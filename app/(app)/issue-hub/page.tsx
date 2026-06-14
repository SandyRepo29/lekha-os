export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  AlertCircle,
  Plus,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Sparkles,
  XCircle,
  TrendingDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/lib/services/issue-hub/issue-service";
import {
  IssueStat,
  IssueSeverityBadge,
  IssueStatusBadge,
} from "@/components/issue-hub/issue-ui";

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
        <p className="font-semibold">Issue &amp; Remediation Hub™</p>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">Connect Supabase to track governance issues.</p>
      </Card>
    );
  }

  const metrics = await getDashboardMetrics(session.org.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Issue &amp; Remediation Hub™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            Centralized governance execution — track, assign, remediate and close issues
          </p>
        </div>
        <Link href="/issue-hub/new">
          <Button>
            <Plus className="h-4 w-4" /> New Issue
          </Button>
        </Link>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <IssueStat label="Total Issues" value={metrics.total} accent="neutral" href="/issue-hub/list" />
        <IssueStat label="Open" value={metrics.open} accent="warn" href="/issue-hub/list?status=open" />
        <IssueStat label="Critical" value={metrics.critical} accent={metrics.critical > 0 ? "danger" : "neutral"} href="/issue-hub/list?severity=critical" />
        <IssueStat label="Overdue" value={metrics.overdue} accent={metrics.overdue > 0 ? "danger" : "neutral"} />
        <IssueStat label="Blocked" value={metrics.blocked} accent={metrics.blocked > 0 ? "danger" : "neutral"} href="/issue-hub/list?status=blocked" />
        <IssueStat label="Resolved (mtd)" value={metrics.resolvedThisMonth} accent={metrics.resolvedThisMonth > 0 ? "good" : "neutral"} />
      </div>

      {/* SLA + Avg resolution */}
      <div className="grid grid-cols-2 gap-3">
        <IssueStat
          label="SLA Compliance"
          value={`${metrics.slaCompliance}%`}
          accent={metrics.slaCompliance >= 90 ? "good" : metrics.slaCompliance >= 70 ? "warn" : "danger"}
          sub="target ≥ 90%"
        />
        <IssueStat
          label="Avg Resolution Time"
          value={`${metrics.avgResolutionDays}d`}
          accent="neutral"
          sub="calendar days"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Top open issues */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            Top Open Issues
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
                  className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-white/[0.03] transition-colors"
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
            <Link href="/issue-hub/list" className="text-xs text-[var(--color-blue)] hover:opacity-80 transition-opacity">
              View all issues →
            </Link>
          </div>
        </Card>

        {/* By severity + status */}
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold mb-3 text-sm">By Severity</h2>
            <div className="space-y-2">
              {Object.entries(metrics.bySeverity).map(([sev, cnt]) => (
                <div key={sev} className="flex items-center justify-between">
                  <IssueSeverityBadge severity={sev} />
                  <span className="text-sm font-semibold">{cnt}</span>
                </div>
              ))}
              {Object.keys(metrics.bySeverity).length === 0 && (
                <p className="text-xs text-[var(--color-ink-dim)]">No open issues</p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold mb-3 text-sm">By Status</h2>
            <div className="space-y-2">
              {Object.entries(metrics.byStatus).map(([st, cnt]) => (
                <div key={st} className="flex items-center justify-between">
                  <IssueStatusBadge status={st} />
                  <span className="text-sm font-semibold">{cnt}</span>
                </div>
              ))}
              {Object.keys(metrics.byStatus).length === 0 && (
                <p className="text-xs text-[var(--color-ink-dim)]">No open issues</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/issue-hub/list">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4" /> Issue Registry
            </Button>
          </Link>
          <Link href="/issue-hub/tasks">
            <Button variant="outline" size="sm">
              <CheckCircle2 className="h-4 w-4" /> All Tasks
            </Button>
          </Link>
          <Link href="/issue-hub/exceptions">
            <Button variant="outline" size="sm">
              <Shield className="h-4 w-4" /> Exceptions
            </Button>
          </Link>
          <Link href="/issue-hub/ai">
            <Button variant="outline" size="sm">
              <Sparkles className="h-4 w-4" /> AI Advisor
            </Button>
          </Link>
          <Link href="/issue-hub/reports">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4" /> Reports
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
