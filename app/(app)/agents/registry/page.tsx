export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getAgentsAction } from "@/lib/agents/actions";
import { Bot, Plus, ArrowRight, Play, Pause, Settings, Activity } from "lucide-react";
import {
  AgentStat, AgentStatusBadge, AgentTypeBadge, ExecModeBadge,
} from "@/components/agents/agent-ui";
import { AgentRegistryActions } from "@/components/agents/agent-registry-actions";

const SUB_NAV = [
  { href: "/agents",              label: "Hub" },
  { href: "/agents/registry",     label: "Registry" },
  { href: "/agents/studio",       label: "Studio" },
  { href: "/agents/runs",         label: "Runs" },
  { href: "/agents/observations", label: "Observations" },
  { href: "/agents/recommendations", label: "Recommendations" },
  { href: "/agents/actions",      label: "Actions" },
  { href: "/agents/orchestration",label: "Orchestration" },
  { href: "/agents/analytics",    label: "Analytics" },
  { href: "/agents/copilot",      label: "Copilotâ„¢" },
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

export default async function AgentRegistryPage() {
  await requireUser();
  const result = await getAgentsAction().catch(() => null);
  const agents = ((result as { data?: unknown[] } | null)?.data ?? []) as Array<{
    id: string; name: string; description: string; agentType: string; status: string;
    executionMode: string; triggerType: string; approvalMode: string;
    lastRunAt?: string; totalRuns: number; successRuns: number;
  }>;

  const active = agents.filter(a => a.status === "active").length;
  const paused = agents.filter(a => a.status === "paused").length;

  return (
    <div className="space-y-6 p-6">
      {/* Sub-nav */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-line)] pb-0 -mb-2">
        {SUB_NAV.map(n => (
          <Link key={n.href} href={n.href}
            className={`whitespace-nowrap px-3 py-2 text-xs font-medium rounded-t-lg transition-colors hover:text-[var(--color-ink)] ${
              n.href === "/agents/registry"
                ? "border-b-2 border-[var(--color-blue)] text-[var(--color-blue)]"
                : "text-[var(--color-ink-dim)]"
            }`}>
            {n.label}
          </Link>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Agent Registryâ„¢</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">All governance agents â€” configure, activate, pause, and monitor execution.</p>
        </div>
        <Link
          href="/agents/studio"
          className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New Agent
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AgentStat label="Total Agents"  value={agents.length}  accent="neutral" />
        <AgentStat label="Active"        value={active}         accent="good" />
        <AgentStat label="Paused"        value={paused}         accent="warn" />
        <AgentStat label="Autonomous"    value={agents.filter(a => a.executionMode === "autonomous").length} accent="purple" />
      </div>

      {/* Table */}
      {agents.length > 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-[var(--color-ink-faint)]">
                  <th className="px-4 py-3 text-left font-medium">Agent</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Mode</th>
                  <th className="px-4 py-3 text-left font-medium">Trigger</th>
                  <th className="px-4 py-3 text-left font-medium">Runs</th>
                  <th className="px-4 py-3 text-left font-medium">Success</th>
                  <th className="px-4 py-3 text-left font-medium">Last Run</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]/40">
                {agents.map(a => {
                  const successRate = a.totalRuns > 0 ? Math.round((a.successRuns / a.totalRuns) * 100) : 0;
                  return (
                    <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{a.name}</div>
                        <div className="mt-0.5 text-[var(--color-ink-faint)] max-w-[200px] truncate">{a.description}</div>
                      </td>
                      <td className="px-4 py-3"><AgentTypeBadge type={a.agentType} /></td>
                      <td className="px-4 py-3"><AgentStatusBadge status={a.status} /></td>
                      <td className="px-4 py-3"><ExecModeBadge mode={a.executionMode} /></td>
                      <td className="px-4 py-3 capitalize text-[var(--color-ink-dim)]">{a.triggerType}</td>
                      <td className="px-4 py-3 text-[var(--color-ink-dim)]">{a.totalRuns}</td>
                      <td className="px-4 py-3">
                        <span className={successRate >= 90 ? "text-emerald-400" : successRate >= 70 ? "text-amber-400" : "text-red-400"}>
                          {successRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-ink-faint)]">{fmtDate(a.lastRunAt)}</td>
                      <td className="px-4 py-3">
                        <AgentRegistryActions agentId={a.id} status={a.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg-2)]/40 flex flex-col items-center py-16 gap-4">
          <Bot className="h-10 w-10 text-[var(--color-blue)] opacity-40" />
          <div className="text-center">
            <p className="font-semibold text-sm">No agents yet</p>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)]">Create your first governance agent in Agent Studioâ„¢.</p>
          </div>
          <Link href="/agents/studio" className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Create Agent
          </Link>
        </div>
      )}
    </div>
  );
}
