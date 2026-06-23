export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ClipboardCheck, Plus, AlertTriangle, Brain, Activity,
  FileSearch, CheckCircle2, Clock, BarChart3, TrendingUp, Zap, Target,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics, listAudits } from "@/lib/services/audit/audit-service";
import { AuditStatusBadge, AuditTypeBadge, SeverityBadge } from "@/components/audit/audit-status-badge";
import { AuditStat, formatDate } from "@/components/audit/audit-ui";
import * as findingRepo from "@/lib/repositories/audit-finding-repo";
import * as capaRepo from "@/lib/repositories/corrective-action-repo";
import * as collabRepo from "@/lib/repositories/auditor-collaboration-repo";

export default async function AuditsDashboardPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardCheck}
          title="Audit Management&#8482;"
          description="Connect Supabase to start planning and executing audits."
        />
      </Card>
    );
  }

  const orgId = session.org.id;

  const [metrics, audits, severityCounts, allCapas, evidenceRequests] = await Promise.all([
    getDashboardMetrics(orgId),
    listAudits(orgId),
    findingRepo.countBySeverity(orgId),
    capaRepo.findByOrg(orgId).catch(() => [] as any[]),
    collabRepo.findAllEvidenceRequests(orgId).catch(() => [] as any[]),
  ]);

  const recentAudits = audits.slice(0, 6);

  // ── Audit Pipeline™ stages ──────────────────────────────────────
  const pipelineStages = [
    { label: "Planned",   count: metrics.planned,    color: "text-[var(--color-blue)]",  href: "/audits/list?status=planned"     },
    { label: "Fieldwork", count: metrics.inProgress, color: "text-amber-400",            href: "/audits/list?status=in_progress" },
    { label: "Review",    count: 0,                  color: "text-purple-400",           href: "/audits/list"                    },
    { label: "Reporting", count: 0,                  color: "text-cyan-400",             href: "/audits/list"                    },
    { label: "Closed",    count: metrics.completed,  color: "text-emerald-400",          href: "/audits/list?status=completed"   },
  ];

  // ── Evidence Requests™ ─────────────────────────────────────────
  const openRequests      = evidenceRequests.filter((r: any) => r.status === "open" || r.status === "pending").length;
  const overdueRequests   = evidenceRequests.filter((r: any) => r.status === "overdue").length;
  const completedRequests = evidenceRequests.filter((r: any) => r.status === "fulfilled" || r.status === "closed").length;
  const pendingReview     = evidenceRequests.filter((r: any) => r.status === "submitted").length;

  // ── CAPA Health™ ───────────────────────────────────────────────
  const openCapas      = allCapas.filter((c: any) => c.status === "open" || c.status === "in_progress").length;
  const overdueCapas   = allCapas.filter((c: any) => c.status === "overdue").length;
  const completedCapas = allCapas.filter((c: any) => c.status === "completed").length;
  const capaTotal      = allCapas.length;

  // Avg closure time (days) for completed CAPAs
  const completedWithDates = allCapas.filter(
    (c: any) => c.status === "completed" && c.completedAt && c.createdAt
  );
  const avgClosureDays = completedWithDates.length
    ? Math.round(
        completedWithDates.reduce((sum: number, c: any) => {
          const diff = new Date(c.completedAt).getTime() - new Date(c.createdAt).getTime();
          return sum + diff / (1000 * 60 * 60 * 24);
        }, 0) / completedWithDates.length
      )
    : null;

  // ── Audit Readiness™ score ─────────────────────────────────────
  // Scoring: start 100, deduct penalties
  let readinessScore = 100;
  const critPenalty = Math.min(30, (severityCounts["critical"] ?? 0) * 10);
  const highPenalty = Math.min(20, (severityCounts["high"] ?? 0) * 3);
  const overdueCapaPenalty = Math.min(15, overdueCapas * 5);
  const overdueAuditPenalty = Math.min(10, metrics.overdue * 5);
  readinessScore = Math.max(0, readinessScore - critPenalty - highPenalty - overdueCapaPenalty - overdueAuditPenalty);
  const readinessLabel =
    readinessScore >= 85 ? "Audit Ready" :
    readinessScore >= 65 ? "Needs Attention" :
    "Not Ready";
  const readinessColor =
    readinessScore >= 85 ? "text-emerald-400" :
    readinessScore >= 65 ? "text-amber-400" : "text-red-400";

  // ── Audit Intelligence™ derived insights ───────────────────────
  const totalFindings = (severityCounts["critical"] ?? 0) + (severityCounts["high"] ?? 0) + (severityCounts["medium"] ?? 0) + (severityCounts["low"] ?? 0);

  // ── Trust Impact (proxy) ───────────────────────────────────────
  // Audit readiness feeds 15% of Org Trust Score
  const currentTrustContrib   = Math.round((readinessScore / 100) * 15);
  const projectedTrustContrib = 15;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Audit Management&#8482;
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            Audit planning, execution, evidence, findings &#8212; CAPA to closure
          </p>
        </div>
        <Link href="/audits/new">
          <Button variant="primary" size="md"><Plus className="h-4 w-4" /> New Audit</Button>
        </Link>
      </div>

      {/* Row 1 — Primary KPIs (P2 Audit Readiness™ added) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AuditStat label="Total Audits"  value={metrics.total}       href="/audits/list" />
        <div className="rounded-xl border border-[var(--color-line)] border-l-2 border-l-emerald-400/60 bg-emerald-400/[0.04] p-4">
          <p className="text-xs text-[var(--color-ink-dim)] mb-1">Audit Readiness&#8482;</p>
          <p className={`font-[family-name:var(--font-display)] text-2xl font-bold ${readinessColor}`}>{readinessScore}%</p>
          <p className={`text-xs font-medium mt-0.5 ${readinessColor}`}>{readinessLabel}</p>
        </div>
        <AuditStat label="Open Findings" value={metrics.openFindings}
          accent={metrics.criticalFindings > 0 ? "danger" : metrics.openFindings > 0 ? "warn" : "good"}
          href="/audits/findings" />
        <AuditStat label="CAPAs Due Soon" value={metrics.capasDueSoon}
          accent={metrics.capasDueSoon > 0 ? "warn" : undefined}
          href="/audits/capas" />
      </div>

      {/* Row 2 — Pipeline + Evidence Requests (P3 + P4) */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Audit Pipeline™ */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--color-blue)]" />
              <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Audit Pipeline&#8482;</h2>
            </div>
            <Link href="/audits/list" className="text-xs text-[var(--color-blue)] hover:underline">View all &#8594;</Link>
          </div>
          <div className="space-y-2.5">
            {pipelineStages.map(({ label, count, color, href }) => (
              <Link key={label} href={href} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <span className="w-20 text-xs text-[var(--color-ink-dim)]">{label}</span>
                <div className="flex-1 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-[var(--color-blue)] transition-all"
                    style={{ width: metrics.total ? `${Math.round((count / metrics.total) * 100)}%` : "0%" }} />
                </div>
                <span className={`w-6 text-right text-sm font-bold ${color}`}>{count}</span>
              </Link>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--color-line)] grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-[var(--color-ink-faint)]">Overdue</p>
              <p className={`text-lg font-bold ${metrics.overdue > 0 ? "text-red-400" : "text-emerald-400"}`}>{metrics.overdue}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-ink-faint)]">Cancelled</p>
              <p className="text-lg font-bold text-[var(--color-ink-dim)]">{metrics.cancelled}</p>
            </div>
          </div>
        </div>

        {/* Evidence Requests™ */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-amber-400" />
              <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Evidence Requests&#8482;</h2>
            </div>
            <Link href="/auditor-collaboration/evidence" className="text-xs text-[var(--color-blue)] hover:underline">View all &#8594;</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Open Requests",       value: openRequests,      color: openRequests > 0      ? "text-amber-400"  : "text-emerald-400" },
              { label: "Overdue Requests",    value: overdueRequests,   color: overdueRequests > 0   ? "text-red-400"    : "text-emerald-400" },
              { label: "Completed",           value: completedRequests, color: "text-emerald-400" },
              { label: "Pending Review",      value: pendingReview,     color: pendingReview > 0     ? "text-[var(--color-blue)]" : "text-emerald-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-[var(--color-line)] p-3">
                <p className="text-[10px] text-[var(--color-ink-faint)]">{label}</p>
                <p className={`text-xl font-bold mt-0.5 ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          {evidenceRequests.length === 0 && (
            <p className="text-xs text-[var(--color-ink-dim)] mt-3">
              No evidence requests yet.{" "}
              <Link href="/auditor-collaboration" className="text-[var(--color-blue)] hover:underline">
                Set up Auditor Collaboration &#8594;
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Row 3 — Findings by Severity + CAPA Health™ (P5 + P6) */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Findings by Severity */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Findings by Severity</h2>
            </div>
            <Link href="/audits/findings" className="text-xs text-[var(--color-blue)] hover:underline">View all &#8594;</Link>
          </div>
          <div className="space-y-3">
            {[
              { label: "Critical", value: severityCounts["critical"] ?? 0, color: "text-red-400",    bg: "bg-red-500"    },
              { label: "High",     value: severityCounts["high"]     ?? 0, color: "text-orange-400", bg: "bg-orange-500" },
              { label: "Medium",   value: severityCounts["medium"]   ?? 0, color: "text-amber-400",  bg: "bg-amber-500"  },
              { label: "Low",      value: severityCounts["low"]      ?? 0, color: "text-yellow-400", bg: "bg-yellow-500" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-14 text-xs text-[var(--color-ink-dim)]">{label}</span>
                <div className="flex-1 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className={`h-full rounded-full ${bg} transition-all`}
                    style={{ width: totalFindings ? `${Math.round((value / totalFindings) * 100)}%` : "0%" }} />
                </div>
                <span className={`w-6 text-right text-sm font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--color-line)] flex items-center justify-between text-xs text-[var(--color-ink-dim)]">
            <span>{totalFindings} open findings</span>
            <Link href="/audits/findings?status=closed" className="text-[var(--color-blue)] hover:underline">View closed &#8594;</Link>
          </div>
        </div>

        {/* CAPA Health™ */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">CAPA Health&#8482;</h2>
            </div>
            <Link href="/audits/capas" className="text-xs text-[var(--color-blue)] hover:underline">View all &#8594;</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Open CAPAs",         value: openCapas,                   color: openCapas > 0      ? "text-amber-400"  : "text-emerald-400" },
              { label: "Overdue CAPAs",      value: overdueCapas,                color: overdueCapas > 0   ? "text-red-400"    : "text-emerald-400" },
              { label: "Completed CAPAs",    value: completedCapas,              color: "text-emerald-400" },
              { label: "Avg Closure",        value: avgClosureDays != null ? `${avgClosureDays}d` : "—", color: "text-[var(--color-ink)]" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-[var(--color-line)] p-3">
                <p className="text-[10px] text-[var(--color-ink-faint)]">{label}</p>
                <p className={`text-xl font-bold mt-0.5 ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          {capaTotal > 0 && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-[var(--color-ink-dim)]">Completion rate</span>
                <span className="font-semibold">{Math.round((completedCapas / capaTotal) * 100)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.round((completedCapas / capaTotal) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 4 — Recent Audits + Audit Intelligence™ (P8) */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Recent Audits (P7 Relationships) */}
        <div className="lg:col-span-2">
          {audits.length === 0 ? (
            <Card>
              <EmptyState
                icon={ClipboardCheck}
                title="No audits planned yet"
                description="Plan your first audit, assign it to a framework, and let AUDT generate your audit program automatically."
                action={
                  <Link href="/audits/new">
                    <Button variant="primary" size="md"><Plus className="h-4 w-4" /> Plan your first audit</Button>
                  </Link>
                }
              />
            </Card>
          ) : (
            <Card>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-line)]">
                <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Recent Audits</h2>
                <Link href="/audits/list" className="text-xs text-[var(--color-blue)] hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-[var(--color-line)]">
                {recentAudits.map((a) => (
                  <Link key={a.id} href={`/audits/${a.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <AuditTypeBadge type={a.auditType} />
                        {a.endDate && (
                          <span className="text-xs text-[var(--color-ink-faint)]">Due {formatDate(a.endDate)}</span>
                        )}
                        {/* P7 relationship hints */}
                        {a.openFindings > 0 && (
                          <span className="text-xs text-amber-400">{a.openFindings} finding{a.openFindings !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                    <AuditStatusBadge status={a.status} />
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Audit Intelligence™ + Trust Impact (P8 + P9) */}
        <div className="space-y-4">

          {/* Audit Intelligence™ */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-[var(--color-blue)]" />
              <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Audit Intelligence&#8482;</h2>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Critical findings open",    value: severityCounts["critical"] ?? 0, color: (severityCounts["critical"] ?? 0) > 0 ? "text-red-400"    : "text-emerald-400" },
                { label: "High findings open",        value: severityCounts["high"]     ?? 0, color: (severityCounts["high"] ?? 0) > 0     ? "text-orange-400" : "text-emerald-400" },
                { label: "CAPAs overdue",             value: overdueCapas,                    color: overdueCapas > 0 ? "text-red-400" : "text-emerald-400" },
                { label: "Audits in fieldwork",       value: metrics.inProgress,              color: "text-amber-400" },
                { label: "Audit readiness score",     value: `${readinessScore}%`,            color: readinessColor },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-ink-dim)]">{label}</span>
                  <span className={`text-sm font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--color-line)]">
              <Link href="/audits/ai" className="text-xs text-[var(--color-blue)] hover:underline">
                Ask Audit Copilot&#8482; &#8594;
              </Link>
            </div>
          </div>

          {/* Trust Impact™ */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-400" />
              <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Trust Impact&#8482;</h2>
            </div>
            <p className="text-xs text-[var(--color-ink-dim)] mb-3">Audit Readiness feeds 15% of Org Trust Score&#8482;</p>
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-[var(--color-ink-dim)]">Current contribution</span>
                  <span className="font-bold text-purple-400">{currentTrustContrib}/15 pts</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${(currentTrustContrib / 15) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-[var(--color-ink-dim)]">Projected (all closed)</span>
                  <span className="font-bold text-emerald-400">15/15 pts</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: "100%" }} />
                </div>
              </div>
              {readinessScore < 85 && (
                <p className="text-[10px] text-[var(--color-ink-faint)]">
                  Close {(severityCounts["critical"] ?? 0) + (severityCounts["high"] ?? 0)} critical/high findings and {overdueCapas} overdue CAPAs to improve readiness.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
