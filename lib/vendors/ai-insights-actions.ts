"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import {
  generateScoreExplanation,
  generateRiskExplanation,
  generateRecommendedActions,
  type RecommendedAction,
} from "@/lib/services/ai-insights-service";

export type InsightState = { error?: string; ok?: boolean; data?: string | RecommendedAction[] } | undefined;

export async function refreshScoreExplanation(vendorId: string): Promise<InsightState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    const data = await generateScoreExplanation(session.org.id, vendorId);
    revalidatePath(`/vendors/${vendorId}`);
    return { ok: true, data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Generation failed." };
  }
}

export async function refreshRiskExplanation(
  vendorId: string,
  riskFactors: { label: string; impact: string; detail: string }[]
): Promise<InsightState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    const data = await generateRiskExplanation(session.org.id, vendorId, riskFactors);
    revalidatePath(`/vendors/${vendorId}`);
    return { ok: true, data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Generation failed." };
  }
}

export async function refreshRecommendedActions(vendorId: string): Promise<InsightState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    const data = await generateRecommendedActions(session.org.id, vendorId);
    revalidatePath(`/vendors/${vendorId}`);
    return { ok: true, data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Generation failed." };
  }
}
