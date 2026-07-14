"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { computeAndSaveTrustScore, generateTrustNarrative } from "@/backend/src/modules/trust-score/trust-score-service";

export async function recalculateTrustScore(vendorId: string): Promise<{ score?: number; error?: string }> {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const breakdown = await computeAndSaveTrustScore(session.org.id, vendorId, "manual");
    revalidatePath(`/vendors/${vendorId}`);
    return { score: breakdown.overall };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to compute Trust Score." };
  }
}

export async function generateTrustNarrativeAction(vendorId: string): Promise<{ narrative?: string; error?: string }> {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const narrative = await generateTrustNarrative(session.org.id, vendorId);
    revalidatePath(`/vendors/${vendorId}`);
    return { narrative };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to generate narrative." };
  }
}
