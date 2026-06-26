"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import {
  transitionVendor, getVendorLifecycleState,
  type VendorState,
} from "@/lib/services/vendor-lifecycle/lifecycle-service";

export type LifecycleActionState = { error?: string; ok?: boolean };

export async function transitionVendorAction(
  _prev: LifecycleActionState | undefined,
  formData: FormData
): Promise<LifecycleActionState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const vendorId  = String(formData.get("vendorId") ?? "");
  const toState   = String(formData.get("toState") ?? "") as VendorState;
  const reason    = String(formData.get("reason") ?? "").trim() || undefined;

  if (!vendorId || !toState) return { error: "Missing required fields." };

  try {
    const currentState = await getVendorLifecycleState(session.org.id, vendorId);
    await transitionVendor({
      orgId:        session.org.id,
      vendorId,
      actorId:      session.id,
      actorName:    session.email ?? undefined,
      fromState:    currentState,
      toState,
      reason,
      triggeredBy:  "manual",
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("transitionVendor failed:", err);
    return { error: "Could not transition vendor state." };
  }

  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/vendors");
  return { ok: true };
}
