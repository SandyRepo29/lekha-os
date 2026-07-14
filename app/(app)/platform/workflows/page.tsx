export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import {
  getOrgTriggers,
  getTriggerStats,
  getTriggerRuns,
} from "@/backend/src/modules/platform/workflow-trigger-service";
import { isAdminOrOwner } from "@/lib/ui/role-guard";
import { Card } from "@/components/ui/card";
import {
  Zap,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
} from "lucide-react";

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "Never";
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(d));
}

function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function eventLabel(event: string): string {
  const map: Record<string, string> = {
    entity_created: "Entity Created",
    status_changed: "Status Changed",
    score_threshold: "Score Threshold",
    document_expiring: "Document Expiring",
    risk_detected: "Risk Detected",
    control_failed: "Control Failed",
    audit_overdue: "Audit Overdue",
    capa_overdue: "CAPA Overdue",
    vendor_onboarded: "Vendor Onboarded",
    assessment_completed: "Assessment Completed",
  };
  return map[event] ?? event.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function entityLabel(entity: string | null): string {
  if (!entity) return "All";
  return entity.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatusBadge({ status }: { status: "success" | "partial" | "failed" }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Success
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
        <Clock className="h-3 w-3" />
        Partial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400">
      <XCircle className="h-3 w-3" />
      Failed
    </span>
  );
}

export default async function WorkflowTriggersPage() {
  const session = await requireUser();
  const orgId = session.org!.id;
  const role = session.org!.role;
  const adminOrOwner = isAdminOrOwner(role);

  const [triggers, stats] = await Promise.all([
    getOrgTriggers(orgId),
    getTriggerStats(orgId),
  ]);

  // Fetch recent runs for each trigger (up to 3 each), then merge and sort
  const runsPerTrigger = await Promise.all(
    triggers.slice(0, 10).map((t) => getTriggerRuns(orgId, t.id, 3))
  );
  const triggerNameMap: Record<string, string> = {};
  triggers.forEach((t) => {
    triggerNameMap[t.id] = t.name;
  });
  const recentRuns = runsPerTrigger
    .flat()
    .sort(
      (a, b) =>
        new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()
    )
    .slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-ink-dim)]">
        <span>Platform</span>
        <span>/</span>
        <span className="text-[var(--color-ink)]">Workflows</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-[var(--color-blue)]" />
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
            Workflow Triggers
          </h1>
        </div>
        <a
          href="/platform/workflows/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-blue)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Create Trigger
        </a>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Triggers", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Runs Today", value: stats.runsToday },
          { label: "Success Rate", value: `${stats.successRate}%` },
        ].map((s) => (
          <Card
            key={s.label}
            className="rounded-2xl border border-[var(--color-line)] bg-white p-4"
          >
            <p className="text-xs text-[var(--color-ink-dim)]">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Trigger list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">
          Triggers ({triggers.length})
        </h2>

        {triggers.length === 0 ? (
          <Card className="rounded-2xl border border-[var(--color-line)] bg-white p-10 text-center">
            <Zap className="mx-auto h-8 w-8 text-[var(--color-ink-dim)] mb-3" />
            <p className="text-sm font-medium text-[var(--color-ink)]">No triggers yet</p>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)]">
              Create your first workflow trigger to automate governance actions.
            </p>
            <a
              href="/platform/workflows/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-blue)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Create Trigger
            </a>
          </Card>
        ) : (
          <div className="space-y-2">
            {triggers.map((trigger) => (
              <Card
                key={trigger.id}
                className="rounded-2xl border border-[var(--color-line)] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: info */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-[var(--color-ink)]">
                        {trigger.name}
                      </span>
                      {/* Active indicator */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          trigger.is_active
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-[#F8F9FB] text-[var(--color-ink-dim)]"
                        }`}
                      >
                        {trigger.is_active ? (
                          <Play className="h-2.5 w-2.5" />
                        ) : (
                          <Pause className="h-2.5 w-2.5" />
                        )}
                        {trigger.is_active ? "Active" : "Paused"}
                      </span>
                    </div>

                    {trigger.description && (
                      <p className="text-xs text-[var(--color-ink-dim)] leading-relaxed">
                        {trigger.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Trigger event badge */}
                      <span className="inline-flex items-center gap-1 rounded-md border border-[var(--color-line)] bg-white px-2 py-0.5 text-xs text-[var(--color-ink-dim)]">
                        <Zap className="h-3 w-3 text-[var(--color-blue)]" />
                        {eventLabel(trigger.trigger_event)}
                      </span>
                      {/* Entity scope chip */}
                      <span className="inline-flex items-center rounded-md border border-[var(--color-line)] bg-white px-2 py-0.5 text-xs text-[var(--color-ink-dim)]">
                        {entityLabel(trigger.trigger_entity_type)}
                      </span>
                      {/* Run count */}
                      <span className="text-xs text-[var(--color-ink-dim)]">
                        {trigger.run_count} run{trigger.run_count !== 1 ? "s" : ""}
                      </span>
                      {/* Last run */}
                      <span className="text-xs text-[var(--color-ink-dim)]">
                        Last: {fmtDate(trigger.last_run_at)}
                      </span>
                    </div>
                  </div>

                  {/* Right: actions */}
                  {adminOrOwner && (
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={`/platform/workflows/${trigger.id}/toggle`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-xs font-medium text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)] transition-colors"
                        title={trigger.is_active ? "Pause trigger" : "Activate trigger"}
                      >
                        {trigger.is_active ? (
                          <Pause className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                        {trigger.is_active ? "Pause" : "Activate"}
                      </a>
                      <a
                        href={`/platform/workflows/${trigger.id}/delete`}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/5 px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete trigger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent runs */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">
          Recent Runs
        </h2>

        {recentRuns.length === 0 ? (
          <Card className="rounded-2xl border border-[var(--color-line)] bg-white p-6 text-center">
            <p className="text-sm text-[var(--color-ink-dim)]">
              No runs recorded yet. Triggers will log executions here.
            </p>
          </Card>
        ) : (
          <Card className="rounded-2xl border border-[var(--color-line)] bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-line)]">
                    {["Trigger", "Event", "Entity", "Status", "Actions", "Executed"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-xs font-medium text-[var(--color-ink-dim)]"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {recentRuns.map((run) => (
                    <tr
                      key={run.id}
                      className="hover:bg-white transition-colors"
                    >
                      <td className="px-4 py-2.5 text-xs font-medium text-[var(--color-ink)]">
                        {triggerNameMap[run.trigger_id] ?? run.trigger_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[var(--color-ink-dim)]">
                        {eventLabel(run.event)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[var(--color-ink-dim)]">
                        {run.entity_type ? entityLabel(run.entity_type) : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={run.status} />
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[var(--color-ink-dim)]">
                        {run.actions_executed} ok
                        {run.actions_failed > 0 && (
                          <span className="ml-1 text-rose-400">
                            / {run.actions_failed} failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[var(--color-ink-dim)]">
                        {fmtDate(run.executed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
