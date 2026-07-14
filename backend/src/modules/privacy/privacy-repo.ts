import { db } from "@/lib/db";
import {
  dataAssets,
  consentRecords,
  privacyRequests,
  retentionPolicies,
  retentionEvents,
  privacyAssessments,
  dataTransfers,
  privacyTrustScores,
  profiles,
  risks,
  controls,
  type DataAsset,
  type ConsentRecord,
  type PrivacyRequest,
  type RetentionPolicy,
  type RetentionEvent,
  type PrivacyAssessment,
  type DataTransfer,
  type PrivacyTrustScore,
} from "@/lib/db/schema";
import { and, eq, sql, desc, count, lt } from "drizzle-orm";
import type { PrivacyScoreInputs } from "@/backend/src/modules/privacy/privacy-score";

/* ============================================================
   Data Assets
   ============================================================ */

export type DataAssetWithOwner = DataAsset & {
  ownerName: string | null;
  ownerEmail: string | null;
};

export type DataAssetDashboardMetrics = {
  total: number;
  sensitive: number;
  crossBorder: number;
  unclassified: number;
  retentionViolations: number;
  averageScore: number;
};

export async function findAssetsByOrg(
  orgId: string,
  filters?: { status?: string; category?: string; sensitivity?: string }
): Promise<DataAssetWithOwner[]> {
  const rows = await db
    .select({
      asset: dataAssets,
      ownerName: profiles.fullName,
      ownerEmail: profiles.email,
    })
    .from(dataAssets)
    .leftJoin(profiles, eq(dataAssets.ownerId, profiles.id))
    .where(
      and(
        eq(dataAssets.organizationId, orgId),
        filters?.status ? sql`${dataAssets.status} = ${filters.status}` : undefined,
        filters?.category
          ? sql`${dataAssets.dataCategory} = ${filters.category}`
          : undefined,
        filters?.sensitivity
          ? sql`${dataAssets.sensitivity} = ${filters.sensitivity}`
          : undefined
      )
    )
    .orderBy(desc(dataAssets.updatedAt));

  return rows.map(({ asset, ownerName, ownerEmail }) => ({
    ...asset,
    ownerName: ownerName ?? null,
    ownerEmail: ownerEmail ?? null,
  }));
}

export async function findAssetById(
  id: string,
  orgId: string
): Promise<DataAssetWithOwner | null> {
  const rows = await db
    .select({
      asset: dataAssets,
      ownerName: profiles.fullName,
      ownerEmail: profiles.email,
    })
    .from(dataAssets)
    .leftJoin(profiles, eq(dataAssets.ownerId, profiles.id))
    .where(and(eq(dataAssets.id, id), eq(dataAssets.organizationId, orgId)));

  if (rows.length === 0) return null;
  const { asset, ownerName, ownerEmail } = rows[0];
  return { ...asset, ownerName: ownerName ?? null, ownerEmail: ownerEmail ?? null };
}

export async function createAsset(data: {
  organizationId: string;
  name: string;
  description?: string;
  ownerId?: string;
  department?: string;
  dataCategory?: string;
  sensitivity?: string;
  purpose?: string;
  storageLocation?: string;
  retentionPeriod?: number;
  crossBorder?: boolean;
}): Promise<DataAsset> {
  const [row] = await db
    .insert(dataAssets)
    .values({
      organizationId: data.organizationId,
      name: data.name,
      description: data.description,
      ownerId: data.ownerId ?? null,
      department: data.department,
      dataCategory: (data.dataCategory as never) ?? "custom",
      sensitivity: (data.sensitivity as never) ?? "medium",
      purpose: data.purpose,
      storageLocation: data.storageLocation,
      retentionPeriod: data.retentionPeriod,
      crossBorder: data.crossBorder ?? false,
    })
    .returning();
  return row;
}

export async function updateAsset(
  id: string,
  orgId: string,
  data: Partial<{
    name: string;
    description: string;
    ownerId: string;
    department: string;
    dataCategory: string;
    sensitivity: string;
    purpose: string;
    storageLocation: string;
    retentionPeriod: number;
    crossBorder: boolean;
    status: string;
    healthScore: number;
  }>
): Promise<DataAsset> {
  const [row] = await db
    .update(dataAssets)
    .set({ ...data, dataCategory: data.dataCategory as never, sensitivity: data.sensitivity as never, status: data.status as never, updatedAt: new Date() })
    .where(and(eq(dataAssets.id, id), eq(dataAssets.organizationId, orgId)))
    .returning();
  return row;
}

export async function deleteAsset(id: string, orgId: string): Promise<void> {
  await db
    .delete(dataAssets)
    .where(and(eq(dataAssets.id, id), eq(dataAssets.organizationId, orgId)));
}

export async function getDataAssetDashboardMetrics(
  orgId: string
): Promise<DataAssetDashboardMetrics> {
  const allAssets = await db
    .select()
    .from(dataAssets)
    .where(and(eq(dataAssets.organizationId, orgId), sql`${dataAssets.status} != 'archived'`));

  const total = allAssets.length;
  const sensitive = allAssets.filter(
    (a) => a.sensitivity === "high" || a.sensitivity === "critical"
  ).length;
  const crossBorder = allAssets.filter((a) => a.crossBorder).length;
  const unclassified = allAssets.filter((a) => a.dataCategory === "custom").length;
  const retentionViolations = allAssets.filter(
    (a) => a.retentionPeriod === null || a.retentionPeriod === undefined
  ).length;
  const scored = allAssets.filter((a) => a.healthScore !== null);
  const averageScore =
    scored.length > 0
      ? Math.round(scored.reduce((s, a) => s + (a.healthScore ?? 0), 0) / scored.length)
      : 0;

  return { total, sensitive, crossBorder, unclassified, retentionViolations, averageScore };
}

/* ============================================================
   Consent Records
   ============================================================ */

export type ConsentMetrics = {
  active: number;
  expired: number;
  withdrawn: number;
  pending: number;
};

export async function findConsentsByOrg(
  orgId: string,
  filters?: { status?: string; assetId?: string }
): Promise<ConsentRecord[]> {
  return db
    .select()
    .from(consentRecords)
    .where(
      and(
        eq(consentRecords.organizationId, orgId),
        filters?.status
          ? sql`${consentRecords.consentStatus} = ${filters.status}`
          : undefined,
        filters?.assetId ? eq(consentRecords.dataAssetId, filters.assetId) : undefined
      )
    )
    .orderBy(desc(consentRecords.updatedAt));
}

export async function findConsentById(id: string, orgId: string): Promise<ConsentRecord | null> {
  const rows = await db
    .select()
    .from(consentRecords)
    .where(and(eq(consentRecords.id, id), eq(consentRecords.organizationId, orgId)));
  return rows[0] ?? null;
}

export async function createConsent(data: {
  organizationId: string;
  subjectId: string;
  subjectName?: string;
  subjectEmail?: string;
  purpose: string;
  consentStatus?: string;
  dataAssetId?: string;
  obtainedAt?: Date;
  expiresAt?: Date;
  source?: string;
  notes?: string;
}): Promise<ConsentRecord> {
  const [row] = await db
    .insert(consentRecords)
    .values({
      organizationId: data.organizationId,
      subjectId: data.subjectId,
      subjectName: data.subjectName,
      subjectEmail: data.subjectEmail,
      purpose: data.purpose,
      consentStatus: (data.consentStatus as never) ?? "pending",
      dataAssetId: data.dataAssetId ?? null,
      obtainedAt: data.obtainedAt ?? null,
      expiresAt: data.expiresAt ?? null,
      source: data.source,
      notes: data.notes,
    })
    .returning();
  return row;
}

export async function updateConsent(
  id: string,
  orgId: string,
  data: Partial<{
    consentStatus: string;
    obtainedAt: Date;
    expiresAt: Date;
    withdrawnAt: Date;
    notes: string;
  }>
): Promise<ConsentRecord> {
  const [row] = await db
    .update(consentRecords)
    .set({ ...data, consentStatus: data.consentStatus as never, updatedAt: new Date() })
    .where(and(eq(consentRecords.id, id), eq(consentRecords.organizationId, orgId)))
    .returning();
  return row;
}

export async function deleteConsent(id: string, orgId: string): Promise<void> {
  await db
    .delete(consentRecords)
    .where(and(eq(consentRecords.id, id), eq(consentRecords.organizationId, orgId)));
}

export async function getConsentMetrics(orgId: string): Promise<ConsentMetrics> {
  const rows = await db
    .select({ status: consentRecords.consentStatus })
    .from(consentRecords)
    .where(eq(consentRecords.organizationId, orgId));

  return {
    active: rows.filter((r) => r.status === "granted").length,
    expired: rows.filter((r) => r.status === "expired").length,
    withdrawn: rows.filter((r) => r.status === "withdrawn").length,
    pending: rows.filter((r) => r.status === "pending").length,
  };
}

/* ============================================================
   Privacy Requests (DSR)
   ============================================================ */

export type DsrMetrics = {
  total: number;
  open: number;
  overdue: number;
  avgResolutionDays: number;
};

export async function findRequestsByOrg(
  orgId: string,
  filters?: { status?: string; type?: string }
): Promise<PrivacyRequest[]> {
  return db
    .select()
    .from(privacyRequests)
    .where(
      and(
        eq(privacyRequests.organizationId, orgId),
        filters?.status
          ? sql`${privacyRequests.status} = ${filters.status}`
          : undefined,
        filters?.type
          ? sql`${privacyRequests.requestType} = ${filters.type}`
          : undefined
      )
    )
    .orderBy(desc(privacyRequests.submittedAt));
}

export async function findRequestById(id: string, orgId: string): Promise<PrivacyRequest | null> {
  const rows = await db
    .select()
    .from(privacyRequests)
    .where(and(eq(privacyRequests.id, id), eq(privacyRequests.organizationId, orgId)));
  return rows[0] ?? null;
}

export async function createRequest(data: {
  organizationId: string;
  requestType: string;
  subjectName: string;
  subjectEmail: string;
  description?: string;
  ownerId?: string;
  dueDate?: Date;
}): Promise<PrivacyRequest> {
  const [row] = await db
    .insert(privacyRequests)
    .values({
      organizationId: data.organizationId,
      requestType: data.requestType as never,
      subjectName: data.subjectName,
      subjectEmail: data.subjectEmail,
      description: data.description,
      ownerId: data.ownerId ?? null,
      dueDate: data.dueDate ?? null,
    })
    .returning();
  return row;
}

export async function updateRequest(
  id: string,
  orgId: string,
  data: Partial<{
    status: string;
    ownerId: string;
    dueDate: Date;
    completedAt: Date;
    resolutionNotes: string;
  }>
): Promise<PrivacyRequest> {
  const [row] = await db
    .update(privacyRequests)
    .set({ ...data, status: data.status as never, updatedAt: new Date() })
    .where(and(eq(privacyRequests.id, id), eq(privacyRequests.organizationId, orgId)))
    .returning();
  return row;
}

export async function deleteRequest(id: string, orgId: string): Promise<void> {
  await db
    .delete(privacyRequests)
    .where(and(eq(privacyRequests.id, id), eq(privacyRequests.organizationId, orgId)));
}

export async function getDsrMetrics(orgId: string): Promise<DsrMetrics> {
  const today = new Date();
  const rows = await db
    .select()
    .from(privacyRequests)
    .where(eq(privacyRequests.organizationId, orgId));

  const total = rows.length;
  const open = rows.filter((r) =>
    ["submitted", "assigned", "investigating"].includes(r.status)
  ).length;
  const overdue = rows.filter((r) => {
    if (!r.dueDate) return false;
    return new Date(r.dueDate) < today && r.status !== "completed" && r.status !== "closed";
  }).length;

  const completed = rows.filter((r) => r.completedAt);
  const avgResolutionDays =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, r) => {
            const diff =
              (new Date(r.completedAt!).getTime() - new Date(r.submittedAt).getTime()) /
              (1000 * 60 * 60 * 24);
            return sum + diff;
          }, 0) / completed.length
        )
      : 0;

  return { total, open, overdue, avgResolutionDays };
}

/* ============================================================
   Retention Policies
   ============================================================ */

export async function findRetentionPoliciesByOrg(orgId: string): Promise<RetentionPolicy[]> {
  return db
    .select()
    .from(retentionPolicies)
    .where(eq(retentionPolicies.organizationId, orgId))
    .orderBy(retentionPolicies.name);
}

export async function createRetentionPolicy(data: {
  organizationId: string;
  name: string;
  description?: string;
  dataCategory?: string;
  retentionDays: number;
  legalBasis?: string;
  actionOnExpiry?: string;
}): Promise<RetentionPolicy> {
  const [row] = await db
    .insert(retentionPolicies)
    .values({
      organizationId: data.organizationId,
      name: data.name,
      description: data.description,
      dataCategory: (data.dataCategory as never) ?? "custom",
      retentionDays: data.retentionDays,
      legalBasis: data.legalBasis,
      actionOnExpiry: data.actionOnExpiry ?? "delete",
    })
    .returning();
  return row;
}

export async function updateRetentionPolicy(
  id: string,
  orgId: string,
  data: Partial<{
    name: string;
    description: string;
    dataCategory: string;
    retentionDays: number;
    legalBasis: string;
    actionOnExpiry: string;
    isActive: boolean;
  }>
): Promise<RetentionPolicy> {
  const [row] = await db
    .update(retentionPolicies)
    .set({ ...data, dataCategory: data.dataCategory as never, updatedAt: new Date() })
    .where(and(eq(retentionPolicies.id, id), eq(retentionPolicies.organizationId, orgId)))
    .returning();
  return row;
}

export async function deleteRetentionPolicy(id: string, orgId: string): Promise<void> {
  await db
    .delete(retentionPolicies)
    .where(and(eq(retentionPolicies.id, id), eq(retentionPolicies.organizationId, orgId)));
}

/* ============================================================
   Privacy Assessments (PIA)
   ============================================================ */

export async function findAssessmentsByOrg(
  orgId: string,
  filters?: { status?: string; riskLevel?: string }
): Promise<PrivacyAssessment[]> {
  return db
    .select()
    .from(privacyAssessments)
    .where(
      and(
        eq(privacyAssessments.organizationId, orgId),
        filters?.status
          ? sql`${privacyAssessments.status} = ${filters.status}`
          : undefined,
        filters?.riskLevel
          ? sql`${privacyAssessments.riskLevel} = ${filters.riskLevel}`
          : undefined
      )
    )
    .orderBy(desc(privacyAssessments.updatedAt));
}

export async function findAssessmentById(
  id: string,
  orgId: string
): Promise<PrivacyAssessment | null> {
  const rows = await db
    .select()
    .from(privacyAssessments)
    .where(and(eq(privacyAssessments.id, id), eq(privacyAssessments.organizationId, orgId)));
  return rows[0] ?? null;
}

export async function createAssessment(data: {
  organizationId: string;
  title: string;
  scope?: string;
  ownerId?: string;
  riskLevel?: string;
  purpose?: string;
  dataTypes?: string;
}): Promise<PrivacyAssessment> {
  const [row] = await db
    .insert(privacyAssessments)
    .values({
      organizationId: data.organizationId,
      title: data.title,
      scope: data.scope,
      ownerId: data.ownerId ?? null,
      riskLevel: (data.riskLevel as never) ?? "medium",
      purpose: data.purpose,
      dataTypes: data.dataTypes,
    })
    .returning();
  return row;
}

export async function updateAssessment(
  id: string,
  orgId: string,
  data: Partial<{
    title: string;
    scope: string;
    ownerId: string;
    riskLevel: string;
    status: string;
    purpose: string;
    dataTypes: string;
    risks: string;
    mitigations: string;
    controls: string;
    residualRisk: string;
    approvedBy: string;
    approvedAt: Date;
    reviewDate: Date;
    aiSummary: string;
  }>
): Promise<PrivacyAssessment> {
  const [row] = await db
    .update(privacyAssessments)
    .set({
      ...data,
      riskLevel: data.riskLevel as never,
      status: data.status as never,
      updatedAt: new Date(),
    })
    .where(and(eq(privacyAssessments.id, id), eq(privacyAssessments.organizationId, orgId)))
    .returning();
  return row;
}

export async function deleteAssessment(id: string, orgId: string): Promise<void> {
  await db
    .delete(privacyAssessments)
    .where(
      and(eq(privacyAssessments.id, id), eq(privacyAssessments.organizationId, orgId))
    );
}

/* ============================================================
   Data Transfers
   ============================================================ */

export async function findTransfersByOrg(orgId: string): Promise<DataTransfer[]> {
  return db
    .select()
    .from(dataTransfers)
    .where(eq(dataTransfers.organizationId, orgId))
    .orderBy(desc(dataTransfers.updatedAt));
}

export async function createTransfer(data: {
  organizationId: string;
  dataAssetId?: string;
  destinationCountry: string;
  recipientName: string;
  transferBasis: string;
  riskNotes?: string;
  reviewDate?: Date;
}): Promise<DataTransfer> {
  const [row] = await db
    .insert(dataTransfers)
    .values({
      organizationId: data.organizationId,
      dataAssetId: data.dataAssetId ?? null,
      destinationCountry: data.destinationCountry,
      recipientName: data.recipientName,
      transferBasis: data.transferBasis,
      riskNotes: data.riskNotes,
      reviewDate: data.reviewDate ?? null,
    })
    .returning();
  return row;
}

export async function updateTransfer(
  id: string,
  orgId: string,
  data: Partial<{
    status: string;
    riskNotes: string;
    approvedBy: string;
    approvedAt: Date;
    reviewDate: Date;
  }>
): Promise<DataTransfer> {
  const [row] = await db
    .update(dataTransfers)
    .set({ ...data, status: data.status as never, updatedAt: new Date() })
    .where(and(eq(dataTransfers.id, id), eq(dataTransfers.organizationId, orgId)))
    .returning();
  return row;
}

export async function deleteTransfer(id: string, orgId: string): Promise<void> {
  await db
    .delete(dataTransfers)
    .where(and(eq(dataTransfers.id, id), eq(dataTransfers.organizationId, orgId)));
}

/* ============================================================
   Privacy Trust Scores
   ============================================================ */

export async function savePrivacyScore(data: {
  organizationId: string;
  score: number;
  inventoryScore: number;
  consentScore: number;
  dsrScore: number;
  retentionScore: number;
  riskScore: number;
  controlsScore: number;
}): Promise<PrivacyTrustScore> {
  const [row] = await db
    .insert(privacyTrustScores)
    .values({
      organizationId: data.organizationId,
      score: data.score,
      inventoryScore: data.inventoryScore,
      consentScore: data.consentScore,
      dsrScore: data.dsrScore,
      retentionScore: data.retentionScore,
      riskScore: data.riskScore,
      controlsScore: data.controlsScore,
    })
    .returning();
  return row;
}

export async function getLatestPrivacyScore(
  orgId: string
): Promise<PrivacyTrustScore | null> {
  const rows = await db
    .select()
    .from(privacyTrustScores)
    .where(eq(privacyTrustScores.organizationId, orgId))
    .orderBy(desc(privacyTrustScores.computedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getScoreHistory(
  orgId: string,
  days: number
): Promise<PrivacyTrustScore[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(privacyTrustScores)
    .where(
      and(
        eq(privacyTrustScores.organizationId, orgId),
        sql`${privacyTrustScores.computedAt} >= ${cutoff.toISOString()}`
      )
    )
    .orderBy(desc(privacyTrustScores.computedAt));
}

/* ============================================================
   Score Inputs Aggregator
   ============================================================ */

export async function getScoreInputs(orgId: string): Promise<PrivacyScoreInputs> {
  const [
    allAssets,
    consentRows,
    dsrRows,
    retentionPoliciesRows,
    riskRows,
    controlRows,
  ] = await Promise.all([
    db
      .select()
      .from(dataAssets)
      .where(and(eq(dataAssets.organizationId, orgId), sql`${dataAssets.status} != 'archived'`)),
    db
      .select({ status: consentRecords.consentStatus })
      .from(consentRecords)
      .where(eq(consentRecords.organizationId, orgId)),
    db
      .select()
      .from(privacyRequests)
      .where(eq(privacyRequests.organizationId, orgId)),
    db
      .select({ category: retentionPolicies.dataCategory })
      .from(retentionPolicies)
      .where(
        and(eq(retentionPolicies.organizationId, orgId), eq(retentionPolicies.isActive, true))
      ),
    db
      .select({ status: risks.status, inherentScore: risks.inherentScore })
      .from(risks)
      .where(
        and(
          eq(risks.organizationId, orgId),
          eq(risks.category, "privacy"),
          sql`${risks.status} NOT IN ('closed', 'archived', 'accepted', 'transferred')`
        )
      ),
    db
      .select({ status: controls.status })
      .from(controls)
      .where(eq(controls.organizationId, orgId)),
  ]);

  const today = new Date();
  const totalAssets = allAssets.length;
  const classifiedAssets = allAssets.filter((a) => a.dataCategory !== "custom").length;

  const totalConsents = consentRows.length;
  const activeConsents = consentRows.filter((r) => r.status === "granted").length;
  const expiredConsents = consentRows.filter((r) => r.status === "expired").length;

  const totalDsrs = dsrRows.length;
  const completedDsrs = dsrRows.filter((r) =>
    ["completed", "closed"].includes(r.status)
  ).length;
  const overdueDsrs = dsrRows.filter((r) => {
    if (!r.dueDate) return false;
    return (
      new Date(r.dueDate) < today && !["completed", "closed"].includes(r.status)
    );
  }).length;

  // Retention: assets that have a matching category retention policy
  const retentionCategories = new Set(retentionPoliciesRows.map((r) => r.category));
  const assetsWithRetentionPolicy = allAssets.filter((a) =>
    retentionCategories.has(a.dataCategory)
  ).length;
  const retentionViolations = allAssets.filter(
    (a) => !a.retentionPeriod || a.retentionPeriod === 0
  ).length;

  const openPrivacyRisks = riskRows.length;
  const criticalPrivacyRisks = riskRows.filter((r) => (r.inherentScore ?? 0) >= 20).length;

  const totalPrivacyControls = controlRows.length;
  const effectivePrivacyControls = controlRows.filter(
    (r) => r.status === "implemented"
  ).length;

  return {
    totalAssets,
    classifiedAssets,
    activeConsents,
    totalConsents,
    expiredConsents,
    completedDsrs,
    totalDsrs,
    overdueDsrs,
    assetsWithRetentionPolicy,
    retentionViolations,
    openPrivacyRisks,
    criticalPrivacyRisks,
    totalPrivacyControls,
    effectivePrivacyControls,
  };
}
