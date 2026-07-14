import { and, eq, desc, isNull, count } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { gapAnalysis } from "@/lib/db/schema";
import type { GapAnalysisRow } from "@/lib/db/schema";

export type NewGap = {
  organizationId: string;
  frameworkId: string;
  gapType: string;
  controlId?: string | null;
  evidenceId?: string | null;
  description: string;
  severity?: string;
  isAiDetected?: boolean;
};

export async function insertGap(
  values: NewGap,
  exec: Executor = db
): Promise<{ id: string }> {
  const [row] = await exec
    .insert(gapAnalysis)
    .values(values)
    .returning({ id: gapAnalysis.id });
  return row;
}

/** Bulk insert gaps — replaces all unresolved gaps for a framework run. */
export async function bulkInsertGaps(
  values: NewGap[],
  exec: Executor = db
): Promise<void> {
  if (values.length === 0) return;
  await exec.insert(gapAnalysis).values(values);
}

export async function findByFramework(
  orgId: string,
  frameworkId: string,
  includeResolved = false
): Promise<GapAnalysisRow[]> {
  const conditions = [
    eq(gapAnalysis.organizationId, orgId),
    eq(gapAnalysis.frameworkId, frameworkId),
  ];
  if (!includeResolved) conditions.push(isNull(gapAnalysis.resolvedAt));
  return db
    .select()
    .from(gapAnalysis)
    .where(and(...conditions))
    .orderBy(desc(gapAnalysis.createdAt));
}

export async function findByOrg(
  orgId: string,
  includeResolved = false
): Promise<GapAnalysisRow[]> {
  const conditions = [eq(gapAnalysis.organizationId, orgId)];
  if (!includeResolved) conditions.push(isNull(gapAnalysis.resolvedAt));
  return db
    .select()
    .from(gapAnalysis)
    .where(and(...conditions))
    .orderBy(desc(gapAnalysis.createdAt));
}

export async function resolveGap(
  orgId: string,
  id: string,
  exec: Executor = db
): Promise<void> {
  await exec
    .update(gapAnalysis)
    .set({ resolvedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(gapAnalysis.organizationId, orgId), eq(gapAnalysis.id, id)));
}

/** Delete all unresolved gaps for a framework before re-running analysis. */
export async function deleteUnresolvedByFramework(
  orgId: string,
  frameworkId: string,
  exec: Executor = db
): Promise<void> {
  await exec
    .delete(gapAnalysis)
    .where(
      and(
        eq(gapAnalysis.organizationId, orgId),
        eq(gapAnalysis.frameworkId, frameworkId),
        isNull(gapAnalysis.resolvedAt)
      )
    );
}

/** Count open gaps by severity — used for dashboard widgets. */
export async function countBySeverity(
  orgId: string,
  frameworkId?: string
): Promise<{ severity: string; n: number }[]> {
  const conditions = [
    eq(gapAnalysis.organizationId, orgId),
    isNull(gapAnalysis.resolvedAt),
  ];
  if (frameworkId) conditions.push(eq(gapAnalysis.frameworkId, frameworkId));
  const rows = await db
    .select({ severity: gapAnalysis.severity, n: count() })
    .from(gapAnalysis)
    .where(and(...conditions))
    .groupBy(gapAnalysis.severity);
  return rows.map((r) => ({ severity: r.severity, n: Number(r.n) }));
}
