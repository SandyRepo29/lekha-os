import { and, eq, desc, count } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { auditFindings } from "@/lib/db/schema";
import type { AuditFinding } from "@/lib/db/schema";

export type NewAuditFinding = {
  organizationId: string;
  auditId: string;
  controlId?: string | null;
  evidenceId?: string | null;
  title: string;
  description?: string | null;
  severity?: "critical" | "high" | "medium" | "low";
  recommendation?: string | null;
  status?: "open" | "accepted" | "remediating" | "closed";
  createdBy?: string | null;
};

export async function insertFinding(
  values: NewAuditFinding,
  exec: Executor = db
): Promise<{ id: string }> {
  const [row] = await exec
    .insert(auditFindings)
    .values(values)
    .returning({ id: auditFindings.id });
  return row;
}

export async function findByAudit(
  orgId: string,
  auditId: string
): Promise<AuditFinding[]> {
  return db
    .select()
    .from(auditFindings)
    .where(
      and(
        eq(auditFindings.organizationId, orgId),
        eq(auditFindings.auditId, auditId)
      )
    )
    .orderBy(desc(auditFindings.createdAt));
}

export async function findByOrg(
  orgId: string,
  filters: { severity?: string; status?: string } = {}
): Promise<AuditFinding[]> {
  const conditions = [eq(auditFindings.organizationId, orgId)];
  if (filters.severity) {
    conditions.push(
      eq(
        auditFindings.severity,
        filters.severity as "critical" | "high" | "medium" | "low"
      )
    );
  }
  if (filters.status) {
    conditions.push(
      eq(
        auditFindings.status,
        filters.status as "open" | "accepted" | "remediating" | "closed"
      )
    );
  }
  return db
    .select()
    .from(auditFindings)
    .where(and(...conditions))
    .orderBy(desc(auditFindings.createdAt));
}

export async function findById(
  orgId: string,
  id: string
): Promise<AuditFinding | null> {
  const [row] = await db
    .select()
    .from(auditFindings)
    .where(and(eq(auditFindings.organizationId, orgId), eq(auditFindings.id, id)))
    .limit(1);
  return row ?? null;
}

export async function updateFinding(
  id: string,
  values: Partial<{
    title: string;
    description: string | null;
    severity: "critical" | "high" | "medium" | "low";
    recommendation: string | null;
    status: "open" | "accepted" | "remediating" | "closed";
  }>,
  exec: Executor = db
): Promise<void> {
  await exec
    .update(auditFindings)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(auditFindings.id, id));
}

export async function countBySeverity(orgId: string): Promise<Record<string, number>> {
  const rows = await db
    .select({ severity: auditFindings.severity, count: count() })
    .from(auditFindings)
    .where(
      and(
        eq(auditFindings.organizationId, orgId),
        eq(auditFindings.status, "open")
      )
    )
    .groupBy(auditFindings.severity);
  const out: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const r of rows) out[r.severity] = r.count;
  return out;
}

export async function countOpenByOrg(orgId: string): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(auditFindings)
    .where(
      and(
        eq(auditFindings.organizationId, orgId),
        eq(auditFindings.status, "open")
      )
    );
  return row?.count ?? 0;
}
