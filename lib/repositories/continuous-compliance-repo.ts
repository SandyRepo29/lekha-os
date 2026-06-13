import { db } from "@/lib/db";
import {
  complianceChecks, complianceCheckRuns, ccEvidence, controlValidations,
  accessReviews, accessReviewUsers, attestations, attestationResponses,
  trainingCampaigns, trainingAssignments, workforceEvents,
  complianceSignals, complianceHealthScores, complianceExceptions,
  automationRules, continuousReadiness,
} from "@/lib/db/schema";
import { eq, and, desc, sql, isNull, or } from "drizzle-orm";

// ── Dashboard metrics ─────────────────────────────────────────────────────────

export async function getDashboardMetrics(orgId: string) {
  const [checks, runs, signals, reviews, attestationRows, training] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` })
      .from(complianceChecks)
      .where(or(eq(complianceChecks.organizationId, orgId), isNull(complianceChecks.organizationId))),
    db.select({
      result: complianceCheckRuns.result,
      count: sql<number>`count(*)::int`,
    })
      .from(complianceCheckRuns)
      .where(eq(complianceCheckRuns.organizationId, orgId))
      .groupBy(complianceCheckRuns.result),
    db.select({
      status: complianceSignals.status,
      count: sql<number>`count(*)::int`,
    })
      .from(complianceSignals)
      .where(eq(complianceSignals.organizationId, orgId))
      .groupBy(complianceSignals.status),
    db.select({ count: sql<number>`count(*)::int` })
      .from(accessReviews)
      .where(and(eq(accessReviews.organizationId, orgId), eq(accessReviews.status, "active"))),
    db.select({ count: sql<number>`count(*)::int` })
      .from(attestations)
      .where(and(eq(attestations.organizationId, orgId), eq(attestations.status, "active"))),
    db.select({ count: sql<number>`count(*)::int` })
      .from(trainingCampaigns)
      .where(and(eq(trainingCampaigns.organizationId, orgId), eq(trainingCampaigns.status, "active"))),
  ]);

  const runMap: Record<string, number> = {};
  for (const r of runs) runMap[r.result] = r.count;
  const sigMap: Record<string, number> = {};
  for (const s of signals) sigMap[s.status] = s.count;

  const totalRuns = Object.values(runMap).reduce((a, b) => a + b, 0);
  const passRate = totalRuns > 0 ? Math.round(((runMap.pass ?? 0) / totalRuns) * 100) : 0;

  return {
    totalChecks:     checks[0]?.count ?? 0,
    passingChecks:   runMap.pass ?? 0,
    failingChecks:   runMap.fail ?? 0,
    checkPassRate:   passRate,
    openSignals:     sigMap.open ?? 0,
    activeReviews:   reviews[0]?.count ?? 0,
    activeAttestations: attestationRows[0]?.count ?? 0,
    activeTraining:  training[0]?.count ?? 0,
  };
}

// ── Compliance Checks ─────────────────────────────────────────────────────────

export async function findAllChecks(orgId: string) {
  return db.select()
    .from(complianceChecks)
    .where(or(eq(complianceChecks.organizationId, orgId), isNull(complianceChecks.organizationId)))
    .orderBy(complianceChecks.category, complianceChecks.name);
}

export async function findCheckById(id: string) {
  const rows = await db.select().from(complianceChecks).where(eq(complianceChecks.id, id));
  return rows[0] ?? null;
}

export async function insertCheck(data: typeof complianceChecks.$inferInsert) {
  const rows = await db.insert(complianceChecks).values(data).returning();
  return rows[0];
}

export async function updateCheck(id: string, data: Partial<typeof complianceChecks.$inferInsert>) {
  const rows = await db.update(complianceChecks).set({ ...data, updatedAt: new Date() }).where(eq(complianceChecks.id, id)).returning();
  return rows[0];
}

// ── Check Runs ────────────────────────────────────────────────────────────────

export async function findRunsByOrg(orgId: string, limit = 50) {
  return db.select()
    .from(complianceCheckRuns)
    .where(eq(complianceCheckRuns.organizationId, orgId))
    .orderBy(desc(complianceCheckRuns.startedAt))
    .limit(limit);
}

export async function findRunsByCheck(orgId: string, checkId: string, limit = 20) {
  return db.select()
    .from(complianceCheckRuns)
    .where(and(eq(complianceCheckRuns.organizationId, orgId), eq(complianceCheckRuns.checkId, checkId)))
    .orderBy(desc(complianceCheckRuns.startedAt))
    .limit(limit);
}

export async function insertCheckRun(data: typeof complianceCheckRuns.$inferInsert) {
  const rows = await db.insert(complianceCheckRuns).values(data).returning();
  return rows[0];
}

export async function updateCheckRun(id: string, data: Partial<typeof complianceCheckRuns.$inferInsert>) {
  const rows = await db.update(complianceCheckRuns).set(data).where(eq(complianceCheckRuns.id, id)).returning();
  return rows[0];
}

// ── Access Reviews ────────────────────────────────────────────────────────────

export async function findAllReviews(orgId: string) {
  return db.select()
    .from(accessReviews)
    .where(eq(accessReviews.organizationId, orgId))
    .orderBy(desc(accessReviews.createdAt));
}

export async function findReviewById(orgId: string, id: string) {
  const rows = await db.select()
    .from(accessReviews)
    .where(and(eq(accessReviews.organizationId, orgId), eq(accessReviews.id, id)));
  return rows[0] ?? null;
}

export async function insertReview(data: typeof accessReviews.$inferInsert) {
  const rows = await db.insert(accessReviews).values(data).returning();
  return rows[0];
}

export async function updateReview(id: string, data: Partial<typeof accessReviews.$inferInsert>) {
  const rows = await db.update(accessReviews).set({ ...data, updatedAt: new Date() }).where(eq(accessReviews.id, id)).returning();
  return rows[0];
}

export async function findReviewUsers(reviewId: string) {
  return db.select()
    .from(accessReviewUsers)
    .where(eq(accessReviewUsers.reviewId, reviewId))
    .orderBy(accessReviewUsers.riskLevel, accessReviewUsers.userName);
}

export async function insertReviewUsers(users: typeof accessReviewUsers.$inferInsert[]) {
  if (!users.length) return [];
  return db.insert(accessReviewUsers).values(users).returning();
}

export async function updateReviewUser(id: string, data: Partial<typeof accessReviewUsers.$inferInsert>) {
  const rows = await db.update(accessReviewUsers).set(data).where(eq(accessReviewUsers.id, id)).returning();
  return rows[0];
}

// ── Attestations ──────────────────────────────────────────────────────────────

export async function findAllAttestations(orgId: string) {
  return db.select()
    .from(attestations)
    .where(eq(attestations.organizationId, orgId))
    .orderBy(desc(attestations.createdAt));
}

export async function insertAttestation(data: typeof attestations.$inferInsert) {
  const rows = await db.insert(attestations).values(data).returning();
  return rows[0];
}

export async function updateAttestation(id: string, data: Partial<typeof attestations.$inferInsert>) {
  const rows = await db.update(attestations).set({ ...data, updatedAt: new Date() }).where(eq(attestations.id, id)).returning();
  return rows[0];
}

// ── Training ──────────────────────────────────────────────────────────────────

export async function findAllTraining(orgId: string) {
  return db.select()
    .from(trainingCampaigns)
    .where(eq(trainingCampaigns.organizationId, orgId))
    .orderBy(desc(trainingCampaigns.createdAt));
}

export async function insertTrainingCampaign(data: typeof trainingCampaigns.$inferInsert) {
  const rows = await db.insert(trainingCampaigns).values(data).returning();
  return rows[0];
}

export async function updateTrainingCampaign(id: string, data: Partial<typeof trainingCampaigns.$inferInsert>) {
  const rows = await db.update(trainingCampaigns).set({ ...data, updatedAt: new Date() }).where(eq(trainingCampaigns.id, id)).returning();
  return rows[0];
}

// ── Workforce Events ──────────────────────────────────────────────────────────

export async function findAllWorkforceEvents(orgId: string) {
  return db.select()
    .from(workforceEvents)
    .where(eq(workforceEvents.organizationId, orgId))
    .orderBy(desc(workforceEvents.createdAt));
}

export async function insertWorkforceEvent(data: typeof workforceEvents.$inferInsert) {
  const rows = await db.insert(workforceEvents).values(data).returning();
  return rows[0];
}

// ── Signals ───────────────────────────────────────────────────────────────────

export async function findAllSignals(orgId: string, status?: string) {
  const cond = status
    ? and(eq(complianceSignals.organizationId, orgId), eq(complianceSignals.status, status))
    : eq(complianceSignals.organizationId, orgId);
  return db.select()
    .from(complianceSignals)
    .where(cond)
    .orderBy(desc(complianceSignals.createdAt))
    .limit(100);
}

export async function insertSignal(data: typeof complianceSignals.$inferInsert) {
  const rows = await db.insert(complianceSignals).values(data).returning();
  return rows[0];
}

export async function resolveSignal(orgId: string, id: string, resolvedBy: string) {
  const rows = await db.update(complianceSignals)
    .set({ status: "resolved", resolvedAt: new Date(), resolvedBy })
    .where(and(eq(complianceSignals.organizationId, orgId), eq(complianceSignals.id, id)))
    .returning();
  return rows[0];
}

// ── Health Scores ─────────────────────────────────────────────────────────────

export async function getLatestHealthScore(orgId: string) {
  const rows = await db.select()
    .from(complianceHealthScores)
    .where(eq(complianceHealthScores.organizationId, orgId))
    .orderBy(desc(complianceHealthScores.snapshotAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getHealthHistory(orgId: string, days = 30) {
  return db.select()
    .from(complianceHealthScores)
    .where(and(
      eq(complianceHealthScores.organizationId, orgId),
      sql`snapshot_at > now() - interval '${sql.raw(String(days))} days'`
    ))
    .orderBy(complianceHealthScores.snapshotAt);
}

export async function upsertHealthScore(data: typeof complianceHealthScores.$inferInsert) {
  const rows = await db.insert(complianceHealthScores).values(data).onConflictDoNothing().returning();
  return rows[0];
}

// ── Exceptions ────────────────────────────────────────────────────────────────

export async function findAllExceptions(orgId: string) {
  return db.select()
    .from(complianceExceptions)
    .where(eq(complianceExceptions.organizationId, orgId))
    .orderBy(desc(complianceExceptions.createdAt));
}

export async function insertException(data: typeof complianceExceptions.$inferInsert) {
  const rows = await db.insert(complianceExceptions).values(data).returning();
  return rows[0];
}

export async function updateException(id: string, data: Partial<typeof complianceExceptions.$inferInsert>) {
  const rows = await db.update(complianceExceptions).set({ ...data, updatedAt: new Date() }).where(eq(complianceExceptions.id, id)).returning();
  return rows[0];
}

// ── Automation Rules ──────────────────────────────────────────────────────────

export async function findAllRules(orgId: string) {
  return db.select()
    .from(automationRules)
    .where(eq(automationRules.organizationId, orgId))
    .orderBy(desc(automationRules.createdAt));
}

export async function insertRule(data: typeof automationRules.$inferInsert) {
  const rows = await db.insert(automationRules).values(data).returning();
  return rows[0];
}

export async function updateRule(id: string, data: Partial<typeof automationRules.$inferInsert>) {
  const rows = await db.update(automationRules).set({ ...data, updatedAt: new Date() }).where(eq(automationRules.id, id)).returning();
  return rows[0];
}

// ── Continuous Readiness ──────────────────────────────────────────────────────

export async function getLatestReadiness(orgId: string) {
  return db.select()
    .from(continuousReadiness)
    .where(eq(continuousReadiness.organizationId, orgId))
    .orderBy(continuousReadiness.frameworkName, desc(continuousReadiness.snapshotAt));
}

export async function upsertReadiness(data: typeof continuousReadiness.$inferInsert) {
  const rows = await db.insert(continuousReadiness).values(data).onConflictDoNothing().returning();
  return rows[0];
}
