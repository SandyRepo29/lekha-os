import { and, eq, desc, lte, isNotNull } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { evidence, controlEvidenceMappings, controls } from "@/lib/db/schema";
import type { Evidence, ControlEvidenceMapping } from "@/lib/db/schema";

export type NewEvidence = {
  organizationId: string;
  title: string;
  description?: string | null;
  source: "vendor_document" | "vendor_assessment" | "vendor_review" | "manual" | "policy";
  sourceEntityId?: string | null;
  owner?: string | null;
  expiresOn?: string | null;
  status?: "draft" | "pending_review" | "approved" | "expired" | "archived";
  storagePath?: string | null;
  createdBy?: string | null;
};

export async function insertEvidence(
  values: NewEvidence,
  exec: Executor = db
): Promise<{ id: string }> {
  const [row] = await exec
    .insert(evidence)
    .values(values)
    .returning({ id: evidence.id });
  return row;
}

export async function findByOrg(
  orgId: string,
  filters?: { status?: string; source?: string }
): Promise<Evidence[]> {
  const conditions = [eq(evidence.organizationId, orgId)];
  if (filters?.status) {
    conditions.push(eq(evidence.status, filters.status as Evidence["status"]));
  }
  if (filters?.source) {
    conditions.push(eq(evidence.source, filters.source as Evidence["source"]));
  }
  return db
    .select()
    .from(evidence)
    .where(and(...conditions))
    .orderBy(desc(evidence.createdAt));
}

export async function findById(orgId: string, id: string): Promise<Evidence | null> {
  const [row] = await db
    .select()
    .from(evidence)
    .where(and(eq(evidence.organizationId, orgId), eq(evidence.id, id)))
    .limit(1);
  return row ?? null;
}

/** Check if evidence already exists for a given source entity (dedup guard). */
export async function findBySourceEntity(
  orgId: string,
  sourceEntityId: string
): Promise<Evidence | null> {
  const [row] = await db
    .select()
    .from(evidence)
    .where(
      and(
        eq(evidence.organizationId, orgId),
        eq(evidence.sourceEntityId, sourceEntityId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function updateEvidence(
  id: string,
  values: Partial<{
    title: string;
    description: string | null;
    owner: string | null;
    expiresOn: string | null;
    status: "draft" | "pending_review" | "approved" | "expired" | "archived";
    storagePath: string | null;
  }>,
  exec: Executor = db
): Promise<void> {
  await exec
    .update(evidence)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(evidence.id, id));
}

export async function deleteEvidence(
  orgId: string,
  id: string,
  exec: Executor = db
): Promise<void> {
  await exec
    .delete(evidence)
    .where(and(eq(evidence.organizationId, orgId), eq(evidence.id, id)));
}

/** Evidence expiring within the next `days` days. */
export async function findExpiring(orgId: string, days: number): Promise<Evidence[]> {
  const cutoff = new Date(Date.now() + days * 86_400_000).toISOString().split("T")[0];
  return db
    .select()
    .from(evidence)
    .where(
      and(
        eq(evidence.organizationId, orgId),
        isNotNull(evidence.expiresOn),
        lte(evidence.expiresOn, cutoff)
      )
    )
    .orderBy(evidence.expiresOn);
}

// ---- Mapping operations --------------------------------------

export async function addMapping(
  controlId: string,
  evidenceId: string,
  mappingType: "manual" | "ai_suggested",
  createdBy: string | null,
  exec: Executor = db
): Promise<void> {
  await exec
    .insert(controlEvidenceMappings)
    .values({ controlId, evidenceId, mappingType, createdBy })
    .onConflictDoNothing();
}

export async function removeMapping(
  controlId: string,
  evidenceId: string,
  exec: Executor = db
): Promise<void> {
  await exec
    .delete(controlEvidenceMappings)
    .where(
      and(
        eq(controlEvidenceMappings.controlId, controlId),
        eq(controlEvidenceMappings.evidenceId, evidenceId)
      )
    );
}

export async function findMappingsByControl(
  controlId: string
): Promise<ControlEvidenceMapping[]> {
  return db
    .select()
    .from(controlEvidenceMappings)
    .where(eq(controlEvidenceMappings.controlId, controlId))
    .orderBy(desc(controlEvidenceMappings.createdAt));
}

export async function findMappingsByEvidence(
  evidenceId: string
): Promise<ControlEvidenceMapping[]> {
  return db
    .select()
    .from(controlEvidenceMappings)
    .where(eq(controlEvidenceMappings.evidenceId, evidenceId))
    .orderBy(desc(controlEvidenceMappings.createdAt));
}

/** All controlIds that have at least one approved evidence item — used for readiness scoring. */
export async function findControlIdsWithApprovedEvidence(
  orgId: string,
  frameworkId: string
): Promise<string[]> {
  const rows = await db
    .select({ controlId: controlEvidenceMappings.controlId })
    .from(controlEvidenceMappings)
    .innerJoin(evidence, eq(controlEvidenceMappings.evidenceId, evidence.id))
    .innerJoin(controls, eq(controlEvidenceMappings.controlId, controls.id))
    .where(
      and(
        eq(evidence.organizationId, orgId),
        eq(evidence.status, "approved"),
        eq(controls.frameworkId, frameworkId)
      )
    )
    .groupBy(controlEvidenceMappings.controlId);
  return rows.map((r) => r.controlId);
}
