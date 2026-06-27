export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getWorkflowAnalyticsAction, getWorkflowInstancesAction } from "@/lib/toe/actions";
import { ToeSubNav } from "@/components/toe/toe-ui";
import { BarChart3, TrendingUp, Clock, CheckCircle } from "lucide-react";

export default async function AnalyticsPage() {
  await requireUser();

  const [analyticsResult, instancesResult] = await Promise.all([
    getWorkflowAnalyticsAction(),
    getWorkflowInstancesAction({ limit: 100 }),
  ]);

  const data = (analyticsResult as { data?: { analytics?: unknown[]; instanceCounts?: Record<string, number> } } | null)?.data;
  const analytics = (data?.analytics ?? []) as Array<{
    workflow_name: string; period_start: string; avg_duration_ms: number;
    completion_rate: number; sla_compliance_rate: number; total_runs: number; successful_runs: number;
  }>;
  const counts = data?.instanceCounts ?? {};

  const instances = ((instancesResult as { data?: unknown[] } | null)?.data ?? []) as Array<{
    id: string; workflow_name: string; status: string;
  }>;

  const totalRuns = instances.length;
  const completedRuns = instances.filter(i => i.status === "completed").length;
  const failedRuns = instances.filter(i => i.status === "failed").length;
  const successRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

  // Aggregate by workflow name
  const byWorkflow = instances.reduce<Record<string, { total: number; completed: number; failed: number }>>((acc, i) => {
    if (!acc[i.workflow_name]) acc[i.workflow_name] = { total: 0, completed: 0, failed: 0 };
    acc[i.workflow_name].total++;
    if (i.status === "completed") acc[i.workflow_name].completed++;
    if (i.status === "failed") acc[i.workflow_name].failed++;
    return acc;
  }, {});

  const statusOrder = ["running", "waiting_approval", "pending", "completed", "failed", "cancelled"];

  return (
    <div className="space-y-6 p-6">
      <ToeSubNav />

      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Workflow Analytics&#8482;</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
          Performance metrics, SLA compliance, and operational bottleneck analysis.
        </p>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-l-2 border-[var(--color-line)] border-l-[var(--color-blue)] bg-[var(--color-bg-2)]/60 p-4">
          <div className="text-2xl font-bold text-[var(--color-blue)]">{totalRuns}</div>
          <div className="text-xs text-[var(--color-ink-dim)]">Total Runs</div>
        </div>
        <div className="rounded-xl border border-l-2 border-[var(--color-line)] border-l-emerald-500 bg-[var(--color-bg-2)]/60 p-4">
          <div className="text-2xl font-bold text-emerald-400">{completedRuns}</div>
          <div className="text-xs text-[var(--color-ink-dim)]">Completed</div>
        </div>
        <div className={`rounded-xl border border-l-2 border-[var(--color-line)] ${failedRuns > 0 ? "border-l-red-500" : "border-l-[var(--color-line)]"} bg-[var(--color-bg-2)]/60 p-4`}>
          <div className={`text-2xl font-bold ${failedRuns > 0 ? "text-red-400" : "text-[var(--color-ink)]"}`}>{failedRuns}</div>
          <div className="text-xs text-[var(--color-ink-dim)]">Failed</div>
        </div>
        <div className={`rounded-xl border border-l-2 border-[var(--color-line)] ${successRate >= 90 ? "border-l-emerald-500" : successRate >= 70 ? "border-l-amber-500" : "border-l-red-500"} bg-[var(--color-bg-2)]/60 p-4`}>
          <div className={`text-2xl font-bold ${successRate >= 90 ? "text-emerald-400" : successRate >= 70 ? "text-amber-400" : "text-red-400"}`}>{successRate}%</div>
          <div className="text-xs text-[var(--color-ink-dim)]">Success Rate</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Status */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[var(--color-blue)]" />
            <span className="text-sm font-semibold">Runs by Status</span>
          </div>
          {Object.keys(counts).length === 0
            ? <p className="text-sm text-[var(--color-ink-dim)]">No workflow runs recorded yet.</p>
            : (
              <div className="space-y-2">
                {statusOrder.filter(s => counts[s] > 0).map(status => {
                  const n = counts[status] ?? 0;
                  const pct = totalRuns > 0 ? Math.round((n / totalRuns) * 100) : 0;
                  const barColor = status === "completed" ? "bg-emerald-500" : status === "failed" ? "bg-red-500" : status === "running" ? "bg-blue-500" : "bg-slate-500";
                  return (
                    <div key={status}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="capitalize text-[var(--color-ink-dim)]">{status.replace(/_/g, " ")}</span>
                        <span className="text-[var(--color-ink)]">{n} <span className="text-[var(--color-ink-dim)]">({pct}%)</span></span>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.05]">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>

        {/* By Workflow */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold">By Workflow</span>
          </div>
          {Object.keys(byWorkflow).length === 0
            ? <p className="text-sm text-[var(--color-ink-dim)]">No workflow runs recorded yet.</p>
            : (
              <div className="space-y-3">
                {Object.entries(byWorkflow).map(([name, stats]) => {
                  const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                  return (
                    <div key={name}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium">{name}</span>
                        <span className={rate >= 80 ? "text-emerald-400" : rate >= 50 ? "text-amber-400" : "text-red-400"}>{rate}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--color-ink-dim)]">
                        <span>{stats.total} runs</span>
                        <span className="text-emerald-400">&#10003; {stats.completed}</span>
                        {stats.failed > 0 && <span className="text-red-400">&#10007; {stats.failed}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      </div>

      {/* Stored analytics */}
      {analytics.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--color-ink-dim)]" />
            <span className="text-sm font-semibold">Historical Analytics</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-left text-[var(--color-ink-dim)]">
                  <th className="pb-2 font-medium">Workflow</th>
                  <th className="pb-2 font-medium">Period</th>
                  <th className="pb-2 font-medium">Runs</th>
                  <th className="pb-2 font-medium">Completion</th>
                  <th className="pb-2 font-medium">SLA</th>
                  <th className="pb-2 font-medium">Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((row, i) => (
                  <tr key={i} className="border-b border-[var(--color-line)] last:border-0">
                    <td className="py-2.5 pr-4 font-medium">{row.workflow_name}</td>
                    <td className="py-2.5 pr-4 text-[var(--color-ink-dim)]">{row.period_start}</td>
                    <td className="py-2.5 pr-4">{row.total_runs}</td>
                    <td className="py-2.5 pr-4">
                      <span className={row.completion_rate >= 80 ? "text-emerald-400" : "text-amber-400"}>
                        {row.completion_rate}%
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={row.sla_compliance_rate >= 90 ? "text-emerald-400" : "text-amber-400"}>
                        {row.sla_compliance_rate}%
                      </span>
                    </td>
                    <td className="py-2.5 text-[var(--color-ink-dim)]">
                      {row.avg_duration_ms > 0 ? `${Math.round(row.avg_duration_ms / 1000)}s` : "&#8212;"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
