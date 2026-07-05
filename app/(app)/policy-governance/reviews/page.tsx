export const dynamic = "force-dynamic";

import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { policyReviews, policies, profiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { cn } from "@/lib/utils";

const OUTCOME_STYLES: Record<string, string> = {
  approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  changes_required: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  rejected: "text-red-400 bg-red-500/10 border-red-500/20",
  expired: "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

const OUTCOME_LABELS: Record<string, string> = {
  approved: "Approved",
  changes_required: "Changes Required",
  rejected: "Rejected",
  expired: "Expired",
};

function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function isDueSoon(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 30;
}

export default async function PolicyReviewsPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={ClipboardCheck} title="Policy Reviews" description="Connect Supabase to view reviews." />
      </Card>
    );
  }

  const reviews = await db
    .select({
      review: policyReviews,
      policyName: policies.name,
      policyId: policies.id,
      reviewerName: profiles.fullName,
    })
    .from(policyReviews)
    .leftJoin(policies, eq(policyReviews.policyId, policies.id))
    .leftJoin(profiles, eq(policyReviews.reviewerId, profiles.id))
    .where(eq(policyReviews.organizationId, session.org.id))
    .orderBy(desc(policyReviews.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Policy Reviews</h2>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">{reviews.length} review{reviews.length !== 1 ? "s" : ""} recorded</p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <EmptyState icon={ClipboardCheck} title="No reviews yet" description="Reviews are added from individual policy pages." />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-white">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Policy</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Reviewer</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Outcome</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Review Date</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Next Review</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {reviews.map(({ review, policyName, policyId, reviewerName }) => {
                  const overdue = isOverdue(review.nextReviewDate);
                  const dueSoon = !overdue && isDueSoon(review.nextReviewDate);
                  return (
                    <tr key={review.id} className="hover:bg-white transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/policy-governance/${policyId}?tab=reviews`} className="font-medium hover:text-indigo-400 transition-colors">
                          {policyName ?? "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-ink-dim)]">{reviewerName ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          OUTCOME_STYLES[review.outcome] ?? "text-[var(--color-ink-dim)] bg-white/5 border-white/10"
                        )}>
                          {OUTCOME_LABELS[review.outcome] ?? review.outcome.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-ink-dim)]">{review.reviewDate}</td>
                      <td className={cn(
                        "px-4 py-3 text-sm font-medium",
                        overdue ? "text-red-400" : dueSoon ? "text-amber-400" : "text-[var(--color-ink-dim)]"
                      )}>
                        {review.nextReviewDate ?? "—"}
                        {overdue && <span className="ml-1.5 text-xs font-semibold">(Overdue)</span>}
                        {dueSoon && <span className="ml-1.5 text-xs font-semibold">(Due Soon)</span>}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-ink-dim)] max-w-xs truncate">{review.notes ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
