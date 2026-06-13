export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, GitBranch, Play, Pencil, Zap, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getWorkflowDetail, listRuns } from "@/lib/services/workflow-studio/workflow-service";
import { publishWorkflowAction, startWorkflowAction } from "@/lib/workflow-studio/actions";
import {
  WorkflowStatusBadge,
  WorkflowRunStatusBadge,
  WorkflowTriggerBadge,
} from "@/components/workflow-studio/workflow-ui";

const NODE_TYPE_COLORS: Record<string, string> = {
  start:         "bg-emerald-500/20 text-emerald-400",
  end:           "bg-red-500/20 text-red-400",
  task:          "bg-[var(--color-blue)]/20 text-[var(--color-blue)]",
  approval:      "bg-violet-500/20 text-violet-400",
  condition:     "bg-amber-500/20 text-amber-400",
  decision:      "bg-orange-500/20 text-orange-400",
  wait:          "bg-white/[0.06] text-[var(--color-ink-dim)]",
  notification:  "bg-indigo-500/20 text-indigo-400",
  webhook:       "bg-teal-500/20 text-teal-400",
  create_record: "bg-cyan-500/20 text-cyan-400",
  update_record: "bg-purple-500/20 text-purple-400",
};

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;

  if (session.demo || !session.org) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
        <p className="font-semibold">Not available in demo mode.</p>
      </Card>
    );
  }

  const [wf, runs] = await Promise.all([
    getWorkflowDetail(session.org.id, id).catch(() => null),
    listRuns(session.org.id, { workflowId: id }),
  ]);

  if (!wf) notFound();

  const completed = runs.filter((r) => r.status === "completed").length;
  const failed    = runs.filter((r) => r.status === "failed").length;
  const running   = runs.filter((r) => r.status === "running" || r.status === "waiting").length;

  async function handlePublish() {
    "use server";
    await publishWorkflowAction(id);
  }

  async function handleStart() {
    "use server";
    await startWorkflowAction(id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">{wf.name}</h1>
              <WorkflowStatusBadge status={wf.status} />
              <WorkflowTriggerBadge trigger={wf.triggerType} />
            </div>
            {wf.description && <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">{wf.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/workflow-studio/${id}/edit`}>
            <Button variant="outline" size="sm"><Pencil className="h-4 w-4" /> Edit</Button>
          </Link>
          {wf.status === "draft" && (
            <form action={handlePublish}>
              <Button size="sm" type="submit"><Zap className="h-4 w-4" /> Publish</Button>
            </form>
          )}
          {wf.status === "active" && (
            <form action={handleStart}>
              <Button size="sm" type="submit"><Play className="h-4 w-4" /> Start Run</Button>
            </form>
          )}
        </div>
      </div>

      {/* Run summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-[var(--color-ink-faint)]">Module</p>
          <p className="text-sm font-semibold mt-1 capitalize">{wf.module.replace(/_/g, " ")}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--color-ink-faint)]">Version</p>
          <p className="text-sm font-semibold mt-1">v{wf.version}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--color-ink-faint)]">Published</p>
          <p className="text-sm font-semibold mt-1">{wf.publishedAt ? formatDate(wf.publishedAt) : "Not published"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--color-ink-faint)]">Total Runs</p>
          <p className="text-sm font-semibold mt-1">{runs.length}</p>
        </Card>
      </div>

      {/* Recent runs summary */}
      {runs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 border-l-2 border-l-emerald-500/60 border-emerald-500/25 bg-emerald-500/[0.04]">
            <p className="text-xs text-[var(--color-ink-faint)]">Completed</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">{completed}</p>
          </Card>
          <Card className="p-4 border-l-2 border-l-red-500/60 border-red-500/25 bg-red-500/[0.04]">
            <p className="text-xs text-[var(--color-ink-faint)]">Failed</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">{failed}</p>
          </Card>
          <Card className="p-4 border-l-2 border-l-[var(--color-line-strong)] border-[var(--color-line)]">
            <p className="text-xs text-[var(--color-ink-faint)]">In Progress</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">{running}</p>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workflow steps */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-indigo-400" /> Workflow Steps ({wf.nodes.length})
          </h2>
          {wf.nodes.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No steps defined. Edit this workflow to add steps.</p>
          ) : (
            <div className="space-y-2">
              {wf.nodes.map((node, i) => (
                <div key={node.id} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-ink-faint)] w-5 text-right">{i + 1}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${NODE_TYPE_COLORS[node.nodeType] ?? "bg-white/[0.06] text-[var(--color-ink-dim)]"}`}>
                    {node.nodeType.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm">{node.label}</span>
                  {i < wf.nodes.length - 1 && <ArrowRight className="h-3 w-3 text-[var(--color-ink-faint)] ml-auto" />}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent runs */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Play className="h-4 w-4 text-[var(--color-blue)]" /> Recent Runs ({runs.length})
          </h2>
          {runs.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No runs yet.</p>
          ) : (
            <div className="space-y-2">
              {runs.slice(0, 8).map((run) => (
                <div
                  key={run.id}
                  className={`flex items-center justify-between gap-3 text-sm rounded-lg px-2 py-1 ${run.status === "failed" ? "bg-red-500/[0.04]" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    {run.status === "completed"
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      : <Clock className="h-3.5 w-3.5 text-[var(--color-ink-dim)]" />}
                    <span className="text-[var(--color-ink-dim)]">{formatDate(run.startedAt)}</span>
                  </div>
                  <WorkflowRunStatusBadge status={run.status} />
                </div>
              ))}
            </div>
          )}
          {runs.length > 8 && (
            <div className="mt-3 pt-3 border-t border-[var(--color-line)]">
              <Link href={`/workflow-studio/runs?workflowId=${id}`} className="text-xs text-[var(--color-blue)] hover:opacity-80 transition-opacity">
                View all {runs.length} runs →
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
