export const dynamic = "force-dynamic";

import Link from "next/link";
import { CheckCircle2, Clock, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { listTasksByOrg } from "@/backend/src/modules/issue-hub/issue-service";
import { IssueStat, TaskStatusBadge } from "@/components/issue-hub/issue-ui";

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(d: string | null | undefined, status: string) {
  if (!d || status === "completed" || status === "cancelled") return false;
  return new Date(d) < new Date();
}

export default async function TasksPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
        <p className="text-sm text-[var(--color-ink-dim)]">Connect Supabase to view tasks.</p>
      </Card>
    );
  }

  const tasks = await listTasksByOrg(session.org.id);
  const open = tasks.filter((t) => !["completed", "cancelled"].includes(t.status));
  const completed = tasks.filter((t) => t.status === "completed");
  const overdue = open.filter((t) => isOverdue(t.dueDate, t.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Tasks</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Org-wide remediation task tracker · {open.length} open · {overdue.length} overdue
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <IssueStat label="Open Tasks" value={open.length} accent={open.length > 0 ? "warn" : "neutral"} />
        <IssueStat label="Overdue" value={overdue.length} accent={overdue.length > 0 ? "danger" : "neutral"} />
        <IssueStat label="Completed" value={completed.length} accent={completed.length > 0 ? "good" : "neutral"} />
      </div>

      {tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
          <p className="font-semibold">No tasks yet</p>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">Tasks are created from issue detail pages.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Task</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Issue</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Owner</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {tasks.map((task) => {
                  const overdueTsk = isOverdue(task.dueDate, task.status);
                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-white transition-colors ${overdueTsk ? "bg-red-500/[0.025]" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <p className={`font-medium ${task.status === "completed" ? "line-through text-[var(--color-ink-dim)]" : ""}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-[var(--color-ink-dim)] truncate max-w-xs">{task.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/issue-hub/${task.issueId}`}
                          className="text-xs text-[var(--color-blue)] hover:opacity-80 transition-opacity truncate block max-w-[200px]"
                        >
                          {(task as typeof task & { issueTitle: string }).issueTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-dim)]">
                          <User className="h-3.5 w-3.5" />
                          <span>{(task as typeof task & { ownerName: string | null }).ownerName ?? "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[var(--color-ink-dim)]" />
                          <span className={overdueTsk ? "text-red-400 font-medium" : ""}>
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
