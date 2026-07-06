import { auditLogs } from "@/lib/db/schema";
import { db } from "@/lib/db";
import * as repo from "@/lib/repositories/contract-repo";
import { computeContractScore } from "@/lib/services/contract-score";
import { DomainError } from "@/lib/services/errors";

// ─── List / Get ──────────────────────────────────────────────────────────────

export async function listContracts(
  orgId: string,
  filters?: { status?: string; contractType?: string; vendorId?: string; search?: string }
) {
  return repo.findContractsByOrg(orgId, filters);
}

export async function getContractDetail(orgId: string, contractId: string) {
  return repo.findContractById(orgId, contractId);
}

export async function getDashboardMetrics(orgId: string) {
  return repo.getDashboardMetrics(orgId);
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createContract(
  orgId: string,
  userId: string | null,
  data: {
    title: string;
    contractType?: string;
    vendorId?: string;
    ownerId?: string;
    effectiveDate?: string;
    expiryDate?: string;
    renewalDate?: string;
    noticePeriodDays?: number;
    autoRenewal?: boolean;
    value?: number;
    currency?: string;
  }
) {
  if (!data.title?.trim()) throw new DomainError("Contract title is required.");

  const contract = await repo.createContract({
    organizationId: orgId,
    title: data.title.trim(),
    contractType: data.contractType,
    vendorId: data.vendorId,
    ownerId: data.ownerId,
    effectiveDate: data.effectiveDate,
    expiryDate: data.expiryDate,
    renewalDate: data.renewalDate,
    noticePeriodDays: data.noticePeriodDays,
    autoRenewal: data.autoRenewal,
    value: data.value,
    currency: data.currency,
  });

  await logAction(orgId, userId, "contract_governance.contract_created", contract.id, { title: contract.title });
  return contract;
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateContract(
  orgId: string,
  userId: string | null,
  contractId: string,
  data: Partial<{
    title: string;
    contractType: string;
    status: string;
    vendorId: string;
    ownerId: string;
    effectiveDate: string;
    expiryDate: string;
    renewalDate: string;
    noticePeriodDays: number;
    autoRenewal: boolean;
    value: number;
    currency: string;
    storagePath: string;
  }>
) {
  const existing = await repo.findContractById(orgId, contractId);
  if (!existing) throw new DomainError("Contract not found.");

  const updated = await repo.updateContract(orgId, contractId, data);
  await logAction(orgId, userId, "contract_governance.contract_updated", contractId, { title: updated.title });
  return updated;
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteContract(orgId: string, userId: string | null, contractId: string) {
  const existing = await repo.findContractById(orgId, contractId);
  if (!existing) throw new DomainError("Contract not found.");

  await repo.softDeleteContract(contractId, orgId);
  await logAction(orgId, userId, "contract_governance.contract_deleted", contractId, { title: existing.title });
}

// ─── Score ───────────────────────────────────────────────────────────────────

export async function computeAndSaveScore(orgId: string, contractId: string) {
  const inputs = await repo.getHealthInputs(contractId);
  const breakdown = computeContractScore(inputs);
  await repo.saveContractScore(contractId, breakdown.score);
  return breakdown;
}

// ─── Clauses ─────────────────────────────────────────────────────────────────

export async function addClause(
  orgId: string,
  contractId: string,
  data: {
    title: string;
    category: string;
    content: string;
    riskLevel?: string;
    aiAnalysis?: string;
    isMissing?: boolean;
  }
) {
  if (!data.title?.trim()) throw new DomainError("Clause title is required.");
  if (!data.content?.trim()) throw new DomainError("Clause content is required.");
  return repo.upsertClause(contractId, data);
}

export async function removeClause(clauseId: string) {
  await repo.deleteClause(clauseId);
}

// ─── Obligations ─────────────────────────────────────────────────────────────

export async function addObligation(
  orgId: string,
  contractId: string,
  data: {
    title: string;
    description?: string;
    ownerId?: string;
    dueDate?: string;
    riskLevel?: string;
  }
) {
  if (!data.title?.trim()) throw new DomainError("Obligation title is required.");
  return repo.createObligation({ contractId, organizationId: orgId, ...data });
}

export async function updateObligationStatus(
  obligationId: string,
  data: Partial<{
    title: string;
    description: string;
    ownerId: string;
    dueDate: string;
    status: string;
    riskLevel: string;
    notes: string;
  }>
) {
  return repo.updateObligation(obligationId, data);
}

export async function completeObligation(obligationId: string) {
  return repo.updateObligation(obligationId, {
    status: "completed",
    completedAt: new Date(),
  });
}

export async function deleteObligation(obligationId: string) {
  await repo.deleteObligation(obligationId);
}

// ─── Junctions ───────────────────────────────────────────────────────────────

export async function linkRisk(orgId: string, contractId: string, riskId: string) {
  await repo.linkRisk(contractId, riskId, orgId);
}

export async function unlinkRisk(contractId: string, riskId: string) {
  await repo.unlinkRisk(contractId, riskId);
}

export async function linkControl(orgId: string, contractId: string, controlId: string) {
  await repo.linkControl(contractId, controlId, orgId);
}

export async function unlinkControl(contractId: string, controlId: string) {
  await repo.unlinkControl(contractId, controlId);
}

export async function linkPolicy(orgId: string, contractId: string, policyId: string) {
  await repo.linkPolicy(contractId, policyId, orgId);
}

export async function unlinkPolicy(contractId: string, policyId: string) {
  await repo.unlinkPolicy(contractId, policyId);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function logAction(
  orgId: string,
  userId: string | null,
  action: string,
  entityId: string,
  meta?: Record<string, unknown>
) {
  await db.insert(auditLogs).values({
    organizationId: orgId,
    actorId: userId,
    action,
    entityId,
    entityType: "contract",
    metadata: meta ?? {},
  });
}
