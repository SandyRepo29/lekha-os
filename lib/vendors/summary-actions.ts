"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { generateVendorSummary } from "@/lib/services/ai-summary-service";

export async function refreshVendorSummary(vendorId: string): Promise<{ ok?: boolean; error?: string }> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const summary = await generateVendorSummary(session.org.id, vendorId);
    if (!summary) return { error: "AI extraction is not configured or no data available." };
    revalidatePath(`/vendors/${vendorId}`);
    return { ok: true };
  } catch (err) {
    console.error("refreshVendorSummary failed:", err);
    return { error: "Could not generate summary." };
  }
}
