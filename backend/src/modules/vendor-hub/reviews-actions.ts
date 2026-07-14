"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as reviewService from "@/backend/src/modules/vendor-hub/review-service";

export type ReviewState = { error?: string; ok?: boolean } | undefined;

export async function createVendorReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const vendorId = String(formData.get("vendorId") || "");
  try {
    await reviewService.createReview({
      orgId: session.org.id, actorId: session.id, vendorId,
      reviewType: String(formData.get("reviewType") || "annual"),
      summary: String(formData.get("summary") || "") || null,
      nextReviewAt: String(formData.get("nextReviewAt") || "") || null,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not create review." };
  }
  revalidatePath(`/vendors/${vendorId}`);
  return { ok: true };
}

export async function changeReviewStatus(reviewId: string, vendorId: string, status: string): Promise<ReviewState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available." };
  try {
    await reviewService.updateReviewStatus({ orgId: session.org.id, actorId: session.id, reviewId, status, vendorId });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update review." };
  }
  revalidatePath(`/vendors/${vendorId}`);
  return { ok: true };
}
