export const dynamic = "force-dynamic";

export const metadata = { title: 'Issue &#38; Remediation Hub™ — AUDT' };

import Link from "next/link";
import {
  AlertCircle, Plus, CheckCircle2, Shield, Sparkles, TrendingDown,
  Brain, Network, BarChart3, Clock, AlertTriangle, ArrowRight, Download,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/lib/services/issue-hub/issue-service";
import { findIssuesByOrg } from "@/lib/repositories/issue-repo";
import * as findingRepo from "@/lib/repositories/audit-finding-repo";
import * as capaRepo from "@/lib/repositories/corrective-action-repo";
import { IssueStat, IssueSeverityBadge, IssueStatusBadge } from "@/components/issue-hub/issue-ui";

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function IssueHubDashboardPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
        <p className="font-semibold">Governance Remediation Platform™</p>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">Connect Supabase to track governance findings.</p>
      </Card>
    );
  }

  const [metrics, allIssues, auditFindingSev, openCapas] = await Promise.all([
    getDashboardMetrics(session.org.id),
    findIssuesByOrg(session.org.id, {}),
    findingRepo.countBySeverity(session.org.id).catch(() => ({ critical: 0, high: 0, medium: 0, low: 0 })),
    capaRepo.countOpenByOrg(session.org.id).catch(() => 0),
  ]);

  // Finding Sources from sourceModule
  const sourceLabels: Record<string, string> = {
    audit_finding: "Audits",
    compliance_gap: "Compliance",
    control_failure: "Controls",
    policy_gap: "Policies",
    risk: "Risk Lens",
    vendor_issue: "Vendors",
    privacy_issue: "Privacy",
    security_incident: "Security",
    contract_obligation: "Contracts",
    custom: "Custom",
  };
  const sourceCounts: Record<string, number> = {};
  for (const issue of allIssues) {
    const src = issue.sourceModule ?? issue.issueType ?? "custom";
    sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
  }
  // Add audit findings count
  const totalAuditFindings = Object.values(auditFindingSev).reduce((s, n) => s + n, 0);
  if (totalAuditFindings > 0) {
    sourceCounts["audit_finding"] = (sourceCounts["audit_finding"] ?? 0) + totalAuditFindings;
  }
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Combined severity: issues + audit findings
  const combinedSev = {
    critical: (metrics.bySeverity["critical"] ?? 0) + (auditFindingSev.critical ?? 0),
    high:     (metrics.bySeverity["high"] ?? 0)     + (auditFindingSev.high     ?? 0),
    medium:   (metrics.bySeverity["medium"] ?? 0)   + (auditFindingSev.medium   ?? 0),
    low:      (metrics.bySeverity["low"] ?? 0)       + (auditFindingSev.low      ?? 0),
  };
  const totalOpen = combinedSev.critical + combinedSev.high + combinedSev.medium + combinedSev.low;
  const closedCount = metrics.total - metrics.open;

  // Pipeline stages from byStatus
  const pipeline = [
    { label: "New",        count: metrics.byStatus["open"] ?? 0,                color: "bg-slate-400" },
    { label: "Assigned",   count: metrics.byStatus["assigned"] ?? 0,            color: "bg-blue-400" },
    { label: "In Progress",count: metrics.byStatus["in_progress"] ?? 0,         color: "bg-amber-400" },
    { label: "Validation", count: metrics.byStatus["pending_validation"] ?? 0,  color: "bg-purple-400" },
    { label: "Closed",     count: (metrics.byStatus["resolved"] ?? 0) + (metrics.byStatus["closed"] ?? 0) + (metrics.byStatus["accepted_risk"] ?? 0), color: "bg-emerald-400" },
  ];
  const pipelineTotal = pipeline.reduce((s, p) => s + p.count, 0) || 1;

  // Trust Impact estimate
  const trustImpact = -(combinedSev.critical * 10 + combinedSev.high * 5 + combinedSev.medium * 2 + combinedSev.low * 1);
  const currentTrust = Math.max(0, 100 + trustImpact);
  const projectedTrust = 100;

  // Intelligence: top issue types
  const typeCounts: Record<string, number> = {};
  for (const issue of allIssues) {
    const t = issue.issueType ?? "custom";
    typeCounts[t] = (typeCounts[t] ?? 0) + 1;
  }
  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Governance Remediation Platform™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            Identify &#8901; Assign &#8901; Remediate &#8901; Validate &#8901; Close
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/v1/issues/export/csv"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[#F8F9FB]"
          >
            <Download className="h-3.5 w-3.5" />
            Export Issues CSV
          </a>
          <Link href="/issue-hub/ai" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[#F8F9FB] transition-colors">
            <Sparkles className="h-3.5 w-3.5" />
            AI Advisor™
          </Link>
          <Link href="/issue-hub/new">
            <Button><Plus className="h-4 w-4" /> New Issue</Button>
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <IssueStat label="Total Findings" value={metrics.total + totalAuditFindings} accent="neutral" href="/issue-hub/findings" />
        <IssueStat label="Open Findings" value={totalOpen} accent={totalOpen > 0 ? "warn" : "neutral"} href="/issue-hub/findings" />
        <IssueStat label="Critical" value={combinedSev.critical} accent={combinedSev.critical > 0 ? "danger" : "neutral"} href="/issue-hub/findings?severity=critical" />
        <IssueStat label="Overdue" value={metrics.overdue} accent={metrics.overdue > 0 ? "danger" : "neutral"} />
        <IssueStat label="Open CAPAs" value={openCapas} accent={openCapas > 0 ? "warn" : "neutral"} href="/issue-hub/capas" />
        <IssueStat label="Avg Closure" value={`${metrics.avgResolutionDays}d`} accent="neutral" sub="calendar days" />
      </div>

      {/* Row 2: Sources + Pipeline */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Finding Sources */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Network className="h-4 w-4 text-[var(--color-blue)]" />
            Finding Sources™
          </h2>
          <p className="text-xs text-[var(--color-ink-dim)] mb-3">Where findings originate across the platform</p>
          {topSources.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No findings yet.</p>
          ) : (
            <div className="space-y-2.5">
              {topSources.map(([src, cnt]) => {
                const maxSrc = topSources[0]?.[1] || 1;
                return (
                  <div key={src} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-[var(--color-ink-dim)] shrink-0">
                      {sourceLabels[src] ?? src}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-[#F8F9FB] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--color-blue)]" style={{ width: `${Math.round((cnt / maxSrc) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{cnt}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-[var(--color-line)]">
            <Link href="/issue-hub/findings" className="text-xs text-[var(--color-blue)] hover:underline">
              View all findings →
            </Link>
          </div>
        </Card>

        {/* Governance Remediation Pipeline */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-purple-400" />
            Governance Remediation Pipeline™
          </h2>
          <div className="space-y-2.5">
            {pipeline.map((stage) => (
              <div key={stage.label} className="flex items-center gap-3">
                <span className="w-24 text-xs text-[var(--color-ink-dim)] shrink-0">{stage.label}</span>
                <div className="flex-1 h-2 rounded-full bg-[#F8F9FB] overflow-hidden">
                  <div className={`h-full rounded-full ${stage.color}`} style={{ width: `${Math.round((stage.count / pipelineTotal) * 100)}%` }} />
                </div>
                <span className="text-sm font-bold w-6 text-right">{stage.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--color-line)]">
            <Link href="/issue-hub/list" className="text-xs text-[var(--color-blue)] hover:underline">
              Manage issues →
            </Link>
          </div>
        </Card>
      </div>

      {/* Row 3: Severity + Status + Trust Impact */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Findings By Severity */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Findings By Severity
          </h2>
          <div className="space-y-2.5">
            {[
              { label: "Critical", count: combinedSev.critical, color: "bg-red-500",    textColor: "text-red-400" },
              { label: "High",     count: combinedSev.high,     color: "bg-orange-500", textColor: "text-orange-400" },
              { label: "Medium",   count: combinedSev.medium,   color: "bg-amber-500",  textColor: "text-amber-400" },
              { label: "Low",      count: combinedSev.low,      color: "bg-blue-500",   textColor: "text-blue-400" },
              { label: "Closed",   count: closedCount,          color: "bg-emerald-500",textColor: "text-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${s.color} shrink-0`} />
                <span className="flex-1 text-xs text-[var(--color-ink-dim)]">{s.label}</span>
                <span className={`text-sm font-bold ${s.textColor}`}>{s.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Findings By Status */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            Findings By Status
          </h2>
          <div className="space-y-2.5">
            {Object.entries(metrics.byStatus).length === 0 ? (
              <p className="text-xs text-[var(--color-ink-dim)]">No open issues</p>
            ) : (
              Object.entries(metrics.byStatus).map(([st, cnt]) => (
                <div key={st} className="flex items-center justify-between gap-3">
                  <IssueStatusBadge status={st} />
                  <span className="text-sm font-bold">{cnt}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Trust Impact */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            Trust Impact™
          </h2>
          <p className="text-xs text-[var(--color-ink-dim)] mb-4 leading-relaxed">
            Open findings reduce your Org Trust Score™. Closing them restores trust.
          </p>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--color-ink-dim)]">Current Trust</span>
                <span className={`text-xs font-bold ${currentTrust >= 80 ? "text-emerald-400" : currentTrust >= 60 ? "text-amber-400" : "text-red-400"}`}>
                  {currentTrust}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#F8F9FB] overflow-hidden">
                <div className={`h-full rounded-full ${currentTrust >= 80 ? "bg-emerald-500" : currentTrust >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${currentTrust}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--color-ink-dim)]">After Closure</span>
                <span className="text-xs font-bold text-emerald-400">{projectedTrust}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#F8F9FB] overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${projectedTrust}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--color-line)]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-ink-dim)]">Total Impact</span>
              <span className="font-bold text-red-400">{trustImpact} pts</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 4: Open Issues + Intelligence */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Top Open Issues */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            Top Open Findings
          </h2>
          {metrics.topOpenIssues.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              No open issues. Great governance posture!
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.topOpenIssues.slice(0, 6).map((issue) => (
                <Link
                  key={issue.id}
                  href={`/issue-hub/${issue.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-white transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{issue.title}</p>
                    <p className="text-xs text-[var(--color-ink-dim)]">
                      {issue.assigneeName ?? issue.ownerName ?? "Unassigned"} · Due {formatDate(issue.dueDate)}
                    </p>
                  </div>
                  <IssueSeverityBadge severity={issue.severity} />
                </Link>
              ))}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-[var(--color-line)]">
            <Link href="/issue-hub/list" className="text-xs text-[var(--color-blue)] hover:opacity-80">
              View all issues →
            </Link>
          </div>
        </Card>

        {/* Findings Intelligence */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            Findings Intelligence™
          </h2>
          <div className="space-y-4">
            {topTypes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--color-ink-dim)] mb-2">Most Common Finding Types</p>
                {topTypes.map(([type, cnt]) => (
                  <div key={type} className="flex items-center justify-between py-1">
                    <span className="text-xs text-[var(--color-ink)]">
                      {(sourceLabels[type] ?? type).replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-bold">{cnt} open</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-[var(--color-line)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-ink-dim)]">Overdue Findings</span>
                <span className={`text-xs font-bold ${metrics.overdue > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {metrics.overdue}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-ink-dim)]">SLA Compliance</span>
                <span className={`text-xs font-bold ${metrics.slaCompliance >= 90 ? "text-emerald-400" : metrics.slaCompliance >= 70 ? "text-amber-400" : "text-red-400"}`}>
                  {metrics.slaCompliance}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-ink-dim)]">Open CAPAs</span>
                <span className={`text-xs font-bold ${openCapas > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {openCapas}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-ink-dim)]">Critical Audit Findings</span>
                <span className={`text-xs font-bold ${auditFindingSev.critical > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {auditFindingSev.critical}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--color-line)]">
            <Link href="/issue-hub/ai" className="text-xs text-[var(--color-blue)] hover:underline">
              Ask Findings Copilot™ →
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4 text-sm">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/issue-hub/findings">
            <Button variant="outline" size="sm"><AlertCircle className="h-4 w-4" /> All Findings</Button>
          </Link>
          <Link href="/issue-hub/list">
            <Button variant="outline" size="sm"><BarChart3 className="h-4 w-4" /> Issue Registry</Button>
          </Link>
          <Link href="/issue-hub/capas">
            <Button variant="outline" size="sm"><Shield className="h-4 w-4" /> CAPAs</Button>
          </Link>
          <Link href="/issue-hub/tasks">
            <Button variant="outline" size="sm"><CheckCircle2 className="h-4 w-4" /> All Tasks</Button>
          </Link>
          <Link href="/issue-hub/ai">
            <Button variant="outline" size="sm"><Sparkles className="h-4 w-4" /> Findings Copilot™</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
