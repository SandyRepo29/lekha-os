import { and, eq } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { readinessScores } from "@/lib/db/schema";
import type { ReadinessScore } from "@/lib/db/schema";

export type ReadinessValues = {
  organizationId: string;
  frameworkId: string;
  overallScore: number;
  controlCoverage: number;
  evidenceCoverage: number;
  policyCoverage: number;
};

/** Insert or update the readiness score for a framework (upsert on org+framework). */
export async function upsertScore(
  values: ReadinessValues,
  exec: Executor = db
): Promise<void> {
  await exec
    .insert(readinessScores)
    .values({ ...values, computedAt: new Date() })
    .onConflictDoUpdate({
      target: [readinessScores.organizationId, readinessScores.frameworkId],
      set: {
        overallScore: values.overallScore,
        controlCoverage: values.controlCoverage,
        evidenceCoverage: values.evidenceCoverage,
        policyCoverage: values.policyCoverage,
        computedAt: new Date(),
      },
    });
}

export async function findByFramework(
  orgId: string,
  frameworkId: string
): Promise<ReadinessScore | null> {
  const [row] = await db
    .select()
    .from(readinessScores)
    .where(
      and(
        eq(readinessScores.organizationId, orgId),
        eq(readinessScores.frameworkId, frameworkId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function findAllByOrg(orgId: string): Promise<ReadinessScore[]> {
  return db
    .select()
    .from(readinessScores)
    .where(eq(readinessScores.organizationId, orgId));
}
