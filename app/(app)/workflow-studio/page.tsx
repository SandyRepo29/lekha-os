export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  AlertCircle, Plus, Play, CheckCircle2, Clock, XCircle,
  Sparkles, BarChart3, Zap, GitBranch, ThumbsUp, TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/lib/services/workflow-studio/workflow-service";
import { WorkflowStat, WorkflowRunStatusBadge } from "@/components/workflow-studio/workflow-ui";

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function WorkflowStudioDashboardPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
        <p className="font-semibold">Workflow Studio™</p>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">Connect Supabase to automate governance processes.</p>
      </Card>
    );
  }

  const metrics = await getDashboardMetrics(session.org.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Workflow Studio™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            Governance automation engine — design, run and track governance workflows
          </p>
        </div>
        <Link href="/workflow-studio/new">
          <Button><Plus className="h-4 w-4" /> New Workflow</Button>
        </Link>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        <WorkflowStat label="Workflows"  value={metrics.total}             accent="neutral" href="/workflow-studio/library" />
        <WorkflowStat label="Active"     value={metrics.active}            accent="good"    href="/workflow-studio/library?status=active" />
        <WorkflowStat label="Draft"      value={metrics.draft}             accent="warn"    href="/workflow-studio/library?status=draft" />
        <WorkflowStat label="Total Runs" value={metrics.totalRuns}         accent="neutral" href="/workflow-studio/runs" />
        <WorkflowStat label="Active Runs" value={metrics.activeRuns}       accent="neutral" href="/workflow-studio/runs?status=running" />
        <WorkflowStat label="Completed"  value={metrics.completedRuns}     accent="good"    href="/workflow-studio/runs?status=completed" />
        <WorkflowStat label="Failed"     value={metrics.failedRuns}        accent="danger"  href="/workflow-studio/runs?status=failed" />
        <WorkflowStat label="Approvals"  value={metrics.pendingApprovals}  accent={metrics.pendingApprovals > 0 ? "warn" : "neutral"} href="/workflow-studio/approvals" />
      </div>

      {/* Automation rate */}
      <Card className="p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/20 text-indigo-400">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium">Automation Rate™</p>
            <p className="text-lg font-bold">{metrics.automationRate}%</p>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${metrics.automationRate}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Recent runs */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Play className="h-4 w-4 text-[var(--color-blue)]" /> Recent Workflow Runs
        </h2>
        {metrics.recentRuns.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-[var(--color-ink-dim)]">
            <AlertCircle className="h-4 w-4" />
            No runs yet. Publish a workflow and start it.
          </div>
        ) : (
          <div className="space-y-2">
            {metrics.recentRuns.map((run) => (
              <div
                key={run.id}
                className={`flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-white ${run.status === "failed" ? "bg-red-500/[0.03]" : ""}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{run.workflowName}</p>
                  <p className="text-xs text-[var(--color-ink-dim)]">
                    {run.startedByName ?? "Automated"} · {formatDate(run.startedAt)}
                  </p>
                </div>
                <WorkflowRunStatusBadge status={run.status} />
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-[var(--color-line)]">
          <Link href="/workflow-studio/runs" className="text-xs text-[var(--color-blue)] hover:opacity-80 transition-opacity">
            View all runs →
          </Link>
        </div>
      </Card>

      {/* Quick actions */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/workflow-studio/library"><Button variant="outline" size="sm"><GitBranch className="h-4 w-4" /> Library</Button></Link>
          <Link href="/workflow-studio/templates"><Button variant="outline" size="sm"><BarChart3 className="h-4 w-4" /> Templates</Button></Link>
          <Link href="/workflow-studio/runs"><Button variant="outline" size="sm"><Play className="h-4 w-4" /> All Runs</Button></Link>
          <Link href="/workflow-studio/approvals"><Button variant="outline" size="sm"><ThumbsUp className="h-4 w-4" /> Approvals {metrics.pendingApprovals > 0 && `(${metrics.pendingApprovals})`}</Button></Link>
          <Link href="/workflow-studio/ai"><Button variant="outline" size="sm"><Sparkles className="h-4 w-4" /> AI Studio</Button></Link>
        </div>
      </Card>
    </div>
  );
}
