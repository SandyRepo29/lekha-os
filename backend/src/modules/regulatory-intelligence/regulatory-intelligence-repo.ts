import { db } from "@/lib/db";
import {
  regulations, regulationVersions, regulatoryChanges, obligations,
  obligationMappings, regulatoryAssessments, regulatoryImpacts,
  regulatoryReviews, regulatoryAlerts, regulatoryWatchlists,
  regulatorySources, regulatoryAgentConfig, regulatoryTasks, regulatoryUpdates,
} from "@/lib/db/schema";
import { and, eq, or, isNull, desc, asc, count, sql, inArray } from "drizzle-orm";

// ─── Regulations ────────────────────────────────────────────────────────────

export async function findAllRegulations(orgId: string) {
  return db
    .select()
    .from(regulations)
    .where(or(isNull(regulations.organizationId), eq(regulations.organizationId, orgId)))
    .orderBy(asc(regulations.name));
}

export async function findRegulationById(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(regulations)
    .where(
      and(
        eq(regulations.id, id),
        or(isNull(regulations.organizationId), eq(regulations.organizationId, orgId))
      )
    )
    .limit(1);
  return row ?? null;
}

export async function insertRegulation(data: typeof regulations.$inferInsert) {
  const [row] = await db.insert(regulations).values(data).returning();
  return row;
}

export async function updateRegulation(orgId: string, id: string, data: Partial<typeof regulations.$inferInsert>) {
  const [row] = await db
    .update(regulations)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(regulations.id, id), eq(regulations.organizationId, orgId)))
    .returning();
  return row;
}

export async function deleteRegulation(orgId: string, id: string) {
  await db.delete(regulations).where(and(eq(regulations.id, id), eq(regulations.organizationId, orgId)));
}

// ─── Regulatory Changes ──────────────────────────────────────────────────────

export async function findChangesByOrg(orgId: string, filters?: { status?: string; severity?: string; limit?: number }) {
  const conditions = [eq(regulatoryChanges.organizationId, orgId)];
  if (filters?.status) conditions.push(eq(regulatoryChanges.status, filters.status));
  if (filters?.severity) conditions.push(eq(regulatoryChanges.severity, filters.severity));
  return db
    .select()
    .from(regulatoryChanges)
    .where(and(...conditions))
    .orderBy(desc(regulatoryChanges.createdAt))
    .limit(filters?.limit ?? 50);
}

export async function findChangeById(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(regulatoryChanges)
    .where(and(eq(regulatoryChanges.id, id), eq(regulatoryChanges.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

export async function insertChange(data: typeof regulatoryChanges.$inferInsert) {
  const [row] = await db.insert(regulatoryChanges).values(data).returning();
  return row;
}

export async function updateChange(orgId: string, id: string, data: Partial<typeof regulatoryChanges.$inferInsert>) {
  const [row] = await db
    .update(regulatoryChanges)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(regulatoryChanges.id, id), eq(regulatoryChanges.organizationId, orgId)))
    .returning();
  return row;
}

// ─── Obligations ─────────────────────────────────────────────────────────────

export async function findObligationsByOrg(orgId: string, filters?: { status?: string; regulationId?: string; priority?: string }) {
  const conditions = [eq(obligations.organizationId, orgId)];
  if (filters?.status) conditions.push(eq(obligations.status, filters.status));
  if (filters?.priority) conditions.push(eq(obligations.priority, filters.priority));
  if (filters?.regulationId) conditions.push(eq(obligations.regulationId, filters.regulationId));
  return db
    .select()
    .from(obligations)
    .where(and(...conditions))
    .orderBy(desc(obligations.createdAt));
}

export async function findObligationById(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(obligations)
    .where(and(eq(obligations.id, id), eq(obligations.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

export async function insertObligation(data: typeof obligations.$inferInsert) {
  const [row] = await db.insert(obligations).values(data).returning();
  return row;
}

export async function updateObligation(orgId: string, id: string, data: Partial<typeof obligations.$inferInsert>) {
  const [row] = await db
    .update(obligations)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(obligations.id, id), eq(obligations.organizationId, orgId)))
    .returning();
  return row;
}

export async function deleteObligation(orgId: string, id: string) {
  await db.delete(obligations).where(and(eq(obligations.id, id), eq(obligations.organizationId, orgId)));
}

// ─── Obligation Mappings ──────────────────────────────────────────────────────

export async function findMappingsByObligation(obligationId: string) {
  return db
    .select()
    .from(obligationMappings)
    .where(eq(obligationMappings.obligationId, obligationId));
}

export async function insertObligationMapping(data: typeof obligationMappings.$inferInsert) {
  const [row] = await db.insert(obligationMappings).values(data).returning();
  return row;
}

export async function deleteObligationMapping(id: string) {
  await db.delete(obligationMappings).where(eq(obligationMappings.id, id));
}

// ─── Regulatory Assessments ──────────────────────────────────────────────────

export async function findAssessmentsByOrg(orgId: string, filters?: { status?: string }) {
  const conditions = [eq(regulatoryAssessments.organizationId, orgId)];
  if (filters?.status) conditions.push(eq(regulatoryAssessments.status, filters.status));
  return db
    .select()
    .from(regulatoryAssessments)
    .where(and(...conditions))
    .orderBy(desc(regulatoryAssessments.createdAt));
}

export async function findAssessmentById(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(regulatoryAssessments)
    .where(and(eq(regulatoryAssessments.id, id), eq(regulatoryAssessments.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

export async function insertAssessment(data: typeof regulatoryAssessments.$inferInsert) {
  const [row] = await db.insert(regulatoryAssessments).values(data).returning();
  return row;
}

export async function updateAssessment(orgId: string, id: string, data: Partial<typeof regulatoryAssessments.$inferInsert>) {
  const [row] = await db
    .update(regulatoryAssessments)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(regulatoryAssessments.id, id), eq(regulatoryAssessments.organizationId, orgId)))
    .returning();
  return row;
}

// ─── Regulatory Impacts ───────────────────────────────────────────────────────

export async function findImpactsByAssessment(assessmentId: string) {
  return db
    .select()
    .from(regulatoryImpacts)
    .where(eq(regulatoryImpacts.assessmentId, assessmentId))
    .orderBy(desc(regulatoryImpacts.createdAt));
}

export async function insertImpact(data: typeof regulatoryImpacts.$inferInsert) {
  const [row] = await db.insert(regulatoryImpacts).values(data).returning();
  return row;
}

// ─── Regulatory Alerts ────────────────────────────────────────────────────────

export async function findAlertsByOrg(orgId: string, filters?: { status?: string; severity?: string }) {
  const conditions = [eq(regulatoryAlerts.organizationId, orgId)];
  if (filters?.status) conditions.push(eq(regulatoryAlerts.status, filters.status));
  if (filters?.severity) conditions.push(eq(regulatoryAlerts.severity, filters.severity));
  return db
    .select()
    .from(regulatoryAlerts)
    .where(and(...conditions))
    .orderBy(desc(regulatoryAlerts.createdAt))
    .limit(50);
}

export async function insertAlert(data: typeof regulatoryAlerts.$inferInsert) {
  const [row] = await db.insert(regulatoryAlerts).values(data).returning();
  return row;
}

export async function resolveAlert(orgId: string, id: string, resolvedBy: string) {
  const [row] = await db
    .update(regulatoryAlerts)
    .set({ status: "resolved", resolvedAt: new Date(), resolvedBy })
    .where(and(eq(regulatoryAlerts.id, id), eq(regulatoryAlerts.organizationId, orgId)))
    .returning();
  return row;
}

export async function acknowledgeAlert(orgId: string, id: string) {
  const [row] = await db
    .update(regulatoryAlerts)
    .set({ status: "acknowledged" })
    .where(and(eq(regulatoryAlerts.id, id), eq(regulatoryAlerts.organizationId, orgId)))
    .returning();
  return row;
}

// ─── Watchlists ───────────────────────────────────────────────────────────────

export async function findWatchlistsByOrg(orgId: string) {
  return db
    .select()
    .from(regulatoryWatchlists)
    .where(eq(regulatoryWatchlists.organizationId, orgId))
    .orderBy(asc(regulatoryWatchlists.name));
}

export async function insertWatchlist(data: typeof regulatoryWatchlists.$inferInsert) {
  const [row] = await db.insert(regulatoryWatchlists).values(data).returning();
  return row;
}

export async function updateWatchlist(orgId: string, id: string, data: Partial<typeof regulatoryWatchlists.$inferInsert>) {
  const [row] = await db
    .update(regulatoryWatchlists)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(regulatoryWatchlists.id, id), eq(regulatoryWatchlists.organizationId, orgId)))
    .returning();
  return row;
}

export async function deleteWatchlist(orgId: string, id: string) {
  await db.delete(regulatoryWatchlists).where(and(eq(regulatoryWatchlists.id, id), eq(regulatoryWatchlists.organizationId, orgId)));
}

// ─── Sources ─────────────────────────────────────────────────────────────────

export async function findSources(orgId: string) {
  return db
    .select()
    .from(regulatorySources)
    .where(or(isNull(regulatorySources.organizationId), eq(regulatorySources.organizationId, orgId)))
    .orderBy(asc(regulatorySources.name));
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function findTasksByOrg(orgId: string, filters?: { status?: string; priority?: string }) {
  const conditions = [eq(regulatoryTasks.organizationId, orgId)];
  if (filters?.status) conditions.push(eq(regulatoryTasks.status, filters.status));
  if (filters?.priority) conditions.push(eq(regulatoryTasks.priority, filters.priority));
  return db
    .select()
    .from(regulatoryTasks)
    .where(and(...conditions))
    .orderBy(desc(regulatoryTasks.createdAt));
}

export async function insertTask(data: typeof regulatoryTasks.$inferInsert) {
  const [row] = await db.insert(regulatoryTasks).values(data).returning();
  return row;
}

export async function updateTask(orgId: string, id: string, data: Partial<typeof regulatoryTasks.$inferInsert>) {
  const [row] = await db
    .update(regulatoryTasks)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(regulatoryTasks.id, id), eq(regulatoryTasks.organizationId, orgId)))
    .returning();
  return row;
}

// ─── Updates Feed ────────────────────────────────────────────────────────────

export async function findUpdatesByOrg(orgId: string, limit = 20) {
  return db
    .select()
    .from(regulatoryUpdates)
    .where(or(isNull(regulatoryUpdates.organizationId), eq(regulatoryUpdates.organizationId, orgId)))
    .orderBy(desc(regulatoryUpdates.createdAt))
    .limit(limit);
}

export async function markUpdateRead(orgId: string, id: string) {
  await db
    .update(regulatoryUpdates)
    .set({ isRead: true })
    .where(and(eq(regulatoryUpdates.id, id), eq(regulatoryUpdates.organizationId, orgId)));
}

// ─── Dashboard Metrics ───────────────────────────────────────────────────────

export async function getDashboardMetrics(orgId: string) {
  const [
    regCount, changeCount, obligationCount, alertCount,
    openAlerts, openChanges, openTasks, openObligations,
  ] = await Promise.all([
    db.select({ c: count() }).from(regulations)
      .where(or(isNull(regulations.organizationId), eq(regulations.organizationId, orgId))),
    db.select({ c: count() }).from(regulatoryChanges)
      .where(eq(regulatoryChanges.organizationId, orgId)),
    db.select({ c: count() }).from(obligations)
      .where(eq(obligations.organizationId, orgId)),
    db.select({ c: count() }).from(regulatoryAlerts)
      .where(eq(regulatoryAlerts.organizationId, orgId)),
    db.select({ c: count() }).from(regulatoryAlerts)
      .where(and(eq(regulatoryAlerts.organizationId, orgId), eq(regulatoryAlerts.status, "open"))),
    db.select({ c: count() }).from(regulatoryChanges)
      .where(and(eq(regulatoryChanges.organizationId, orgId), eq(regulatoryChanges.status, "new"))),
    db.select({ c: count() }).from(regulatoryTasks)
      .where(and(eq(regulatoryTasks.organizationId, orgId), eq(regulatoryTasks.status, "open"))),
    db.select({ c: count() }).from(obligations)
      .where(and(eq(obligations.organizationId, orgId), eq(obligations.status, "not_started"))),
  ]);

  return {
    totalRegulations: Number(regCount[0]?.c ?? 0),
    totalChanges: Number(changeCount[0]?.c ?? 0),
    totalObligations: Number(obligationCount[0]?.c ?? 0),
    totalAlerts: Number(alertCount[0]?.c ?? 0),
    openAlerts: Number(openAlerts[0]?.c ?? 0),
    newChanges: Number(openChanges[0]?.c ?? 0),
    openTasks: Number(openTasks[0]?.c ?? 0),
    openObligations: Number(openObligations[0]?.c ?? 0),
  };
}

// ─── Regulatory Readiness ─────────────────────────────────────────────────────

export async function getReadinessData(orgId: string) {
  const [total, implemented, validated] = await Promise.all([
    db.select({ c: count() }).from(obligations).where(eq(obligations.organizationId, orgId)),
    db.select({ c: count() }).from(obligations)
      .where(and(eq(obligations.organizationId, orgId), eq(obligations.status, "implemented"))),
    db.select({ c: count() }).from(obligations)
      .where(and(eq(obligations.organizationId, orgId), eq(obligations.status, "validated"))),
  ]);
  const totalCount = Number(total[0]?.c ?? 0);
  const doneCount = Number(implemented[0]?.c ?? 0) + Number(validated[0]?.c ?? 0);
  const score = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  return { total: totalCount, implemented: doneCount, score };
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function findReviewsByOrg(orgId: string) {
  return db
    .select()
    .from(regulatoryReviews)
    .where(eq(regulatoryReviews.organizationId, orgId))
    .orderBy(desc(regulatoryReviews.createdAt))
    .limit(50);
}

export async function insertReview(data: typeof regulatoryReviews.$inferInsert) {
  const [row] = await db.insert(regulatoryReviews).values(data).returning();
  return row;
}

export async function updateReview(orgId: string, id: string, data: Partial<typeof regulatoryReviews.$inferInsert>) {
  const [row] = await db
    .update(regulatoryReviews)
    .set(data)
    .where(and(eq(regulatoryReviews.id, id), eq(regulatoryReviews.organizationId, orgId)))
    .returning();
  return row;
}
