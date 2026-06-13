export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getRunsAction } from "@/lib/agents/actions";
import { Activity, CheckCircle } from "lucide-react";
import { AgentStat, RunStatusBadge } from "@/components/agents/agent-ui";

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
  { href: "/agents/copilot", label: "Copilotâ„¢" },
];

// Inline helpers — cannot call "use client" exports as plain functions from server components
function fmtDate(val?: string | Date | null): string {
  if (!val) return "—";
  try { return new Date(val as string).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }
  catch { return "—"; }
}
function fmtDuration(ms?: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}m`;
}

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
      {/* Sub-nav */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-line)] pb-0 -mb-2">
        {SUB_NAV.map(n => (
          <Link key={n.href} href={n.href}
            className={`whitespace-nowrap px-3 py-2 text-xs font-medium rounded-t-lg transition-colors hover:text-[var(--color-ink)] ${
              n.href === "/agents/runs"
                ? "border-b-2 border-[var(--color-blue)] text-[var(--color-blue)]"
                : "text-[var(--color-ink-dim)]"
            }`}>
            {n.label}
          </Link>
        ))}
      </div>

      {/* Header */}
      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Agent Runsâ„¢</h1>
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
                    <td className="px-4 py-3 text-red-400 max-w-[160px] truncate">{r.errorMessage ?? "â€”"}</td>
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
