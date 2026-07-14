import { and, eq } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { auditPrograms } from "@/lib/db/schema";
import type { AuditProgram } from "@/lib/db/schema";

export type NewAuditProgram = {
  organizationId: string;
  auditId: string;
  title: string;
  description?: string | null;
  controlId?: string | null;
  expectedEvidence?: string | null;
  status?: "pending" | "reviewed" | "passed" | "failed";
};

export async function insertProgram(
  values: NewAuditProgram,
  exec: Executor = db
): Promise<{ id: string }> {
  const [row] = await exec
    .insert(auditPrograms)
    .values(values)
    .returning({ id: auditPrograms.id });
  return row;
}

export async function insertPrograms(
  values: NewAuditProgram[],
  exec: Executor = db
): Promise<void> {
  if (values.length === 0) return;
  await exec.insert(auditPrograms).values(values);
}

export async function findByAudit(
  orgId: string,
  auditId: string
): Promise<AuditProgram[]> {
  return db
    .select()
    .from(auditPrograms)
    .where(
      and(
        eq(auditPrograms.organizationId, orgId),
        eq(auditPrograms.auditId, auditId)
      )
    );
}

export async function updateProgram(
  id: string,
  values: Partial<{
    title: string;
    description: string | null;
    expectedEvidence: string | null;
    status: "pending" | "reviewed" | "passed" | "failed";
  }>,
  exec: Executor = db
): Promise<void> {
  await exec
    .update(auditPrograms)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(auditPrograms.id, id));
}

export async function deleteByAudit(
  auditId: string,
  exec: Executor = db
): Promise<void> {
  await exec
    .delete(auditPrograms)
    .where(eq(auditPrograms.auditId, auditId));
}
