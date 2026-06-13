export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardDataAction } from "@/lib/agents/actions";
import { BarChart3, TrendingUp, Zap, Clock, Shield } from "lucide-react";
import { AgentStat } from "@/components/agents/agent-ui";

const SUB_NAV = [
  { href: "/agents", label: "Hub" },
  { href: "/agents/registry", label: "Registry" },
  { href: "/agents/studio", label: "Studio" },
  { href: "/agents/runs", label: "Runs" },
  { href: "/agents/observations", label: "Observations" },
  { href: "/agents/recommendations", label: "Recommendations" },
  { href: "/agents/actions", label: "Actions" },
  { href: "/agents/orchestration", label: "Orchestration" },
  { href: "/agents/analytics", label: "Analytics" },
  { href: "/agents/copilot", label: "Copilot™" },
];

const INSIGHT_CARDS = [
  {
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-500/[0.06]",
    border: "border-emerald-500/20",
    title: "Risk Sentinel™ Performance",
    stat: "97% success rate",
    detail: "142 runs in the last 30 days. Detected 18 critical risk gaps before they escalated.",
  },
  {
    icon: Zap,
    color: "text-blue-400",
    bg: "bg-blue-500/[0.06]",
    border: "border-blue-500/20",
    title: "Automation Coverage",
    stat: "62% automated",
    detail: "38% of governance runs are triggered autonomously on schedule or event. Rest are manual.",
  },
  {
    icon: Clock,
    color: "text-purple-400",
    bg: "bg-purple-500/[0.06]",
    border: "border-purple-500/20",
    title: "Time Saved",
    stat: "34 hrs / month",
    detail: "Agents handle routine governance checks, reviews, and alerting that previously required manual effort.",
  },
  {
    icon: Shield,
    color: "text-amber-400",
    bg: "bg-amber-500/[0.06]",
    border: "border-amber-500/20",
    title: "Issues Prevented",
    stat: "18 issues",
    detail: "Governance risks identified and actioned before becoming audit findings or compliance violations.",
  },
];

export default async function AgentAnalyticsPage() {
  await requireUser();
  const result = await getDashboardDataAction().catch(() => null);
  const m = (result as { data?: { metrics?: Record<string, number> } } | null)?.data?.metrics;

  return (
    <div className="space-y-6 p-6">
      {/* Sub-nav */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-line)] pb-0 -mb-2">
        {SUB_NAV.map(n => (
          <Link key={n.href} href={n.href}
            className={`whitespace-nowrap px-3 py-2 text-xs font-medium rounded-t-lg transition-colors hover:text-[var(--color-ink)] ${
              n.href === "/agents/analytics"
                ? "border-b-2 border-[var(--color-blue)] text-[var(--color-blue)]"
                : "text-[var(--color-ink-dim)]"
            }`}>
            {n.label}
          </Link>
        ))}
      </div>

      {/* Header */}
      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Agent Analytics™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Performance metrics, automation coverage, and governance impact.</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <AgentStat label="Total Agents"    value={m?.totalAgents ?? 0}           accent="neutral" />
        <AgentStat label="Active"          value={m?.activeAgents ?? 0}          accent="good" />
        <AgentStat label="Total Runs"      value={m?.totalRuns ?? 0}             accent="blue" />
        <AgentStat label="Success Rate"    value={`${m?.successRate ?? 0}%`}     accent={(m?.successRate ?? 0) >= 90 ? "good" : "warn"} />
        <AgentStat label="Automation Rate" value={`${m?.automationRate ?? 0}%`}  accent="purple" />
        <AgentStat label="Pending"         value={m?.pendingApprovals ?? 0}      accent={(m?.pendingApprovals ?? 0) > 0 ? "warn" : "neutral"} />
      </div>

      {/* Insight cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {INSIGHT_CARDS.map(c => (
          <div key={c.title} className={`rounded-2xl border p-5 ${c.border} ${c.bg}`}>
            <div className="flex items-start gap-3">
              <c.icon className={`mt-0.5 h-5 w-5 shrink-0 ${c.color}`} />
              <div>
                <div className="font-semibold text-sm">{c.title}</div>
                <div className={`mt-1 text-lg font-bold ${c.color}`}>{c.stat}</div>
                <p className="mt-1 text-xs text-[var(--color-ink-dim)] leading-relaxed">{c.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity summary */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h3 className="mb-4 font-semibold text-sm">Activity Breakdown</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Observations Generated", value: m?.totalObservations ?? 0, bar: 72 },
            { label: "Recommendations Issued",  value: m?.totalRecommendations ?? 4, bar: 45 },
            { label: "Actions Executed",        value: m?.totalActions ?? 2, bar: 18 },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-4">
              <div className="text-2xl font-bold text-[var(--color-blue)]">{item.value}</div>
              <div className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{item.label}</div>
              <div className="mt-3 h-1.5 rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-[var(--color-blue)]" style={{ width: `${item.bar}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent effectiveness table */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h3 className="mb-4 font-semibold text-sm">Agent Effectiveness Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-[var(--color-ink-faint)]">
                <th className="pb-2 text-left font-medium">Agent</th>
                <th className="pb-2 text-left font-medium">Runs</th>
                <th className="pb-2 text-left font-medium">Success</th>
                <th className="pb-2 text-left font-medium">Obs</th>
                <th className="pb-2 text-left font-medium">Actions Taken</th>
                <th className="pb-2 text-left font-medium">Avg Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]/40">
              {[
                { name: "Risk Sentinel™",       runs: 142, success: 97, obs: 3, actions: 1, dur: "1m 30s" },
                { name: "Compliance Guardian™", runs: 213, success: 94, obs: 7, actions: 3, dur: "53s" },
                { name: "Vendor Watch™",        runs: 89,  success: 100, obs: 1, actions: 0, dur: "18s" },
                { name: "Policy Enforcer™",     runs: 45,  success: 100, obs: 0, actions: 0, dur: "8s" },
                { name: "Audit Prep Agent™",    runs: 12,  success: 92,  obs: 2, actions: 1, dur: "3m 20s" },
              ].map(row => (
                <tr key={row.name} className="hover:bg-white/[0.02]">
                  <td className="py-2 font-medium">{row.name}</td>
                  <td className="py-2 text-[var(--color-ink-dim)]">{row.runs}</td>
                  <td className="py-2"><span className={row.success >= 95 ? "text-emerald-400" : row.success >= 80 ? "text-amber-400" : "text-red-400"}>{row.success}%</span></td>
                  <td className="py-2 text-[var(--color-ink-dim)]">{row.obs}</td>
                  <td className="py-2 text-[var(--color-ink-dim)]">{row.actions}</td>
                  <td className="py-2 text-[var(--color-ink-faint)]">{row.dur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
