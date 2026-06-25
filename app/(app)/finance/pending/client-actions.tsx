"use client";

// ─── Client components for Pending Verification page ─────────────────────────
// VerifyButton, RejectButton, AddNotesButton
// Each uses useTransition + router.refresh() to avoid full navigation.

import { useTransition, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, StickyNote, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Stub server actions (replace with real DB-backed actions when schema exists) ──

async function verifyPaymentAction(transactionId: string): Promise<{ ok: boolean; error?: string }> {
  // TODO: implement real DB update
  await new Promise((r) => setTimeout(r, 800));
  console.log("Verified payment:", transactionId);
  return { ok: true };
}

async function rejectPaymentAction(
  transactionId: string,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  // TODO: implement real DB update
  await new Promise((r) => setTimeout(r, 600));
  console.log("Rejected payment:", transactionId, "reason:", reason);
  return { ok: true };
}

async function addPaymentNoteAction(
  transactionId: string,
  note: string
): Promise<{ ok: boolean; error?: string }> {
  // TODO: implement real DB update
  await new Promise((r) => setTimeout(r, 500));
  console.log("Added note for:", transactionId, "note:", note);
  return { ok: true };
}

// ─── VerifyButton ─────────────────────────────────────────────────────────────

export function VerifyButton({
  transactionId,
  orgName,
}: {
  transactionId: string;
  orgName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleVerify() {
    setError(null);
    startTransition(async () => {
      const result = await verifyPaymentAction(transactionId);
      if (result.ok) {
        setDone(true);
        router.refresh();
      } else {
        setError(result.error ?? "Verification failed. Please try again.");
      }
    });
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400">
        <CheckCircle2 className="h-4 w-4" />
        Verified
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleVerify}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-60 transition-colors"
        title={`Verify payment from ${orgName}`}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        {isPending ? "Verifying..." : "Verify Payment"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── RejectButton ─────────────────────────────────────────────────────────────

export function RejectButton({
  transactionId,
  orgName,
}: {
  transactionId: string;
  orgName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleToggle() {
    setOpen((v) => !v);
    setError(null);
    if (!open) setTimeout(() => textareaRef.current?.focus(), 80);
  }

  function handleReject() {
    if (!reason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await rejectPaymentAction(transactionId, reason.trim());
      if (result.ok) {
        setDone(true);
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "Rejection failed. Please try again.");
      }
    });
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400">
        <XCircle className="h-4 w-4" />
        Rejected
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleToggle}
        className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/5 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
        title={`Reject payment from ${orgName}`}
      >
        <XCircle className="h-4 w-4" />
        Reject
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="w-72 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface,#0f0f1a)] p-3 shadow-lg">
          <p className="mb-2 text-xs font-medium text-[var(--color-ink-dim)]">
            Reason for rejection
          </p>
          <textarea
            ref={textareaRef}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. UTR not found in bank statement, amount mismatch..."
            rows={3}
            className="w-full resize-none rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] focus:border-red-500/50 focus:outline-none"
          />
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => { setOpen(false); setReason(""); setError(null); }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60 transition-colors"
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {isPending ? "Rejecting..." : "Confirm Reject"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AddNotesButton ───────────────────────────────────────────────────────────

export function AddNotesButton({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleToggle() {
    setOpen((v) => !v);
    setSaved(false);
    setError(null);
    if (!open) setTimeout(() => textareaRef.current?.focus(), 80);
  }

  function handleSave() {
    if (!note.trim()) {
      setError("Note cannot be empty.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addPaymentNoteAction(transactionId, note.trim());
      if (result.ok) {
        setSaved(true);
        setNote("");
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "Could not save note. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleToggle}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line-strong)] bg-white/[0.04] px-4 py-2 text-sm font-medium text-[var(--color-ink-dim)] hover:bg-white/[0.08] hover:text-[var(--color-ink)] transition-colors"
        title="Add internal note"
      >
        <StickyNote className="h-4 w-4" />
        Add Notes
        {saved && (
          <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-400">
            Saved
          </span>
        )}
      </button>

      {open && (
        <div className="w-72 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface,#0f0f1a)] p-3 shadow-lg">
          <p className="mb-2 text-xs font-medium text-[var(--color-ink-dim)]">
            Internal note (not visible to customer)
          </p>
          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Checked bank statement — transfer visible, pending 2-day settlement..."
            rows={3}
            className="w-full resize-none rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] focus:border-[var(--color-blue)]/50 focus:outline-none"
          />
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => { setOpen(false); setNote(""); setError(null); }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {isPending ? "Saving..." : "Save Note"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
