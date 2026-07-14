import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToeEventType = {
  id: string; name: string; label: string; description: string | null;
  module: string; severity: string; created_at: string;
};

export type ToeEvent = {
  id: string; org_id: string; event_type: string; entity_type: string | null;
  entity_id: string | null; actor_id: string | null; payload: Record<string, unknown>;
  published_at: string;
};

export type ToeWorkflow = {
  id: string; org_id: string | null; name: string; description: string | null;
  trigger_event: string | null; steps: unknown[]; status: string; version: number;
  is_template: boolean; created_by: string | null; created_at: string; updated_at: string;
};

export type ToeWorkflowInstance = {
  id: string; org_id: string; workflow_id: string | null; workflow_name: string;
  trigger_event_id: string | null; status: string; current_step: number;
  total_steps: number; context: Record<string, unknown>; error_message: string | null;
  started_at: string; completed_at: string | null; created_by: string | null; created_at: string;
};

export type ToeApproval = {
  id: string; org_id: string; entity_type: string | null; entity_id: string | null;
  request_type: string; title: string; description: string | null;
  requester_id: string | null; assignee_id: string | null; status: string;
  context: Record<string, unknown>; notes: string | null; instance_id: string | null;
  due_at: string | null; resolved_at: string | null; created_at: string;
  requester_name?: string; assignee_name?: string;
};

export type ToeAutomationRule = {
  id: string; org_id: string; name: string; description: string | null;
  trigger_event: string; conditions: Record<string, unknown>;
  action_type: string; action_config: Record<string, unknown>;
  active: boolean; run_count: number; last_run_at: string | null;
  created_by: string | null; created_at: string; updated_at: string;
};

export type ToeAiDecision = {
  id: string; org_id: string; title: string; context: string | null;
  recommendation: string; confidence: number; priority: string; status: string;
  entity_type: string | null; entity_id: string | null; instance_id: string | null;
  reasoning: string | null; actions: unknown[]; accepted_at: string | null;
  dismissed_at: string | null; created_at: string;
};

export type ToeDashboardMetrics = {
  pendingApprovals: number; activeWorkflows: number; automationRules: number;
  eventsToday: number; openDecisions: number; totalWorkflows: number;
  completedWorkflows: number; failedWorkflows: number;
};

// ─── Event Types ──────────────────────────────────────────────────────────────

export async function findEventTypes(): Promise<ToeEventType[]> {
  const rows = await db.execute(sql`SELECT * FROM toe_event_types ORDER BY module, name`);
  return rows as unknown as ToeEventType[];
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function insertEvent(data: {
  orgId: string; eventType: string; entityType?: string; entityId?: string;
  actorId?: string; payload?: Record<string, unknown>;
}) {
  const rows = await db.execute(sql`
    INSERT INTO toe_events (org_id, event_type, entity_type, entity_id, actor_id, payload)
    VALUES (${data.orgId}, ${data.eventType}, ${data.entityType ?? null},
            ${data.entityId ?? null}, ${data.actorId ?? null},
            ${JSON.stringify(data.payload ?? {})}::jsonb)
    RETURNING id
  `);
  return (rows as unknown as Array<{ id: string }>)[0];
}

export async function findOrgEvents(orgId: string, filters?: {
  eventType?: string; limit?: number; offset?: number;
}) {
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;
  let query = sql`SELECT * FROM toe_events WHERE org_id = ${orgId}`;
  if (filters?.eventType) query = sql`${query} AND event_type = ${filters.eventType}`;
  query = sql`${query} ORDER BY published_at DESC LIMIT ${limit} OFFSET ${offset}`;
  const rows = await db.execute(query);
  return rows as unknown as ToeEvent[];
}

export async function countEventsToday(orgId: string): Promise<number> {
  const rows = await db.execute(sql`
    SELECT count(*)::int AS n FROM toe_events
    WHERE org_id = ${orgId} AND published_at >= now() - interval '24 hours'
  `);
  return (rows as unknown as Array<{ n: number }>)[0]?.n ?? 0;
}

// ─── Workflows ────────────────────────────────────────────────────────────────

export async function findWorkflows(orgId: string): Promise<ToeWorkflow[]> {
  const rows = await db.execute(sql`
    SELECT * FROM toe_workflows
    WHERE org_id = ${orgId} OR is_template = true
    ORDER BY is_template DESC, name ASC
  `);
  return rows as unknown as ToeWorkflow[];
}

export async function findWorkflowTemplates(): Promise<ToeWorkflow[]> {
  const rows = await db.execute(sql`
    SELECT * FROM toe_workflows WHERE is_template = true ORDER BY name
  `);
  return rows as unknown as ToeWorkflow[];
}

export async function findWorkflowById(id: string): Promise<ToeWorkflow | null> {
  const rows = await db.execute(sql`SELECT * FROM toe_workflows WHERE id = ${id} LIMIT 1`);
  return (rows as unknown as ToeWorkflow[])[0] ?? null;
}

export async function insertWorkflow(data: {
  orgId: string; name: string; description?: string; triggerEvent?: string;
  steps?: unknown[]; status?: string; createdBy?: string;
}) {
  const rows = await db.execute(sql`
    INSERT INTO toe_workflows (org_id, name, description, trigger_event, steps, status, created_by)
    VALUES (${data.orgId}, ${data.name}, ${data.description ?? null},
            ${data.triggerEvent ?? null}, ${JSON.stringify(data.steps ?? [])}::jsonb,
            ${data.status ?? 'draft'}, ${data.createdBy ?? null})
    RETURNING *
  `);
  return (rows as unknown as ToeWorkflow[])[0];
}

export async function updateWorkflow(id: string, orgId: string, data: {
  name?: string; description?: string; triggerEvent?: string; steps?: unknown[]; status?: string;
}) {
  const rows = await db.execute(sql`
    UPDATE toe_workflows SET
      name = COALESCE(${data.name ?? null}, name),
      description = COALESCE(${data.description ?? null}, description),
      trigger_event = COALESCE(${data.triggerEvent ?? null}, trigger_event),
      steps = COALESCE(${data.steps ? JSON.stringify(data.steps) + '::jsonb' : null}::jsonb, steps),
      status = COALESCE(${data.status ?? null}, status),
      version = version + 1,
      updated_at = now()
    WHERE id = ${id} AND org_id = ${orgId}
    RETURNING *
  `);
  return (rows as unknown as ToeWorkflow[])[0] ?? null;
}

export async function deleteWorkflow(id: string, orgId: string) {
  await db.execute(sql`DELETE FROM toe_workflows WHERE id = ${id} AND org_id = ${orgId}`);
}

// ─── Workflow Instances ───────────────────────────────────────────────────────

export async function findInstances(orgId: string, filters?: {
  status?: string; workflowId?: string; limit?: number;
}): Promise<ToeWorkflowInstance[]> {
  const limit = filters?.limit ?? 50;
  let query = sql`SELECT * FROM toe_workflow_instances WHERE org_id = ${orgId}`;
  if (filters?.status) query = sql`${query} AND status = ${filters.status}`;
  if (filters?.workflowId) query = sql`${query} AND workflow_id = ${filters.workflowId}`;
  query = sql`${query} ORDER BY started_at DESC LIMIT ${limit}`;
  const rows = await db.execute(query);
  return rows as unknown as ToeWorkflowInstance[];
}

export async function findInstanceById(id: string, orgId: string): Promise<ToeWorkflowInstance | null> {
  const rows = await db.execute(sql`
    SELECT * FROM toe_workflow_instances WHERE id = ${id} AND org_id = ${orgId} LIMIT 1
  `);
  return (rows as unknown as ToeWorkflowInstance[])[0] ?? null;
}

export async function insertInstance(data: {
  orgId: string; workflowId?: string; workflowName: string; triggerEventId?: string;
  totalSteps?: number; context?: Record<string, unknown>; createdBy?: string;
}) {
  const rows = await db.execute(sql`
    INSERT INTO toe_workflow_instances
      (org_id, workflow_id, workflow_name, trigger_event_id, total_steps, context, created_by)
    VALUES (${data.orgId}, ${data.workflowId ?? null}, ${data.workflowName},
            ${data.triggerEventId ?? null}, ${data.totalSteps ?? 0},
            ${JSON.stringify(data.context ?? {})}::jsonb, ${data.createdBy ?? null})
    RETURNING *
  `);
  return (rows as unknown as ToeWorkflowInstance[])[0];
}

export async function updateInstanceStatus(id: string, orgId: string, status: string, extra?: {
  currentStep?: number; errorMessage?: string; completedAt?: Date;
}) {
  await db.execute(sql`
    UPDATE toe_workflow_instances SET
      status = ${status},
      current_step = COALESCE(${extra?.currentStep ?? null}, current_step),
      error_message = COALESCE(${extra?.errorMessage ?? null}, error_message),
      completed_at = COALESCE(${extra?.completedAt?.toISOString() ?? null}::timestamptz, completed_at)
    WHERE id = ${id} AND org_id = ${orgId}
  `);
}

export async function findInstanceSteps(instanceId: string) {
  const rows = await db.execute(sql`
    SELECT * FROM toe_workflow_instance_steps WHERE instance_id = ${instanceId} ORDER BY step_index
  `);
  return rows as unknown as Array<{
    id: string; instance_id: string; step_index: number; step_name: string;
    step_type: string; status: string; input: unknown; output: unknown;
    assigned_to: string | null; started_at: string | null; completed_at: string | null;
  }>;
}

export async function insertInstanceStep(data: {
  instanceId: string; stepIndex: number; stepName: string; stepType?: string;
  input?: unknown; assignedTo?: string;
}) {
  await db.execute(sql`
    INSERT INTO toe_workflow_instance_steps
      (instance_id, step_index, step_name, step_type, input, assigned_to)
    VALUES (${data.instanceId}, ${data.stepIndex}, ${data.stepName},
            ${data.stepType ?? 'action'}, ${JSON.stringify(data.input ?? {})}::jsonb,
            ${data.assignedTo ?? null})
  `);
}

export async function countInstancesByStatus(orgId: string): Promise<Record<string, number>> {
  const rows = await db.execute(sql`
    SELECT status, count(*)::int AS n
    FROM toe_workflow_instances WHERE org_id = ${orgId}
    GROUP BY status
  `);
  const result: Record<string, number> = {};
  for (const r of rows as unknown as Array<{ status: string; n: number }>) result[r.status] = r.n;
  return result;
}

// ─── Approvals ────────────────────────────────────────────────────────────────

export async function findApprovals(orgId: string, filters?: {
  status?: string; assigneeId?: string; limit?: number;
}): Promise<ToeApproval[]> {
  const limit = filters?.limit ?? 50;
  let query = sql`
    SELECT a.*,
      p1.full_name AS requester_name,
      p2.full_name AS assignee_name
    FROM toe_approvals a
    LEFT JOIN profiles p1 ON p1.id = a.requester_id
    LEFT JOIN profiles p2 ON p2.id = a.assignee_id
    WHERE a.org_id = ${orgId}
  `;
  if (filters?.status) query = sql`${query} AND a.status = ${filters.status}`;
  if (filters?.assigneeId) query = sql`${query} AND a.assignee_id = ${filters.assigneeId}`;
  query = sql`${query} ORDER BY a.created_at DESC LIMIT ${limit}`;
  const rows = await db.execute(query);
  return rows as unknown as ToeApproval[];
}

export async function countPendingApprovals(orgId: string): Promise<number> {
  const rows = await db.execute(sql`
    SELECT count(*)::int AS n FROM toe_approvals
    WHERE org_id = ${orgId} AND status = 'pending'
  `);
  return (rows as unknown as Array<{ n: number }>)[0]?.n ?? 0;
}

export async function insertApproval(data: {
  orgId: string; entityType?: string; entityId?: string; requestType: string;
  title: string; description?: string; requesterId?: string; assigneeId?: string;
  context?: Record<string, unknown>; instanceId?: string; dueAt?: Date;
}) {
  const rows = await db.execute(sql`
    INSERT INTO toe_approvals
      (org_id, entity_type, entity_id, request_type, title, description,
       requester_id, assignee_id, context, instance_id, due_at)
    VALUES (${data.orgId}, ${data.entityType ?? null}, ${data.entityId ?? null},
            ${data.requestType}, ${data.title}, ${data.description ?? null},
            ${data.requesterId ?? null}, ${data.assigneeId ?? null},
            ${JSON.stringify(data.context ?? {})}::jsonb,
            ${data.instanceId ?? null}, ${data.dueAt?.toISOString() ?? null}::timestamptz)
    RETURNING *
  `);
  return (rows as unknown as ToeApproval[])[0];
}

export async function resolveApproval(id: string, orgId: string, status: string, notes?: string) {
  await db.execute(sql`
    UPDATE toe_approvals
    SET status = ${status}, notes = ${notes ?? null}, resolved_at = now()
    WHERE id = ${id} AND org_id = ${orgId}
  `);
}

// ─── Automation Rules ─────────────────────────────────────────────────────────

export async function findAutomationRules(orgId: string): Promise<ToeAutomationRule[]> {
  const rows = await db.execute(sql`
    SELECT * FROM toe_automation_rules WHERE org_id = ${orgId} ORDER BY name
  `);
  return rows as unknown as ToeAutomationRule[];
}

export async function insertAutomationRule(data: {
  orgId: string; name: string; description?: string; triggerEvent: string;
  conditions?: Record<string, unknown>; actionType: string; actionConfig?: Record<string, unknown>;
  createdBy?: string;
}) {
  const rows = await db.execute(sql`
    INSERT INTO toe_automation_rules
      (org_id, name, description, trigger_event, conditions, action_type, action_config, created_by)
    VALUES (${data.orgId}, ${data.name}, ${data.description ?? null}, ${data.triggerEvent},
            ${JSON.stringify(data.conditions ?? {})}::jsonb, ${data.actionType},
            ${JSON.stringify(data.actionConfig ?? {})}::jsonb, ${data.createdBy ?? null})
    RETURNING *
  `);
  return (rows as unknown as ToeAutomationRule[])[0];
}

export async function toggleAutomationRule(id: string, orgId: string, active: boolean) {
  await db.execute(sql`
    UPDATE toe_automation_rules SET active = ${active}, updated_at = now()
    WHERE id = ${id} AND org_id = ${orgId}
  `);
}

export async function deleteAutomationRule(id: string, orgId: string) {
  await db.execute(sql`DELETE FROM toe_automation_rules WHERE id = ${id} AND org_id = ${orgId}`);
}

// ─── AI Decisions ─────────────────────────────────────────────────────────────

export async function findAiDecisions(orgId: string, filters?: {
  status?: string; priority?: string; limit?: number;
}): Promise<ToeAiDecision[]> {
  const limit = filters?.limit ?? 20;
  let query = sql`SELECT * FROM toe_ai_decisions WHERE org_id = ${orgId}`;
  if (filters?.status) query = sql`${query} AND status = ${filters.status}`;
  if (filters?.priority) query = sql`${query} AND priority = ${filters.priority}`;
  query = sql`${query} ORDER BY created_at DESC LIMIT ${limit}`;
  const rows = await db.execute(query);
  return rows as unknown as ToeAiDecision[];
}

export async function countPendingDecisions(orgId: string): Promise<number> {
  const rows = await db.execute(sql`
    SELECT count(*)::int AS n FROM toe_ai_decisions WHERE org_id = ${orgId} AND status = 'pending'
  `);
  return (rows as unknown as Array<{ n: number }>)[0]?.n ?? 0;
}

export async function insertAiDecision(data: {
  orgId: string; title: string; context?: string; recommendation: string;
  confidence?: number; priority?: string; entityType?: string; entityId?: string;
  instanceId?: string; reasoning?: string; actions?: unknown[];
}) {
  const rows = await db.execute(sql`
    INSERT INTO toe_ai_decisions
      (org_id, title, context, recommendation, confidence, priority,
       entity_type, entity_id, instance_id, reasoning, actions)
    VALUES (${data.orgId}, ${data.title}, ${data.context ?? null}, ${data.recommendation},
            ${data.confidence ?? 0}, ${data.priority ?? 'medium'},
            ${data.entityType ?? null}, ${data.entityId ?? null},
            ${data.instanceId ?? null}, ${data.reasoning ?? null},
            ${JSON.stringify(data.actions ?? [])}::jsonb)
    RETURNING *
  `);
  return (rows as unknown as ToeAiDecision[])[0];
}

export async function resolveAiDecision(id: string, orgId: string, status: 'accepted' | 'dismissed') {
  const col = status === 'accepted' ? 'accepted_at' : 'dismissed_at';
  await db.execute(sql`
    UPDATE toe_ai_decisions SET status = ${status}, ${sql.raw(col)} = now()
    WHERE id = ${id} AND org_id = ${orgId}
  `);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function findWorkflowAnalytics(orgId: string): Promise<Array<{
  workflow_name: string; period_start: string; avg_duration_ms: number;
  completion_rate: number; sla_compliance_rate: number; total_runs: number; successful_runs: number;
}>> {
  const rows = await db.execute(sql`
    SELECT * FROM toe_workflow_analytics WHERE org_id = ${orgId}
    ORDER BY period_start DESC, total_runs DESC LIMIT 50
  `);
  return rows as unknown as Array<{
    workflow_name: string; period_start: string; avg_duration_ms: number;
    completion_rate: number; sla_compliance_rate: number; total_runs: number; successful_runs: number;
  }>;
}

export async function upsertWorkflowAnalytics(data: {
  orgId: string; workflowId: string | null; workflowName: string; periodStart: string;
  avgDurationMs: number; completionRate: number; slaComplianceRate: number;
  totalRuns: number; successfulRuns: number; failedRuns: number;
}) {
  await db.execute(sql`
    INSERT INTO toe_workflow_analytics
      (org_id, workflow_id, workflow_name, period_start, avg_duration_ms,
       completion_rate, sla_compliance_rate, total_runs, successful_runs, failed_runs)
    VALUES (${data.orgId}, ${data.workflowId}, ${data.workflowName}, ${data.periodStart}::date,
            ${data.avgDurationMs}, ${data.completionRate}, ${data.slaComplianceRate},
            ${data.totalRuns}, ${data.successfulRuns}, ${data.failedRuns})
    ON CONFLICT (org_id, workflow_id, period_start)
    DO UPDATE SET
      avg_duration_ms = EXCLUDED.avg_duration_ms,
      completion_rate = EXCLUDED.completion_rate,
      total_runs = EXCLUDED.total_runs + toe_workflow_analytics.total_runs,
      successful_runs = EXCLUDED.successful_runs + toe_workflow_analytics.successful_runs
  `);
}

// ─── Dashboard Metrics ────────────────────────────────────────────────────────

export async function getDashboardMetrics(orgId: string): Promise<ToeDashboardMetrics> {
  const [pending, rules, today, decisions, instanceCounts] = await Promise.all([
    countPendingApprovals(orgId),
    db.execute(sql`SELECT count(*)::int AS n FROM toe_automation_rules WHERE org_id = ${orgId} AND active = true`),
    countEventsToday(orgId),
    countPendingDecisions(orgId),
    countInstancesByStatus(orgId),
  ]);

  const counts = instanceCounts;
  return {
    pendingApprovals: pending,
    activeWorkflows: (counts['running'] ?? 0) + (counts['pending'] ?? 0) + (counts['waiting_approval'] ?? 0),
    automationRules: (rules as unknown as Array<{ n: number }>)[0]?.n ?? 0,
    eventsToday: today,
    openDecisions: decisions,
    totalWorkflows: Object.values(counts).reduce((a, b) => a + b, 0),
    completedWorkflows: counts['completed'] ?? 0,
    failedWorkflows: counts['failed'] ?? 0,
  };
}
