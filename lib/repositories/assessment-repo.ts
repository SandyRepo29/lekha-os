import { eq, and, desc, isNull, isNotNull, sql } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { assessments, assessmentResponses } from "@/lib/db/schema";
import type { Assessment, AssessmentResponse } from "@/lib/db/schema";

export async function createAssessment(values: { organizationId: string; vendorId: string; title: string; conductedBy: string }, exec: Executor = db): Promise<{ id: string }> {
  const [row] = await exec.insert(assessments).values(values).returning({ id: assessments.id });
  return row;
}

export async function listByVendor(orgId: string, vendorId: string): Promise<Assessment[]> {
  return db.select().from(assessments).where(and(eq(assessments.organizationId, orgId), eq(assessments.vendorId, vendorId), isNull(assessments.deletedAt))).orderBy(desc(assessments.createdAt));
}

export async function getWithResponses(orgId: string, id: string): Promise<{ assessment: Assessment; responses: AssessmentResponse[] } | null> {
  const [a] = await db.select().from(assessments).where(and(eq(assessments.organizationId, orgId), eq(assessments.id, id), isNull(assessments.deletedAt))).limit(1);
  if (!a) return null;
  const resp = await db.select().from(assessmentResponses).where(eq(assessmentResponses.assessmentId, id));
  return { assessment: a, responses: resp };
}

export async function upsertResponse(assessmentId: string, questionKey: string, answer: "yes" | "no" | "partial" | "na", notes?: string | null, exec: Executor = db): Promise<void> {
  await exec.insert(assessmentResponses).values({ assessmentId, questionKey, answer, notes })
    .onConflictDoUpdate({ target: [assessmentResponses.assessmentId, assessmentResponses.questionKey], set: { answer, notes } });
}

export async function completeAssessment(id: string, score: number, exec: Executor = db): Promise<void> {
  await exec.update(assessments).set({ score, status: "completed", completedAt: new Date(), updatedAt: new Date() }).where(eq(assessments.id, id));
}

export async function softDeleteAssessment(id: string, orgId: string, exec: Executor = db): Promise<void> {
  await exec
    .update(assessments)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(assessments.id, id), eq(assessments.organizationId, orgId)));
}

export async function restoreAssessment(id: string, orgId: string, exec: Executor = db): Promise<void> {
  await exec
    .update(assessments)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(and(eq(assessments.id, id), eq(assessments.organizationId, orgId)));
}

export async function findDeletedAssessments(orgId: string): Promise<Assessment[]> {
  const since = new Date(Date.now() - 30 * 86_400_000);
  return db
    .select()
    .from(assessments)
    .where(
      and(
        eq(assessments.organizationId, orgId),
        isNotNull(assessments.deletedAt),
        sql`${assessments.deletedAt} >= ${since.toISOString()}`
      )
    )
    .orderBy(desc(assessments.deletedAt));
}
