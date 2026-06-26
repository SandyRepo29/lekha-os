import {
  insertActivity,
  findActivities,
  countActivities,
} from "@/lib/repositories/platform/activity-repo";
import { DomainError } from "@/lib/services/errors";

export async function publishActivity(params: {
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
}): Promise<void> {
  try {
    await insertActivity({
      orgId: params.orgId,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      eventType: params.eventType,
      actorId: params.actorId,
      actorName: params.actorName,
      title: params.title,
      description: params.description,
      severity: params.severity ?? "info",
      metadata: params.metadata,
    });
  } catch {
    // Fire-and-forget — swallow errors so callers are never blocked
  }
}

export async function getActivityFeed(
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
) {
  return findActivities(orgId, {
    entityType: opts?.entityType,
    entityId: opts?.entityId,
    actorId: opts?.actorId,
    eventType: opts?.eventType,
    limit: opts?.limit ?? 50,
    offset: opts?.offset ?? 0,
    from: opts?.from,
    to: opts?.to,
  });
}

export async function getEntityActivity(
  orgId: string,
  entityType: string,
  entityId: string,
  limit = 20
) {
  return findActivities(orgId, { entityType, entityId, limit, offset: 0 });
}

export async function getActivityStats(orgId: string): Promise<{
  total: number;
  last24h: number;
  byEntityType: Record<string, number>;
  recentActors: { actor_name: string; count: number }[];
}> {
  const [total, last24h, all] = await Promise.all([
    countActivities(orgId, {}),
    countActivities(orgId, { from: new Date(Date.now() - 86_400_000) }),
    findActivities(orgId, { limit: 1000, offset: 0 }),
  ]);

  const byEntityType: Record<string, number> = {};
  const actorCounts: Record<string, number> = {};

  for (const row of all) {
    const et = (row as Record<string, unknown>).entity_type as string | undefined;
    if (et) {
      byEntityType[et] = (byEntityType[et] ?? 0) + 1;
    }

    const name = (row as Record<string, unknown>).actor_name as string | undefined;
    if (name) {
      actorCounts[name] = (actorCounts[name] ?? 0) + 1;
    }
  }

  const recentActors = Object.entries(actorCounts)
    .map(([actor_name, count]) => ({ actor_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { total, last24h, byEntityType, recentActors };
}
