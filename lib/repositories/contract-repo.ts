import { db } from "@/lib/db";
import {
  contracts,
  contractClauses,
  contractObligations,
  contractRisks,
  contractControls,
  contractPolicies,
  vendors,
  profiles,
  risks,
  controls,
  policies,
  type Contract,
  type ContractClause,
  type ContractObligation,
} from "@/lib/db/schema";
import { and, eq, sql, desc, count, asc, isNull, isNotNull } from "drizzle-orm";
import type { ContractScoreInputs } from "@/lib/services/contract-score";

export type ContractWithMeta = Contract & {
  vendorName: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
};

export type ContractDetail = Contract & {
  vendorName: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  clauses: ContractClause[];
  obligations: ContractObligation[];
  linkedRiskCount: number;
  linkedControlCount: number;
  linkedPolicyCount: number;
};

export type ContractDashboardMetrics = {
  total: number;
  active: number;
  expiring: number;
  expired: number;
  renewalsDue: number;
  totalValue: number;
  activeValue: number;
  expiringContracts: ContractWithMeta[];
  recentObligations: Array<ContractObligation & { contractTitle: string }>;
};

export async function findContractsByOrg(
  orgId: string,
  filters?: { status?: string; contractType?: string; vendorId?: string; search?: string }
): Promise<ContractWithMeta[]> {
  const rows = await db
    .select({
      contract: contracts,
      vendorName: vendors.name,
      ownerName: profiles.fullName,
      ownerEmail: profiles.email,
    })
    .from(contracts)
    .leftJoin(vendors, eq(contracts.vendorId, vendors.id))
    .leftJoin(profiles, eq(contracts.ownerId, profiles.id))
    .where(
      and(
        eq(contracts.organizationId, orgId),
        isNull(contracts.deletedAt),
        filters?.status ? sql`${contracts.status} = ${filters.status}` : undefined,
        filters?.contractType ? sql`${contracts.contractType} = ${filters.contractType}` : undefined,
        filters?.vendorId ? eq(contracts.vendorId, filters.vendorId) : undefined,
        filters?.search ? sql`${contracts.title} ILIKE ${"%" + filters.search + "%"}` : undefined
      )
    )
    .orderBy(desc(contracts.updatedAt));

  return rows.map(({ contract, vendorName, ownerName, ownerEmail }) => ({
    ...contract,
    vendorName: vendorName ?? null,
    ownerName: ownerName ?? null,
    ownerEmail: ownerEmail ?? null,
  }));
}

export async function findContractById(orgId: string, contractId: string): Promise<ContractDetail | null> {
  const rows = await db
    .select({
      contract: contracts,
      vendorName: vendors.name,
      ownerName: profiles.fullName,
      ownerEmail: profiles.email,
    })
    .from(contracts)
    .leftJoin(vendors, eq(contracts.vendorId, vendors.id))
    .leftJoin(profiles, eq(contracts.ownerId, profiles.id))
    .where(and(eq(contracts.id, contractId), eq(contracts.organizationId, orgId), isNull(contracts.deletedAt)));

  if (rows.length === 0) return null;
  const { contract, vendorName, ownerName, ownerEmail } = rows[0];

  const [clauses, obligations, riskCount, controlCount, policyCount] = await Promise.all([
    db
      .select()
      .from(contractClauses)
      .where(eq(contractClauses.contractId, contractId))
      .orderBy(asc(contractClauses.createdAt)),
    db
      .select()
      .from(contractObligations)
      .where(eq(contractObligations.contractId, contractId))
      .orderBy(asc(contractObligations.dueDate)),
    db
      .select({ n: count() })
      .from(contractRisks)
      .where(eq(contractRisks.contractId, contractId))
      .then((r) => Number(r[0]?.n ?? 0)),
    db
      .select({ n: count() })
      .from(contractControls)
      .where(eq(contractControls.contractId, contractId))
      .then((r) => Number(r[0]?.n ?? 0)),
    db
      .select({ n: count() })
      .from(contractPolicies)
      .where(eq(contractPolicies.contractId, contractId))
      .then((r) => Number(r[0]?.n ?? 0)),
  ]);

  return {
    ...contract,
    vendorName: vendorName ?? null,
    ownerName: ownerName ?? null,
    ownerEmail: ownerEmail ?? null,
    clauses,
    obligations,
    linkedRiskCount: riskCount,
    linkedControlCount: controlCount,
    linkedPolicyCount: policyCount,
  };
}

export async function createContract(data: {
  organizationId: string;
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
  storagePath?: string;
}): Promise<Contract> {
  const [row] = await db
    .insert(contracts)
    .values({
      organizationId: data.organizationId,
      title: data.title,
      contractType: (data.contractType as never) ?? "vendor_agreement",
      vendorId: data.vendorId ?? null,
      ownerId: data.ownerId ?? null,
      effectiveDate: data.effectiveDate ?? null,
      expiryDate: data.expiryDate ?? null,
      renewalDate: data.renewalDate ?? null,
      noticePeriodDays: data.noticePeriodDays ?? 30,
      autoRenewal: data.autoRenewal ?? false,
      value: data.value ? String(data.value) : null,
      currency: data.currency ?? "USD",
      storagePath: data.storagePath ?? null,
    })
    .returning();
  return row;
}

export async function updateContract(
  orgId: string,
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
    aiSummary: string;
    trustScore: number;
    trustScoreAt: Date;
  }>
): Promise<Contract> {
  const [row] = await db
    .update(contracts)
    .set({
      ...data,
      contractType: data.contractType as never,
      status: data.status as never,
      value: data.value !== undefined ? String(data.value) : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(contracts.id, contractId), eq(contracts.organizationId, orgId)))
    .returning();
  return row;
}

export async function getDashboardMetrics(orgId: string): Promise<ContractDashboardMetrics> {
  const today = new Date().toISOString().split("T")[0];
  const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const allContracts = await db
    .select({
      contract: contracts,
      vendorName: vendors.name,
      ownerName: profiles.fullName,
      ownerEmail: profiles.email,
    })
    .from(contracts)
    .leftJoin(vendors, eq(contracts.vendorId, vendors.id))
    .leftJoin(profiles, eq(contracts.ownerId, profiles.id))
    .where(and(eq(contracts.organizationId, orgId), isNull(contracts.deletedAt)));

  const total = allContracts.length;
  const active = allContracts.filter((c) => c.contract.status === "active").length;
  const expired = allContracts.filter((c) => c.contract.status === "expired").length;

  const expiring = allContracts.filter((c) => {
    const d = c.contract.expiryDate;
    return d && d >= today && d <= in90Days && !["expired", "terminated", "archived"].includes(c.contract.status);
  }).length;

  const renewalsDue = allContracts.filter((c) => {
    const d = c.contract.renewalDate;
    return d && d >= today && d <= in30Days;
  }).length;

  const totalValue = allContracts.reduce((s, c) => s + Number(c.contract.value ?? 0), 0);
  const activeValue = allContracts
    .filter((c) => c.contract.status === "active")
    .reduce((s, c) => s + Number(c.contract.value ?? 0), 0);

  const expiringContracts: ContractWithMeta[] = allContracts
    .filter((c) => {
      const d = c.contract.expiryDate;
      return d && d >= today && d <= in90Days && !["expired", "terminated", "archived"].includes(c.contract.status);
    })
    .sort((a, b) => ((a.contract.expiryDate ?? "") < (b.contract.expiryDate ?? "") ? -1 : 1))
    .slice(0, 5)
    .map(({ contract, vendorName, ownerName, ownerEmail }) => ({
      ...contract,
      vendorName: vendorName ?? null,
      ownerName: ownerName ?? null,
      ownerEmail: ownerEmail ?? null,
    }));

  const recentObligationsRaw = await db
    .select({
      obligation: contractObligations,
      contractTitle: contracts.title,
    })
    .from(contractObligations)
    .leftJoin(contracts, eq(contractObligations.contractId, contracts.id))
    .where(
      and(
        eq(contractObligations.organizationId, orgId),
        sql`${contractObligations.status} IN ('open', 'overdue', 'in_progress')`
      )
    )
    .orderBy(asc(contractObligations.dueDate))
    .limit(10);

  const recentObligations = recentObligationsRaw.map(({ obligation, contractTitle }) => ({
    ...obligation,
    contractTitle: contractTitle ?? "",
  }));

  return {
    total,
    active,
    expiring,
    expired,
    renewalsDue,
    totalValue,
    activeValue,
    expiringContracts,
    recentObligations,
  };
}

export async function getClauses(contractId: string): Promise<ContractClause[]> {
  return db
    .select()
    .from(contractClauses)
    .where(eq(contractClauses.contractId, contractId))
    .orderBy(asc(contractClauses.createdAt));
}

/** All clauses across an org's (non-deleted) contracts, with the contract title, for reporting. */
export async function getClausesByOrg(
  orgId: string
): Promise<Array<ContractClause & { contractTitle: string }>> {
  const rows = await db
    .select({ clause: contractClauses, contractTitle: contracts.title })
    .from(contractClauses)
    .innerJoin(contracts, eq(contractClauses.contractId, contracts.id))
    .where(and(eq(contracts.organizationId, orgId), isNull(contracts.deletedAt)))
    .orderBy(desc(contracts.updatedAt), asc(contractClauses.createdAt));

  return rows.map(({ clause, contractTitle }) => ({ ...clause, contractTitle: contractTitle ?? "" }));
}

export async function upsertClause(
  contractId: string,
  data: {
    id?: string;
    title: string;
    category: string;
    content: string;
    riskLevel?: string;
    aiAnalysis?: string;
    isMissing?: boolean;
  }
): Promise<ContractClause> {
  if (data.id) {
    const [row] = await db
      .update(contractClauses)
      .set({
        title: data.title,
        category: data.category as never,
        content: data.content,
        riskLevel: (data.riskLevel as never) ?? "low",
        aiAnalysis: data.aiAnalysis ?? null,
        isMissing: data.isMissing ?? false,
        updatedAt: new Date(),
      })
      .where(eq(contractClauses.id, data.id))
      .returning();
    return row;
  }
  const [row] = await db
    .insert(contractClauses)
    .values({
      contractId,
      title: data.title,
      category: data.category as never,
      content: data.content,
      riskLevel: (data.riskLevel as never) ?? "low",
      aiAnalysis: data.aiAnalysis ?? null,
      isMissing: data.isMissing ?? false,
    })
    .returning();
  return row;
}

export async function deleteClause(clauseId: string): Promise<void> {
  await db.delete(contractClauses).where(eq(contractClauses.id, clauseId));
}

export async function getObligations(
  orgId: string,
  contractId?: string
): Promise<Array<ContractObligation & { contractTitle: string }>> {
  const rows = await db
    .select({
      obligation: contractObligations,
      contractTitle: contracts.title,
    })
    .from(contractObligations)
    .leftJoin(contracts, eq(contractObligations.contractId, contracts.id))
    .where(
      and(
        eq(contractObligations.organizationId, orgId),
        contractId ? eq(contractObligations.contractId, contractId) : undefined
      )
    )
    .orderBy(asc(contractObligations.dueDate));

  return rows.map(({ obligation, contractTitle }) => ({
    ...obligation,
    contractTitle: contractTitle ?? "",
  }));
}

export async function createObligation(data: {
  contractId: string;
  organizationId: string;
  title: string;
  description?: string;
  ownerId?: string;
  dueDate?: string;
  riskLevel?: string;
}): Promise<ContractObligation> {
  const [row] = await db
    .insert(contractObligations)
    .values({
      contractId: data.contractId,
      organizationId: data.organizationId,
      title: data.title,
      description: data.description ?? null,
      ownerId: data.ownerId ?? null,
      dueDate: data.dueDate ?? null,
      riskLevel: (data.riskLevel as never) ?? "low",
    })
    .returning();
  return row;
}

export async function updateObligation(
  obligationId: string,
  data: Partial<{
    title: string;
    description: string;
    ownerId: string;
    dueDate: string;
    status: string;
    riskLevel: string;
    notes: string;
    completedAt: Date;
  }>
): Promise<ContractObligation> {
  const [row] = await db
    .update(contractObligations)
    .set({ ...data, status: data.status as never, riskLevel: data.riskLevel as never, updatedAt: new Date() })
    .where(eq(contractObligations.id, obligationId))
    .returning();
  return row;
}

export async function deleteObligation(obligationId: string): Promise<void> {
  await db.delete(contractObligations).where(eq(contractObligations.id, obligationId));
}

export async function getHealthInputs(contractId: string): Promise<ContractScoreInputs> {
  const contractRow = await db
    .select()
    .from(contracts)
    .where(eq(contracts.id, contractId))
    .limit(1);

  if (contractRow.length === 0) {
    return {
      totalClauses: 0,
      criticalClauses: 0,
      totalObligations: 0,
      completedObligations: 0,
      waivedObligations: 0,
      daysUntilExpiry: null,
      autoRenewal: false,
      linkedPolicies: 0,
      contractType: "vendor_agreement",
      hasDpaClause: false,
    };
  }

  const c = contractRow[0];

  const [clausesRaw, obligationsRaw, policyCount] = await Promise.all([
    db.select().from(contractClauses).where(eq(contractClauses.contractId, contractId)),
    db.select().from(contractObligations).where(eq(contractObligations.contractId, contractId)),
    db
      .select({ n: count() })
      .from(contractPolicies)
      .where(eq(contractPolicies.contractId, contractId))
      .then((r) => Number(r[0]?.n ?? 0)),
  ]);

  const today = new Date();
  let daysUntilExpiry: number | null = null;
  if (c.expiryDate) {
    const exp = new Date(c.expiryDate);
    daysUntilExpiry = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  const totalClauses = clausesRaw.length;
  const criticalClauses = clausesRaw.filter((cl) => cl.riskLevel === "critical").length;
  const hasDpaClause = clausesRaw.some((cl) => cl.category === "privacy") || c.contractType === "dpa";

  const totalObligations = obligationsRaw.length;
  const completedObligations = obligationsRaw.filter((o) => o.status === "completed").length;
  const waivedObligations = obligationsRaw.filter((o) => o.status === "waived").length;

  return {
    totalClauses,
    criticalClauses,
    totalObligations,
    completedObligations,
    waivedObligations,
    daysUntilExpiry,
    autoRenewal: c.autoRenewal,
    linkedPolicies: policyCount,
    contractType: c.contractType,
    hasDpaClause,
  };
}

export async function saveContractScore(
  contractId: string,
  score: number
): Promise<void> {
  await db
    .update(contracts)
    .set({ trustScore: score, trustScoreAt: new Date(), updatedAt: new Date() })
    .where(eq(contracts.id, contractId));
}

export async function linkRisk(contractId: string, riskId: string, orgId: string): Promise<void> {
  await db
    .insert(contractRisks)
    .values({ contractId, riskId, organizationId: orgId })
    .onConflictDoNothing();
}

export async function unlinkRisk(contractId: string, riskId: string): Promise<void> {
  await db
    .delete(contractRisks)
    .where(and(eq(contractRisks.contractId, contractId), eq(contractRisks.riskId, riskId)));
}

export async function getLinkedRisks(contractId: string) {
  return db
    .select({ id: risks.id, title: risks.title, status: risks.status, category: risks.category })
    .from(contractRisks)
    .innerJoin(risks, eq(contractRisks.riskId, risks.id))
    .where(eq(contractRisks.contractId, contractId));
}

export async function linkControl(contractId: string, controlId: string, orgId: string): Promise<void> {
  await db
    .insert(contractControls)
    .values({ contractId, controlId, organizationId: orgId })
    .onConflictDoNothing();
}

export async function unlinkControl(contractId: string, controlId: string): Promise<void> {
  await db
    .delete(contractControls)
    .where(and(eq(contractControls.contractId, contractId), eq(contractControls.controlId, controlId)));
}

export async function getLinkedControls(contractId: string) {
  return db
    .select({ id: controls.id, controlRef: controls.controlRef, name: controls.name, status: controls.status })
    .from(contractControls)
    .innerJoin(controls, eq(contractControls.controlId, controls.id))
    .where(eq(contractControls.contractId, contractId));
}

export async function linkPolicy(contractId: string, policyId: string, orgId: string): Promise<void> {
  await db
    .insert(contractPolicies)
    .values({ contractId, policyId, organizationId: orgId })
    .onConflictDoNothing();
}

export async function unlinkPolicy(contractId: string, policyId: string): Promise<void> {
  await db
    .delete(contractPolicies)
    .where(and(eq(contractPolicies.contractId, contractId), eq(contractPolicies.policyId, policyId)));
}

export async function getLinkedPolicies(contractId: string) {
  return db
    .select({ id: policies.id, name: policies.name, status: policies.status })
    .from(contractPolicies)
    .innerJoin(policies, eq(contractPolicies.policyId, policies.id))
    .where(eq(contractPolicies.contractId, contractId));
}

export async function softDeleteContract(id: string, orgId: string): Promise<void> {
  await db
    .update(contracts)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(contracts.id, id), eq(contracts.organizationId, orgId)));
}

export async function restoreContract(id: string, orgId: string): Promise<void> {
  await db
    .update(contracts)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(and(eq(contracts.id, id), eq(contracts.organizationId, orgId)));
}

export async function findDeletedContracts(orgId: string): Promise<ContractWithMeta[]> {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const rows = await db
    .select({
      contract: contracts,
      vendorName: vendors.name,
      ownerName: profiles.fullName,
      ownerEmail: profiles.email,
    })
    .from(contracts)
    .leftJoin(vendors, eq(contracts.vendorId, vendors.id))
    .leftJoin(profiles, eq(contracts.ownerId, profiles.id))
    .where(
      and(
        eq(contracts.organizationId, orgId),
        isNotNull(contracts.deletedAt),
        sql`${contracts.deletedAt} >= ${since.toISOString()}`
      )
    )
    .orderBy(desc(contracts.deletedAt));
  return rows.map(({ contract, vendorName, ownerName, ownerEmail }) => ({
    ...contract,
    vendorName: vendorName ?? null,
    ownerName: ownerName ?? null,
    ownerEmail: ownerEmail ?? null,
  }));
}
