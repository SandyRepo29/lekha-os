import { db } from "@/lib/db";
import { policies, policyVersions, auditLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import * as repo from "@/lib/repositories/policy-governance-repo";
import { softDeletePolicy } from "@/lib/repositories/policy-repo";
import { computePolicyHealth } from "@/lib/services/policy-health";
import { DomainError } from "@/lib/services/errors";

// ─── List / Get ──────────────────────────────────────────────────────────────

export async function listPolicies(
  orgId: string,
  filters?: { status?: string; policyType?: string; search?: string }
) {
  return repo.findPoliciesByOrg(orgId, filters);
}

export async function getPolicyDetail(orgId: string, policyId: string) {
  return repo.findPolicyById(orgId, policyId);
}

export async function getDashboardMetrics(orgId: string) {
  return repo.getDashboardMetrics(orgId);
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createPolicy(
  orgId: string,
  userId: string | null,
  data: {
    name: string;
    description?: string;
    policyType?: string;
    version?: string;
    owner?: string;
    ownerId?: string;
    effectiveDate?: string;
    nextReviewDate?: string;
    attestationRequired?: boolean;
    audience?: string;
  }
) {
  if (!data.name?.trim()) throw new DomainError("Policy name is required.");

  const policy = await repo.createPolicy({
    organizationId: orgId,
    name: data.name.trim(),
    description: data.description,
    policyType: data.policyType,
    version: data.version ?? "1.0",
    owner: data.owner,
    ownerId: data.ownerId,
    effectiveDate: data.effectiveDate,
    nextReviewDate: data.nextReviewDate,
    attestationRequired: data.attestationRequired ?? false,
    audience: data.audience ?? "everyone",
    createdBy: userId ?? undefined,
  });

  await logAction(orgId, userId, "policy_governance.policy_created", policy.id, { name: policy.name });
  return policy;
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updatePolicy(
  orgId: string,
  userId: string | null,
  policyId: string,
  data: Partial<{
    name: string;
    description: string;
    policyType: string;
    version: string;
    owner: string;
    ownerId: string;
    effectiveDate: string;
    nextReviewDate: string;
    reviewDate: string;
    attestationRequired: boolean;
    audience: string;
    changeSummary: string;
    storagePath: string;
  }>
) {
  const existing = await repo.findPolicyById(orgId, policyId);
  if (!existing) throw new DomainError("Policy not found.");

  // Create a version snapshot if name or storagePath is changing
  if (data.storagePath && data.storagePath !== existing.storagePath) {
    await db.insert(policyVersions).values({
      policyId,
      version: existing.version,
      storagePath: existing.storagePath ?? undefined,
      notes: data.changeSummary ?? "Content updated",
      createdBy: userId ?? undefined,
    });
  }

  const updated = await repo.updatePolicy(policyId, data);
  await logAction(orgId, userId, "policy_governance.policy_updated", policyId, { name: data.name ?? existing.name });
  return updated;
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deletePolicy(orgId: string, userId: string | null, policyId: string): Promise<void> {
  const existing = await repo.findPolicyById(orgId, policyId);
  if (!existing) throw new DomainError("Policy not found.");

  await softDeletePolicy(policyId, orgId);
  await logAction(orgId, userId, "policy_governance.policy_deleted", policyId, { name: existing.name });
}

// ─── Status Transitions ──────────────────────────────────────────────────────

export async function publishPolicy(orgId: string, userId: string, policyId: string) {
  const existing = await repo.findPolicyById(orgId, policyId);
  if (!existing) throw new DomainError("Policy not found.");
  if (!["draft", "approved", "review"].includes(existing.status)) {
    throw new DomainError("Only draft/approved/review policies can be published.");
  }

  const updated = await repo.updatePolicy(policyId, {
    status: "published",
    approvalDate: new Date().toISOString().split("T")[0],
  });
  await logAction(orgId, userId, "policy_governance.policy_published", policyId, { name: existing.name });
  return updated;
}

export async function retirePolicy(orgId: string, userId: string, policyId: string) {
  const existing = await repo.findPolicyById(orgId, policyId);
  if (!existing) throw new DomainError("Policy not found.");

  const updated = await repo.updatePolicy(policyId, { status: "retired" });
  await logAction(orgId, userId, "policy_governance.policy_retired", policyId, { name: existing.name });
  return updated;
}

// ─── Health ──────────────────────────────────────────────────────────────────

export async function computeAndSaveHealth(orgId: string, policyId: string) {
  const inputs = await repo.getHealthInputs(orgId, policyId);
  const breakdown = computePolicyHealth(inputs);
  await repo.saveHealthScore(policyId, breakdown.score);
  return breakdown;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function addReview(
  orgId: string,
  userId: string,
  policyId: string,
  data: {
    outcome: string;
    notes?: string;
    nextReviewDate?: string;
  }
) {
  const today = new Date().toISOString().split("T")[0];
  const review = await repo.addReview({
    policyId,
    organizationId: orgId,
    reviewerId: userId,
    reviewDate: today,
    outcome: data.outcome,
    notes: data.notes,
    nextReviewDate: data.nextReviewDate,
  });

  // Update policy reviewDate and nextReviewDate
  await repo.updatePolicy(policyId, {
    reviewDate: today,
    nextReviewDate: data.nextReviewDate,
  });

  await logAction(orgId, userId, "policy_governance.policy_reviewed", policyId, { outcome: data.outcome });
  return review;
}

// ─── Attestations ─────────────────────────────────────────────────────────────

export async function assignAttestations(
  orgId: string,
  policyId: string,
  userIds: string[],
  dueDate: Date
) {
  const policy = await repo.findPolicyById(orgId, policyId);
  if (!policy) throw new DomainError("Policy not found.");

  const dueDateStr = dueDate.toISOString().split("T")[0];
  for (const uid of userIds) {
    await repo.addAttestation({
      policyId,
      organizationId: orgId,
      userId: uid,
      policyVersion: policy.version,
      dueDate: dueDateStr,
    });
  }
}

export async function acknowledgeAttestation(orgId: string, userId: string, policyId: string) {
  const rows = await repo.findAttestationsByPolicy(policyId);
  const att = rows.find((r) => r.attestation.userId === userId && r.attestation.organizationId === orgId);
  if (!att) throw new DomainError("Attestation not found.");
  await repo.updateAttestationStatus(att.attestation.id, "acknowledged", new Date());
}

export async function rejectAttestation(orgId: string, userId: string, policyId: string) {
  const rows = await repo.findAttestationsByPolicy(policyId);
  const att = rows.find((r) => r.attestation.userId === userId && r.attestation.organizationId === orgId);
  if (!att) throw new DomainError("Attestation not found.");
  await repo.updateAttestationStatus(att.attestation.id, "rejected", new Date());
}

// ─── Junctions ────────────────────────────────────────────────────────────────

export async function linkControl(orgId: string, policyId: string, controlId: string) {
  await repo.linkControl(policyId, controlId, orgId);
}

export async function unlinkControl(orgId: string, policyId: string, controlId: string) {
  void orgId;
  await repo.unlinkControl(policyId, controlId);
}

export async function linkFramework(orgId: string, policyId: string, frameworkId: string) {
  await repo.linkFramework(policyId, frameworkId, orgId);
}

export async function unlinkFramework(orgId: string, policyId: string, frameworkId: string) {
  void orgId;
  await repo.unlinkFramework(policyId, frameworkId);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function logAction(
  orgId: string,
  userId: string | null,
  action: string,
  entityId: string,
  meta: Record<string, unknown>
) {
  await db.insert(auditLogs).values({
    organizationId: orgId,
    actorId: userId,
    action,
    entityType: "policy",
    entityId,
    metadata: meta,
  }).catch(() => {});
}
