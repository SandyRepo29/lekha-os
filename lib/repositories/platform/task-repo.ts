import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type TaskRow = {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  entity_type: string | null;
  entity_id: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  created_by: string | null;
  created_by_name: string | null;
  due_date: Date | null;
  completed_at: Date | null;
  sla_hours: number | null;
  sla_breached: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

export async function insertTask(params: {
  orgId: string;
  title: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  priority?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdBy?: string;
  createdByName?: string;
  dueDate?: Date;
  slaHours?: number;
  tags?: string[];
}): Promise<{ id: string }> {
  const rows = await db.execute<{ id: string }>(sql`
    INSERT INTO platform_tasks (
      organization_id, title, description, entity_type, entity_id,
      priority, assigned_to, assigned_to_name, created_by, created_by_name,
      due_date, sla_hours, tags
    ) VALUES (
      ${params.orgId},
      ${params.title},
      ${params.description ?? null},
      ${params.entityType ?? null},
      ${params.entityId ?? null},
      ${params.priority ?? "medium"},
      ${params.assignedTo ?? null},
      ${params.assignedToName ?? null},
      ${params.createdBy ?? null},
      ${params.createdByName ?? null},
      ${params.dueDate ?? null},
      ${params.slaHours ?? null},
      ${params.tags ? JSON.stringify(params.tags) : "[]"}::jsonb
    )
    RETURNING id
  `);
  return rows[0];
}

export async function findOrgTasks(
  orgId: string,
  opts?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    entityType?: string;
    entityId?: string;
    overdue?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<TaskRow[]> {
  const limit = opts?.limit ?? 100;
  const offset = opts?.offset ?? 0;

  const rows = await db.execute<TaskRow>(sql`
    SELECT *
    FROM platform_tasks
    WHERE organization_id = ${orgId}
      AND (${opts?.status ?? null} IS NULL OR status = ${opts?.status ?? null})
      AND (${opts?.priority ?? null} IS NULL OR priority = ${opts?.priority ?? null})
      AND (${opts?.assignedTo ?? null} IS NULL OR assigned_to = ${opts?.assignedTo ?? null})
      AND (${opts?.entityType ?? null} IS NULL OR entity_type = ${opts?.entityType ?? null})
      AND (${opts?.entityId ?? null} IS NULL OR entity_id = ${opts?.entityId ?? null})
      AND (
        ${opts?.overdue ? sql`true` : sql`false`} = false
        OR (due_date IS NOT NULL AND due_date < NOW() AND status NOT IN ('completed', 'cancelled'))
      )
    ORDER BY
      CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
      due_date ASC NULLS LAST,
      created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);
  return rows as TaskRow[];
}

export async function findEntityTasks(
  orgId: string,
  entityType: string,
  entityId: string
): Promise<TaskRow[]> {
  const rows = await db.execute<TaskRow>(sql`
    SELECT *
    FROM platform_tasks
    WHERE organization_id = ${orgId}
      AND entity_type = ${entityType}
      AND entity_id = ${entityId}
    ORDER BY
      CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
      due_date ASC NULLS LAST,
      created_at DESC
  `);
  return rows as TaskRow[];
}

export async function findMyTasks(
  orgId: string,
  userId: string
): Promise<TaskRow[]> {
  const rows = await db.execute<TaskRow>(sql`
    SELECT *
    FROM platform_tasks
    WHERE organization_id = ${orgId}
      AND assigned_to = ${userId}
      AND status NOT IN ('completed', 'cancelled')
    ORDER BY
      CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
      due_date ASC NULLS LAST,
      created_at DESC
  `);
  return rows as TaskRow[];
}

export async function updateTask(
  orgId: string,
  taskId: string,
  values: Partial<{
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assignedTo: string | null;
    assignedToName: string | null;
    dueDate: Date | null;
    completedAt: Date | null;
    slaBreached: boolean;
  }>
): Promise<void> {
  await db.execute(sql`
    UPDATE platform_tasks
    SET
      title            = COALESCE(${values.title ?? null}, title),
      description      = CASE WHEN ${Object.prototype.hasOwnProperty.call(values, "description") ? "1" : "0"} = '1' THEN ${values.description ?? null} ELSE description END,
      status           = COALESCE(${values.status ?? null}, status),
      priority         = COALESCE(${values.priority ?? null}, priority),
      assigned_to      = CASE WHEN ${Object.prototype.hasOwnProperty.call(values, "assignedTo") ? "1" : "0"} = '1' THEN ${values.assignedTo ?? null} ELSE assigned_to END,
      assigned_to_name = CASE WHEN ${Object.prototype.hasOwnProperty.call(values, "assignedToName") ? "1" : "0"} = '1' THEN ${values.assignedToName ?? null} ELSE assigned_to_name END,
      due_date         = CASE WHEN ${Object.prototype.hasOwnProperty.call(values, "dueDate") ? "1" : "0"} = '1' THEN ${values.dueDate ?? null} ELSE due_date END,
      completed_at     = CASE WHEN ${Object.prototype.hasOwnProperty.call(values, "completedAt") ? "1" : "0"} = '1' THEN ${values.completedAt ?? null} ELSE completed_at END,
      sla_breached     = COALESCE(${values.slaBreached ?? null}, sla_breached),
      updated_at       = NOW()
    WHERE id = ${taskId}
      AND organization_id = ${orgId}
  `);
}

export async function deleteTask(
  orgId: string,
  taskId: string
): Promise<void> {
  await db.execute(sql`
    DELETE FROM platform_tasks
    WHERE id = ${taskId}
      AND organization_id = ${orgId}
  `);
}

export async function countOrgTasks(orgId: string): Promise<{
  total: number;
  open: number;
  overdue: number;
  completedToday: number;
}> {
  const rows = await db.execute<{
    total: string;
    open: string;
    overdue: string;
    completed_today: string;
  }>(sql`
    SELECT
      COUNT(*)                                                                          AS total,
      COUNT(*) FILTER (WHERE status NOT IN ('completed', 'cancelled'))                 AS open,
      COUNT(*) FILTER (
        WHERE due_date IS NOT NULL
          AND due_date < NOW()
          AND status NOT IN ('completed', 'cancelled')
      )                                                                                 AS overdue,
      COUNT(*) FILTER (
        WHERE completed_at IS NOT NULL
          AND completed_at >= CURRENT_DATE
      )                                                                                 AS completed_today
    FROM platform_tasks
    WHERE organization_id = ${orgId}
  `);
  const row = rows[0];
  return {
    total: Number(row.total),
    open: Number(row.open),
    overdue: Number(row.overdue),
    completedToday: Number(row.completed_today),
  };
}

export async function markSlaBreached(taskId: string): Promise<void> {
  await db.execute(sql`
    UPDATE platform_tasks
    SET sla_breached = true,
        updated_at   = NOW()
    WHERE id = ${taskId}
  `);
}
