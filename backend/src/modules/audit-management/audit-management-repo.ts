import { and, eq, desc, count, sql } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { audits } from "@/lib/db/schema";
import type { Audit } from "@/lib/db/schema";

export type NewAudit = {
  organizationId: string;
  name: string;
  auditType?: "internal" | "external" | "vendor" | "security" | "compliance" | "regulatory";
  frameworkId?: string | null;
  scope?: string | null;
  objective?: string | null;
  ownerId?: string | null;
  auditorName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: "planned" | "in_progress" | "completed" | "cancelled";
  createdBy?: string | null;
};

export async function insertAudit(
  values: NewAudit,
  exec: Executor = db
): Promise<{ id: string }> {
  const [row] = await exec
    .insert(audits)
    .values(values)
    .returning({ id: audits.id });
  return row;
}

export async function findByOrg(orgId: string): Promise<Audit[]> {
  return db
    .select()
    .from(audits)
    .where(eq(audits.organizationId, orgId))
    .orderBy(desc(audits.createdAt));
}

export async function findById(orgId: string, id: string): Promise<Audit | null> {
  const [row] = await db
    .select()
    .from(audits)
    .where(and(eq(audits.organizationId, orgId), eq(audits.id, id)))
    .limit(1);
  return row ?? null;
}

export async function updateAudit(
  id: string,
  values: Partial<{
    name: string;
    auditType: "internal" | "external" | "vendor" | "security" | "compliance" | "regulatory";
    frameworkId: string | null;
    scope: string | null;
    objective: string | null;
    ownerId: string | null;
    auditorName: string | null;
    startDate: string | null;
    endDate: string | null;
    status: "planned" | "in_progress" | "completed" | "cancelled";
    aiSummary: string | null;
    aiSummaryAt: Date | null;
  }>,
  exec: Executor = db
): Promise<void> {
  await exec
    .update(audits)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(audits.id, id));
}

export async function deleteAudit(
  orgId: string,
  id: string,
  exec: Executor = db
): Promise<void> {
  await exec
    .delete(audits)
    .where(and(eq(audits.organizationId, orgId), eq(audits.id, id)));
}

export async function countByStatus(orgId: string): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: audits.status, count: count() })
    .from(audits)
    .where(eq(audits.organizationId, orgId))
    .groupBy(audits.status);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = r.count;
  return out;
}

export async function countOverdue(orgId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const [row] = await db
    .select({ count: count() })
    .from(audits)
    .where(
      and(
        eq(audits.organizationId, orgId),
        sql`${audits.status} IN ('planned','in_progress')`,
        sql`${audits.endDate} < ${today}`
      )
    );
  return row?.count ?? 0;
}
