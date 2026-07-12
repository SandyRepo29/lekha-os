export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { GitBranch, ArrowDown, CheckCircle, Shield, Eye, Lightbulb, Zap, Bot } from "lucide-react";
import { AgentSubNav } from "@/components/agents/agent-ui";

const SWEEP_STEPS = [
  {
    icon: Shield,
    step: "1",
    name: "Risk Sentinel™",
    desc: "Scans Risk Lens™ for critical/high risks overdue for review or without treatment plans.",
    output: "Observations → Risk Gaps",
    color: "text-red-700",
    bg: "bg-red-500/[0.08]",
    border: "border-red-200",
  },
  {
    icon: Eye,
    step: "2",
    name: "Vendor Watch™",
    desc: "Checks all active vendors for trust score decline, expired evidence, overdue assessments.",
    output: "Observations → Vendor Alerts",
    color: "text-orange-700",
    bg: "bg-orange-500/[0.08]",
    border: "border-orange-200",
  },
  {
    icon: Shield,
    step: "3",
    name: "Compliance Guardian™",
    desc: "Validates control effectiveness, checks evidence freshness against active frameworks.",
    output: "Observations → Compliance Gaps",
    color: "text-blue-700",
    bg: "bg-blue-500/[0.08]",
    border: "border-blue-200",
  },
  {
    icon: Lightbulb,
    step: "4",
    name: "Recommendation Engine™",
    desc: "Aggregates all observations, applies priority scoring, generates ranked action list.",
    output: "Recommendations → Action Queue",
    color: "text-amber-700",
    bg: "bg-amber-500/[0.08]",
    border: "border-amber-200",
  },
  {
    icon: Zap,
    step: "5",
    name: "Action Executor™",
    desc: "Evaluates each action against approval mode. Auto-executes low-risk; queues rest for approval.",
    output: "Actions → Executed / Pending Approval",
    color: "text-emerald-700",
    bg: "bg-emerald-500/[0.08]",
    border: "border-emerald-200",
  },
  {
    icon: Bot,
    step: "6",
    name: "Copilot™ Summary",
    desc: "Governance Copilot™ generates a run summary and updates its context window for NL queries.",
    output: "Context → Copilot Answers",
    color: "text-purple-700",
    bg: "bg-purple-500/[0.08]",
    border: "border-purple-200",
  },
];

const PIPELINES = [
  {
    name: "Governance Sweep™",
    description: "Full governance scan — runs all agents in sequence, aggregates findings, and updates Copilot™ context.",
    schedule: "Every 6 hours",
    status: "active",
    lastRun: "2 hours ago",
    nextRun: "In 4 hours",
    agentCount: 5,
  },
  {
    name: "Vendor Health Check™",
    description: "Targeted vendor trust and evidence scan for all active vendors.",
    schedule: "Daily at 9am",
    status: "active",
    lastRun: "14 hours ago",
    nextRun: "Tomorrow 9am",
    agentCount: 1,
  },
  {
    name: "Pre-Audit Sweep™",
    description: "Deep evidence and control scan triggered 2 weeks before a scheduled audit.",
    schedule: "Event-triggered",
    status: "idle",
    lastRun: "3 days ago",
    nextRun: "On next audit schedule",
    agentCount: 3,
  },
];

export default async function OrchestrationPage() {
  await requireUser();

  return (
    <div className="space-y-6 p-6">
      <AgentSubNav />

      {/* Header */}
      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Agent Orchestration™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Multi-agent governance pipelines that coordinate agents into unified sweeps.</p>
      </div>

      {/* Active pipelines */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-ink-dim)] uppercase tracking-wider">Active Pipelines</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {PIPELINES.map(p => (
            <div key={p.name} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-sm">{p.name}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                  p.status === "active"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-[#F8F9FB] text-[var(--color-ink-faint)] border-[var(--color-line)]"
                }`}>
                  {p.status}
                </span>
              </div>
              <p className="text-xs text-[var(--color-ink-dim)] mb-3">{p.description}</p>
              <div className="space-y-1 text-[11px] text-[var(--color-ink-faint)]">
                <div className="flex justify-between">
                  <span>Schedule</span><span className="text-[var(--color-ink-dim)]">{p.schedule}</span>
                </div>
                <div className="flex justify-between">
                  <span>Agents</span><span className="text-[var(--color-ink-dim)]">{p.agentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last run</span><span className="text-[var(--color-ink-dim)]">{p.lastRun}</span>
                </div>
                <div className="flex justify-between">
                  <span>Next run</span><span className="text-[var(--color-blue)]">{p.nextRun}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Governance Sweep flow */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Governance Sweep™ — Pipeline Flow</h3>
            <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">Default orchestration pipeline. Runs every 6 hours.</p>
          </div>
          <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-1 text-xs text-emerald-700 font-medium">Active</span>
        </div>

        <div className="space-y-2">
          {SWEEP_STEPS.map((step, idx) => (
            <div key={step.step}>
              <div className={`rounded-xl border p-4 flex items-start gap-4 ${step.border} ${step.bg}`}>
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F8F9FB] border border-[#E4E8EF]`}>
                  <step.icon className={`h-4 w-4 ${step.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[var(--color-ink-faint)] w-5">#{step.step}</span>
                    <span className="font-semibold text-sm">{step.name}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{step.desc}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] text-[var(--color-ink-faint)]">Output:</span>
                    <span className={`text-[10px] font-medium ${step.color}`}>{step.output}</span>
                  </div>
                </div>
              </div>
              {idx < SWEEP_STEPS.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-[var(--color-ink-faint)]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Coming soon */}
      <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white/[0.01] p-6 text-center">
        <GitBranch className="mx-auto mb-2 h-8 w-8 text-[var(--color-blue)] opacity-40" />
        <p className="font-semibold text-sm">Custom Pipeline Builder — Coming Soon</p>
        <p className="mt-1 text-xs text-[var(--color-ink-dim)]">Drag-and-drop interface to build custom multi-agent governance pipelines with conditional routing and approval gates.</p>
      </div>
    </div>
  );
}
