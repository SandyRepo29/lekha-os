"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { changePlanAction, extendTrialAction } from "@/lib/platform-admin/actions";

export function ChangePlanSelect({
  orgId,
  currentPlanId,
  plans,
}: {
  orgId: string;
  currentPlanId: string | null;
  plans: Array<{ id: string; name: string; price_monthly: number | null }>;
}) {
  const [selected, setSelected] = useState(currentPlanId ?? "");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selected}
        onChange={(e) => { setSelected(e.target.value); setOk(false); }}
        className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white min-w-[180px]"
      >
        <option value="">Select plan…</option>
        {plans.map((p) => (
          <option key={p.id as string} value={p.id as string}>
            {p.name as string}{p.price_monthly ? ` — $${Number(p.price_monthly).toLocaleString("en-US")}/mo` : ""}
          </option>
        ))}
      </select>
      <button
        onClick={() => {
          if (!selected) return;
          setErr(""); setOk(false);
          startTransition(async () => {
            const res = await changePlanAction(orgId, selected);
            if (res.error) setErr(res.error);
            else { setOk(true); router.refresh(); }
          });
        }}
        disabled={pending || !selected || selected === currentPlanId}
        className="rounded-lg bg-[#007A94] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        {pending ? "Saving…" : "Change Plan"}
      </button>
      {ok && <span className="text-xs text-emerald-400">✓ Plan updated</span>}
      {err && <span className="text-xs text-red-400">{err}</span>}
    </div>
  );
}

export function ExtendTrialButton({ orgId }: { orgId: string }) {
  const [days, setDays] = useState("14");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        value={days}
        min={1}
        max={365}
        onChange={(e) => { setDays(e.target.value); setOk(false); }}
        className="w-20 rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white text-center"
      />
      <span className="text-xs text-white/40">days</span>
      <button
        onClick={() => {
          setErr(""); setOk(false);
          startTransition(async () => {
            const res = await extendTrialAction(orgId, Number(days));
            if (res.error) setErr(res.error);
            else { setOk(true); router.refresh(); }
          });
        }}
        disabled={pending || Number(days) < 1}
        className="rounded-lg border border-[#007A94]/40 bg-[#007A94]/10 px-4 py-2 text-sm font-medium text-[#00B8D9] hover:bg-[#007A94]/20 disabled:opacity-40 transition-colors"
      >
        {pending ? "Extending…" : "Extend Trial"}
      </button>
      {ok && <span className="text-xs text-emerald-400">✓ Trial extended</span>}
      {err && <span className="text-xs text-red-400">{err}</span>}
    </div>
  );
}
