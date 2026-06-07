"use client";

import { useActionState, useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, RefreshCw, PlusCircle } from "lucide-react";
import {
  deleteControlAction,
  computeHealthAction,
  addTestAction,
  deleteTestAction,
} from "@/lib/control-center/actions";
import { TestResultBadge } from "@/components/controls/control-status-badge";

// ─── Delete control ──────────────────────────────────────────────────────────

export function DeleteControlButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  function handle() {
    if (!confirm) { setConfirm(true); return; }
    startTransition(async () => {
      await deleteControlAction(id);
      router.push("/controls");
    });
  }

  return (
    <Button variant="danger" size="sm" onClick={handle} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      {confirm ? "Confirm Delete" : "Delete"}
    </Button>
  );
}

// ─── Compute health ──────────────────────────────────────────────────────────

export function ComputeHealthButton({ controlId }: { controlId: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const router = useRouter();

  function handle() {
    startTransition(async () => {
      await computeHealthAction(controlId);
      setDone(true);
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handle} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      {done ? "Recompute Health" : "Compute Health™"}
    </Button>
  );
}

// ─── Add test inline form ────────────────────────────────────────────────────

export function AddTestForm({ controlId }: { controlId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addTestAction, undefined);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PlusCircle className="h-4 w-4" /> Add Test
      </Button>
    );
  }

  return (
    <form
      action={action}
      className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-4 space-y-4 mt-4"
    >
      <input type="hidden" name="controlId" value={controlId} />
      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs text-[var(--color-ink-dim)]">Test Date *</label>
          <input
            name="testDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-blue)]/60"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--color-ink-dim)]">Result *</label>
          <select
            name="result"
            defaultValue="passed"
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-blue)]/60"
          >
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="partially_effective">Partially Effective</option>
            <option value="exception">Exception</option>
            <option value="not_tested">Not Tested</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs text-[var(--color-ink-dim)]">Tester Name</label>
          <input
            name="testerName"
            placeholder="Who ran the test?"
            className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-blue)]/60"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--color-ink-dim)]">Method</label>
          <input
            name="method"
            placeholder="How was it tested?"
            className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-blue)]/60"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-[var(--color-ink-dim)]">Comments</label>
        <textarea
          name="comments"
          rows={2}
          className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-blue)]/60 resize-none"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
          Save Test
        </Button>
      </div>
    </form>
  );
}

// ─── Delete test ─────────────────────────────────────────────────────────────

export function DeleteTestButton({ testId, controlId }: { testId: string; controlId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      onClick={() => startTransition(async () => { await deleteTestAction(testId, controlId); router.refresh(); })}
      disabled={pending}
      className="text-white/30 hover:text-red-400 transition-colors"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}
