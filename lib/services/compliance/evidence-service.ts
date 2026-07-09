import { db } from "@/lib/db";
import { DomainError } from "@/lib/services/errors";
import * as evidenceRepo from "@/lib/repositories/evidence-repo";
import * as controlRepo from "@/lib/repositories/control-repo";
import * as documentRepo from "@/lib/repositories/document-repo";
import * as assessmentRepo from "@/lib/repositories/assessment-repo";
import * as reviewRepo from "@/lib/repositories/review-repo";
import * as vendorRepo from "@/lib/repositories/vendor-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";
import { recomputeReadiness } from "./framework-service";
import type { Evidence, ControlEvidenceMapping } from "@/lib/db/schema";

export type EvidenceWithMappings = Evidence & {
  mappings: ControlEvidenceMapping[];
};

// ---- Queries -------------------------------------------------

export async function listEvidence(
  orgId: string,
  filters?: { status?: string; source?: string }
): Promise<Evidence[]> {
  return evidenceRepo.findByOrg(orgId, filters);
}

export async function getEvidence(
  orgId: string,
  id: string
): Promise<EvidenceWithMappings | null> {
  const ev = await evidenceRepo.findById(orgId, id);
  if (!ev) return null;
  const mappings = await evidenceRepo.findMappingsByEvidence(id);
  return { ...ev, mappings };
}

// ---- Mutations -----------------------------------------------

export async function createEvidence(params: {
  orgId: string;
  actorId: string;
  input: {
    title: string;
    description?: string | null;
    source?: "vendor_document" | "vendor_assessment" | "vendor_review" | "manual" | "policy";
    sourceEntityId?: string | null;
    owner?: string | null;
    expiresOn?: string | null;
    storagePath?: string | null;
  };
}): Promise<{ id: string }> {
  const title = (params.input.title || "").trim();
  if (title.length < 2) throw new DomainError("Evidence title is required.");

  let result!: { id: string };
  await db.transaction(async (tx) => {
    result = await evidenceRepo.insertEvidence(
      {
        organizationId: params.orgId,
        title,
        description: params.input.description?.trim() || null,
        source: params.input.source ?? "manual",
        sourceEntityId: params.input.sourceEntityId || null,
        owner: params.input.owner?.trim() || null,
        expiresOn: params.input.expiresOn || null,
        status: "draft",
        storagePath: params.input.storagePath || null,
        createdBy: params.actorId,
      },
      tx
    );
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.evidence_created",
        entityType: "evidence",
        entityId: result.id,
        metadata: { title, source: params.input.source ?? "manual" },
      },
      tx
    );
  });
  return result;
}

export async function updateEvidenceStatus(params: {
  orgId: string;
  actorId: string;
  evidenceId: string;
  status: "draft" | "pending_review" | "approved" | "expired" | "archived";
}): Promise<void> {
  const ev = await evidenceRepo.findById(params.orgId, params.evidenceId);
  if (!ev) throw new DomainError("Evidence not found.");

  await db.transaction(async (tx) => {
    await evidenceRepo.updateEvidence(params.evidenceId, { status: params.status }, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.evidence_status_changed",
        entityType: "evidence",
        entityId: params.evidenceId,
        metadata: { from: ev.status, to: params.status },
      },
      tx
    );
  });

  // Approval/un-approval changes evidence coverage — recompute all frameworks
  if (params.status === "approved" || ev.status === "approved") {
    const mappings = await evidenceRepo.findMappingsByEvidence(params.evidenceId);
    const frameworkIds = new Set<string>();
    for (const m of mappings) {
      const control = await controlRepo.findById(params.orgId, m.controlId);
      if (control?.frameworkId) frameworkIds.add(control.frameworkId);
    }
    await Promise.all(
      [...frameworkIds].map((fid) =>
        recomputeReadiness(params.orgId, fid).catch(() => {})
      )
    );
  }
}

export async function deleteEvidence(params: {
  orgId: string;
  actorId: string;
  evidenceId: string;
}): Promise<void> {
  const ev = await evidenceRepo.findById(params.orgId, params.evidenceId);
  if (!ev) throw new DomainError("Evidence not found.");

  // Capture which frameworks are affected before deleting
  const mappings = await evidenceRepo.findMappingsByEvidence(params.evidenceId);
  const frameworkIds = new Set<string>();
  for (const m of mappings) {
    const control = await controlRepo.findById(params.orgId, m.controlId);
    if (control?.frameworkId) frameworkIds.add(control.frameworkId);
  }

  await db.transaction(async (tx) => {
    await evidenceRepo.softDeleteEvidence(params.evidenceId, params.orgId, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.evidence_deleted",
        entityType: "evidence",
        entityId: params.evidenceId,
        metadata: { title: ev.title },
      },
      tx
    );
  });

  await Promise.all(
    [...frameworkIds].map((fid) =>
      recomputeReadiness(params.orgId, fid).catch(() => {})
    )
  );
}

// ---- Evidence ↔ Control mapping ------------------------------

export async function mapEvidenceToControl(params: {
  orgId: string;
  actorId: string;
  evidenceId: string;
  controlId: string;
  mappingType?: "manual" | "ai_suggested";
}): Promise<void> {
  const [ev, control] = await Promise.all([
    evidenceRepo.findById(params.orgId, params.evidenceId),
    controlRepo.findById(params.orgId, params.controlId),
  ]);
  if (!ev) throw new DomainError("Evidence not found.");
  if (!control) throw new DomainError("Control not found.");

  await db.transaction(async (tx) => {
    await evidenceRepo.addMapping(
      params.controlId,
      params.evidenceId,
      params.mappingType ?? "manual",
      params.actorId,
      tx
    );
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.evidence_mapped",
        entityType: "evidence",
        entityId: params.evidenceId,
        metadata: { controlId: params.controlId, controlRef: control.controlRef },
      },
      tx
    );
  });

  if (control.frameworkId) await recomputeReadiness(params.orgId, control.frameworkId).catch(() => {});
}

export async function unmapEvidenceFromControl(params: {
  orgId: string;
  actorId: string;
  evidenceId: string;
  controlId: string;
}): Promise<void> {
  const control = await controlRepo.findById(params.orgId, params.controlId);
  if (!control) throw new DomainError("Control not found.");

  await db.transaction(async (tx) => {
    await evidenceRepo.removeMapping(params.controlId, params.evidenceId, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.evidence_unmapped",
        entityType: "evidence",
        entityId: params.evidenceId,
        metadata: { controlId: params.controlId },
      },
      tx
    );
  });

  if (control.frameworkId) await recomputeReadiness(params.orgId, control.frameworkId).catch(() => {});
}

// ---- Vendor module bridge ------------------------------------

/**
 * Auto-import vendor documents, assessments and reviews as evidence items.
 * Idempotent — skips source entities that already have an evidence row.
 *
 * Returns the count of newly created evidence items.
 */
export async function autoImportFromVendors(params: {
  orgId: string;
  actorId: string;
}): Promise<{ imported: number }> {
  const { orgId, actorId } = params;
  let imported = 0;

  // 1. Vendor documents (valid + expiring only — expired docs are weak evidence)
  const vendors = await vendorRepo.findVendorsByOrg(orgId);
  for (const vendor of vendors) {
    const docs = await documentRepo.listByVendor(orgId, vendor.id);
    for (const doc of docs) {
      if (doc.status === "missing") continue;
      const existing = await evidenceRepo.findBySourceEntity(orgId, doc.id);
      if (existing) continue;

      const title =
        (doc.extracted as Record<string, string> | null)?.documentType ||
        doc.documentType ||
        "Vendor Document";

      await evidenceRepo.insertEvidence({
        organizationId: orgId,
        title: `${vendor.name} — ${title}`,
        description: (doc.extracted as Record<string, string> | null)?.summary || null,
        source: "vendor_document",
        sourceEntityId: doc.id,
        owner: vendor.ownerEmail || null,
        expiresOn: doc.expiresOn || null,
        status: doc.status === "expired" ? "expired" : "approved",
        createdBy: actorId,
      });
      imported++;
    }
  }

  // 2. Completed assessments
  for (const vendor of vendors) {
    const assessments = await assessmentRepo.listByVendor(orgId, vendor.id);
    for (const a of assessments) {
      if (a.status !== "completed") continue;
      const existing = await evidenceRepo.findBySourceEntity(orgId, a.id);
      if (existing) continue;

      await evidenceRepo.insertEvidence({
        organizationId: orgId,
        title: `${vendor.name} — ${a.title}`,
        description: a.aiSummary || null,
        source: "vendor_assessment",
        sourceEntityId: a.id,
        owner: vendor.ownerEmail || null,
        status: "approved",
        createdBy: actorId,
      });
      imported++;
    }
  }

  // 3. Approved vendor reviews
  for (const vendor of vendors) {
    const reviews = await reviewRepo.listByVendor(orgId, vendor.id);
    for (const r of reviews) {
      if (r.status !== "approved") continue;
      const existing = await evidenceRepo.findBySourceEntity(orgId, r.id);
      if (existing) continue;

      await evidenceRepo.insertEvidence({
        organizationId: orgId,
        title: `${vendor.name} — ${r.reviewType.replace("_", " ")} review`,
        description: r.summary || null,
        source: "vendor_review",
        sourceEntityId: r.id,
        owner: vendor.ownerEmail || null,
        status: "approved",
        createdBy: actorId,
      });
      imported++;
    }
  }

  return { imported };
}
