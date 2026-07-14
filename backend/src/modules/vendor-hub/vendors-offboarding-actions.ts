"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import { initiateOffboarding, completeStep } from "@/backend/src/modules/vendor-hub/offboarding-service";
import { transitionVendor, getVendorLifecycleState } from "@/backend/src/modules/vendor-hub/lifecycle-service";
import type { OffboardingStep } from "@/backend/src/modules/vendor-hub/offboarding-service";

export type OffboardingActionState = { error?: string; ok?: boolean };

export async function initiateOffboardingAction(
  _prev: OffboardingActionState | undefined,
  formData: FormData
): Promise<OffboardingActionState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const vendorId   = String(formData.get("vendorId") ?? "");
  const reason     = String(formData.get("reason") ?? "").trim() || undefined;
  const targetDate = String(formData.get("targetDate") ?? "").trim();

  if (!vendorId) return { error: "Vendor ID is required." };

  try {
    const currentState = await getVendorLifecycleState(session.org.id, vendorId);
    await transitionVendor({
      orgId:       session.org.id,
      vendorId,
      actorId:     session.id,
      actorName:   session.email ?? undefined,
      fromState:   currentState,
      toState:     "offboarding",
      reason,
      triggeredBy: "manual",
    });

    await initiateOffboarding({
      orgId:      session.org.id,
      vendorId,
      actorId:    session.id,
      actorName:  session.email ?? undefined,
      reason,
      targetDate: targetDate ? new Date(targetDate) : undefined,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not initiate offboarding." };
  }

  revalidatePath(`/vendors/${vendorId}`);
  redirect(`/vendors/${vendorId}/offboarding`);
}

export async function completeOffboardingStepAction(
  _prev: OffboardingActionState | undefined,
  formData: FormData
): Promise<OffboardingActionState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const vendorId = String(formData.get("vendorId") ?? "");
  const step     = String(formData.get("step") ?? "") as OffboardingStep;
  const notes    = String(formData.get("notes") ?? "").trim() || undefined;

  if (!vendorId || !step) return { error: "Missing required fields." };

  try {
    await completeStep({
      orgId:     session.org.id,
      vendorId,
      step,
      actorId:   session.id,
      actorName: session.email ?? undefined,
      notes,
    });

    // If final step, transition to offboarded
    if (step === "lifecycle_updated") {
      const currentState = await getVendorLifecycleState(session.org.id, vendorId);
      if (currentState === "offboarding") {
        await transitionVendor({
          orgId:       session.org.id,
          vendorId,
          actorId:     session.id,
          actorName:   session.email ?? undefined,
          fromState:   "offboarding",
          toState:     "offboarded",
          reason:      "Offboarding checklist complete",
          triggeredBy: "manual",
        });
      }
    }
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not complete step." };
  }

  revalidatePath(`/vendors/${vendorId}/offboarding`);
  revalidatePath(`/vendors/${vendorId}`);
  return { ok: true };
}
