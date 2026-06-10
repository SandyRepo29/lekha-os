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

function Stat({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-[var(--color-ink-dim)]">{label}</p>
      </div>
    </Card>
  );
}

const RUN_STATUS_COLORS: Record<string, string> = {
  running: "bg-blue-500/20 text-blue-400",
  waiting: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
  failed: "bg-red-500/20 text-red-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-slate-500/20 text-slate-400",
};

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
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
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
        <Stat label="Workflows" value={metrics.total} icon={GitBranch} color="bg-indigo-500/20 text-indigo-400" />
        <Stat label="Active" value={metrics.active} icon={Zap} color="bg-green-500/20 text-green-400" />
        <Stat label="Draft" value={metrics.draft} icon={BarChart3} color="bg-yellow-500/20 text-yellow-400" />
        <Stat label="Total Runs" value={metrics.totalRuns} icon={Play} color="bg-blue-500/20 text-blue-400" />
        <Stat label="Active Runs" value={metrics.activeRuns} icon={Clock} color="bg-orange-500/20 text-orange-400" />
        <Stat label="Completed" value={metrics.completedRuns} icon={CheckCircle2} color="bg-teal-500/20 text-teal-400" />
        <Stat label="Failed" value={metrics.failedRuns} icon={XCircle} color="bg-red-500/20 text-red-400" />
        <Stat label="Approvals" value={metrics.pendingApprovals} icon={ThumbsUp} color="bg-purple-500/20 text-purple-400" />
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
          <Play className="h-4 w-4 text-blue-400" /> Recent Workflow Runs
        </h2>
        {metrics.recentRuns.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-[var(--color-ink-dim)]">
            <AlertCircle className="h-4 w-4" />
            No runs yet. Publish a workflow and start it.
          </div>
        ) : (
          <div className="space-y-2">
            {metrics.recentRuns.map((run) => (
              <div key={run.id} className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-white/[0.03]">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{run.workflowName}</p>
                  <p className="text-xs text-[var(--color-ink-dim)]">
                    {run.startedByName ?? "Automated"} · {formatDate(run.startedAt)}
                  </p>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${RUN_STATUS_COLORS[run.status] ?? "bg-slate-500/20 text-slate-400"}`}>
                  {run.status}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-[var(--color-line)]">
          <Link href="/workflow-studio/runs" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
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
          <Link href="/workflow-studio/ai"><Button variant="outline" size="sm"><Sparkles className="h-4 w-4" /> AI Advisor</Button></Link>
        </div>
      </Card>
    </div>
  );
}
