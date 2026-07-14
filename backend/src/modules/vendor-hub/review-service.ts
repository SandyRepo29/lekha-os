import { db } from "@/lib/db";
import { DomainError } from "@/lib/services/errors";
import * as reviewRepo from "@/backend/src/modules/vendor-hub/review-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";
import type { VendorReview } from "@/lib/db/schema";

export type { VendorReview };

const REVIEW_TYPES = ["annual", "quarterly", "security", "compliance"] as const;
const REVIEW_STATUSES = ["pending", "approved", "rejected", "needs_followup"] as const;

export async function createReview(params: {
  orgId: string; actorId: string; vendorId: string;
  reviewType: string; summary?: string | null; nextReviewAt?: string | null;
}): Promise<{ id: string }> {
  if (!REVIEW_TYPES.includes(params.reviewType as any)) throw new DomainError("Invalid review type.");
  return db.transaction(async (tx) => {
    const r = await reviewRepo.createReview({
      organizationId: params.orgId, vendorId: params.vendorId,
      reviewType: params.reviewType as "annual" | "quarterly" | "security" | "compliance",
      reviewedBy: params.actorId,
      summary: params.summary?.trim() || null,
      nextReviewAt: params.nextReviewAt || null,
    }, tx);
    await recordAudit({ organizationId: params.orgId, actorId: params.actorId, action: "review.created", entityType: "vendor_review", entityId: r.id, metadata: { vendorId: params.vendorId, type: params.reviewType } }, tx);
    return r;
  });
}

export async function updateReviewStatus(params: { orgId: string; actorId: string; reviewId: string; status: string; vendorId: string }): Promise<void> {
  if (!REVIEW_STATUSES.includes(params.status as any)) throw new DomainError("Invalid status.");
  await db.transaction(async (tx) => {
    await reviewRepo.updateStatus(params.reviewId, params.status as any, tx);
    await recordAudit({ organizationId: params.orgId, actorId: params.actorId, action: "review.status_changed", entityType: "vendor_review", entityId: params.reviewId, metadata: { status: params.status } }, tx);
  });
}

export async function listReviews(orgId: string, vendorId: string): Promise<VendorReview[]> {
  return reviewRepo.listByVendor(orgId, vendorId);
}
