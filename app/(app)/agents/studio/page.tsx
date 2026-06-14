export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { createAgentAction } from "@/lib/agents/actions";
import { Sparkles } from "lucide-react";
import { AgentSubNav } from "@/components/agents/agent-ui";
import { AgentStudioForm } from "@/components/agents/agent-studio-form";

const AGENT_TYPES = [
  { value: "risk_monitor",       label: "Risk Monitor",        desc: "Monitors open risks, escalates critical ones" },
  { value: "vendor_watcher",     label: "Vendor Watch",        desc: "Tracks vendor trust score changes" },
  { value: "compliance_checker", label: "Compliance Guardian", desc: "Validates control effectiveness and evidence freshness" },
  { value: "control_validator",  label: "Control Validator",   desc: "Tests and validates governance controls" },
  { value: "policy_enforcer",    label: "Policy Enforcer",     desc: "Tracks policy attestation and reminders" },
  { value: "audit_assistant",    label: "Audit Prep Agent",    desc: "Gathers evidence ahead of scheduled audits" },
  { value: "custom",             label: "Custom Agent",        desc: "Define your own governance automation logic" },
];

const EXECUTION_MODES = [
  { value: "autonomous",     label: "Autonomous",     desc: "Takes actions automatically without approval" },
  { value: "supervised",     label: "Supervised",     desc: "Proposes actions — you approve each one" },
  { value: "advisory",       label: "Advisory",       desc: "Observations and recommendations only — no actions" },
  { value: "semi_autonomous", label: "Semi-Autonomous", desc: "Auto-executes low-risk actions; escalates high-risk" },
];

const TRIGGER_TYPES = [
  { value: "scheduled",   label: "Scheduled",   desc: "Runs on a cron schedule (e.g. every 6h, daily)" },
  { value: "event",       label: "Event-driven", desc: "Triggers on governance events (new risk, failed check)" },
  { value: "manual",      label: "Manual",       desc: "Only runs when you trigger it manually" },
  { value: "continuous",  label: "Continuous",   desc: "Runs in a tight loop (low-latency monitoring)" },
];

const APPROVAL_MODES = [
  { value: "required",     label: "Require Approval", desc: "All proposed actions need human approval" },
  { value: "auto",         label: "Auto-Approve",     desc: "Actions execute automatically (use with care)" },
  { value: "notify_only",  label: "Notify Only",       desc: "No actions taken — notifications and observations only" },
];

export default async function AgentStudioPage() {
  await requireUser();

  return (
    <div className="space-y-6 p-6">
      <AgentSubNav />

      {/* Header */}
      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Agent Studio™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Design, configure, and deploy custom governance agents.</p>
      </div>

      {/* Info callout */}
      <div className="rounded-2xl border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.05] p-4 flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 text-[var(--color-blue)] shrink-0" />
        <div>
          <p className="text-sm font-medium text-[var(--color-blue)]">Build AI-powered governance automation in minutes</p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">
            Define what your agent monitors, how it reasons, and what actions it proposes. Agents use your AUDT governance data as context.
          </p>
        </div>
      </div>

      {/* Form */}
      <AgentStudioForm
        agentTypes={AGENT_TYPES}
        executionModes={EXECUTION_MODES}
        triggerTypes={TRIGGER_TYPES}
        approvalModes={APPROVAL_MODES}
        createAction={createAgentAction}
      />
    </div>
  );
}
