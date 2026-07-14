import { and, eq, desc, count, lte } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { correctiveActions } from "@/lib/db/schema";
import type { CorrectiveAction } from "@/lib/db/schema";

export type NewCorrectiveAction = {
  organizationId: string;
  findingId: string;
  title: string;
  description?: string | null;
  ownerId?: string | null;
  dueDate?: string | null;
  status?: "open" | "in_progress" | "completed" | "overdue";
};

export async function insertCapa(
  values: NewCorrectiveAction,
  exec: Executor = db
): Promise<{ id: string }> {
  const [row] = await exec
    .insert(correctiveActions)
    .values(values)
    .returning({ id: correctiveActions.id });
  return row;
}

export async function findByFinding(
  orgId: string,
  findingId: string
): Promise<CorrectiveAction[]> {
  return db
    .select()
    .from(correctiveActions)
    .where(
      and(
        eq(correctiveActions.organizationId, orgId),
        eq(correctiveActions.findingId, findingId)
      )
    )
    .orderBy(desc(correctiveActions.createdAt));
}

export async function findByOrg(
  orgId: string,
  filters: { status?: string } = {}
): Promise<CorrectiveAction[]> {
  const conditions = [eq(correctiveActions.organizationId, orgId)];
  if (filters.status) {
    conditions.push(
      eq(
        correctiveActions.status,
        filters.status as "open" | "in_progress" | "completed" | "overdue"
      )
    );
  }
  return db
    .select()
    .from(correctiveActions)
    .where(and(...conditions))
    .orderBy(correctiveActions.dueDate);
}

export async function findById(
  orgId: string,
  id: string
): Promise<CorrectiveAction | null> {
  const [row] = await db
    .select()
    .from(correctiveActions)
    .where(and(eq(correctiveActions.organizationId, orgId), eq(correctiveActions.id, id)))
    .limit(1);
  return row ?? null;
}

export async function updateCapa(
  id: string,
  values: Partial<{
    title: string;
    description: string | null;
    ownerId: string | null;
    dueDate: string | null;
    status: "open" | "in_progress" | "completed" | "overdue";
    completionNotes: string | null;
    completedAt: Date | null;
  }>,
  exec: Executor = db
): Promise<void> {
  await exec
    .update(correctiveActions)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(correctiveActions.id, id));
}

export async function countDueSoon(orgId: string, withinDays = 30): Promise<number> {
  const future = new Date();
  future.setDate(future.getDate() + withinDays);
  const futureStr = future.toISOString().slice(0, 10);
  const [row] = await db
    .select({ count: count() })
    .from(correctiveActions)
    .where(
      and(
        eq(correctiveActions.organizationId, orgId),
        lte(correctiveActions.dueDate, futureStr),
        eq(correctiveActions.status, "open")
      )
    );
  return row?.count ?? 0;
}

export async function countOpenByOrg(orgId: string): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(correctiveActions)
    .where(
      and(
        eq(correctiveActions.organizationId, orgId),
        eq(correctiveActions.status, "open")
      )
    );
  return row?.count ?? 0;
}
