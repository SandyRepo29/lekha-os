import { eq, and, desc } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { vendorReviews } from "@/lib/db/schema";
import type { VendorReview } from "@/lib/db/schema";

export type ReviewType = "annual" | "quarterly" | "security" | "compliance";
export type ReviewStatus = "pending" | "approved" | "rejected" | "needs_followup";

export async function createReview(values: {
  organizationId: string; vendorId: string; reviewType: ReviewType;
  reviewedBy: string; summary?: string | null; nextReviewAt?: string | null;
}, exec: Executor = db): Promise<{ id: string }> {
  const [row] = await exec.insert(vendorReviews).values(values).returning({ id: vendorReviews.id });
  return row;
}

export async function updateStatus(id: string, status: ReviewStatus, exec: Executor = db): Promise<void> {
  await exec.update(vendorReviews).set({ status, updatedAt: new Date() }).where(eq(vendorReviews.id, id));
}

export async function listByVendor(orgId: string, vendorId: string): Promise<VendorReview[]> {
  return db.select().from(vendorReviews)
    .where(and(eq(vendorReviews.organizationId, orgId), eq(vendorReviews.vendorId, vendorId)))
    .orderBy(desc(vendorReviews.createdAt));
}
