"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { extendTrialAction, changePlanAction } from "@/lib/platform-admin/actions";

export function ExtendTrialButton({ orgId }: { orgId: string }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState("14");
  const router = useRouter();

  function handle() {
    setErr("");
    startTransition(async () => {
      const res = await extendTrialAction(orgId, parseInt(days) || 14);
      if (res.error) setErr(res.error);
      else { setOpen(false); router.refresh(); }
    });
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-500/20 transition-colors">
      Extend Trial
    </button>
  );

  return (
    <div className="flex items-center gap-2">
      <select
        value={days}
        onChange={(e) => setDays(e.target.value)}
        className="rounded-lg border border-[#30363d] bg-[#161b22] px-2 py-1.5 text-xs text-white"
      >
        <option value="7">+7 days</option>
        <option value="14">+14 days</option>
        <option value="30">+30 days</option>
        <option value="60">+60 days</option>
      </select>
      <button onClick={handle} disabled={pending} className="rounded-lg bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-500/20 disabled:opacity-50">
        {pending ? "…" : "Extend"}
      </button>
      <button onClick={() => setOpen(false)} className="text-xs text-white/30 hover:text-white/60">✕</button>
      {err && <div className="text-[10px] text-red-400">{err}</div>}
    </div>
  );
}

export function ChangePlanSelect({ orgId, plans }: { orgId: string; plans: Array<{ id: string; name: string }> }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const router = useRouter();

  function handle(planId: string) {
    if (!planId) return;
    setErr("");
    startTransition(async () => {
      const res = await changePlanAction(orgId, planId);
      if (res.error) setErr(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <select
        onChange={(e) => handle(e.target.value)}
        disabled={pending}
        defaultValue=""
        className="rounded-lg border border-[#30363d] bg-[#161b22] px-2 py-1.5 text-xs text-white disabled:opacity-50"
      >
        <option value="" disabled>Change plan…</option>
        {plans.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      {err && <div className="mt-0.5 text-[10px] text-red-400">{err}</div>}
    </div>
  );
}
