export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import {
  getDashboardDataAction,
  generateAdvisoryAction,
} from "@/lib/toe/actions";
import {
  ToeStat, ToeSubNav, InstanceStatusBadge, ApprovalStatusBadge,
  EventSeverityBadge, PriorityBadge, fmtDt,
} from "@/components/toe/toe-ui";
import {
  Zap, GitBranch, CheckSquare, Bot, BarChart3, Terminal,
  ArrowRight, Clock, AlertTriangle, Activity,
} from "lucide-react";

const MODULE_NAV = [
  { href: "/operations/events",         icon: Activity,    label: "Event Log",        desc: "All platform governance events" },
  { href: "/operations/workflows",      icon: GitBranch,   label: "Workflows",         desc: "Orchestrated governance workflows" },
  { href: "/operations/approvals",      icon: CheckSquare, label: "Approvals",         desc: "Unified approval queue" },
  { href: "/operations/automation",     icon: Zap,         label: "Automation",        desc: "Event-driven automation rules" },
  { href: "/operations/analytics",      icon: BarChart3,   label: "Analytics",         desc: "Workflow performance metrics" },
  { href: "/operations/command-center", icon: Terminal,    label: "Command Center",    desc: "Governance mission control" },
  { href: "/operations/ai",             icon: Bot,         label: "AI Engine",         desc: "AI-assisted decision support" },
];

export default async function OperationsHubPage() {
  await requireUser();

  const [dashResult, advisoryResult] = await Promise.all([
    getDashboardDataAction().catch(() => null),
    generateAdvisoryAction().catch(() => null),
  ]);

  const d = (dashResult as { data?: { metrics?: { pendingApprovals?: number; activeWorkflows?: number; eventsToday?: number; openDecisions?: number; automationRules?: number; completedWorkflows?: number; failedWorkflows?: number }; recentEvents?: Array<{ id: string; event_type: string; entity_type: string | null; published_at: string }>; pendingApprovals?: Array<{ id: string; title: string; request_type: string; status: string; created_at: string }>; activeInstances?: Array<{ id: string; workflow_name: string; status: string; current_step: number; total_steps: number; started_at: string }>; openDecisions?: Array<{ id: string; title: string; priority: string; confidence: number }> } } | null)?.data;
  const m = d?.metrics;
  const advisory = (advisoryResult as { data?: string } | null)?.data;

  return (
    <div className="space-y-6 p-6">
      <ToeSubNav />

      {/* Header */}
      <div className="pt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Trust Operations Engine&#8482;</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            The orchestration layer connecting every governance capability into one intelligent operating system.
          </p>
        </div>
        <Link
          href="/operations/command-center"
          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <Terminal className="h-4 w-4" /> Command Center &#8594;
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <ToeStat label="Pending Approvals" value={m?.pendingApprovals ?? 0} accent={(m?.pendingApprovals ?? 0) > 0 ? "warn" : "neutral"} href="/operations/approvals" />
        <ToeStat label="Active Workflows"  value={m?.activeWorkflows ?? 0}  accent="blue"    href="/operations/workflows" />
        <ToeStat label="Events Today"      value={m?.eventsToday ?? 0}      accent="neutral" href="/operations/events" />
        <ToeStat label="Open AI Decisions" value={m?.openDecisions ?? 0}    accent={(m?.openDecisions ?? 0) > 0 ? "purple" : "neutral"} href="/operations/ai" />
        <ToeStat label="Automation Rules"  value={m?.automationRules ?? 0}  accent="good"    href="/operations/automation" />
        <ToeStat label="Completed Workflows" value={m?.completedWorkflows ?? 0} accent="good" href="/operations/workflows" />
        <ToeStat label="Failed Workflows"  value={m?.failedWorkflows ?? 0}  accent={(m?.failedWorkflows ?? 0) > 0 ? "danger" : "neutral"} href="/operations/workflows" />
      </div>

      {/* Vision callout */}
      <div className="rounded-2xl border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.05] p-5">
        <div className="flex items-start gap-4">
          <Zap className="mt-0.5 h-8 w-8 shrink-0 text-[var(--color-blue)]" />
          <div>
            <div className="font-semibold text-sm text-[var(--color-blue)]">Every governance event triggers the next appropriate action</div>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)] leading-relaxed">
              The Trust Operations Engine connects Vendor Hub&#8482;, Risk Lens&#8482;, Evidence Vault&#8482;, Audit Management&#8482;,
              Control Center&#8482;, and every other governance module into a unified event-driven platform.
              Workflows execute automatically, AI recommends next actions, and approvals route to the right people &#8212; without manual handoffs.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Event Engine", "Workflow Orchestration", "Automation", "AI Decisions", "Approval Queue", "Cross-Module Intelligence"].map(t => (
                <span key={t} className="rounded-full border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.08] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-blue)]">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Advisory */}
      {advisory && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Bot className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold">Operations Advisory</span>
            <span className="ml-auto text-[10px] text-[var(--color-ink-dim)]">AI &#8212; cached 24h</span>
          </div>
          <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed whitespace-pre-wrap">{advisory}</p>
        </div>
      )}

      {/* Module nav grid */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-ink-dim)]">Operations Modules</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODULE_NAV.map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-4 hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/[0.03] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-blue)]/10">
                  <Icon className="h-4 w-4 text-[var(--color-blue)]" />
                </div>
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-[var(--color-ink-dim)]">{desc}</div>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-[var(--color-ink-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Events */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-[var(--color-blue)]" /> Recent Events</h3>
            <Link href="/operations/events" className="text-xs text-[var(--color-blue)] hover:underline">View all</Link>
          </div>
          {(d?.recentEvents ?? []).length === 0
            ? <p className="text-sm text-[var(--color-ink-dim)]">No events yet. Events are published automatically as governance actions occur.</p>
            : <div className="space-y-2">
                {(d?.recentEvents ?? []).slice(0, 6).map(ev => (
                  <div key={ev.id} className="flex items-center justify-between gap-2 py-1 text-xs border-b border-[var(--color-line)] last:border-0">
                    <span className="text-[var(--color-ink-dim)] font-mono">{ev.event_type}</span>
                    <span className="shrink-0 text-[var(--color-ink-dim)]">{fmtDt(ev.published_at)}</span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Pending Approvals */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><CheckSquare className="h-4 w-4 text-amber-400" /> Pending Approvals</h3>
            <Link href="/operations/approvals" className="text-xs text-[var(--color-blue)] hover:underline">View all</Link>
          </div>
          {(d?.pendingApprovals ?? []).length === 0
            ? <p className="text-sm text-[var(--color-ink-dim)]">No pending approvals. Approval requests will appear here.</p>
            : <div className="space-y-2">
                {(d?.pendingApprovals ?? []).map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--color-line)] last:border-0">
                    <div>
                      <div className="text-xs font-medium">{a.title}</div>
                      <div className="text-[11px] text-[var(--color-ink-dim)]">{a.request_type}</div>
                    </div>
                    <ApprovalStatusBadge status={a.status} />
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Active Workflows */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><GitBranch className="h-4 w-4 text-[var(--color-blue)]" /> Active Workflows</h3>
            <Link href="/operations/workflows" className="text-xs text-[var(--color-blue)] hover:underline">View all</Link>
          </div>
          {(d?.activeInstances ?? []).length === 0
            ? <p className="text-sm text-[var(--color-ink-dim)]">No active workflows. Start a workflow from the Workflows page.</p>
            : <div className="space-y-2">
                {(d?.activeInstances ?? []).map(inst => (
                  <div key={inst.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--color-line)] last:border-0">
                    <div>
                      <div className="text-xs font-medium">{inst.workflow_name}</div>
                      <div className="text-[11px] text-[var(--color-ink-dim)]">Step {inst.current_step + 1} of {inst.total_steps}</div>
                    </div>
                    <InstanceStatusBadge status={inst.status} />
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {/* Open AI Decisions */}
      {(d?.openDecisions ?? []).length > 0 && (
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Bot className="h-4 w-4 text-purple-400" /> Open AI Decisions</h3>
            <Link href="/operations/ai" className="text-xs text-[var(--color-blue)] hover:underline">View all</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(d?.openDecisions ?? []).map(dec => (
              <div key={dec.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/40 p-3">
                <div className="mb-1 flex items-center justify-between gap-1">
                  <PriorityBadge priority={dec.priority} />
                  <span className="text-[11px] text-[var(--color-ink-dim)]">{dec.confidence}% confidence</span>
                </div>
                <div className="text-xs font-medium leading-snug">{dec.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
