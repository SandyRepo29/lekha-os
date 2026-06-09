import { eq, and, desc, asc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { governanceAlerts } from "@/lib/db/schema";
import type { GovernanceAlert } from "@/lib/db/schema";

export type { GovernanceAlert };

export type AlertInsert = {
  organizationId: string;
  type: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  description?: string;
  entityType?: "vendor" | "risk" | "control" | "audit" | "evidence" | "policy" | "framework" | "organization";
  entityId?: string;
};

export async function insertAlert(values: AlertInsert): Promise<GovernanceAlert> {
  const rows = await db.insert(governanceAlerts).values(values).returning();
  return rows[0];
}

export async function findAlerts(
  orgId: string,
  opts: { status?: string; severity?: string; limit?: number } = {}
): Promise<GovernanceAlert[]> {
  // build filters
  const filters = [eq(governanceAlerts.organizationId, orgId)];
  if (opts.status) filters.push(eq(governanceAlerts.status, opts.status));
  if (opts.severity) filters.push(eq(governanceAlerts.severity, opts.severity as any));

  return db
    .select()
    .from(governanceAlerts)
    .where(and(...filters))
    .orderBy(desc(governanceAlerts.createdAt))
    .limit(opts.limit ?? 100);
}

export async function countAlerts(orgId: string): Promise<{
  open: number; critical: number; high: number; resolved: number;
}> {
  const rows = await db
    .select({ status: governanceAlerts.status, severity: governanceAlerts.severity })
    .from(governanceAlerts)
    .where(eq(governanceAlerts.organizationId, orgId));

  return {
    open: rows.filter((r) => r.status === "open").length,
    critical: rows.filter((r) => r.status === "open" && r.severity === "critical").length,
    high: rows.filter((r) => r.status === "open" && r.severity === "high").length,
    resolved: rows.filter((r) => r.status === "resolved").length,
  };
}

export async function resolveAlert(id: string, resolvedBy: string): Promise<void> {
  await db
    .update(governanceAlerts)
    .set({ status: "resolved", resolvedAt: new Date(), resolvedBy, updatedAt: new Date() })
    .where(eq(governanceAlerts.id, id));
}

export async function resolveAlertsByType(orgId: string, type: string): Promise<void> {
  await db
    .update(governanceAlerts)
    .set({ status: "resolved", resolvedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(governanceAlerts.organizationId, orgId), eq(governanceAlerts.type, type), eq(governanceAlerts.status, "open")));
}

// prevent duplicate open alerts for same entity+type
export async function findExistingAlert(orgId: string, type: string, entityId?: string): Promise<GovernanceAlert | null> {
  const filters = [
    eq(governanceAlerts.organizationId, orgId),
    eq(governanceAlerts.type, type),
    eq(governanceAlerts.status, "open"),
  ];
  if (entityId) filters.push(eq(governanceAlerts.entityId, entityId));

  const rows = await db.select().from(governanceAlerts).where(and(...filters)).limit(1);
  return rows[0] ?? null;
}

export async function deleteAlert(id: string): Promise<void> {
  await db.delete(governanceAlerts).where(eq(governanceAlerts.id, id));
}
