export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardDataAction } from "@/backend/src/modules/toe/actions";
import { ToeSubNav, InstanceStatusBadge, ApprovalStatusBadge, PriorityBadge, fmtDt } from "@/components/toe/toe-ui";
import { Terminal, Activity, GitBranch, CheckSquare, Zap, Bot, AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function getOrgId(userId: string): Promise<string> {
  const rows = await db.execute(sql`
    SELECT organization_id FROM memberships WHERE user_id = ${userId} LIMIT 1
  `);
  return (rows as unknown as Array<{ organization_id: string }>)[0]?.organization_id ?? "";
}

async function getCrossModuleStats(orgId: string) {
  const [vendors, risks, controls, audits, evidence, capas, contracts] = await Promise.all([
    db.execute(sql`SELECT count(*)::int AS n FROM vendors WHERE organization_id = ${orgId} AND status != 'offboarded'`),
    db.execute(sql`SELECT count(*)::int AS n FROM risks WHERE organization_id = ${orgId} AND status IN ('open','mitigating','identified')`),
    db.execute(sql`SELECT count(*)::int AS n FROM controls WHERE organization_id = ${orgId} AND health_score < 60`),
    db.execute(sql`SELECT count(*)::int AS n FROM audits WHERE organization_id = ${orgId} AND status = 'active'`),
    db.execute(sql`SELECT count(*)::int AS n FROM evidence WHERE organization_id = ${orgId} AND status = 'expired'`),
    db.execute(sql`SELECT count(*)::int AS n FROM corrective_actions WHERE organization_id = ${orgId} AND status IN ('open','in_progress') AND due_date < now()`),
    db.execute(sql`SELECT count(*)::int AS n FROM contracts WHERE organization_id = ${orgId} AND status = 'active' AND end_date < now() + interval '90 days'`),
  ]);

  const n = (r: unknown) => (r as unknown as Array<{ n: number }>)[0]?.n ?? 0;
  return {
    activeVendors: n(vendors),
    openRisks: n(risks),
    weakControls: n(controls),
    activeAudits: n(audits),
    expiredEvidence: n(evidence),
    overdueCapas: n(capas),
    expiringContracts: n(contracts),
  };
}

export default async function CommandCenterPage() {
  const session = await requireUser();

  const [dashResult, crossStats] = await Promise.all([
    getDashboardDataAction().catch(() => null),
    getCrossModuleStats(session.org?.id ?? "").catch(() => null),
  ]);

  const d = (dashResult as { data?: { metrics?: { pendingApprovals?: number; activeWorkflows?: number; eventsToday?: number; openDecisions?: number; automationRules?: number }; pendingApprovals?: unknown[]; activeInstances?: unknown[]; openDecisions?: unknown[]; recentEvents?: unknown[] } } | null)?.data;
  const m = d?.metrics;
  const cs = crossStats;

  const pendingApprovals = (d?.pendingApprovals ?? []) as Array<{ id: string; title: string; request_type: string; status: string }>;
  const activeInstances = (d?.activeInstances ?? []) as Array<{ id: string; workflow_name: string; status: string; current_step: number; total_steps: number }>;
  const openDecisions = (d?.openDecisions ?? []) as Array<{ id: string; title: string; priority: string; confidence: number }>;
  const recentEvents = (d?.recentEvents ?? []) as Array<{ id: string; event_type: string; published_at: string }>;

  const issues = [
    cs?.expiredEvidence && cs.expiredEvidence > 0 && { label: "Expired Evidence", value: cs.expiredEvidence, href: "/compliance/evidence", severity: "critical" },
    cs?.overdueCapas && cs.overdueCapas > 0 && { label: "Overdue CAPAs", value: cs.overdueCapas, href: "/audits/capas", severity: "high" },
    (m?.pendingApprovals ?? 0) > 0 && { label: "Pending Approvals", value: m?.pendingApprovals, href: "/operations/approvals", severity: "high" },
    cs?.weakControls && cs.weakControls > 0 && { label: "Weak Controls", value: cs.weakControls, href: "/controls", severity: "medium" },
    cs?.expiringContracts && cs.expiringContracts > 0 && { label: "Contracts Expiring (90d)", value: cs.expiringContracts, href: "/contract-governance/renewals", severity: "medium" },
    ((m as Record<string, unknown>)?.failedWorkflows as number ?? 0) > 0 && { label: "Failed Workflows", value: (m as Record<string, unknown>)?.failedWorkflows as number, href: "/operations/workflows", severity: "medium" },
  ].filter(Boolean) as Array<{ label: string; value: number; href: string; severity: string }>;

  const statCards = [
    { label: "Active Vendors",     value: cs?.activeVendors    ?? "—", href: "/vendors",                      alert: false },
    { label: "Open Risks",         value: cs?.openRisks        ?? "—", href: "/risks",                        alert: (cs?.openRisks ?? 0) > 10 },
    { label: "Weak Controls",      value: cs?.weakControls     ?? "—", href: "/controls",                     alert: (cs?.weakControls ?? 0) > 0 },
    { label: "Active Audits",      value: cs?.activeAudits     ?? "—", href: "/audits",                       alert: false },
    { label: "Expired Evidence",   value: cs?.expiredEvidence  ?? "—", href: "/compliance/evidence",          alert: (cs?.expiredEvidence ?? 0) > 0 },
    { label: "Overdue CAPAs",      value: cs?.overdueCapas     ?? "—", href: "/audits/capas",                 alert: (cs?.overdueCapas ?? 0) > 0 },
    { label: "Expiring Contracts", value: cs?.expiringContracts ?? "—", href: "/contract-governance/renewals", alert: (cs?.expiringContracts ?? 0) > 0 },
  ];

  return (
    <div className="space-y-6 p-6">
      <ToeSubNav />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Governance Command Center™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Mission control for trust operations — real-time visibility across every governance activity.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-600 font-medium">Live</span>
        </div>
      </div>

      {/* Attention Strip */}
      {issues.length > 0 && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Requires Attention</span>
            <span className="ml-auto text-xs text-[var(--color-ink-dim)]">{issues.length} item{issues.length > 1 ? "s" : ""}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map(issue => (
              <Link key={issue.label} href={issue.href}
                className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-white px-3 py-2.5 transition-colors hover:bg-[#F8F9FB] hover:border-red-500/30"
              >
                <span className="text-xs text-[var(--color-ink-dim)]">{issue.label}</span>
                <span className={`text-sm font-bold ${
                  issue.severity === "critical" ? "text-red-400" : issue.severity === "high" ? "text-orange-400" : "text-amber-400"
                }`}>{issue.value}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Platform Health Strip */}
      <div>
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Platform Health</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {statCards.map(({ label, value, href, alert }) => (
            <Link key={label} href={href}
              className={`rounded-xl border border-l-2 px-4 py-3.5 transition-colors hover:bg-[#F8F9FB] ${
                alert
                  ? "border-[var(--color-line)] border-l-red-500/60 bg-red-500/[0.04]"
                  : "border-[var(--color-line)] border-l-[var(--color-blue)]/40 bg-white"
              }`}
            >
              <div className={`font-[family-name:var(--font-display)] text-2xl font-extrabold ${alert ? "text-red-400" : "text-[var(--color-ink)]"}`}>
                {value}
              </div>
              <div className="mt-0.5 text-[11px] text-[var(--color-ink-faint)]">{label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Live Operations */}
      <div>
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Live Operations</div>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Active Workflows */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-blue)]/10">
                  <GitBranch className="h-4 w-4 text-[var(--color-blue)]" />
                </div>
                <span className="font-[family-name:var(--font-display)] text-sm font-semibold">Active Workflows</span>
              </div>
              <Link href="/operations/workflows" className="flex items-center gap-1 text-xs text-[var(--color-blue)] hover:underline">
                All <TrendingUp className="h-3 w-3" />
              </Link>
            </div>
            {activeInstances.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle className="h-7 w-7 text-emerald-400/50" />
                <p className="text-xs text-[var(--color-ink-dim)]">No active workflows running.</p>
              </div>
            ) : activeInstances.map(inst => (
              <div key={inst.id} className="flex items-center justify-between gap-2 border-b border-[var(--color-line)] py-2.5 last:border-0">
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-[var(--color-ink)]">{inst.workflow_name}</div>
                  <div className="text-[11px] text-[var(--color-ink-faint)]">Step {inst.current_step + 1}/{inst.total_steps}</div>
                </div>
                <InstanceStatusBadge status={inst.status} />
              </div>
            ))}
          </div>

          {/* Pending Approvals */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/10">
                  <CheckSquare className="h-4 w-4 text-amber-500" />
                </div>
                <span className="font-[family-name:var(--font-display)] text-sm font-semibold">Pending Approvals</span>
              </div>
              <Link href="/operations/approvals" className="text-xs text-[var(--color-blue)] hover:underline">All</Link>
            </div>
            {pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle className="h-7 w-7 text-emerald-400/50" />
                <p className="text-xs text-[var(--color-ink-dim)]">No pending approvals.</p>
              </div>
            ) : pendingApprovals.map(a => (
              <div key={a.id} className="flex items-center justify-between gap-2 border-b border-[var(--color-line)] py-2.5 last:border-0">
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-[var(--color-ink)]">{a.title}</div>
                  <div className="text-[11px] text-[var(--color-ink-faint)]">{a.request_type}</div>
                </div>
                <ApprovalStatusBadge status={a.status} />
              </div>
            ))}
          </div>

          {/* Event Stream */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-blue)]/10">
                  <Activity className="h-4 w-4 text-[var(--color-blue)]" />
                </div>
                <span className="font-[family-name:var(--font-display)] text-sm font-semibold">Live Event Stream</span>
              </div>
              <Link href="/operations/events" className="text-xs text-[var(--color-blue)] hover:underline">All</Link>
            </div>
            {recentEvents.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Clock className="h-7 w-7 text-[var(--color-ink-faint)]" />
                <p className="text-xs text-[var(--color-ink-dim)]">No events yet.</p>
              </div>
            ) : recentEvents.slice(0, 8).map(ev => (
              <div key={ev.id} className="flex items-center gap-2 border-b border-[var(--color-line)] py-1.5 last:border-0">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-blue)]" />
                <span className="flex-1 font-mono text-[11px] text-[var(--color-ink-dim)] truncate">{ev.event_type}</span>
                <span className="shrink-0 text-[10px] text-[var(--color-ink-faint)]">{fmtDt(ev.published_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Decisions */}
      {openDecisions.length > 0 && (
        <div>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Open AI Decisions</div>
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-500/10">
                  <Bot className="h-4 w-4 text-indigo-400" />
                </div>
                <span className="font-[family-name:var(--font-display)] text-sm font-semibold">AI Decision Engine™</span>
              </div>
              <Link href="/operations/ai" className="text-xs text-[var(--color-blue)] hover:underline">Review all</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {openDecisions.map(dec => (
                <div key={dec.id} className="rounded-xl border border-[var(--color-line)] bg-white p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <PriorityBadge priority={dec.priority} />
                    <span className="text-[11px] text-[var(--color-ink-dim)]">{dec.confidence}% confidence</span>
                  </div>
                  <div className="text-xs font-medium leading-snug text-[var(--color-ink)]">{dec.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
