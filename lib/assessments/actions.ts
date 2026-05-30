"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as assessmentService from "@/lib/services/assessment-service";

export type AssessmentState = { error?: string; ok?: boolean } | undefined;

export async function startAssessment(vendorId: string): Promise<{ id?: string; error?: string }> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    const { id } = await assessmentService.startAssessment({ orgId: session.org.id, actorId: session.id, vendorId });
    return { id };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not start assessment." };
  }
}

export async function submitAssessment(_prev: AssessmentState, formData: FormData): Promise<AssessmentState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available." };

  const assessmentId = String(formData.get("assessmentId") || "");
  const vendorId = String(formData.get("vendorId") || "");
  const complete = formData.get("complete") === "1";

  const keys = Array.from(formData.keys()).filter((k) => k.startsWith("q_"));
  const responses = keys.map((k) => ({
    questionKey: k.replace("q_", ""),
    answer: String(formData.get(k) || "na"),
    notes: String(formData.get(`n_${k.replace("q_", "")}`) || "") || null,
  }));

  try {
    await assessmentService.saveResponses({ orgId: session.org.id, actorId: session.id, assessmentId, responses, complete });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not save assessment." };
  }

  revalidatePath(`/vendors/${vendorId}`);
  if (complete) redirect(`/vendors/${vendorId}`);
  return { ok: true };
}
