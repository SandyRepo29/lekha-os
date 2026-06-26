"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import { createRenewalAssessment } from "@/lib/services/vendor-lifecycle/renewal-service";
import { transitionVendor, getVendorLifecycleState } from "@/lib/services/vendor-lifecycle/lifecycle-service";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { getVendor } from "@/lib/services/vendor-service";
import { findActiveByVendor } from "@/lib/repositories/risk-repo";
import type { RenewalRecommendation } from "@/lib/services/vendor-lifecycle/renewal-service";

export type RenewalActionState = { error?: string; ok?: boolean; recommendation?: RenewalRecommendation };

export async function startRenewalAction(
  _prev: RenewalActionState | undefined,
  formData: FormData
): Promise<RenewalActionState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const vendorId = String(formData.get("vendorId") ?? "");
  const notes    = String(formData.get("notes") ?? "").trim() || undefined;

  if (!vendorId) return { error: "Vendor ID is required." };

  try {
    const vendor = await getVendor(session.org.id, vendorId);
    if (!vendor) return { error: "Vendor not found." };

    const risks = await findActiveByVendor(session.org.id, vendorId).catch(() => []);
    const criticalRisks = risks.filter((r: any) => r.riskLevel === "critical" || r.inherentScore >= 20).length;

    const currentState = await getVendorLifecycleState(session.org.id, vendorId);
    if (!["active", "renewal_due", "under_review"].includes(currentState)) {
      return { error: "Vendor is not in a state that allows renewal." };
    }

    if (currentState !== "renewal_due" && currentState !== "renewing") {
      await transitionVendor({
        orgId:       session.org.id,
        vendorId,
        actorId:     session.id,
        actorName:   session.email ?? undefined,
        fromState:   currentState,
        toState:     "renewal_due",
        reason:      "Renewal assessment initiated",
        triggeredBy: "manual",
      });
    }

    const assessment = await createRenewalAssessment({
      orgId:     session.org.id,
      vendorId,
      actorId:   session.id,
      actorName: session.email ?? undefined,
      notes,
      aiEnabled: isGeminiConfigured(),
      inputs: {
        vendorName:      vendor.name,
        trustScore:      vendor.trustScore ?? null,
        complianceScore: vendor.complianceScore,
        openRisks:       risks.length,
        criticalRisks,
        openFindings:    0, // would need to query audit findings
        openCapas:       0, // would need to query CAPAs
        contractHealth:  null,
      },
    });

    revalidatePath(`/vendors/${vendorId}`);
    revalidatePath(`/vendors/${vendorId}/renewal`);
    return { ok: true, recommendation: assessment.recommendation as RenewalRecommendation };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("startRenewalAction failed:", err);
    return { error: "Could not create renewal assessment." };
  }
}

export async function finaliseRenewalAction(
  _prev: RenewalActionState | undefined,
  formData: FormData
): Promise<RenewalActionState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const vendorId = String(formData.get("vendorId") ?? "");
  const decision = String(formData.get("decision") ?? "") as RenewalRecommendation;

  if (!vendorId || !decision) return { error: "Missing required fields." };

  try {
    const currentState = await getVendorLifecycleState(session.org.id, vendorId);

    const toState =
      decision === "renew" || decision === "renew_with_conditions" ? "active" as const :
      decision === "offboard" ? "offboarding" as const :
      "renewal_due" as const;

    if (["active", "renewal_due", "renewing", "under_review"].includes(currentState)) {
      await transitionVendor({
        orgId:       session.org.id,
        vendorId,
        actorId:     session.id,
        actorName:   session.email ?? undefined,
        fromState:   currentState,
        toState,
        reason:      `Renewal decision: ${decision}`,
        triggeredBy: "manual",
      });
    }

    revalidatePath(`/vendors/${vendorId}`);
    return { ok: true, recommendation: decision };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not finalise renewal." };
  }
}
