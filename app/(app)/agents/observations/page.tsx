export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getObservationsAction } from "@/backend/src/modules/governance-agents/actions";
import { Eye, AlertTriangle, CheckCircle } from "lucide-react";
import { AgentStat, SeverityBadge, ObsStatusBadge, AgentSubNav } from "@/components/agents/agent-ui";
import { fmtDate } from "@/backend/src/modules/governance-agents/utils";

const MODULE_COLORS: Record<string, string> = {
  "Risk Lens™":        "bg-red-100 text-red-700",
  "Vendor Hub™":       "bg-orange-100 text-orange-700",
  "Control Center™":   "bg-blue-100 text-blue-700",
  "Evidence Vault™":   "bg-emerald-100 text-emerald-700",
  "Audit Management™": "bg-purple-100 text-purple-700",
  "Policy Governance™":"bg-indigo-100 text-indigo-700",
};

export default async function ObservationsPage() {
  await requireUser();
  const result = await getObservationsAction().catch(() => null);
  const obs = ((result as { data?: unknown[] } | null)?.data ?? []) as Array<{
    id: string; title: string; detail: string; severity: string; status: string;
    sourceModule: string; agentName: string; observedAt: string;
    sourceEntityName?: string;
  }>;

  const newObs      = obs.filter(o => o.status === "new");
  const criticalObs = obs.filter(o => o.severity === "critical");
  const highObs     = obs.filter(o => o.severity === "high");

  return (
    <div className="space-y-6 p-6">
      <AgentSubNav />

      {/* Header */}
      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Agent Observations™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Governance signals detected by your agents across all modules.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AgentStat label="Total"      value={obs.length}         accent="neutral" />
        <AgentStat label="New"        value={newObs.length}      accent={newObs.length > 0 ? "warn" : "good"} />
        <AgentStat label="Critical"   value={criticalObs.length} accent={criticalObs.length > 0 ? "danger" : "neutral"} />
        <AgentStat label="High"       value={highObs.length}     accent={highObs.length > 0 ? "warn" : "neutral"} />
      </div>

      {/* Observation list */}
      {obs.length > 0 ? (
        <div className="space-y-3">
          {obs.map(o => (
            <div key={o.id} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-4">
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                  o.severity === "critical" ? "bg-red-100" :
                  o.severity === "high" ? "bg-orange-100" : "bg-amber-100"
                }`}>
                  <AlertTriangle className={`h-4 w-4 ${
                    o.severity === "critical" ? "text-red-700" :
                    o.severity === "high" ? "text-orange-700" : "text-amber-700"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-semibold text-sm leading-snug">{o.title}</p>
                    <div className="flex shrink-0 items-center gap-2">
                      <ObsStatusBadge status={o.status} />
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--color-ink-dim)] leading-relaxed">{o.detail}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={o.severity} />
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${MODULE_COLORS[o.sourceModule] ?? "bg-slate-100 text-[var(--color-ink-dim)]"}`}>
                      {o.sourceModule}
                    </span>
                    {o.sourceEntityName && (
                      <span className="text-[11px] text-[var(--color-ink-faint)]">- {o.sourceEntityName}</span>
                    )}
                    <span className="ml-auto text-[11px] text-[var(--color-ink-faint)]">
                      by {o.agentName} - {fmtDate(o.observedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg-2)]/40 flex flex-col items-center py-16 gap-4">
          <CheckCircle className="h-10 w-10 text-emerald-700 opacity-40" />
          <div className="text-center">
            <p className="font-semibold text-sm">No observations yet</p>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)]">
              Activate agents in the{" "}
              <Link href="/agents/registry" className="text-[var(--color-blue)] hover:underline">Registry</Link>
              {" "}to start generating governance observations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
