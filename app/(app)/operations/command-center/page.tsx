export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardDataAction } from "@/lib/toe/actions";
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

  return (
    <div className="space-y-6 p-6">
      <ToeSubNav />

      <div className="pt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Governance Command Center™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Mission control for trust operations — real-time visibility across every governance activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Live</span>
        </div>
      </div>

      {/* Attention Required */}
      {issues.length > 0 && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Requires Attention</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map(issue => (
              <Link key={issue.label} href={issue.href}
                className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/40 px-3 py-2 hover:border-red-500/30 transition-colors"
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { label: "Active Vendors",    value: cs?.activeVendors ?? "—",    href: "/vendors",                   color: "text-[var(--color-blue)]" },
          { label: "Open Risks",        value: cs?.openRisks ?? "—",        href: "/risks",                     color: (cs?.openRisks ?? 0) > 10 ? "text-amber-400" : "text-[var(--color-ink)]" },
          { label: "Weak Controls",     value: cs?.weakControls ?? "—",     href: "/controls",                  color: (cs?.weakControls ?? 0) > 0 ? "text-amber-400" : "text-emerald-400" },
          { label: "Active Audits",     value: cs?.activeAudits ?? "—",     href: "/audits",                    color: "text-[var(--color-ink)]" },
          { label: "Expired Evidence",  value: cs?.expiredEvidence ?? "—",  href: "/compliance/evidence",       color: (cs?.expiredEvidence ?? 0) > 0 ? "text-red-400" : "text-emerald-400" },
          { label: "Overdue CAPAs",     value: cs?.overdueCapas ?? "—",     href: "/audits/capas",              color: (cs?.overdueCapas ?? 0) > 0 ? "text-red-400" : "text-emerald-400" },
          { label: "Expiring Contracts",value: cs?.expiringContracts ?? "—",href: "/contract-governance/renewals", color: (cs?.expiringContracts ?? 0) > 0 ? "text-amber-400" : "text-[var(--color-ink)]" },
        ].map(({ label, value, href, color }) => (
          <Link key={label} href={href}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-3 hover:border-[var(--color-blue)]/30 transition-colors"
          >
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-[11px] text-[var(--color-ink-dim)]">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Workflows */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><GitBranch className="h-4 w-4 text-[var(--color-blue)]" /> Active Workflows</h3>
            <Link href="/operations/workflows" className="text-xs text-[var(--color-blue)] hover:underline">All</Link>
          </div>
          {activeInstances.length === 0
            ? <p className="text-sm text-[var(--color-ink-dim)]">No active workflows.</p>
            : activeInstances.map(inst => (
              <div key={inst.id} className="flex items-center justify-between gap-2 py-2 border-b border-[var(--color-line)] last:border-0">
                <div>
                  <div className="text-xs font-medium">{inst.workflow_name}</div>
                  <div className="text-[11px] text-[var(--color-ink-dim)]">Step {inst.current_step + 1}/{inst.total_steps}</div>
                </div>
                <InstanceStatusBadge status={inst.status} />
              </div>
            ))
          }
        </div>

        {/* Pending Approvals */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><CheckSquare className="h-4 w-4 text-amber-400" /> Pending Approvals</h3>
            <Link href="/operations/approvals" className="text-xs text-[var(--color-blue)] hover:underline">All</Link>
          </div>
          {pendingApprovals.length === 0
            ? <p className="text-sm text-[var(--color-ink-dim)]">No pending approvals.</p>
            : pendingApprovals.map(a => (
              <div key={a.id} className="flex items-center justify-between gap-2 py-2 border-b border-[var(--color-line)] last:border-0">
                <div>
                  <div className="text-xs font-medium">{a.title}</div>
                  <div className="text-[11px] text-[var(--color-ink-dim)]">{a.request_type}</div>
                </div>
                <ApprovalStatusBadge status={a.status} />
              </div>
            ))
          }
        </div>

        {/* Event Stream */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--color-blue)]" /> Live Event Stream
            </h3>
            <Link href="/operations/events" className="text-xs text-[var(--color-blue)] hover:underline">All</Link>
          </div>
          {recentEvents.length === 0
            ? <p className="text-sm text-[var(--color-ink-dim)]">No events yet.</p>
            : recentEvents.slice(0, 8).map(ev => (
              <div key={ev.id} className="flex items-center gap-2 py-1.5 border-b border-[var(--color-line)] last:border-0">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-blue)]" />
                <span className="flex-1 font-mono text-[11px] text-[var(--color-ink-dim)] truncate">{ev.event_type}</span>
                <span className="shrink-0 text-[10px] text-[var(--color-ink-dim)]">{fmtDt(ev.published_at)}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* AI Decisions */}
      {openDecisions.length > 0 && (
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Bot className="h-4 w-4 text-purple-400" /> Open AI Decisions</h3>
            <Link href="/operations/ai" className="text-xs text-[var(--color-blue)] hover:underline">Review all</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {openDecisions.map(dec => (
              <div key={dec.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/40 p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <PriorityBadge priority={dec.priority} />
                  <span className="text-[11px] text-[var(--color-ink-dim)]">{dec.confidence}%</span>
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
