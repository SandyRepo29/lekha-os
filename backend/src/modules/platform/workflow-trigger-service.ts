import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { DomainError } from "@/lib/services/errors";

export type TriggerAction = {
  type: "create_task" | "send_notification" | "assign_owner" | "create_risk" | "generate_ai_summary";
  config: Record<string, unknown>;
};

export type TriggerRow = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  trigger_entity_type: string | null;
  conditions: Record<string, unknown>;
  actions: TriggerAction[];
  is_active: boolean;
  run_count: number;
  last_run_at: Date | null;
  created_by: string | null;
  created_at: Date;
};

type TriggerRunRow = {
  id: string;
  trigger_id: string;
  organization_id: string;
  event: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  status: "success" | "partial" | "failed";
  actions_executed: number;
  actions_failed: number;
  error_log: string | null;
  executed_at: Date;
};

export async function getOrgTriggers(
  orgId: string,
  opts?: { event?: string; isActive?: boolean }
): Promise<TriggerRow[]> {
  const rows = await db.execute(sql`
    SELECT
      id, organization_id, name, description,
      trigger_event, trigger_entity_type,
      conditions, actions,
      is_active, run_count, last_run_at,
      created_by, created_at
    FROM workflow_triggers
    WHERE organization_id = ${orgId}
      ${opts?.event !== undefined ? sql`AND trigger_event = ${opts.event}` : sql``}
      ${opts?.isActive !== undefined ? sql`AND is_active = ${opts.isActive}` : sql``}
    ORDER BY created_at DESC
  `);

  return (rows as unknown as TriggerRow[]).map(normalizeRow);
}

export async function getTriggerById(
  orgId: string,
  triggerId: string
): Promise<TriggerRow | null> {
  const rows = await db.execute(sql`
    SELECT
      id, organization_id, name, description,
      trigger_event, trigger_entity_type,
      conditions, actions,
      is_active, run_count, last_run_at,
      created_by, created_at
    FROM workflow_triggers
    WHERE id = ${triggerId}
      AND organization_id = ${orgId}
    LIMIT 1
  `);

  const arr = rows as unknown as TriggerRow[];
  if (!arr.length) return null;
  return normalizeRow(arr[0]);
}

export async function createTrigger(params: {
  orgId: string;
  name: string;
  description?: string;
  triggerEvent: string;
  triggerEntityType?: string;
  conditions?: Record<string, unknown>;
  actions: TriggerAction[];
  createdBy?: string;
}): Promise<{ id: string }> {
  if (!params.name?.trim()) {
    throw new DomainError("Trigger name is required");
  }
  if (!params.triggerEvent?.trim()) {
    throw new DomainError("Trigger event is required");
  }
  if (!params.actions?.length) {
    throw new DomainError("At least one action is required");
  }

  const conditionsJson = JSON.stringify(params.conditions ?? {});
  const actionsJson = JSON.stringify(params.actions);

  const rows = await db.execute(sql`
    INSERT INTO workflow_triggers (
      organization_id, name, description,
      trigger_event, trigger_entity_type,
      conditions, actions,
      is_active, run_count, created_by
    ) VALUES (
      ${params.orgId},
      ${params.name.trim()},
      ${params.description ?? null},
      ${params.triggerEvent},
      ${params.triggerEntityType ?? null},
      ${conditionsJson}::jsonb,
      ${actionsJson}::jsonb,
      true,
      0,
      ${params.createdBy ?? null}
    )
    RETURNING id
  `);

  const arr = rows as unknown as { id: string }[];
  return { id: arr[0].id };
}

export async function updateTrigger(
  orgId: string,
  triggerId: string,
  values: Partial<{
    name: string;
    description: string | null;
    conditions: Record<string, unknown>;
    actions: TriggerAction[];
    isActive: boolean;
  }>
): Promise<void> {
  const existing = await getTriggerById(orgId, triggerId);
  if (!existing) {
    throw new DomainError("Trigger not found");
  }

  const setClauses: ReturnType<typeof sql>[] = [];

  if (values.name !== undefined) {
    if (!values.name.trim()) throw new DomainError("Trigger name cannot be empty");
    setClauses.push(sql`name = ${values.name.trim()}`);
  }
  if (values.description !== undefined) {
    setClauses.push(sql`description = ${values.description}`);
  }
  if (values.conditions !== undefined) {
    setClauses.push(sql`conditions = ${JSON.stringify(values.conditions)}::jsonb`);
  }
  if (values.actions !== undefined) {
    if (!values.actions.length) throw new DomainError("At least one action is required");
    setClauses.push(sql`actions = ${JSON.stringify(values.actions)}::jsonb`);
  }
  if (values.isActive !== undefined) {
    setClauses.push(sql`is_active = ${values.isActive}`);
  }

  if (!setClauses.length) return;

  setClauses.push(sql`updated_at = now()`);

  const setFragment = setClauses.reduce(
    (acc, clause, i) => (i === 0 ? clause : sql`${acc}, ${clause}`)
  );

  await db.execute(sql`
    UPDATE workflow_triggers
    SET ${setFragment}
    WHERE id = ${triggerId}
      AND organization_id = ${orgId}
  `);
}

export async function deleteTrigger(orgId: string, triggerId: string): Promise<void> {
  const existing = await getTriggerById(orgId, triggerId);
  if (!existing) {
    throw new DomainError("Trigger not found");
  }

  await db.execute(sql`
    DELETE FROM workflow_triggers
    WHERE id = ${triggerId}
      AND organization_id = ${orgId}
  `);
}

export async function fireTrigger(params: {
  orgId: string;
  event: string;
  entityType?: string;
  entityId?: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  let triggers: TriggerRow[];
  try {
    triggers = await getOrgTriggers(params.orgId, {
      event: params.event,
      isActive: true,
    });
  } catch {
    return;
  }

  const matching = triggers.filter((t) => {
    if (t.trigger_entity_type && params.entityType && t.trigger_entity_type !== params.entityType) {
      return false;
    }
    return evaluateConditions(t.conditions, params.payload);
  });

  for (const trigger of matching) {
    let actionsExecuted = 0;
    let actionsFailed = 0;
    const errorParts: string[] = [];

    for (const action of trigger.actions) {
      try {
        await executeAction(action, {
          orgId: params.orgId,
          entityId: params.entityId,
          entityType: params.entityType,
          payload: params.payload,
        });
        actionsExecuted++;
      } catch (err) {
        actionsFailed++;
        const msg = err instanceof Error ? err.message : String(err);
        errorParts.push(`[${action.type}] ${msg}`);
      }
    }

    const status: "success" | "partial" | "failed" =
      actionsFailed === 0
        ? "success"
        : actionsExecuted === 0
        ? "failed"
        : "partial";

    try {
      await db.execute(sql`
        INSERT INTO workflow_trigger_runs (
          trigger_id, organization_id,
          event, entity_type, entity_id,
          payload, status,
          actions_executed, actions_failed,
          error_log, executed_at
        ) VALUES (
          ${trigger.id},
          ${params.orgId},
          ${params.event},
          ${params.entityType ?? null},
          ${params.entityId ?? null},
          ${JSON.stringify(params.payload)}::jsonb,
          ${status},
          ${actionsExecuted},
          ${actionsFailed},
          ${errorParts.length ? errorParts.join("; ") : null},
          now()
        )
      `);

      await db.execute(sql`
        UPDATE workflow_triggers
        SET run_count = run_count + 1,
            last_run_at = now()
        WHERE id = ${trigger.id}
      `);
    } catch {
      // fire-and-forget — recording failure must not bubble up
    }
  }
}

export async function getTriggerRuns(
  orgId: string,
  triggerId: string,
  limit = 50
): Promise<TriggerRunRow[]> {
  const rows = await db.execute(sql`
    SELECT
      r.id, r.trigger_id, r.organization_id,
      r.event, r.entity_type, r.entity_id,
      r.payload, r.status,
      r.actions_executed, r.actions_failed,
      r.error_log, r.executed_at
    FROM workflow_trigger_runs r
    JOIN workflow_triggers t ON t.id = r.trigger_id
    WHERE r.trigger_id = ${triggerId}
      AND r.organization_id = ${orgId}
      AND t.organization_id = ${orgId}
    ORDER BY r.executed_at DESC
    LIMIT ${limit}
  `);

  return rows as unknown as TriggerRunRow[];
}

export async function getTriggerStats(orgId: string): Promise<{
  total: number;
  active: number;
  runsToday: number;
  successRate: number;
}> {
  const [countRows, runRows] = await Promise.all([
    db.execute(sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE is_active = true) AS active
      FROM workflow_triggers
      WHERE organization_id = ${orgId}
    `),
    db.execute(sql`
      SELECT
        COUNT(*) AS runs_today,
        COUNT(*) FILTER (WHERE status = 'success') AS successes
      FROM workflow_trigger_runs r
      JOIN workflow_triggers t ON t.id = r.trigger_id
      WHERE r.organization_id = ${orgId}
        AND t.organization_id = ${orgId}
        AND r.executed_at >= current_date
    `),
  ]);

  const counts = (countRows as unknown as { total: string; active: string }[])[0];
  const runs = (runRows as unknown as { runs_today: string; successes: string }[])[0];

  const total = parseInt(counts?.total ?? "0", 10);
  const active = parseInt(counts?.active ?? "0", 10);
  const runsToday = parseInt(runs?.runs_today ?? "0", 10);
  const successes = parseInt(runs?.successes ?? "0", 10);
  const successRate = runsToday > 0 ? Math.round((successes / runsToday) * 100) : 100;

  return { total, active, runsToday, successRate };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function normalizeRow(row: TriggerRow): TriggerRow {
  return {
    ...row,
    conditions:
      typeof row.conditions === "string"
        ? (JSON.parse(row.conditions) as Record<string, unknown>)
        : (row.conditions ?? {}),
    actions:
      typeof row.actions === "string"
        ? (JSON.parse(row.actions) as TriggerAction[])
        : (row.actions ?? []),
    is_active: row.is_active === true || (row.is_active as unknown as string) === "true",
    run_count:
      typeof row.run_count === "string" ? parseInt(row.run_count, 10) : (row.run_count ?? 0),
    last_run_at: row.last_run_at ? new Date(row.last_run_at) : null,
    created_at: new Date(row.created_at),
  };
}

function evaluateConditions(
  conditions: Record<string, unknown>,
  payload: Record<string, unknown>
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true;

  for (const [key, expected] of Object.entries(conditions)) {
    const actual = resolveNestedKey(payload, key);

    if (Array.isArray(expected)) {
      if (!expected.includes(actual)) return false;
    } else if (
      expected !== null &&
      typeof expected === "object" &&
      "$gt" in (expected as Record<string, unknown>)
    ) {
      const threshold = (expected as Record<string, unknown>)["$gt"] as number;
      if (typeof actual !== "number" || actual <= threshold) return false;
    } else if (
      expected !== null &&
      typeof expected === "object" &&
      "$lt" in (expected as Record<string, unknown>)
    ) {
      const threshold = (expected as Record<string, unknown>)["$lt"] as number;
      if (typeof actual !== "number" || actual >= threshold) return false;
    } else if (
      expected !== null &&
      typeof expected === "object" &&
      "$contains" in (expected as Record<string, unknown>)
    ) {
      const needle = (expected as Record<string, unknown>)["$contains"] as string;
      if (typeof actual !== "string" || !actual.includes(needle)) return false;
    } else {
      if (actual !== expected) return false;
    }
  }

  return true;
}

function resolveNestedKey(obj: Record<string, unknown>, key: string): unknown {
  const parts = key.split(".");
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur === null || cur === undefined || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

async function executeAction(
  action: TriggerAction,
  ctx: {
    orgId: string;
    entityId?: string;
    entityType?: string;
    payload: Record<string, unknown>;
  }
): Promise<void> {
  switch (action.type) {
    case "create_task": {
      const cfg = action.config;
      const title = (cfg.title as string) ?? "Automated task";
      const description = (cfg.description as string) ?? null;
      const priority = (cfg.priority as string) ?? "medium";
      const dueDays = typeof cfg.due_days === "number" ? cfg.due_days : null;
      const dueAt = dueDays
        ? sql`now() + (${dueDays} || ' days')::interval`
        : sql`null::timestamptz`;

      await db.execute(sql`
        INSERT INTO issue_tasks (
          organization_id, title, description,
          priority, status,
          source_entity_type, source_entity_id,
          due_at, created_at
        ) VALUES (
          ${ctx.orgId},
          ${title},
          ${description},
          ${priority},
          'open',
          ${ctx.entityType ?? null},
          ${ctx.entityId ?? null},
          ${dueAt},
          now()
        )
      `);
      break;
    }

    case "send_notification": {
      const cfg = action.config;
      const message = (cfg.message as string) ?? "Automated governance notification";
      const severity = (cfg.severity as string) ?? "info";

      await db.execute(sql`
        INSERT INTO governance_alerts (
          organization_id, alert_type, severity,
          title, message,
          entity_type, entity_id,
          status, created_at
        ) VALUES (
          ${ctx.orgId},
          'workflow_trigger',
          ${severity},
          'Workflow Notification',
          ${message},
          ${ctx.entityType ?? null},
          ${ctx.entityId ?? null},
          'open',
          now()
        )
      `);
      break;
    }

    case "assign_owner": {
      const cfg = action.config;
      const ownerId = cfg.owner_id as string | undefined;
      if (!ownerId || !ctx.entityId || !ctx.entityType) break;

      const tableMap: Record<string, string> = {
        vendor: "vendors",
        risk: "risks",
        control: "controls",
        issue: "issues",
        audit: "audits",
      };
      const table = ctx.entityType ? tableMap[ctx.entityType] : null;
      if (!table) break;

      await db.execute(sql`
        UPDATE ${sql.raw(table)}
        SET owner_id = ${ownerId}
        WHERE id = ${ctx.entityId}
          AND organization_id = ${ctx.orgId}
      `);
      break;
    }

    case "create_risk": {
      const cfg = action.config;
      const title = (cfg.title as string) ?? "Automated risk";
      const description = (cfg.description as string) ?? null;
      const category = (cfg.category as string) ?? "operational";
      const impact = typeof cfg.impact === "number" ? cfg.impact : 3;
      const likelihood = typeof cfg.likelihood === "number" ? cfg.likelihood : 3;
      const inherentScore = impact * likelihood * 4;

      await db.execute(sql`
        INSERT INTO risks (
          organization_id, title, description,
          category, status, source,
          impact, likelihood,
          inherent_score, residual_score,
          treatment_strategy, created_at
        ) VALUES (
          ${ctx.orgId},
          ${title},
          ${description},
          ${category},
          'identified',
          'ai_generated',
          ${impact},
          ${likelihood},
          ${inherentScore},
          ${inherentScore},
          'monitor',
          now()
        )
      `);
      break;
    }

    case "generate_ai_summary": {
      const cfg = action.config;
      const targetId = (cfg.target_id as string) ?? ctx.entityId;
      const summaryType = (cfg.summary_type as string) ?? "workflow_trigger";
      if (!targetId) break;

      // Record a placeholder in ai_compliance_insights — actual AI call is deferred
      await db.execute(sql`
        INSERT INTO ai_compliance_insights (
          organization_id, insight_type,
          target_id, content,
          generated_at
        ) VALUES (
          ${ctx.orgId},
          ${summaryType},
          ${targetId},
          'AI summary scheduled by workflow trigger. Refresh to generate.',
          now()
        )
        ON CONFLICT (organization_id, insight_type, target_id)
        DO UPDATE SET
          content = EXCLUDED.content,
          generated_at = EXCLUDED.generated_at
      `);
      break;
    }

    default:
      throw new DomainError(`Unknown action type: ${(action as TriggerAction).type}`);
  }
}
