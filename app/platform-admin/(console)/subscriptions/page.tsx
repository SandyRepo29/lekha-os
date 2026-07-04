export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { getSubscriptionsAction } from "@/lib/platform-admin/actions";
import { CreditCard } from "lucide-react";
import { ExtendTrialButton, ChangePlanSelect } from "@/components/platform-admin/subscription-actions";
import { getPlansAction } from "@/lib/platform-admin/actions";

const STATUS_STYLE: Record<string, string> = {
  trial:        "bg-blue-500/20 text-blue-300",
  active:       "bg-emerald-500/20 text-emerald-300",
  grace_period: "bg-amber-500/20 text-amber-300",
  suspended:    "bg-red-500/20 text-red-300",
  expired:      "bg-white/10 text-white/40",
  cancelled:    "bg-white/10 text-white/30",
};

export default async function SubscriptionsPage() {
  await requirePlatformUser();
  const [{ data }, plansResult] = await Promise.all([
    getSubscriptionsAction(),
    getPlansAction(),
  ]);
  const subs = data?.subscriptions ?? [];
  const stats = (data?.stats ?? {}) as Record<string, unknown>;
  const plans = (plansResult.data ?? []) as Array<{ id: string; name: string }>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Subscriptions</h1>
        <p className="mt-0.5 text-sm text-white/40">Plan distribution and lifecycle status across all organizations.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: "Trial",        value: stats.trials,    color: "text-blue-400" },
          { label: "Active",       value: stats.active,    color: "text-emerald-400" },
          { label: "Grace Period", value: stats.grace,     color: "text-amber-400" },
          { label: "Suspended",    value: stats.suspended, color: "text-red-400" },
          { label: "Expired",      value: stats.expired,   color: "text-white/30" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#30363d] bg-white/[0.02] p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{String(s.value ?? 0)}</div>
            <div className="mt-1 text-xs text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#30363d] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#30363d] px-5 py-3 bg-white/[0.02]">
          <CreditCard className="h-4 w-4 text-white/40" />
          <h2 className="text-sm font-semibold text-white">All Subscriptions</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#30363d] bg-white/[0.01]">
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Organization</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Plan</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Status</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Trial Ends / Period End</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]">
            {subs.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-white/30">No subscriptions yet.</td></tr>
            ) : subs.map((s) => (
              <tr key={s.id as string} className="hover:bg-white/[0.015] transition-colors">
                <td className="px-5 py-3 text-sm text-white">{s.org_name as string}</td>
                <td className="px-5 py-3 text-sm text-white/60">{(s.plan_name as string) ?? "—"}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[s.status as string] ?? "bg-white/5 text-white/40"}`}>
                    {s.status as string}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-white/40">
                  {s.trial_ends_at
                    ? `Trial ends ${new Date(s.trial_ends_at as string).toLocaleDateString()}`
                    : s.current_period_end
                    ? `Period ends ${new Date(s.current_period_end as string).toLocaleDateString()}`
                    : "—"}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {s.status === "trial" && <ExtendTrialButton orgId={s.org_id as string} />}
                    <ChangePlanSelect orgId={s.org_id as string} plans={plans} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
