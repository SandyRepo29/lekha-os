export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getPendingActionsAction } from "@/lib/agents/actions";
import { Zap, Clock, CheckCircle } from "lucide-react";
import { AgentStat, ActionStatusBadge, AgentSubNav } from "@/components/agents/agent-ui";
import { fmtDate } from "@/lib/agents/utils";
import { AgentActionButtons } from "@/components/agents/agent-action-buttons";

export default async function AgentActionsPage() {
  await requireUser();
  const result = await getPendingActionsAction().catch(() => null);
  const actions = ((result as { data?: unknown[] } | null)?.data ?? []) as Array<{
    id: string; title: string; description: string; status: string;
    agentName: string; targetModule: string; targetEntityId?: string;
    requestedAt: string; decidedAt?: string; decidedBy?: string; executedAt?: string;
  }>;

  const pending  = actions.filter(a => a.status === "pending_approval");
  const decided  = actions.filter(a => a.status !== "pending_approval");
  const approved = actions.filter(a => a.status === "approved" || a.status === "executed");

  return (
    <div className="space-y-6 p-6">
      <AgentSubNav />

      {/* Header */}
      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Agent Actions™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Review and approve proposed governance actions from your agents.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AgentStat label="Total"    value={actions.length}  accent="neutral" />
        <AgentStat label="Pending"  value={pending.length}  accent={pending.length > 0 ? "warn" : "good"} />
        <AgentStat label="Approved" value={approved.length} accent="good" />
        <AgentStat label="Decided"  value={decided.length}  accent="neutral" />
      </div>

      {/* Pending approval queue */}
      {pending.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-700" />
            <h2 className="font-semibold text-sm text-amber-700">Awaiting Approval ({pending.length})</h2>
          </div>
          <div className="space-y-3">
            {pending.map(a => (
              <div key={a.id} className="rounded-2xl border border-amber-200 bg-amber-500/[0.04] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{a.title}</p>
                    <p className="mt-1 text-xs text-[var(--color-ink-dim)] leading-relaxed">{a.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-ink-faint)]">
                      <span className="rounded-full bg-slate-100 border border-[var(--color-line)] px-2 py-0.5">{a.targetModule}</span>
                      {a.targetEntityId && <span>- {a.targetEntityId}</span>}
                      <span>- by {a.agentName}</span>
                      <span>- {fmtDate(a.requestedAt)}</span>
                    </div>
                  </div>
                  <AgentActionButtons actionId={a.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All actions history */}
      {actions.length > 0 ? (
        <div>
          <h2 className="mb-3 font-semibold text-sm text-[var(--color-ink-dim)]">All Actions</h2>
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-line)] text-[var(--color-ink-faint)]">
                    <th className="px-4 py-3 text-left font-medium">Action</th>
                    <th className="px-4 py-3 text-left font-medium">Agent</th>
                    <th className="px-4 py-3 text-left font-medium">Module</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Requested</th>
                    <th className="px-4 py-3 text-left font-medium">Decided By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line)]/40">
                  {actions.map(a => (
                    <tr key={a.id} className="hover:bg-white">
                      <td className="px-4 py-3 font-medium max-w-[240px] truncate">{a.title}</td>
                      <td className="px-4 py-3 text-[var(--color-ink-dim)]">{a.agentName}</td>
                      <td className="px-4 py-3 text-[var(--color-ink-faint)]">{a.targetModule}</td>
                      <td className="px-4 py-3"><ActionStatusBadge status={a.status} /></td>
                      <td className="px-4 py-3 text-[var(--color-ink-faint)]">{fmtDate(a.requestedAt)}</td>
                      <td className="px-4 py-3 text-[var(--color-ink-faint)]">{a.decidedBy ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg-2)]/40 flex flex-col items-center py-16 gap-4">
          <CheckCircle className="h-10 w-10 text-emerald-700 opacity-40" />
          <div className="text-center">
            <p className="font-semibold text-sm">No actions yet</p>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)]">Agents will propose actions once activated and observations are generated.</p>
          </div>
        </div>
      )}
    </div>
  );
}
