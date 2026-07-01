export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getAutomationRulesAction, getEventTypesAction } from "@/lib/toe/actions";
import { ToeSubNav } from "@/components/toe/toe-ui";
import { Zap, Plus } from "lucide-react";
import { ToggleRuleButton, DeleteRuleButton, CreateRuleForm } from "@/components/toe/automation-actions";

const ACTION_LABELS: Record<string, string> = {
  create_task: "Create Task",
  create_issue: "Create Issue",
  send_notification: "Send Notification",
  trigger_workflow: "Trigger Workflow",
  update_status: "Update Status",
  assign_owner: "Assign Owner",
  escalate: "Escalate",
  ai_analyze: "AI Analysis",
};

export default async function AutomationPage() {
  await requireUser();

  const [rulesResult, typesResult] = await Promise.all([
    getAutomationRulesAction(),
    getEventTypesAction(),
  ]);

  const rules = ((rulesResult as { data?: unknown[] } | null)?.data ?? []) as Array<{
    id: string; name: string; description: string | null; trigger_event: string;
    action_type: string; active: boolean; run_count: number; last_run_at: string | null;
    created_at: string;
  }>;

  const eventTypes = ((typesResult as { data?: unknown[] } | null)?.data ?? []) as Array<{
    name: string; label: string; module: string;
  }>;

  const activeRules = rules.filter(r => r.active);
  const inactiveRules = rules.filter(r => !r.active);

  return (
    <div className="space-y-6 p-6">
      <ToeSubNav />

      <div className="pt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Automation Engine™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Event-driven automation rules. When a governance event occurs, automatically trigger actions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] px-3 py-1.5 text-sm text-emerald-400">
            {activeRules.length} active
          </div>
        </div>
      </div>

      {/* Create rule */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-[var(--color-blue)]" />
          <span className="text-sm font-semibold">Create Automation Rule</span>
        </div>
        <CreateRuleForm eventTypes={eventTypes.map(e => ({ name: e.name, label: e.label }))} />
      </div>

      {/* Active Rules */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold">Active Rules</span>
          <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400">{activeRules.length}</span>
        </div>
        {activeRules.length === 0
          ? <p className="text-sm text-[var(--color-ink-dim)]">No active automation rules. Create a rule above to start automating governance work.</p>
          : (
            <div className="space-y-3">
              {activeRules.map(rule => (
                <div key={rule.id} className="flex items-start justify-between gap-3 rounded-xl border border-[var(--color-line)] p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{rule.name}</span>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">active</span>
                    </div>
                    {rule.description && <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{rule.description}</p>}
                    <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-md bg-[var(--color-blue)]/10 px-2 py-0.5 font-mono text-[var(--color-blue)]">
                        WHEN {rule.trigger_event}
                      </span>
                      <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-purple-300">
                        THEN {ACTION_LABELS[rule.action_type] ?? rule.action_type}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--color-ink-dim)]">
                      Ran {rule.run_count} times
                      {rule.last_run_at && ` · last ${new Date(rule.last_run_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ToggleRuleButton ruleId={rule.id} active={rule.active} />
                    <DeleteRuleButton ruleId={rule.id} />
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Inactive Rules */}
      {inactiveRules.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-[var(--color-ink-dim)]" />
            <span className="text-sm font-semibold">Paused Rules</span>
            <span className="ml-auto rounded-full bg-[#F8F9FB] px-2 py-0.5 text-[11px] text-[var(--color-ink-dim)]">{inactiveRules.length}</span>
          </div>
          <div className="space-y-2">
            {inactiveRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] p-3 opacity-60">
                <div>
                  <div className="text-sm font-medium">{rule.name}</div>
                  <div className="mt-0.5 text-[11px] text-[var(--color-ink-dim)] font-mono">{rule.trigger_event} → {ACTION_LABELS[rule.action_type] ?? rule.action_type}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <ToggleRuleButton ruleId={rule.id} active={rule.active} />
                  <DeleteRuleButton ruleId={rule.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
