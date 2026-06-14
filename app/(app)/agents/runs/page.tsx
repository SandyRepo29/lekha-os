export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getRunsAction } from "@/lib/agents/actions";
import { Activity } from "lucide-react";
import { AgentStat, RunStatusBadge, AgentSubNav } from "@/components/agents/agent-ui";
import { fmtDate, fmtDuration } from "@/lib/agents/utils";

export default async function AgentRunsPage() {
  await requireUser();
  const result = await getRunsAction().catch(() => null);
  const runs = ((result as { data?: unknown[] } | null)?.data ?? []) as Array<{
    id: string; agentName: string; status: string; startedAt: string;
    completedAt?: string; durationMs?: number;
    observationCount: number; recommendationCount: number; actionCount: number;
    errorMessage?: string;
  }>;

  const completed = runs.filter(r => r.status === "completed" || r.status === "success");
  const failed    = runs.filter(r => r.status === "failed");
  const running   = runs.filter(r => r.status === "running");
  const totalObs  = runs.reduce((s, r) => s + (r.observationCount ?? 0), 0);

  return (
    <div className="space-y-6 p-6">
      <AgentSubNav />

      {/* Header */}
      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Agent Runs™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Full execution history across all governance agents.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <AgentStat label="Total Runs"   value={runs.length}      accent="neutral" />
        <AgentStat label="Running"      value={running.length}   accent={running.length > 0 ? "blue" : "neutral"} />
        <AgentStat label="Completed"    value={completed.length} accent="good" />
        <AgentStat label="Failed"       value={failed.length}    accent={failed.length > 0 ? "danger" : "neutral"} />
        <AgentStat label="Observations" value={totalObs}         accent="purple" />
      </div>

      {/* Table */}
      {runs.length > 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-[var(--color-ink-faint)]">
                  <th className="px-4 py-3 text-left font-medium">Agent</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Started</th>
                  <th className="px-4 py-3 text-left font-medium">Duration</th>
                  <th className="px-4 py-3 text-left font-medium">Obs</th>
                  <th className="px-4 py-3 text-left font-medium">Recs</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                  <th className="px-4 py-3 text-left font-medium">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]/40">
                {runs.map(r => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-semibold">{r.agentName}</td>
                    <td className="px-4 py-3"><RunStatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-[var(--color-ink-faint)]">{fmtDate(r.startedAt)}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">{fmtDuration(r.durationMs)}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">{r.observationCount}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">{r.recommendationCount}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">{r.actionCount}</td>
                    <td className="px-4 py-3 text-red-400 max-w-[160px] truncate">{r.errorMessage ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg-2)]/40 flex flex-col items-center py-16 gap-4">
          <Activity className="h-10 w-10 text-[var(--color-blue)] opacity-40" />
          <div className="text-center">
            <p className="font-semibold text-sm">No runs yet</p>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)]">
              Activate agents in the{" "}
              <Link href="/agents/registry" className="text-[var(--color-blue)] hover:underline">Registry</Link>
              {" "}to start generating runs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
