export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getAutomationRules } from "@/lib/services/continuous-compliance/continuous-compliance-service";
import { createRuleAction, toggleRuleAction } from "@/lib/continuous-compliance/actions";
import { Zap, Plus } from "lucide-react";
import { StatusBadge, CcStat, CcSubNav } from "@/components/continuous-compliance/cc-ui";

const TRIGGER_LABELS: Record<string, string> = {
  check_failed:            "Check Fails",
  check_passed:            "Check Passes",
  signal_created:          "Signal Created",
  trust_score_drop:        "Trust Score Drops",
  policy_expired:          "Policy Expires",
  contract_obligation:     "Contract Obligation Due",
  training_overdue:        "Training Overdue",
  verification_expiring:   "Verification Expiring",
};

const EXAMPLE_RULES = [
  { trigger: "check_failed", name: "MFA Check Failure → Create Issue", actions: ["Create Issue", "Notify Owner"] },
  { trigger: "trust_score_drop", name: "Trust Drop → Trigger Review", actions: ["Trigger Review", "Alert Compliance Manager"] },
  { trigger: "training_overdue", name: "Training Overdue → Escalate", actions: ["Send Reminder", "Escalate if 7d+"] },
  { trigger: "verification_expiring", name: "Cert Expiring → Start Renewal", actions: ["Create Renewal Task", "Notify Owner"] },
];

export default async function AutomationPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const rules = await getAutomationRules(orgId).catch(() => []);
  const active = rules.filter(r => r.status === "active").length;

  return (
    <div className="space-y-6 p-6">
      <CcSubNav />

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Compliance Automation Rules™</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">If-this-then-that automation for compliance events</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <CcStat label="Active Rules" value={active}       accent="blue" />
        <CcStat label="Total Rules"  value={rules.length} accent="neutral" />
        <CcStat label="Runs Today"   value={rules.reduce((s, r) => s + r.runCount, 0)} accent="neutral" />
      </div>

      {/* Create form */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-sm">
          <Plus className="h-4 w-4 text-[var(--color-blue)]" /> New Automation Rule
        </h3>
        <form action={createRuleAction.bind(null, null)} className="grid grid-cols-2 gap-3">
          <input name="name" required placeholder="Rule name *"
            className="col-span-2 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]" />
          <select name="triggerType"
            className="col-span-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]">
            {Object.entries(TRIGGER_LABELS).map(([v, l]) => <option key={v} value={v}>IF: {l}</option>)}
          </select>
          <textarea name="description" rows={2} placeholder="Description (optional)"
            className="col-span-2 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]" />
          <button type="submit"
            className="col-span-2 rounded-xl grad-brand py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
            Create Rule
          </button>
        </form>
      </div>

      {/* Existing rules */}
      {rules.length > 0 ? (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-[var(--color-blue)]" />
                <div>
                  <div className="text-sm font-medium">{rule.name}</div>
                  <div className="mt-0.5 text-xs text-[var(--color-ink-dim)]">
                    IF: <span className="text-[var(--color-ink)]">{TRIGGER_LABELS[rule.triggerType] ?? rule.triggerType}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-ink-faint)]">{rule.runCount} runs</span>
                <StatusBadge status={rule.status} />
                <form action={async () => { "use server"; await toggleRuleAction(rule.id, rule.status !== "active"); }}>
                  <button type="submit"
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors border ${
                      rule.status === "active"
                        ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    }`}>
                    {rule.status === "active" ? "Disable" : "Enable"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Example rules */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-dim)]">Example Rules</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {EXAMPLE_RULES.map((ex, i) => (
                <div key={i} className="rounded-xl border border-[var(--color-line)]/50 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-[var(--color-blue)] opacity-60" />
                    <span className="text-xs font-medium">{ex.name}</span>
                  </div>
                  <div className="text-[11px] text-[var(--color-ink-faint)]">Trigger: {TRIGGER_LABELS[ex.trigger]}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {ex.actions.map(a => (
                      <span key={a} className="rounded-full bg-[#F8F9FB] px-1.5 py-0.5 text-[10px]">{a}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
