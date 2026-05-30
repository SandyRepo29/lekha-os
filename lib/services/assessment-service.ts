import { db } from "@/lib/db";
import { DomainError } from "./errors";
import * as assessmentRepo from "@/lib/repositories/assessment-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";
import { STANDARD_QUESTIONS, calculateScore } from "@/lib/constants/assessment-questions";
import type { Assessment } from "@/lib/db/schema";

export type { Assessment };

export async function startAssessment(params: { orgId: string; actorId: string; vendorId: string }): Promise<{ id: string }> {
  const title = `Security Assessment — ${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`;
  return db.transaction(async (tx) => {
    const a = await assessmentRepo.createAssessment({ organizationId: params.orgId, vendorId: params.vendorId, title, conductedBy: params.actorId }, tx);
    await recordAudit({ organizationId: params.orgId, actorId: params.actorId, action: "assessment.created", entityType: "assessment", entityId: a.id, metadata: { vendorId: params.vendorId } }, tx);
    return a;
  });
}

export async function saveResponses(params: {
  orgId: string; actorId: string; assessmentId: string;
  responses: { questionKey: string; answer: string; notes?: string | null }[];
  complete: boolean;
}): Promise<void> {
  const result = await assessmentRepo.getWithResponses(params.orgId, params.assessmentId);
  if (!result) throw new DomainError("Assessment not found.");
  if (result.assessment.status === "completed") throw new DomainError("Assessment is already completed.");

  const VALID_ANSWERS = ["yes", "no", "partial", "na"];
  await db.transaction(async (tx) => {
    for (const r of params.responses) {
      if (!VALID_ANSWERS.includes(r.answer)) continue;
      await assessmentRepo.upsertResponse(params.assessmentId, r.questionKey, r.answer as "yes" | "no" | "partial" | "na", r.notes ?? null, tx);
    }
    if (params.complete) {
      const respMap = new Map(params.responses.map((r) => [r.questionKey, r.answer]));
      const score = calculateScore(respMap);
      await assessmentRepo.completeAssessment(params.assessmentId, score, tx);
      await recordAudit({ organizationId: params.orgId, actorId: params.actorId, action: "assessment.completed", entityType: "assessment", entityId: params.assessmentId, metadata: { score } }, tx);
    }
  });
}

export async function listAssessments(orgId: string, vendorId: string): Promise<Assessment[]> {
  return assessmentRepo.listByVendor(orgId, vendorId);
}

export async function getAssessment(orgId: string, id: string) {
  return assessmentRepo.getWithResponses(orgId, id);
}
