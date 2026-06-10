export const dynamic = "force-dynamic";

import Link from "next/link";
import { CheckCircle2, Clock, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { listTasksByOrg } from "@/lib/services/issue-hub/issue-service";

const TASK_STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400",
  in_progress: "bg-indigo-500/20 text-indigo-400",
  blocked: "bg-red-500/20 text-red-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-gray-500/20 text-gray-400",
};

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
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Tasks</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Org-wide remediation task tracker · {open.length} open · {overdue.length} overdue
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{open.length}</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Open Tasks</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{overdue.length}</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Overdue</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{completed.length}</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Completed</p>
        </Card>
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
                    <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
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
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors truncate block max-w-[200px]"
                        >
                          {(task as typeof task & { issueTitle: string }).issueTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TASK_STATUS_COLORS[task.status] ?? ""}`}>
                          {task.status.replace(/_/g, " ")}
                        </span>
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
