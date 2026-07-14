import { db } from "@/lib/db";
import { DomainError } from "@/lib/services/errors";
import * as controlRepo from "@/backend/src/modules/compliance/control-repo";
import * as frameworkRepo from "@/backend/src/modules/compliance/framework-repo";
import * as evidenceRepo from "@/backend/src/modules/compliance/evidence-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";
import { recomputeReadiness } from "./framework-service";
import type { Control } from "@/lib/db/schema";

export type ControlWithEvidenceCount = Control & {
  evidenceCount: number;
};

// ---- Queries -------------------------------------------------

export async function listControls(
  orgId: string,
  frameworkId: string
): Promise<ControlWithEvidenceCount[]> {
  const controls = await controlRepo.findByFramework(orgId, frameworkId);

  // Fetch evidence mappings for all controls in one pass
  const mappingsPerControl = await Promise.all(
    controls.map((c) =>
      evidenceRepo
        .findMappingsByControl(c.id)
        .then((ms) => ({ controlId: c.id, count: ms.length }))
    )
  );
  const countMap = new Map(mappingsPerControl.map((m) => [m.controlId, m.count]));

  return controls.map((c) => ({
    ...c,
    evidenceCount: countMap.get(c.id) ?? 0,
  }));
}

export async function getControl(
  orgId: string,
  id: string
): Promise<ControlWithEvidenceCount | null> {
  const control = await controlRepo.findById(orgId, id);
  if (!control) return null;
  const mappings = await evidenceRepo.findMappingsByControl(id);
  return { ...control, evidenceCount: mappings.length };
}

// ---- Mutations -----------------------------------------------

export async function createControl(params: {
  orgId: string;
  actorId: string;
  frameworkId: string;
  input: {
    controlRef: string;
    name: string;
    description?: string | null;
    category?: string | null;
    owner?: string | null;
    status?: "implemented" | "partial" | "not_implemented" | "not_applicable";
    priority?: "low" | "medium" | "high" | "critical";
    reviewDate?: string | null;
  };
}): Promise<{ id: string }> {
  const fw = await frameworkRepo.findById(params.orgId, params.frameworkId);
  if (!fw) throw new DomainError("Framework not found.");

  const name = (params.input.name || "").trim();
  if (name.length < 2) throw new DomainError("Control name is required.");
  const ref = (params.input.controlRef || "").trim();
  if (!ref) throw new DomainError("Control reference is required (e.g. A.5.1).");

  let result!: { id: string };
  await db.transaction(async (tx) => {
    result = await controlRepo.insertControl(
      {
        organizationId: params.orgId,
        frameworkId: params.frameworkId,
        controlRef: ref,
        name,
        description: params.input.description?.trim() || null,
        category: params.input.category?.trim() || null,
        owner: params.input.owner?.trim() || null,
        status: params.input.status ?? "not_implemented",
        priority: params.input.priority ?? "medium",
        reviewDate: params.input.reviewDate || null,
      },
      tx
    );
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.control_created",
        entityType: "control",
        entityId: result.id,
        metadata: { name, ref, frameworkId: params.frameworkId },
      },
      tx
    );
  });

  // Recompute readiness outside the transaction (non-critical)
  await recomputeReadiness(params.orgId, params.frameworkId).catch(() => {});

  return result;
}

export async function updateControlStatus(params: {
  orgId: string;
  actorId: string;
  controlId: string;
  status: "implemented" | "partial" | "not_implemented" | "not_applicable";
}): Promise<void> {
  const control = await controlRepo.findById(params.orgId, params.controlId);
  if (!control) throw new DomainError("Control not found.");

  await db.transaction(async (tx) => {
    await controlRepo.updateControl(params.controlId, { status: params.status }, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.control_status_changed",
        entityType: "control",
        entityId: params.controlId,
        metadata: { from: control.status, to: params.status },
      },
      tx
    );
  });

  if (control.frameworkId) await recomputeReadiness(params.orgId, control.frameworkId).catch(() => {});
}

export async function updateControl(params: {
  orgId: string;
  actorId: string;
  controlId: string;
  input: {
    controlRef?: string;
    name?: string;
    description?: string | null;
    category?: string | null;
    owner?: string | null;
    status?: "implemented" | "partial" | "not_implemented" | "not_applicable";
    priority?: "low" | "medium" | "high" | "critical";
    reviewDate?: string | null;
  };
}): Promise<void> {
  const control = await controlRepo.findById(params.orgId, params.controlId);
  if (!control) throw new DomainError("Control not found.");

  await db.transaction(async (tx) => {
    await controlRepo.updateControl(params.controlId, params.input, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.control_updated",
        entityType: "control",
        entityId: params.controlId,
        metadata: params.input,
      },
      tx
    );
  });

  if (params.input.status !== undefined) {
    if (control.frameworkId) await recomputeReadiness(params.orgId, control.frameworkId).catch(() => {});
  }
}

export async function deleteControl(params: {
  orgId: string;
  actorId: string;
  controlId: string;
}): Promise<void> {
  const control = await controlRepo.findById(params.orgId, params.controlId);
  if (!control) throw new DomainError("Control not found.");

  await db.transaction(async (tx) => {
    await controlRepo.deleteControl(params.orgId, params.controlId, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.control_deleted",
        entityType: "control",
        entityId: params.controlId,
        metadata: { name: control.name },
      },
      tx
    );
  });

  if (control.frameworkId) await recomputeReadiness(params.orgId, control.frameworkId).catch(() => {});
}

/** Per-status summary — used for the framework detail readiness breakdown. */
export async function getStatusSummary(
  orgId: string,
  frameworkId: string
): Promise<{ implemented: number; partial: number; notImplemented: number; notApplicable: number; total: number }> {
  const counts = await controlRepo.countByStatus(orgId, frameworkId);
  const byStatus = new Map(counts.map((c) => [c.status, c.n]));
  const implemented = byStatus.get("implemented") ?? 0;
  const partial = byStatus.get("partial") ?? 0;
  const notImplemented = byStatus.get("not_implemented") ?? 0;
  const notApplicable = byStatus.get("not_applicable") ?? 0;
  return {
    implemented,
    partial,
    notImplemented,
    notApplicable,
    total: implemented + partial + notImplemented + notApplicable,
  };
}
