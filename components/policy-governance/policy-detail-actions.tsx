"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  publishPolicyAction,
  retirePolicyAction,
  deletePolicyAction,
  computeHealthAction,
  addReviewAction,
} from "@/lib/policy-governance/actions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Archive, Trash2, Activity, ClipboardCheck } from "lucide-react";

interface PolicyDetailActionsProps {
  policyId: string;
  status: string;
}

export function PolicyDetailActions({ policyId, status }: PolicyDetailActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewOutcome, setReviewOutcome] = useState("approved");
  const [reviewNotes, setReviewNotes] = useState("");
  const [nextReviewDate, setNextReviewDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handlePublish() {
    startTransition(async () => {
      const result = await publishPolicyAction(policyId);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleRetire() {
    if (!confirm("Retire this policy? It will no longer be active.")) return;
    startTransition(async () => {
      await retirePolicyAction(policyId);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Delete this policy? This cannot be undone.")) return;
    startTransition(async () => {
      await deletePolicyAction(policyId);
      router.push("/policy-governance/library");
    });
  }

  function handleComputeHealth() {
    startTransition(async () => {
      await computeHealthAction(policyId);
      router.refresh();
    });
  }

  async function handleAddReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("policyId", policyId);
    fd.set("outcome", reviewOutcome);
    fd.set("notes", reviewNotes);
    fd.set("nextReviewDate", nextReviewDate);
    startTransition(async () => {
      const result = await addReviewAction(undefined, fd);
      if (result?.error) setError(result.error);
      else {
        setShowReviewForm(false);
        router.refresh();
      }
    });
  }

  const canPublish = ["draft", "approved", "review"].includes(status);
  const canRetire = !["retired", "archived"].includes(status);

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {canPublish && (
          <Button size="sm" onClick={handlePublish} disabled={pending}>
            <CheckCircle2 className="h-4 w-4" /> Publish
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={handleComputeHealth} disabled={pending}>
          <Activity className="h-4 w-4" /> Health Score
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowReviewForm(!showReviewForm)} disabled={pending}>
          <ClipboardCheck className="h-4 w-4" /> Add Review
        </Button>
        {canRetire && (
          <Button size="sm" variant="outline" onClick={handleRetire} disabled={pending}>
            <Archive className="h-4 w-4" /> Retire
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={handleDelete} disabled={pending} className="text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/50">
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>

      {showReviewForm && (
        <form onSubmit={handleAddReview} className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-4 space-y-3">
          <h4 className="text-sm font-semibold">Add Review</h4>
          <div>
            <label className="mb-1 block text-xs text-[var(--color-ink-dim)]">Outcome</label>
            <select
              value={reviewOutcome}
              onChange={(e) => setReviewOutcome(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm"
            >
              <option value="approved">Approved</option>
              <option value="changes_required">Changes Required</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--color-ink-dim)]">Notes</label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm resize-none"
              placeholder="Review notes…"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--color-ink-dim)]">Next Review Date</label>
            <input
              type="date"
              value={nextReviewDate}
              onChange={(e) => setNextReviewDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowReviewForm(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={pending}>Save Review</Button>
          </div>
        </form>
      )}
    </div>
  );
}
