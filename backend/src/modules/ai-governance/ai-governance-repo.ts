import { db } from "@/lib/db";
import {
  aiSystems,
  aiVendors,
  aiRisks,
  aiControls,
  aiPolicies,
  aiAssessments,
  aiIncidents,
  aiComplianceRecords,
  aiTrustScores,
  type AiSystem,
  type AiVendor,
  type AiRisk,
  type AiControl,
  type AiPolicy,
  type AiAssessment,
  type AiIncident,
  type AiComplianceRecord,
  type AiTrustScore,
} from "@/lib/db/schema";
import { eq, and, desc, asc, count, sql, or } from "drizzle-orm";

// ── AI Systems ────────────────────────────────────────────────────────────────

export async function getDashboardMetrics(orgId: string): Promise<{
  totalSystems: number;
  approvedSystems: number;
  highRiskSystems: number;
  pendingReview: number;
  avgTrustScore: number;
  byType: { systemType: string; count: number }[];
  byRiskLevel: { riskLevel: string; count: number }[];
  recentSystems: AiSystem[];
}> {
  const [
    totalRows,
    approvedRows,
    highRiskRows,
    pendingRows,
    avgTrustRows,
    byTypeRows,
    byRiskRows,
    recentRows,
  ] = await Promise.all([
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(aiSystems)
      .where(eq(aiSystems.organizationId, orgId)),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(aiSystems)
      .where(and(eq(aiSystems.organizationId, orgId), eq(aiSystems.approvalStatus, "approved"))),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(aiSystems)
      .where(and(eq(aiSystems.organizationId, orgId), or(eq(aiSystems.riskClassification, "high"), eq(aiSystems.riskClassification, "critical")))),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(aiSystems)
      .where(and(eq(aiSystems.organizationId, orgId), eq(aiSystems.approvalStatus, "pending"))),
    db
      .select({ avg: sql<number>`avg(ai_trust_score)::numeric(5,2)` })
      .from(aiSystems)
      .where(and(eq(aiSystems.organizationId, orgId), sql`ai_trust_score is not null`)),
    db
      .select({
        systemType: aiSystems.systemType,
        count: sql<number>`count(*)::int`,
      })
      .from(aiSystems)
      .where(eq(aiSystems.organizationId, orgId))
      .groupBy(aiSystems.systemType),
    db
      .select({
        riskLevel: aiSystems.riskClassification,
        count: sql<number>`count(*)::int`,
      })
      .from(aiSystems)
      .where(eq(aiSystems.organizationId, orgId))
      .groupBy(aiSystems.riskClassification),
    db
      .select()
      .from(aiSystems)
      .where(eq(aiSystems.organizationId, orgId))
      .orderBy(desc(aiSystems.createdAt))
      .limit(5),
  ]);

  return {
    totalSystems: totalRows[0]?.c ?? 0,
    approvedSystems: approvedRows[0]?.c ?? 0,
    highRiskSystems: highRiskRows[0]?.c ?? 0,
    pendingReview: pendingRows[0]?.c ?? 0,
    avgTrustScore: Number(avgTrustRows[0]?.avg ?? 0),
    byType: byTypeRows,
    byRiskLevel: byRiskRows,
    recentSystems: recentRows,
  };
}

export async function findAllSystems(
  orgId: string,
  filters?: { status?: string; riskLevel?: string; systemType?: string }
): Promise<AiSystem[]> {
  const conditions = [eq(aiSystems.organizationId, orgId)];
  if (filters?.status) conditions.push(eq(aiSystems.approvalStatus, filters.status as any));
  if (filters?.riskLevel) conditions.push(eq(aiSystems.riskClassification, filters.riskLevel as any));
  if (filters?.systemType) conditions.push(eq(aiSystems.systemType, filters.systemType as any));

  return db
    .select()
    .from(aiSystems)
    .where(and(...conditions))
    .orderBy(desc(aiSystems.createdAt));
}

export async function findSystemById(
  orgId: string,
  id: string
): Promise<AiSystem | null> {
  const rows = await db
    .select()
    .from(aiSystems)
    .where(and(eq(aiSystems.organizationId, orgId), eq(aiSystems.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createSystem(
  orgId: string,
  data: Omit<AiSystem, "id" | "organizationId" | "createdAt" | "updatedAt" | "createdBy">,
  createdBy: string
): Promise<AiSystem> {
  const rows = await db
    .insert(aiSystems)
    .values({ ...data, organizationId: orgId, createdBy })
    .returning();
  return rows[0];
}

export async function updateSystem(
  orgId: string,
  id: string,
  data: Partial<Omit<AiSystem, "id" | "organizationId" | "createdAt" | "createdBy">>
): Promise<AiSystem> {
  const rows = await db
    .update(aiSystems)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(aiSystems.organizationId, orgId), eq(aiSystems.id, id)))
    .returning();
  return rows[0];
}

export async function deleteSystem(orgId: string, id: string): Promise<void> {
  await db
    .delete(aiSystems)
    .where(and(eq(aiSystems.organizationId, orgId), eq(aiSystems.id, id)));
}

// ── AI Vendors ────────────────────────────────────────────────────────────────

export async function findAllVendors(orgId: string): Promise<AiVendor[]> {
  return db
    .select()
    .from(aiVendors)
    .where(eq(aiVendors.organizationId, orgId))
    .orderBy(asc(aiVendors.name));
}

export async function findVendorById(
  orgId: string,
  id: string
): Promise<AiVendor | null> {
  const rows = await db
    .select()
    .from(aiVendors)
    .where(and(eq(aiVendors.organizationId, orgId), eq(aiVendors.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createVendor(
  orgId: string,
  data: Omit<AiVendor, "id" | "organizationId" | "createdAt" | "updatedAt" | "createdBy">,
  createdBy: string
): Promise<AiVendor> {
  const rows = await db
    .insert(aiVendors)
    .values({ ...data, organizationId: orgId, createdBy })
    .returning();
  return rows[0];
}

export async function updateVendor(
  orgId: string,
  id: string,
  data: Partial<Omit<AiVendor, "id" | "organizationId" | "createdAt" | "createdBy">>
): Promise<AiVendor> {
  const rows = await db
    .update(aiVendors)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(aiVendors.organizationId, orgId), eq(aiVendors.id, id)))
    .returning();
  return rows[0];
}

export async function deleteVendor(orgId: string, id: string): Promise<void> {
  await db
    .delete(aiVendors)
    .where(and(eq(aiVendors.organizationId, orgId), eq(aiVendors.id, id)));
}

// ── AI Risks ──────────────────────────────────────────────────────────────────

export async function findAllRisks(
  orgId: string,
  filters?: { status?: string; category?: string; systemId?: string }
): Promise<AiRisk[]> {
  let query = db
    .select()
    .from(aiRisks)
    .where(eq(aiRisks.organizationId, orgId))
    .$dynamic();

  if (filters?.status) {
    query = query.where(
      and(eq(aiRisks.organizationId, orgId), eq(aiRisks.status, filters.status))
    );
  }
  if (filters?.category) {
    query = query.where(
      and(eq(aiRisks.organizationId, orgId), eq(aiRisks.riskCategory, filters.category as any))
    );
  }
  if (filters?.systemId) {
    query = query.where(
      and(eq(aiRisks.organizationId, orgId), eq(aiRisks.aiSystemId, filters.systemId))
    );
  }

  return query.orderBy(desc(aiRisks.createdAt));
}

export async function findRisksBySystem(systemId: string): Promise<AiRisk[]> {
  return db
    .select()
    .from(aiRisks)
    .where(eq(aiRisks.aiSystemId, systemId))
    .orderBy(desc(aiRisks.createdAt));
}

export async function createRisk(
  orgId: string,
  data: Omit<AiRisk, "id" | "organizationId" | "createdAt" | "updatedAt" | "createdBy">,
  createdBy: string
): Promise<AiRisk> {
  const rows = await db
    .insert(aiRisks)
    .values({ ...data, organizationId: orgId, createdBy })
    .returning();
  return rows[0];
}

export async function updateRisk(
  orgId: string,
  id: string,
  data: Partial<Omit<AiRisk, "id" | "organizationId" | "createdAt" | "createdBy">>
): Promise<AiRisk> {
  const rows = await db
    .update(aiRisks)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(aiRisks.organizationId, orgId), eq(aiRisks.id, id)))
    .returning();
  return rows[0];
}

export async function deleteRisk(orgId: string, id: string): Promise<void> {
  await db
    .delete(aiRisks)
    .where(and(eq(aiRisks.organizationId, orgId), eq(aiRisks.id, id)));
}

// ── AI Controls ───────────────────────────────────────────────────────────────

export async function findAllControls(orgId: string): Promise<AiControl[]> {
  return db
    .select()
    .from(aiControls)
    .where(eq(aiControls.organizationId, orgId))
    .orderBy(asc(aiControls.name));
}

export async function createControl(
  orgId: string,
  data: Omit<AiControl, "id" | "organizationId" | "createdAt" | "updatedAt" | "createdBy">,
  createdBy: string
): Promise<AiControl> {
  const rows = await db
    .insert(aiControls)
    .values({ ...data, organizationId: orgId, createdBy })
    .returning();
  return rows[0];
}

export async function updateControl(
  orgId: string,
  id: string,
  data: Partial<Omit<AiControl, "id" | "organizationId" | "createdAt" | "createdBy">>
): Promise<AiControl> {
  const rows = await db
    .update(aiControls)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(aiControls.organizationId, orgId), eq(aiControls.id, id)))
    .returning();
  return rows[0];
}

// ── AI Policies ───────────────────────────────────────────────────────────────

export async function findAllPolicies(orgId: string): Promise<AiPolicy[]> {
  return db
    .select()
    .from(aiPolicies)
    .where(eq(aiPolicies.organizationId, orgId))
    .orderBy(asc(aiPolicies.name));
}

export async function createPolicy(
  orgId: string,
  data: Omit<AiPolicy, "id" | "organizationId" | "createdAt" | "updatedAt" | "createdBy">,
  createdBy: string
): Promise<AiPolicy> {
  const rows = await db
    .insert(aiPolicies)
    .values({ ...data, organizationId: orgId, createdBy })
    .returning();
  return rows[0];
}

export async function updatePolicy(
  orgId: string,
  id: string,
  data: Partial<Omit<AiPolicy, "id" | "organizationId" | "createdAt" | "createdBy">>
): Promise<AiPolicy> {
  const rows = await db
    .update(aiPolicies)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(aiPolicies.organizationId, orgId), eq(aiPolicies.id, id)))
    .returning();
  return rows[0];
}

// ── AI Assessments ────────────────────────────────────────────────────────────

export async function findAllAssessments(orgId: string): Promise<AiAssessment[]> {
  return db
    .select()
    .from(aiAssessments)
    .where(eq(aiAssessments.organizationId, orgId))
    .orderBy(desc(aiAssessments.createdAt));
}

export async function findAssessmentsBySystem(systemId: string): Promise<AiAssessment[]> {
  return db
    .select()
    .from(aiAssessments)
    .where(eq(aiAssessments.aiSystemId, systemId))
    .orderBy(desc(aiAssessments.createdAt));
}

export async function createAssessment(
  orgId: string,
  data: Omit<AiAssessment, "id" | "organizationId" | "createdAt" | "updatedAt" | "createdBy">,
  createdBy: string
): Promise<AiAssessment> {
  const rows = await db
    .insert(aiAssessments)
    .values({ ...data, organizationId: orgId, createdBy })
    .returning();
  return rows[0];
}

export async function updateAssessment(
  orgId: string,
  id: string,
  data: Partial<Omit<AiAssessment, "id" | "organizationId" | "createdAt" | "createdBy">>
): Promise<AiAssessment> {
  const rows = await db
    .update(aiAssessments)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(aiAssessments.organizationId, orgId), eq(aiAssessments.id, id)))
    .returning();
  return rows[0];
}

// ── AI Incidents ──────────────────────────────────────────────────────────────

export async function findAllIncidents(
  orgId: string,
  filters?: { status?: string; severity?: string; systemId?: string }
): Promise<AiIncident[]> {
  let query = db
    .select()
    .from(aiIncidents)
    .where(eq(aiIncidents.organizationId, orgId))
    .$dynamic();

  if (filters?.status) {
    query = query.where(
      and(eq(aiIncidents.organizationId, orgId), eq(aiIncidents.status, filters.status))
    );
  }
  if (filters?.severity) {
    query = query.where(
      and(eq(aiIncidents.organizationId, orgId), eq(aiIncidents.severity, filters.severity))
    );
  }
  if (filters?.systemId) {
    query = query.where(
      and(eq(aiIncidents.organizationId, orgId), eq(aiIncidents.aiSystemId, filters.systemId))
    );
  }

  return query.orderBy(desc(aiIncidents.createdAt));
}

export async function createIncident(
  orgId: string,
  data: Omit<AiIncident, "id" | "organizationId" | "createdAt" | "updatedAt" | "reporterId">,
  reporterId: string
): Promise<AiIncident> {
  const rows = await db
    .insert(aiIncidents)
    .values({ ...data, organizationId: orgId, reporterId })
    .returning();
  return rows[0];
}

export async function updateIncident(
  orgId: string,
  id: string,
  data: Partial<Omit<AiIncident, "id" | "organizationId" | "createdAt" | "reporterId">>
): Promise<AiIncident> {
  const rows = await db
    .update(aiIncidents)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(aiIncidents.organizationId, orgId), eq(aiIncidents.id, id)))
    .returning();
  return rows[0];
}

// ── AI Compliance ─────────────────────────────────────────────────────────────

export async function findAllCompliance(orgId: string): Promise<AiComplianceRecord[]> {
  return db
    .select()
    .from(aiComplianceRecords)
    .where(eq(aiComplianceRecords.organizationId, orgId))
    .orderBy(asc(aiComplianceRecords.framework));
}

export async function upsertComplianceRecord(
  orgId: string,
  framework: string,
  data: Partial<Omit<AiComplianceRecord, "id" | "organizationId" | "framework" | "createdAt">>
): Promise<AiComplianceRecord> {
  const rows = await db
    .insert(aiComplianceRecords)
    .values({ organizationId: orgId, framework: framework as any, ...data, updatedAt: new Date() } as any)
    .onConflictDoUpdate({
      target: [aiComplianceRecords.organizationId, aiComplianceRecords.framework],
      set: { ...data, updatedAt: new Date() },
    })
    .returning();
  return rows[0];
}

// ── AI Trust Scores ───────────────────────────────────────────────────────────

export async function findTrustScoreBySystem(systemId: string): Promise<AiTrustScore | null> {
  const rows = await db
    .select()
    .from(aiTrustScores)
    .where(eq(aiTrustScores.aiSystemId, systemId))
    .orderBy(desc(aiTrustScores.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function saveAiTrustScore(
  orgId: string,
  systemId: string,
  scores: Omit<AiTrustScore, "id" | "organizationId" | "systemId" | "createdAt" | "updatedAt">
): Promise<AiTrustScore> {
  const rows = await db
    .insert(aiTrustScores)
    .values({ organizationId: orgId, aiSystemId: systemId, ...(scores as any) })
    .returning();
  return rows[0];
}
