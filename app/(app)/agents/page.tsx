export const dynamic = "force-dynamic";

export const metadata = { title: 'Governance Agent Framework&#8482; — AUDT' };

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardDataAction, getRunsAction, getObservationsAction } from "@/lib/agents/actions";
import { Cpu, Play, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { AgentStat, RunStatusBadge, SeverityBadge, AgentSubNav } from "@/components/agents/agent-ui";
import { fmtDate, fmtDuration } from "@/lib/agents/utils";

export default async function AgentsPage() {
  await requireUser();

  const [dashResult, runsResult, obsResult] = await Promise.all([
    getDashboardDataAction().catch(() => null),
    getRunsAction().catch(() => null),
    getObservationsAction().catch(() => null),
  ]);

  const m = (dashResult as { data?: { metrics?: { totalAgents?: number; activeAgents?: number; totalRuns?: number; pendingApprovals?: number; totalObservations?: number; successRate?: number } } } | null)?.data?.metrics;
  const runs = ((runsResult as { data?: unknown[] } | null)?.data ?? []) as Array<{
    id: string; agentName: string; status: string; startedAt: string; durationMs?: number;
    observationCount: number; recommendationCount: number; actionCount: number;
  }>;
  const obs = ((obsResult as { data?: unknown[] } | null)?.data ?? []) as Array<{
    id: string; title: string; severity: string; status: string; sourceModule: string;
    agentName: string; observedAt: string;
  }>;

  return (
    <div className="space-y-6 p-6">
      <AgentSubNav />
      {/* Header */}
      <div className="pt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Governance Agent Framework&#8482;</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">AI agents that continuously monitor, reason, and act across your entire governance posture.</p>
        </div>
        <Link href="/agents/copilot" className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
          <Cpu className="h-4 w-4" /> Governance Copilot&#8482; &#8594;
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <AgentStat label="Total Agents"       value={m?.totalAgents ?? 0}        accent="neutral"  href="/agents/registry" />
        <AgentStat label="Active Agents"      value={m?.activeAgents ?? 0}       accent="good"     href="/agents/registry" />
        <AgentStat label="Total Runs"         value={m?.totalRuns ?? 0}          accent="blue"     href="/agents/runs" />
        <AgentStat label="Pending Approvals"  value={m?.pendingApprovals ?? 0}   accent={(m?.pendingApprovals ?? 0) > 0 ? "warn" : "neutral"} href="/agents/actions" />
        <AgentStat label="Observations"       value={m?.totalObservations ?? 0}  accent="purple"   href="/agents/observations" />
        <AgentStat label="Success Rate"       value={`${m?.successRate ?? 0}%`}  accent={(m?.successRate ?? 0) >= 90 ? "good" : "warn"} />
      </div>

      {/* Strategic callout */}
      <div className="rounded-2xl border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.05] p-5">
        <div className="flex items-start gap-4">
          <Cpu className="mt-0.5 h-8 w-8 shrink-0 text-[var(--color-blue)]" />
          <div>
            <div className="font-semibold text-sm text-[var(--color-blue)]">Governance Built on Agents - Not Alerts</div>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)] leading-relaxed">
              AUDT agents don&apos;t just detect issues - they reason about root causes, generate prioritized recommendations,
              and execute approved governance actions. From vendor trust deterioration to overdue CAPAs,
              agents work 24/7 so your team doesn&apos;t have to.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Risk Monitor", "Vendor Watch", "Compliance Guardian", "Policy Enforcer", "Audit Prep", "Custom"].map(t => (
                <span key={t} className="rounded-full border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.08] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-blue)]">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Runs */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Recent Agent Runs</h3>
            <Link href="/agents/runs" className="text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">View all &#8594;</Link>
          </div>
          {runs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-line)] text-[var(--color-ink-faint)]">
                    <th className="pb-2 text-left font-medium">Agent</th>
                    <th className="pb-2 text-left font-medium">Status</th>
                    <th className="pb-2 text-left font-medium">Obs</th>
                    <th className="pb-2 text-left font-medium">Duration</th>
                    <th className="pb-2 text-left font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line)]/40">
                  {runs.slice(0, 6).map(r => (
                    <tr key={r.id}>
                      <td className="py-2 font-medium truncate max-w-[120px]">{r.agentName}</td>
                      <td className="py-2"><RunStatusBadge status={r.status} /></td>
                      <td className="py-2 text-[var(--color-ink-dim)]">{r.observationCount}</td>
                      <td className="py-2 text-[var(--color-ink-faint)]">{fmtDuration(r.durationMs)}</td>
                      <td className="py-2 text-[var(--color-ink-faint)]">{fmtDate(r.startedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 gap-3">
              <Play className="h-8 w-8 text-[var(--color-blue)] opacity-40" />
              <p className="text-xs text-[var(--color-ink-faint)]">No runs yet.</p>
              <Link href="/agents/registry" className="text-xs text-[var(--color-blue)] hover:underline">Activate an agent</Link>
            </div>
          )}
        </div>

        {/* Recent Observations */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Recent Observations</h3>
            <Link href="/agents/observations" className="text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">View all &#8594;</Link>
          </div>
          {obs.length > 0 ? (
            <div className="space-y-2">
              {obs.slice(0, 5).map(o => (
                <div key={o.id} className="flex items-start gap-3 rounded-xl border border-[var(--color-line)]/60 bg-white px-3 py-2.5">
                  <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                    o.severity === "critical" ? "text-red-400" :
                    o.severity === "high" ? "text-orange-400" : "text-amber-400"
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium">{o.title}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <SeverityBadge severity={o.severity} />
                      <span className="text-[10px] text-[var(--color-ink-faint)]">{o.sourceModule}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] text-[var(--color-ink-faint)]">{fmtDate(o.observedAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 gap-3">
              <CheckCircle className="h-8 w-8 text-emerald-400 opacity-40" />
              <p className="text-xs text-[var(--color-ink-faint)]">No observations yet. All clear!</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions callout */}
      {(m?.pendingApprovals ?? 0) > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-300">{m?.pendingApprovals} agent action{(m?.pendingApprovals ?? 0) > 1 ? "s" : ""} awaiting your approval</p>
              <p className="text-xs text-amber-400/70">Review and approve or reject proposed governance actions.</p>
            </div>
          </div>
          <Link href="/agents/actions" className="shrink-0 rounded-xl bg-amber-500/20 border border-amber-500/30 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/30 transition-colors">
            Review Actions
          </Link>
        </div>
      )}

    </div>
  );
}
