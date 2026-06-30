"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  invoiceId: string;
}

async function rejectPaymentAction(invoiceId: string, reason: string) {
  const res = await fetch("/api/finance/transactions/reject", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId, reason }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to reject payment");
  }
}

export default function RejectPaymentForm({ invoiceId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleReject() {
    if (!reason.trim()) {
      setError("Rejection reason is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await rejectPaymentAction(invoiceId, reason.trim());
        setSuccess(true);
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Rejection failed.");
      }
    });
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
        <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <span className="text-sm font-medium text-red-300">Payment marked as rejected</span>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/20 transition-colors"
      >
        Reject Payment
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/[0.07] p-4 space-y-3">
      <p className="text-sm font-medium text-red-300">Reject this payment</p>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-red-300/70 uppercase tracking-wide">
          Rejection Reason <span className="text-red-400">*</span>
        </label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError(null);
          }}
          placeholder="e.g. UTR not found in bank records, amount mismatch..."
          className="w-full resize-none rounded-xl border border-red-500/30 bg-[#F8F9FB] px-3 py-2 text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-dim)] focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleReject}
          disabled={isPending}
          className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Rejecting..." : "Confirm Rejection"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setReason("");
            setError(null);
          }}
          disabled={isPending}
          className="rounded-xl border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
