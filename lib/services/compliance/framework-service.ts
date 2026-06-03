import { db } from "@/lib/db";
import { DomainError } from "@/lib/services/errors";
import * as frameworkRepo from "@/lib/repositories/framework-repo";
import * as controlRepo from "@/lib/repositories/control-repo";
import * as evidenceRepo from "@/lib/repositories/evidence-repo";
import * as readinessRepo from "@/lib/repositories/readiness-repo";
import * as policyRepo from "@/lib/repositories/policy-repo";
import * as gapRepo from "@/lib/repositories/gap-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";
import {
  computeReadiness,
  type ControlInput,
} from "./readiness-service";
import type { Framework } from "@/lib/db/schema";
import type { ReadinessScore } from "@/lib/db/schema";

export type FrameworkWithScore = Framework & {
  readiness: ReadinessScore | null;
  controlCount: number;
  openGapCount: number;
};

// ---- Queries -------------------------------------------------

export async function listFrameworks(
  orgId: string
): Promise<FrameworkWithScore[]> {
  const [fws, scores, gaps] = await Promise.all([
    frameworkRepo.findByOrg(orgId),
    readinessRepo.findAllByOrg(orgId),
    gapRepo.findByOrg(orgId, false),
  ]);

  const scoreMap = new Map(scores.map((s) => [s.frameworkId, s]));
  const gapCounts = new Map<string, number>();
  for (const g of gaps) {
    gapCounts.set(g.frameworkId, (gapCounts.get(g.frameworkId) ?? 0) + 1);
  }

  // Fetch control counts in parallel
  const countRows = await Promise.all(
    fws.map((fw) =>
      controlRepo
        .findByFramework(orgId, fw.id)
        .then((cs) => ({ frameworkId: fw.id, count: cs.length }))
    )
  );
  const controlCounts = new Map(countRows.map((r) => [r.frameworkId, r.count]));

  return fws.map((fw) => ({
    ...fw,
    readiness: scoreMap.get(fw.id) ?? null,
    controlCount: controlCounts.get(fw.id) ?? 0,
    openGapCount: gapCounts.get(fw.id) ?? 0,
  }));
}

export async function getFramework(
  orgId: string,
  id: string
): Promise<FrameworkWithScore | null> {
  const fw = await frameworkRepo.findById(orgId, id);
  if (!fw) return null;
  const [readiness, controls, gaps] = await Promise.all([
    readinessRepo.findByFramework(orgId, id),
    controlRepo.findByFramework(orgId, id),
    gapRepo.findByFramework(orgId, id, false),
  ]);
  return {
    ...fw,
    readiness: readiness ?? null,
    controlCount: controls.length,
    openGapCount: gaps.length,
  };
}

// ---- Mutations -----------------------------------------------

export async function createFramework(params: {
  orgId: string;
  actorId: string;
  input: {
    name: string;
    description?: string | null;
    version?: string | null;
    owner?: string | null;
    reviewDate?: string | null;
  };
}): Promise<{ id: string }> {
  const name = (params.input.name || "").trim();
  if (name.length < 2) throw new DomainError("Framework name is required.");

  let result!: { id: string };
  await db.transaction(async (tx) => {
    result = await frameworkRepo.insertFramework(
      {
        organizationId: params.orgId,
        name,
        description: params.input.description?.trim() || null,
        version: params.input.version?.trim() || null,
        owner: params.input.owner?.trim() || null,
        reviewDate: params.input.reviewDate || null,
        createdBy: params.actorId,
      },
      tx
    );
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.framework_created",
        entityType: "framework",
        entityId: result.id,
        metadata: { name },
      },
      tx
    );
  });
  return result;
}

export async function updateFramework(params: {
  orgId: string;
  actorId: string;
  frameworkId: string;
  input: {
    name?: string;
    description?: string | null;
    version?: string | null;
    owner?: string | null;
    status?: "not_started" | "in_progress" | "ready" | "certified" | "expired";
    reviewDate?: string | null;
  };
}): Promise<void> {
  const fw = await frameworkRepo.findById(params.orgId, params.frameworkId);
  if (!fw) throw new DomainError("Framework not found.");
  if (params.input.name !== undefined) {
    const name = params.input.name.trim();
    if (name.length < 2) throw new DomainError("Framework name is required.");
  }
  await db.transaction(async (tx) => {
    await frameworkRepo.updateFramework(
      params.frameworkId,
      {
        name: params.input.name?.trim(),
        description: params.input.description,
        version: params.input.version,
        owner: params.input.owner,
        status: params.input.status,
        reviewDate: params.input.reviewDate,
      },
      tx
    );
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.framework_updated",
        entityType: "framework",
        entityId: params.frameworkId,
        metadata: params.input,
      },
      tx
    );
  });
}

export async function deleteFramework(params: {
  orgId: string;
  actorId: string;
  frameworkId: string;
}): Promise<void> {
  const fw = await frameworkRepo.findById(params.orgId, params.frameworkId);
  if (!fw) throw new DomainError("Framework not found.");
  await db.transaction(async (tx) => {
    await frameworkRepo.deleteFramework(params.orgId, params.frameworkId, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.framework_deleted",
        entityType: "framework",
        entityId: params.frameworkId,
        metadata: { name: fw.name },
      },
      tx
    );
  });
}

// ---- Seed controls from built-in template --------------------

/**
 * Bulk-seed the standard controls for a framework from a built-in template key.
 * Safe to call multiple times — skips if controls already exist.
 */
export async function seedFrameworkControls(
  orgId: string,
  frameworkId: string,
  templateKey: string
): Promise<{ seeded: number }> {
  const { FRAMEWORK_TEMPLATE_MAP } = await import(
    "@/lib/constants/compliance-framework-templates"
  );
  const template = FRAMEWORK_TEMPLATE_MAP.get(templateKey);
  if (!template) return { seeded: 0 };

  const existing = await controlRepo.findByFramework(orgId, frameworkId);
  if (existing.length > 0) return { seeded: 0 }; // idempotent

  await controlRepo.bulkInsertControls(
    template.controls.map((c) => ({
      organizationId: orgId,
      frameworkId,
      controlRef: c.controlRef,
      name: c.name,
      description: c.description,
      category: c.category,
      priority: c.priority,
      status: "not_implemented" as const,
    }))
  );

  // Initialise readiness score at 0
  await recomputeReadiness(orgId, frameworkId).catch(() => {});

  return { seeded: template.controls.length };
}

// ---- Frameworks with controls (for mapping UI) ---------------

export type FrameworkWithControls = Framework & {
  controls: import("@/lib/db/schema").Control[];
};

export async function listFrameworksWithControls(
  orgId: string
): Promise<FrameworkWithControls[]> {
  const fws = await frameworkRepo.findByOrg(orgId);
  return Promise.all(
    fws.map(async (fw) => ({
      ...fw,
      controls: await controlRepo.findByFramework(orgId, fw.id),
    }))
  );
}

// ---- Readiness recompute -------------------------------------

/**
 * Recompute and persist the readiness score for a single framework.
 * Call this after any control/evidence/policy change.
 */
export async function recomputeReadiness(
  orgId: string,
  frameworkId: string
): Promise<void> {
  const [controls, coveredIds, totalPolicies, approvedPolicies] =
    await Promise.all([
      controlRepo.findByFramework(orgId, frameworkId),
      evidenceRepo.findControlIdsWithApprovedEvidence(orgId, frameworkId),
      policyRepo
        .findByOrg(orgId)
        .then((ps) => ps.length),
      policyRepo.countApproved(orgId),
    ]);

  const breakdown = computeReadiness(
    controls as ControlInput[],
    new Set(coveredIds),
    totalPolicies,
    approvedPolicies
  );

  await readinessRepo.upsertScore({
    organizationId: orgId,
    frameworkId,
    ...breakdown,
  });
}
