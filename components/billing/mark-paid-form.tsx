"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markInvoicePaidAction } from "@/lib/billing/actions";

export function MarkPaidForm({ invoiceId }: { invoiceId: string }) {
  const [open, setOpen] = useState(false);
  const [ref, setRef] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("invoiceId", invoiceId);
    fd.set("paymentReference", ref);
    startTransition(async () => {
      const res = await markInvoicePaidAction(fd);
      if ("error" in res && res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
      >
        Mark Paid
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        placeholder="UTR / reference"
        required
        className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500 w-36"
      />
      <button
        type="submit"
        disabled={isPending || !ref}
        className="text-xs px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors"
      >
        {isPending ? "…" : "Confirm"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-white/30 hover:text-white">✕</button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </form>
  );
}
