"use client";

import { useState, useTransition } from "react";
import { cancelSubscriptionAction } from "@/lib/billing/actions";

const REASONS = [
  "Too expensive",
  "Missing features I need",
  "Switching to another product",
  "Not using it enough",
  "Technical issues",
  "Other",
];

export function CancelModal({ periodEnd }: { periodEnd: Date | null }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const periodStr = periodEnd
    ? new Date(periodEnd).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "end of billing period";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await cancelSubscriptionAction(fd);
      if ("error" in res && res.error) {
        setError(res.error);
      } else {
        setDone(true);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setDone(false); setError(null); }}
        className="text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-2"
      >
        Cancel subscription
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0e0f1a] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/08">
              <h2 className="font-semibold text-base">Cancel Subscription</h2>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white text-xl leading-none">×</button>
            </div>

            {done ? (
              <div className="p-6">
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-amber-300 text-sm mb-4">
                  Your subscription is scheduled for cancellation. You&apos;ll have full access until <strong>{periodStr}</strong>.
                </div>
                <button onClick={() => setOpen(false)} className="w-full py-2 rounded-lg bg-white/8 hover:bg-white/12 text-white text-sm font-semibold transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <p className="text-sm text-white/60">
                  You&apos;ll keep full access until <strong className="text-white/80">{periodStr}</strong>. After that your account will be downgraded.
                </p>

                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Reason for cancelling</label>
                  <select
                    name="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 rounded-lg bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  {isPending ? "Cancelling…" : "Confirm Cancellation"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="w-full py-2 rounded-lg text-white/40 hover:text-white text-sm transition-colors">
                  Keep my subscription
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
