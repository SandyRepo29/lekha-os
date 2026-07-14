import { and, eq, desc } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { frameworks } from "@/lib/db/schema";
import type { Framework } from "@/lib/db/schema";

export type NewFramework = {
  organizationId: string;
  name: string;
  description?: string | null;
  version?: string | null;
  owner?: string | null;
  status?: "not_started" | "in_progress" | "ready" | "certified" | "expired";
  reviewDate?: string | null;
  createdBy?: string | null;
};

export async function insertFramework(
  values: NewFramework,
  exec: Executor = db
): Promise<{ id: string }> {
  const [row] = await exec
    .insert(frameworks)
    .values(values)
    .returning({ id: frameworks.id });
  return row;
}

export async function findByOrg(orgId: string): Promise<Framework[]> {
  return db
    .select()
    .from(frameworks)
    .where(eq(frameworks.organizationId, orgId))
    .orderBy(desc(frameworks.createdAt));
}

export async function findById(orgId: string, id: string): Promise<Framework | null> {
  const [row] = await db
    .select()
    .from(frameworks)
    .where(and(eq(frameworks.organizationId, orgId), eq(frameworks.id, id)))
    .limit(1);
  return row ?? null;
}

export async function updateFramework(
  id: string,
  values: Partial<{
    name: string;
    description: string | null;
    version: string | null;
    owner: string | null;
    status: "not_started" | "in_progress" | "ready" | "certified" | "expired";
    reviewDate: string | null;
    aiSummary: string | null;
    aiSummaryAt: Date | null;
  }>,
  exec: Executor = db
): Promise<void> {
  await exec
    .update(frameworks)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(frameworks.id, id));
}

export async function deleteFramework(
  orgId: string,
  id: string,
  exec: Executor = db
): Promise<void> {
  await exec
    .delete(frameworks)
    .where(and(eq(frameworks.organizationId, orgId), eq(frameworks.id, id)));
}
