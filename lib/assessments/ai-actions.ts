"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { generateAssessmentSummary } from "@/lib/services/ai-insights-service";

export type AISummaryState = { error?: string; ok?: boolean; data?: string } | undefined;

export async function refreshAssessmentSummary(
  assessmentId: string,
  vendorId: string
): Promise<AISummaryState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    const data = await generateAssessmentSummary(session.org.id, assessmentId);
    revalidatePath(`/vendors/${vendorId}/assessment`);
    revalidatePath(`/vendors/${vendorId}`);
    return { ok: true, data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Generation failed." };
  }
}
