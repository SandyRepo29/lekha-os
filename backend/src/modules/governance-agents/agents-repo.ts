import { db } from "@/lib/db";
import {
  agents,
  agentRuns,
  agentMemory,
  agentObservations,
  agentRecommendations,
  agentActions,
  agentApprovals,
  agentSchedules,
  agentMetrics,
  agentConversations,
  agentEvents,
  agentOrchestrations,
} from "@/lib/db/schema";
import { eq, and, desc, sql, or, isNull, lt } from "drizzle-orm";

// ── Dashboard Metrics ─────────────────────────────────────────────────────────

export async function getDashboardMetrics(orgId: string) {
  const [agentRows, runRows, observationRows, recommendationRows, actionRows, approvalRows] =
    await Promise.all([
      db.select({
        total:  sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where status = 'active')::int`,
      }).from(agents).where(eq(agents.organizationId, orgId)),

      db.select({
        total:     sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where status = 'completed')::int`,
      }).from(agentRuns).where(eq(agentRuns.organizationId, orgId)),

      db.select({
        total: sql<number>`count(*)::int`,
      }).from(agentObservations).where(eq(agentObservations.organizationId, orgId)),

      db.select({
        total: sql<number>`count(*)::int`,
      }).from(agentRecommendations).where(eq(agentRecommendations.organizationId, orgId)),

      db.select({
        total:     sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where status = 'completed')::int`,
      }).from(agentActions).where(eq(agentActions.organizationId, orgId)),

      db.select({
        pending: sql<number>`count(*)::int`,
      }).from(agentApprovals).where(
        and(eq(agentApprovals.organizationId, orgId), eq(agentApprovals.status, "pending"))
      ),
    ]);

  const totalRuns = runRows[0]?.total ?? 0;
  const completedRuns = runRows[0]?.completed ?? 0;
  const successRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;
  const totalActions = actionRows[0]?.total ?? 0;
  const completedActions = actionRows[0]?.completed ?? 0;
  const automationRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  return {
    totalAgents:          agentRows[0]?.total ?? 0,
    activeAgents:         agentRows[0]?.active ?? 0,
    totalRuns,
    successRate,
    totalObservations:    observationRows[0]?.total ?? 0,
    totalRecommendations: recommendationRows[0]?.total ?? 0,
    totalActions,
    pendingApprovals:     approvalRows[0]?.pending ?? 0,
    automationRate,
    issuesPrevented:      completedActions,
  };
}

// ── Agents ────────────────────────────────────────────────────────────────────

export async function findAllAgents(orgId: string) {
  return db
    .select()
    .from(agents)
    .where(eq(agents.organizationId, orgId))
    .orderBy(desc(agents.createdAt));
}

export async function findAgentById(orgId: string, id: string) {
  const rows = await db
    .select()
    .from(agents)
    .where(and(eq(agents.organizationId, orgId), eq(agents.id, id)));
  return rows[0] ?? null;
}

export async function insertAgent(data: typeof agents.$inferInsert) {
  const rows = await db.insert(agents).values(data).returning();
  return rows[0];
}

export async function updateAgent(
  orgId: string,
  id: string,
  data: Partial<typeof agents.$inferInsert>
) {
  const rows = await db
    .update(agents)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(agents.organizationId, orgId), eq(agents.id, id)))
    .returning();
  return rows[0];
}

export async function deleteAgent(orgId: string, id: string) {
  await db.delete(agents).where(and(eq(agents.organizationId, orgId), eq(agents.id, id)));
}

export async function incrementAgentRuns(agentId: string, success: boolean) {
  const newRate = success
    ? sql`least(100, COALESCE(success_rate, 0) + 2)`
    : sql`greatest(0, COALESCE(success_rate, 0) - 5)`;
  await db
    .update(agents)
    .set({
      totalRuns: sql`COALESCE(total_runs, 0) + 1`,
      successRate: newRate,
      lastRunAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(agents.id, agentId));
}

// ── Agent Runs ────────────────────────────────────────────────────────────────

export async function insertRun(data: typeof agentRuns.$inferInsert) {
  const rows = await db.insert(agentRuns).values(data).returning();
  return rows[0];
}

export async function updateRun(runId: string, data: Partial<typeof agentRuns.$inferInsert>) {
  const rows = await db
    .update(agentRuns)
    .set(data)
    .where(eq(agentRuns.id, runId))
    .returning();
  return rows[0];
}

export async function findRunsByOrg(orgId: string, limitOrOpts?: number | { limit?: number }) {
  const limit = typeof limitOrOpts === "number" ? limitOrOpts : (limitOrOpts?.limit ?? 50);
  return db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.organizationId, orgId))
    .orderBy(desc(agentRuns.startedAt))
    .limit(limit);
}

export async function findRunsByAgent(agentId: string, limit = 50) {
  return db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.agentId, agentId))
    .orderBy(desc(agentRuns.startedAt))
    .limit(limit);
}

// ── Agent Memory ──────────────────────────────────────────────────────────────

export async function upsertMemory(data: {
  organizationId: string;
  agentId: string;
  key: string;
  value: Record<string, unknown>;
  memoryType?: string;
  runId?: string;
  expiresAt?: Date;
}) {
  const rows = await db
    .insert(agentMemory)
    .values({
      organizationId: data.organizationId,
      agentId:        data.agentId,
      key:            data.key,
      value:          data.value,
      memoryType:     (data.memoryType ?? "observation") as typeof agentMemory.$inferInsert["memoryType"],
      runId:          data.runId ?? null,
      expiresAt:      data.expiresAt ?? null,
    })
    .onConflictDoUpdate({
      target: [agentMemory.agentId, agentMemory.key],
      set: {
        value:      sql`excluded.value`,
        memoryType: sql`excluded.memory_type`,
        runId:      sql`excluded.run_id`,
        expiresAt:  sql`excluded.expires_at`,
        updatedAt:  new Date(),
      },
    })
    .returning();
  return rows[0];
}

export async function getMemory(agentId: string, key: string) {
  const rows = await db
    .select()
    .from(agentMemory)
    .where(and(eq(agentMemory.agentId, agentId), eq(agentMemory.key, key)));
  return rows[0] ?? null;
}

export async function getAgentMemory(agentId: string) {
  return db
    .select()
    .from(agentMemory)
    .where(eq(agentMemory.agentId, agentId))
    .orderBy(agentMemory.key);
}

// ── Observations ──────────────────────────────────────────────────────────────

export async function insertObservation(data: typeof agentObservations.$inferInsert) {
  const rows = await db.insert(agentObservations).values(data).returning();
  return rows[0];
}

export async function findObservationsByOrg(
  orgId: string,
  filters?: { severity?: string; status?: string; agentId?: string; limit?: number }
) {
  const conditions = [eq(agentObservations.organizationId, orgId)];
  if (filters?.severity)
    conditions.push(sql`severity = ${filters.severity}`);
  if (filters?.status)
    conditions.push(eq(agentObservations.status, filters.status));
  if (filters?.agentId)
    conditions.push(eq(agentObservations.agentId, filters.agentId));

  return db
    .select()
    .from(agentObservations)
    .where(and(...conditions))
    .orderBy(desc(agentObservations.createdAt))
    .limit(filters?.limit ?? 100);
}

export async function updateObservationStatus(id: string, status: string) {
  const rows = await db
    .update(agentObservations)
    .set({ status, updatedAt: new Date() })
    .where(eq(agentObservations.id, id))
    .returning();
  return rows[0];
}

// ── Recommendations ───────────────────────────────────────────────────────────

export async function insertRecommendation(data: typeof agentRecommendations.$inferInsert) {
  const rows = await db.insert(agentRecommendations).values(data).returning();
  return rows[0];
}

export async function findRecommendationsByOrg(
  orgId: string,
  filters?: { priority?: string; status?: string; agentId?: string }
) {
  const conditions = [eq(agentRecommendations.organizationId, orgId)];
  if (filters?.priority)
    conditions.push(sql`${agentRecommendations.priority} = ${filters.priority}`);
  if (filters?.status)
    conditions.push(eq(agentRecommendations.status, filters.status));
  if (filters?.agentId)
    conditions.push(eq(agentRecommendations.agentId, filters.agentId));

  return db
    .select()
    .from(agentRecommendations)
    .where(and(...conditions))
    .orderBy(desc(agentRecommendations.createdAt))
    .limit(100);
}

export async function updateRecommendationStatus(
  id: string,
  status: string,
  userId?: string
) {
  const rows = await db
    .update(agentRecommendations)
    .set({
      status,
      actionedBy: userId ?? null,
      actionedAt: userId ? new Date() : null,
      updatedAt:  new Date(),
    })
    .where(eq(agentRecommendations.id, id))
    .returning();
  return rows[0];
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function insertAction(data: typeof agentActions.$inferInsert) {
  const rows = await db.insert(agentActions).values(data).returning();
  return rows[0];
}

export async function findActionsByOrg(
  orgId: string,
  filters?: { status?: string; agentId?: string }
) {
  const conditions = [eq(agentActions.organizationId, orgId)];
  if (filters?.status)
    conditions.push(eq(agentActions.status, filters.status));
  if (filters?.agentId)
    conditions.push(eq(agentActions.agentId, filters.agentId));

  return db
    .select()
    .from(agentActions)
    .where(and(...conditions))
    .orderBy(desc(agentActions.createdAt))
    .limit(100);
}

export async function findPendingActions(orgId: string) {
  return db
    .select()
    .from(agentActions)
    .where(and(eq(agentActions.organizationId, orgId), eq(agentActions.status, "pending_approval")))
    .orderBy(desc(agentActions.createdAt));
}

export async function updateActionStatus(
  id: string,
  status: string,
  data?: { approvedBy?: string; result?: Record<string, unknown>; errorMessage?: string }
) {
  const rows = await db
    .update(agentActions)
    .set({
      status,
      approvedBy:   data?.approvedBy ?? undefined,
      approvedAt:   data?.approvedBy ? new Date() : undefined,
      result:       data?.result ?? undefined,
      errorMessage: data?.errorMessage ?? undefined,
      updatedAt:    new Date(),
    })
    .where(eq(agentActions.id, id))
    .returning();
  return rows[0];
}

// ── Approvals ─────────────────────────────────────────────────────────────────

export async function insertApproval(data: typeof agentApprovals.$inferInsert) {
  const rows = await db.insert(agentApprovals).values(data).returning();
  return rows[0];
}

export async function updateApproval(id: string, status: string, userId: string, notes?: string) {
  const rows = await db
    .update(agentApprovals)
    .set({
      status,
      approverId: userId,
      notes:      notes ?? null,
      decidedAt:  new Date(),
    })
    .where(eq(agentApprovals.id, id))
    .returning();
  return rows[0];
}

// ── Metrics ───────────────────────────────────────────────────────────────────

export async function upsertDailyMetrics(
  orgId: string,
  agentId: string | null,
  data: {
    totalRuns?: number;
    successRuns?: number;
    failedRuns?: number;
    observationsGenerated?: number;
    recommendationsGenerated?: number;
    actionsExecuted?: number;
  }
) {
  const today = new Date().toISOString().slice(0, 10);
  await db
    .insert(agentMetrics)
    .values({
      organizationId:       orgId,
      agentId:              agentId ?? undefined,
      metricDate:           today,
      totalRuns:            data.totalRuns ?? 0,
      successfulRuns:       data.successRuns ?? 0,
      failedRuns:           data.failedRuns ?? 0,
      totalObservations:    data.observationsGenerated ?? 0,
      totalRecommendations: data.recommendationsGenerated ?? 0,
      totalActions:         data.actionsExecuted ?? 0,
    })
    .onConflictDoUpdate({
      target: [agentMetrics.organizationId, agentMetrics.agentId, agentMetrics.metricDate],
      set: {
        totalRuns:            sql`agent_metrics.total_runs + ${data.totalRuns ?? 0}`,
        successfulRuns:       sql`agent_metrics.successful_runs + ${data.successRuns ?? 0}`,
        failedRuns:           sql`agent_metrics.failed_runs + ${data.failedRuns ?? 0}`,
        totalObservations:    sql`agent_metrics.total_observations + ${data.observationsGenerated ?? 0}`,
        totalRecommendations: sql`agent_metrics.total_recommendations + ${data.recommendationsGenerated ?? 0}`,
        totalActions:         sql`agent_metrics.total_actions + ${data.actionsExecuted ?? 0}`,
      },
    });
}

export async function getMetricsHistory(orgId: string, days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return db
    .select()
    .from(agentMetrics)
    .where(
      and(
        eq(agentMetrics.organizationId, orgId),
        isNull(agentMetrics.agentId),
        sql`metric_date >= ${cutoff.toISOString().slice(0, 10)}`
      )
    )
    .orderBy(agentMetrics.metricDate);
}

export async function getOrgMetricsSummary(orgId: string) {
  const rows = await db
    .select({
      totalRuns:            sql<number>`sum(total_runs)::int`,
      successfulRuns:       sql<number>`sum(successful_runs)::int`,
      totalObservations:    sql<number>`sum(total_observations)::int`,
      totalRecommendations: sql<number>`sum(total_recommendations)::int`,
      totalActions:         sql<number>`sum(total_actions)::int`,
      timeSavedMinutes:     sql<number>`sum(time_saved_minutes)::int`,
    })
    .from(agentMetrics)
    .where(eq(agentMetrics.organizationId, orgId));
  return rows[0];
}

// ── Conversations (Copilot) ───────────────────────────────────────────────────

export async function insertConversation(data: typeof agentConversations.$inferInsert) {
  const rows = await db.insert(agentConversations).values(data).returning();
  return rows[0];
}

export async function getConversationHistory(
  orgId: string,
  userId: string,
  agentId?: string,
  limit = 50
) {
  const conditions = [
    eq(agentConversations.organizationId, orgId),
    eq(agentConversations.userId, userId),
  ];
  if (agentId) conditions.push(eq(agentConversations.agentId, agentId));

  return db
    .select()
    .from(agentConversations)
    .where(and(...conditions))
    .orderBy(agentConversations.createdAt)
    .limit(limit);
}

// ── Events ────────────────────────────────────────────────────────────────────

export async function insertEvent(data: typeof agentEvents.$inferInsert) {
  const rows = await db.insert(agentEvents).values(data).returning();
  return rows[0];
}

export async function findUnprocessedEvents(orgId: string) {
  return db
    .select()
    .from(agentEvents)
    .where(and(eq(agentEvents.organizationId, orgId), eq(agentEvents.processed, false)))
    .orderBy(agentEvents.createdAt)
    .limit(100);
}

export async function markEventProcessed(id: string, agentId?: string) {
  await db
    .update(agentEvents)
    .set({ processed: true, agentId: agentId ?? null, processedAt: new Date() })
    .where(eq(agentEvents.id, id));
}

// ── Orchestrations ────────────────────────────────────────────────────────────

export async function insertOrchestration(data: typeof agentOrchestrations.$inferInsert) {
  const rows = await db.insert(agentOrchestrations).values(data).returning();
  return rows[0];
}

export async function findOrchestrationsByOrg(orgId: string) {
  return db
    .select()
    .from(agentOrchestrations)
    .where(eq(agentOrchestrations.organizationId, orgId))
    .orderBy(desc(agentOrchestrations.createdAt));
}

export async function updateOrchestration(
  id: string,
  data: Partial<typeof agentOrchestrations.$inferInsert>
) {
  const rows = await db
    .update(agentOrchestrations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(agentOrchestrations.id, id))
    .returning();
  return rows[0];
}
