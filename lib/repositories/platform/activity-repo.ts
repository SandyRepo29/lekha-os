import { sql } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";

export type ActivityRow = {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  event_type: string;
  actor_id: string | null;
  actor_name: string | null;
  title: string;
  description: string | null;
  severity: string;
  metadata: Record<string, unknown>;
  created_at: Date;
};

export async function insertActivity(params: {
  orgId: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  eventType: string;
  actorId?: string;
  actorName?: string;
  title: string;
  description?: string;
  severity?: "info" | "success" | "warn" | "error";
  metadata?: Record<string, unknown>;
  exec?: Executor;
}): Promise<{ id: string }> {
  const {
    orgId,
    entityType,
    entityId,
    entityName = null,
    eventType,
    actorId = null,
    actorName = null,
    title,
    description = null,
    severity = "info",
    metadata = {},
    exec,
  } = params;

  const runner = exec ?? db;
  const rows = await runner.execute<{ id: string }>(sql`
    INSERT INTO platform_activity (
      organization_id, entity_type, entity_id, entity_name,
      event_type, actor_id, actor_name, title, description,
      severity, metadata
    ) VALUES (
      ${orgId}, ${entityType}, ${entityId}, ${entityName},
      ${eventType}, ${actorId}, ${actorName}, ${title}, ${description},
      ${severity}, ${JSON.stringify(metadata)}::jsonb
    )
    RETURNING id
  `);

  return rows[0];
}

export async function findOrgActivity(
  orgId: string,
  opts?: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    eventType?: string;
    limit?: number;
    offset?: number;
    from?: Date;
    to?: Date;
  }
): Promise<ActivityRow[]> {
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  const rows = await db.execute<ActivityRow>(sql`
    SELECT
      id, organization_id, entity_type, entity_id, entity_name,
      event_type, actor_id, actor_name, title, description,
      severity, metadata, created_at
    FROM platform_activity
    WHERE organization_id = ${orgId}
      AND (${opts?.entityType ?? null} IS NULL OR entity_type = ${opts?.entityType ?? null})
      AND (${opts?.entityId ?? null} IS NULL OR entity_id = ${opts?.entityId ?? null})
      AND (${opts?.actorId ?? null} IS NULL OR actor_id = ${opts?.actorId ?? null})
      AND (${opts?.eventType ?? null} IS NULL OR event_type = ${opts?.eventType ?? null})
      AND (${opts?.from ? opts.from.toISOString() : null}::timestamptz IS NULL OR created_at >= ${opts?.from ? opts.from.toISOString() : null}::timestamptz)
      AND (${opts?.to ? opts.to.toISOString() : null}::timestamptz IS NULL OR created_at <= ${opts?.to ? opts.to.toISOString() : null}::timestamptz)
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  return Array.from(rows);
}

export async function findEntityActivity(
  orgId: string,
  entityType: string,
  entityId: string,
  limit: number = 50
): Promise<ActivityRow[]> {
  const rows = await db.execute<ActivityRow>(sql`
    SELECT
      id, organization_id, entity_type, entity_id, entity_name,
      event_type, actor_id, actor_name, title, description,
      severity, metadata, created_at
    FROM platform_activity
    WHERE organization_id = ${orgId}
      AND entity_type = ${entityType}
      AND entity_id = ${entityId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);

  return Array.from(rows);
}

export async function countOrgActivity(orgId: string): Promise<number> {
  const rows = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text AS count
    FROM platform_activity
    WHERE organization_id = ${orgId}
  `);

  return parseInt(rows[0]?.count ?? "0", 10);
}
