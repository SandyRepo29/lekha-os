import { db, type Executor } from "@/lib/db";
import { auditLogs, profiles } from "@/lib/db/schema";
import { eq, desc, and, gte, lte, ilike, sql } from "drizzle-orm";

export type AuditLogWithActor = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  createdAt: Date;
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
};

export type AuditFilters = {
  userId?: string;
  module?: string;
  from?: Date;
  to?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type AuditEntry = {
  organizationId: string;
  actorId: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

/** Append an audit-log row. Pass a transaction handle to include it atomically. */
export async function recordAudit(entry: AuditEntry, exec: Executor = db): Promise<void> {
  await exec.insert(auditLogs).values({
    organizationId: entry.organizationId,
    actorId: entry.actorId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    metadata: entry.metadata,
  });
}

export async function listByOrg(
  orgId: string,
  filters: AuditFilters = {}
): Promise<AuditLogWithActor[]> {
  const { userId, module, from, to, search, page = 1, pageSize = 50 } = filters;
  const offset = (page - 1) * pageSize;

  const conditions = [eq(auditLogs.organizationId, orgId)];
  if (userId) conditions.push(eq(auditLogs.actorId, userId));
  if (module) conditions.push(ilike(auditLogs.action, `${module}.%`));
  if (from) conditions.push(gte(auditLogs.createdAt, from));
  if (to) conditions.push(lte(auditLogs.createdAt, to));
  if (search) conditions.push(ilike(auditLogs.action, `%${search}%`));

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorId: auditLogs.actorId,
      actorEmail: profiles.email,
      actorName: profiles.fullName,
    })
    .from(auditLogs)
    .leftJoin(profiles, eq(auditLogs.actorId, profiles.id))
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(pageSize)
    .offset(offset);

  return rows;
}

export async function countByOrg(
  orgId: string,
  filters: Omit<AuditFilters, "page" | "pageSize"> = {}
): Promise<number> {
  const { userId, module, from, to, search } = filters;
  const conditions = [eq(auditLogs.organizationId, orgId)];
  if (userId) conditions.push(eq(auditLogs.actorId, userId));
  if (module) conditions.push(ilike(auditLogs.action, `${module}.%`));
  if (from) conditions.push(gte(auditLogs.createdAt, from));
  if (to) conditions.push(lte(auditLogs.createdAt, to));
  if (search) conditions.push(ilike(auditLogs.action, `%${search}%`));

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(and(...conditions));
  return count;
}
