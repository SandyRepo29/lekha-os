import { eq, and, desc } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { assessments, assessmentResponses } from "@/lib/db/schema";
import type { Assessment, AssessmentResponse } from "@/lib/db/schema";

export async function createAssessment(values: { organizationId: string; vendorId: string; title: string; conductedBy: string }, exec: Executor = db): Promise<{ id: string }> {
  const [row] = await exec.insert(assessments).values(values).returning({ id: assessments.id });
  return row;
}

export async function listByVendor(orgId: string, vendorId: string): Promise<Assessment[]> {
  return db.select().from(assessments).where(and(eq(assessments.organizationId, orgId), eq(assessments.vendorId, vendorId))).orderBy(desc(assessments.createdAt));
}

export async function getWithResponses(orgId: string, id: string): Promise<{ assessment: Assessment; responses: AssessmentResponse[] } | null> {
  const [a] = await db.select().from(assessments).where(and(eq(assessments.organizationId, orgId), eq(assessments.id, id))).limit(1);
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
