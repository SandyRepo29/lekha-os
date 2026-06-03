import { and, eq, desc, count } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { controls } from "@/lib/db/schema";
import type { Control } from "@/lib/db/schema";

export type NewControl = {
  organizationId: string;
  frameworkId: string;
  controlRef: string;
  name: string;
  description?: string | null;
  category?: string | null;
  owner?: string | null;
  status?: "implemented" | "partial" | "not_implemented" | "not_applicable";
  priority?: "low" | "medium" | "high" | "critical";
  reviewDate?: string | null;
};

export async function insertControl(
  values: NewControl,
  exec: Executor = db
): Promise<{ id: string }> {
  const [row] = await exec
    .insert(controls)
    .values(values)
    .returning({ id: controls.id });
  return row;
}

/** Bulk insert — used when seeding a full framework's control list. */
export async function bulkInsertControls(
  values: NewControl[],
  exec: Executor = db
): Promise<void> {
  if (values.length === 0) return;
  await exec.insert(controls).values(values);
}

export async function findByFramework(
  orgId: string,
  frameworkId: string
): Promise<Control[]> {
  return db
    .select()
    .from(controls)
    .where(
      and(
        eq(controls.organizationId, orgId),
        eq(controls.frameworkId, frameworkId)
      )
    )
    .orderBy(controls.controlRef);
}

export async function findById(orgId: string, id: string): Promise<Control | null> {
  const [row] = await db
    .select()
    .from(controls)
    .where(and(eq(controls.organizationId, orgId), eq(controls.id, id)))
    .limit(1);
  return row ?? null;
}

export async function updateControl(
  id: string,
  values: Partial<{
    controlRef: string;
    name: string;
    description: string | null;
    category: string | null;
    owner: string | null;
    status: "implemented" | "partial" | "not_implemented" | "not_applicable";
    priority: "low" | "medium" | "high" | "critical";
    reviewDate: string | null;
  }>,
  exec: Executor = db
): Promise<void> {
  await exec
    .update(controls)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(controls.id, id));
}

export async function deleteControl(
  orgId: string,
  id: string,
  exec: Executor = db
): Promise<void> {
  await exec
    .delete(controls)
    .where(and(eq(controls.organizationId, orgId), eq(controls.id, id)));
}

/** Per-status counts for a framework — used to compute readiness. */
export async function countByStatus(
  orgId: string,
  frameworkId: string
): Promise<{ status: string; n: number }[]> {
  const rows = await db
    .select({ status: controls.status, n: count() })
    .from(controls)
    .where(
      and(
        eq(controls.organizationId, orgId),
        eq(controls.frameworkId, frameworkId)
      )
    )
    .groupBy(controls.status);
  return rows.map((r) => ({ status: r.status, n: Number(r.n) }));
}
