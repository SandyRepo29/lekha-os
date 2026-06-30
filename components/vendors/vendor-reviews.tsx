"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, ChevronDown, CheckCircle2 } from "lucide-react";
import { createVendorReview, changeReviewStatus, type ReviewState } from "@/lib/reviews/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import type { VendorReview } from "@/lib/db/schema";

const STATUS_STYLES: Record<string, string> = {
  pending:        "text-[var(--color-blue)] bg-[var(--color-blue)]/10 border-[var(--color-blue)]/30",
  approved:       "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  rejected:       "text-red-400 bg-red-500/10 border-red-500/30",
  needs_followup: "text-amber-400 bg-amber-500/10 border-amber-500/30",
};

const TYPE_LABELS: Record<string, string> = {
  annual: "Annual Review", quarterly: "Quarterly Review",
  security: "Security Review", compliance: "Compliance Review",
};

function ReviewRow({ review, vendorId }: { review: VendorReview; vendorId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const nextStatuses = review.status === "pending" ? ["approved", "rejected", "needs_followup"] : [];

  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-[var(--color-line)] last:border-0">
      <ClipboardCheck className="h-4 w-4 mt-0.5 shrink-0 text-[var(--color-ink-faint)]" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{TYPE_LABELS[review.reviewType] ?? review.reviewType}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[review.status] ?? ""}`}>
            {review.status.replace("_", " ")}
          </span>
        </div>
        {review.summary && <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">{review.summary}</p>}
        <div className="flex gap-3 text-xs text-[var(--color-ink-faint)] mt-0.5">
          <span>{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          {review.nextReviewAt && <span>Next: {review.nextReviewAt}</span>}
        </div>
      </div>
      {nextStatuses.length > 0 && (
        <div className="relative">
          <button onClick={() => setOpen(!open)} disabled={pending}
            className="flex items-center gap-1 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] border border-[var(--color-line)] rounded-lg px-2 py-1.5 transition-colors">
            Update <ChevronDown className="h-3 w-3" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-8 z-20 min-w-[150px] rounded-xl border border-[var(--color-line-strong)] bg-[#0d0f1a] shadow-xl overflow-hidden">
                {nextStatuses.map((s) => (
                  <button key={s} onClick={() => { setOpen(false); start(async () => { await changeReviewStatus(review.id, vendorId, s); router.refresh(); }); }}
                    className="w-full text-left px-3 py-2.5 text-sm capitalize text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]">
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function NewReviewForm({ vendorId }: { vendorId: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(createVendorReview, undefined);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm text-[var(--color-blue)] hover:underline mt-2">
        <ClipboardCheck className="h-3.5 w-3.5" /> Log a review
      </button>
    );
  }

  return (
    <form action={action} className="mt-3 space-y-3 rounded-xl border border-[var(--color-line)] p-4">
      <input type="hidden" name="vendorId" value={vendorId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="reviewType">Review type</Label>
          <Select id="reviewType" name="reviewType" defaultValue="annual">
            <SelectOption value="annual">Annual Review</SelectOption>
            <SelectOption value="quarterly">Quarterly Review</SelectOption>
            <SelectOption value="security">Security Review</SelectOption>
            <SelectOption value="compliance">Compliance Review</SelectOption>
          </Select>
        </div>
        <div>
          <Label htmlFor="nextReviewAt">Next review date</Label>
          <Input id="nextReviewAt" name="nextReviewAt" type="date" />
        </div>
      </div>
      <div>
        <Label htmlFor="summary">Summary / notes</Label>
        <Input id="summary" name="summary" placeholder="Key findings and actions…" />
      </div>
      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state?.ok && <p className="flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Review logged.</p>}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>{pending ? "Saving…" : "Log review"}</Button>
        <Button type="button" variant="subtle" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

export function VendorReviews({ reviews, vendorId }: { reviews: VendorReview[]; vendorId: string }) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold text-[var(--color-ink)]">Reviews ({reviews.length})</span>
      {reviews.length > 0 && (
        <div>{reviews.map((r) => <ReviewRow key={r.id} review={r} vendorId={vendorId} />)}</div>
      )}
      {reviews.length === 0 && <p className="text-xs text-[var(--color-ink-faint)]">No reviews logged yet.</p>}
      <NewReviewForm vendorId={vendorId} />
    </div>
  );
}
