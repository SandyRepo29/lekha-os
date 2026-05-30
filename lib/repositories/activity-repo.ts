import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, profiles } from "@/lib/db/schema";

export type ActivityItem = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: Date;
};

export async function listOrgActivity(orgId: string, limit = 20): Promise<ActivityItem[]> {
  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      actorName: profiles.fullName,
      actorEmail: profiles.email,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(profiles, eq(auditLogs.actorId, profiles.id))
    .where(eq(auditLogs.organizationId, orgId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    metadata: (r.metadata as Record<string, unknown> | null) ?? null,
    createdAt: r.createdAt ?? new Date(),
  }));
}

export async function listVendorActivity(orgId: string, vendorId: string, limit = 15): Promise<ActivityItem[]> {
  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      actorName: profiles.fullName,
      actorEmail: profiles.email,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(profiles, eq(auditLogs.actorId, profiles.id))
    .where(eq(auditLogs.organizationId, orgId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit * 4); // over-fetch then filter

  // Filter to vendor-related activity
  const vendorActivity = rows.filter(
    (r) =>
      r.entityId === vendorId ||
      (r.metadata as any)?.vendorId === vendorId
  );

  return vendorActivity.slice(0, limit).map((r) => ({
    ...r,
    metadata: (r.metadata as Record<string, unknown> | null) ?? null,
    createdAt: r.createdAt ?? new Date(),
  }));
}
