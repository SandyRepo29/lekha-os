"use client";

import { useRef, useState, useTransition } from "react";

type ActionFn = (fd: FormData) => Promise<{ error?: string; invoiceNumber?: string }>;

const PLANS = ["Business", "Enterprise"] as const;

type Props = {
  currentPlan: string;
  userEmail: string;
  userName: string;
  action: ActionFn;
};

export function RequestUpgradeModal({ currentPlan, userEmail, userName, action }: Props) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<string>("Business");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await action(fd);
      if ("error" in res) {
        setError(res.error ?? "Something went wrong.");
      } else {
        setSuccess(`Request submitted! Invoice ${res.invoiceNumber} will be emailed to you.`);
        formRef.current?.reset();
      }
    });
  }

  const targetPlan = PLANS.find((p) => p !== currentPlan && currentPlan === "Growth") ?? "Business";

  return (
    <>
      <button
        onClick={() => { setOpen(true); setSuccess(null); setError(null); }}
        className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
      >
        Request Upgrade to {targetPlan}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e0f1a] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/08">
              <h2 className="font-semibold text-base">Request Upgrade</h2>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white text-xl leading-none">×</button>
            </div>

            {success ? (
              <div className="p-6">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-300 text-sm mb-4">
                  {success}
                </div>
                <p className="text-sm text-white/50">
                  We&apos;ll send bank transfer details to your billing email. Once payment is received, your subscription will be activated within 24 hours.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-4 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
                <input type="hidden" name="planName" value={plan} />

                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Plan</label>
                  <div className="flex gap-2">
                    {PLANS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlan(p)}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          plan === p
                            ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                            : "border-white/10 text-white/50 hover:border-white/20"
                        }`}
                      >
                        {p}
                        {p === "Enterprise" && <span className="ml-1 text-xs opacity-60">Custom</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Billing Name *</label>
                  <input
                    name="billingName"
                    defaultValue={userName}
                    required
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                    placeholder="Company or your name"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Billing Email *</label>
                  <input
                    name="billingEmail"
                    type="email"
                    defaultValue={userEmail}
                    required
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                    placeholder="billing@yourcompany.com"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">GSTIN (optional)</label>
                  <input
                    name="billingGstin"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Message (optional)</label>
                  <textarea
                    name="message"
                    rows={2}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 resize-none"
                    placeholder="Any questions or special requirements?"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  {isPending ? "Submitting…" : "Request Invoice"}
                </button>
                <p className="text-xs text-white/30 text-center">
                  We&apos;ll send bank transfer details within 24 hours
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
