export const dynamic = "force-dynamic";

import { AlertCircle, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { listRuns } from "@/lib/services/workflow-studio/workflow-service";
import Link from "next/link";
import { WorkflowRunStatusBadge, WorkflowFilterChip } from "@/components/workflow-studio/workflow-ui";

function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function WorkflowRunsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; workflowId?: string }>;
}) {
  const session = await requireUser();
  const sp = await searchParams;

  if (session.demo || !session.org) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
        <p className="font-semibold">Not available in demo mode.</p>
      </Card>
    );
  }

  const runs = await listRuns(session.org.id, {
    status: sp.status || undefined,
    workflowId: sp.workflowId || undefined,
  });

  const statuses = ["running", "waiting", "completed", "failed", "cancelled"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Workflow Runs</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">{runs.length} run{runs.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <WorkflowFilterChip label="All" active={!sp.status} href="/workflow-studio/runs" />
        {statuses.map((s) => (
          <WorkflowFilterChip
            key={s}
            label={s.charAt(0).toUpperCase() + s.slice(1)}
            active={sp.status === s}
            href={`/workflow-studio/runs?status=${s}`}
          />
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        {runs.length === 0 ? (
          <div className="p-12 text-center">
            <Play className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
            <p className="font-semibold">No runs found</p>
            <p className="text-sm text-[var(--color-ink-dim)] mt-1">Publish and start a workflow to see runs here.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-xs text-[var(--color-ink-dim)]">
                <th className="text-left px-5 py-3 font-medium">Workflow</th>
                <th className="text-left px-5 py-3 font-medium">Trigger</th>
                <th className="text-left px-5 py-3 font-medium">Started By</th>
                <th className="text-left px-5 py-3 font-medium">Started</th>
                <th className="text-left px-5 py-3 font-medium">Completed</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr
                  key={run.id}
                  className={`border-b border-[var(--color-line)]/50 hover:bg-white ${run.status === "failed" ? "bg-red-500/[0.03]" : ""}`}
                >
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/workflow-studio/${run.workflowId}`} className="hover:text-[var(--color-blue)] transition-colors">
                      {run.workflowName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-ink-dim)] capitalize">{run.triggerType.replace(/_/g, " ")}</td>
                  <td className="px-5 py-3 text-[var(--color-ink-dim)]">{run.startedByName ?? "Automated"}</td>
                  <td className="px-5 py-3 text-[var(--color-ink-dim)]">{formatDateTime(run.startedAt)}</td>
                  <td className="px-5 py-3 text-[var(--color-ink-dim)]">{run.completedAt ? formatDateTime(run.completedAt) : "—"}</td>
                  <td className="px-5 py-3">
                    <WorkflowRunStatusBadge status={run.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
