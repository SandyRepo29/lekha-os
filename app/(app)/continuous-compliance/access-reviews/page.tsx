export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getAccessReviews } from "@/lib/services/continuous-compliance/continuous-compliance-service";
import { startAccessReviewAction } from "@/lib/continuous-compliance/actions";
import { Users, Plus, PlayCircle } from "lucide-react";
import { StatusBadge, CcStat, CcSubNav } from "@/components/continuous-compliance/cc-ui";

const TYPE_LABELS: Record<string, string> = {
  quarterly: "Quarterly", privileged: "Privileged", application: "Application",
  vendor: "Vendor", emergency: "Emergency", annual: "Annual",
};

const RISK_COLORS: Record<string, string> = {
  critical: "text-red-400", high: "text-orange-400", medium: "text-amber-400", low: "text-emerald-400",
};

export default async function AccessReviewsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const reviews = await getAccessReviews(orgId).catch(() => []);

  const active    = reviews.filter(r => r.status === "active").length;
  const completed = reviews.filter(r => r.status === "completed").length;
  const overdue   = reviews.filter(r => r.status === "overdue").length;

  return (
    <div className="space-y-6 p-6">
      <CcSubNav />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Access Review Manager™</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">Enterprise access certification campaigns</p>
        </div>
        <Link
          href="/continuous-compliance/access-reviews/new"
          className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New Campaign
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <CcStat label="Active"    value={active}    accent="blue" />
        <CcStat label="Completed" value={completed} accent="good" />
        <CcStat label="Overdue"   value={overdue}   accent={overdue > 0 ? "danger" : "neutral"} />
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06]">
                    <Users className="h-4 w-4 text-[var(--color-blue)]" />
                  </span>
                  <div>
                    <div className="font-semibold text-sm">{review.name}</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-[var(--color-ink-dim)]">{TYPE_LABELS[review.campaignType] ?? review.campaignType}</span>
                      <span className="text-[var(--color-ink-faint)]">·</span>
                      <span className={`text-xs font-medium ${RISK_COLORS[review.riskLevel] ?? "text-[var(--color-ink-dim)]"}`}>
                        {review.riskLevel} risk
                      </span>
                    </div>
                    {review.description && <p className="mt-1 text-xs text-[var(--color-ink-faint)]">{review.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={review.status} />
                  {review.status === "draft" && (
                    <form action={async () => { "use server"; await startAccessReviewAction(review.id); }}>
                      <button type="submit"
                        className="flex items-center gap-1.5 rounded-lg bg-[var(--color-blue)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-blue)] hover:bg-[var(--color-blue)]/20">
                        <PlayCircle className="h-3.5 w-3.5" /> Start
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3 text-center">
                <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                  <div className="text-sm font-semibold">{review.totalUsers}</div>
                  <div className="text-[10px] text-[var(--color-ink-faint)]">Total Users</div>
                </div>
                <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                  <div className="text-sm font-semibold">{review.reviewedUsers}</div>
                  <div className="text-[10px] text-[var(--color-ink-faint)]">Reviewed</div>
                </div>
                <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                  <div className="text-sm font-semibold text-emerald-400">{review.approvedCount}</div>
                  <div className="text-[10px] text-[var(--color-ink-faint)]">Approved</div>
                </div>
                <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                  <div className="text-sm font-semibold text-red-400">{review.revokedCount}</div>
                  <div className="text-[10px] text-[var(--color-ink-faint)]">Revoked</div>
                </div>
              </div>

              {review.dueDate && (
                <div className="mt-3 text-[11px] text-[var(--color-ink-faint)]">
                  Due: {new Date(review.dueDate).toLocaleDateString()}
                  {review.completionRate > 0 && ` · ${review.completionRate}% complete`}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-10 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-[var(--color-ink-faint)] opacity-40" />
          <p className="text-sm text-[var(--color-ink-dim)]">No access review campaigns yet.</p>
          <Link href="/continuous-compliance/access-reviews/new"
            className="mt-3 inline-flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Create Campaign
          </Link>
        </div>
      )}
    </div>
  );
}
