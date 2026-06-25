"use client";

import { useState, useTransition } from "react";
import { Sparkles, Plus, CheckCircle2, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArchiveDialog } from "@/components/ui/archive-dialog";
import {
  updateRiskStatusAction,
  deleteRiskAction,
  generateRiskNarrativeAction,
  addTreatmentAction,
  completeTreatmentAction,
  addReviewAction,
} from "@/lib/risk/actions";
import type { Risk } from "@/lib/db/schema";
import { useRouter } from "next/navigation";

// ---- Status change + delete actions ----
export function RiskDetailActions({
  riskId,
  currentStatus,
  riskTitle,
}: {
  riskId: string;
  currentStatus: string;
  riskTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const transitions: { label: string; status: Risk["status"] }[] = (
    [
      { label: "Mark Open", status: "open" as const },
      { label: "Start Mitigating", status: "mitigating" as const },
      { label: "Accept Risk", status: "accepted" as const },
      { label: "Transfer Risk", status: "transferred" as const },
      { label: "Close Risk", status: "closed" as const },
      { label: "Archive", status: "archived" as const },
    ] as { label: string; status: Risk["status"] }[]
  ).filter((t) => t.status !== currentStatus);

  function handleStatus(status: Risk["status"]) {
    setOpen(false);
    startTransition(async () => {
      await updateRiskStatusAction(riskId, status);
      router.refresh();
    });
  }

  function handleDelete() {
    setOpen(false);
    setArchiveOpen(true);
  }

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative">
        <Button variant="ghost" size="sm" onClick={() => setOpen(!open)} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Update Status</span><ChevronDown className="h-3.5 w-3.5" /></>}
        </Button>
        {open && (
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] py-1 shadow-xl">
            {transitions.map((t) => (
              <button key={t.status} onClick={() => handleStatus(t.status)} className="w-full px-4 py-2 text-left text-sm hover:bg-white/[0.04] transition-colors">
                {t.label}
              </button>
            ))}
            <hr className="my-1 border-[var(--color-line)]" />
            <button onClick={handleDelete} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors">
              Delete Risk
            </button>
          </div>
        )}
      </div>
      <ArchiveDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        itemName={riskTitle}
        itemType="risk"
        onArchive={() => {
          setArchiveOpen(false);
          startTransition(async () => { await deleteRiskAction(riskId); });
        }}
        onDelete={() => {
          setArchiveOpen(false);
          startTransition(async () => { await deleteRiskAction(riskId); });
        }}
      />
    </div>
  );
}

// ---- Narrative generation ----
export function RiskNarrativeAction({ riskId }: { riskId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    await generateRiskNarrativeAction(riskId);
    setLoading(false);
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={handleGenerate}>
      {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</> : <><Sparkles className="h-3.5 w-3.5" /> Generate</>}
    </Button>
  );
}

// ---- Add treatment inline ----
export function AddTreatmentAction({ riskId }: { riskId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await addTreatmentAction(riskId, fd);
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Add Action
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input name="action" required autoFocus placeholder="Action description…" className="flex-1 rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-blue)]/60" />
      <input name="targetDate" type="date" className="rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-2 py-1.5 text-sm outline-none" />
      <Button type="submit" variant="primary" size="sm" disabled={pending}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
    </form>
  );
}

// ---- Complete treatment ----
export function CompleteTreatmentAction({ riskId, treatmentId }: { riskId: string; treatmentId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleComplete() {
    startTransition(async () => {
      await completeTreatmentAction(riskId, treatmentId);
      router.refresh();
    });
  }

  return (
    <button onClick={handleComplete} disabled={pending} className="text-xs text-emerald-400 hover:underline disabled:opacity-50">
      {pending ? "…" : "Mark done"}
    </button>
  );
}

// ---- Add review inline ----
export function AddReviewAction({ riskId }: { riskId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await addReviewAction(riskId, fd);
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Add Review
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      <input name="reviewDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-2 py-1.5 text-sm outline-none" />
      <select name="outcome" className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-2 py-1.5 text-sm outline-none">
        <option value="no_change">No Change</option>
        <option value="score_updated">Score Updated</option>
        <option value="status_changed">Status Changed</option>
        <option value="closed">Closed</option>
      </select>
      <input name="notes" placeholder="Notes…" className="flex-1 rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-1.5 text-sm outline-none" />
      <Button type="submit" variant="primary" size="sm" disabled={pending}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
    </form>
  );
}
