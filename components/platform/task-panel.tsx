"use client";

import { useActionState, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createTaskAction, completeTaskAction, deleteTaskAction } from "@/lib/platform/task-actions";

type TaskRow = {
  id: string; title: string; description: string | null; status: string; priority: string;
  assigned_to: string | null; assigned_to_name: string | null;
  due_date: Date | null; completed_at: Date | null; sla_breached: boolean;
  created_at: Date;
};

interface Props {
  entityType: string;
  entityId: string;
  entityName?: string;
  tasks: TaskRow[];
  currentUserName?: string;
  canCreate?: boolean;
}

const PRIORITY_BADGE: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  low: "bg-green-500/20 text-green-400 border border-green-500/30",
};

const STATUS_DOT: Record<string, string> = {
  open: "bg-blue-400",
  in_progress: "bg-amber-400",
  completed: "bg-green-400",
  cancelled: "bg-gray-500",
  blocked: "bg-red-400",
};

function isOverdue(date: Date | null): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

function isDueSoon(date: Date | null): boolean {
  if (!date) return false;
  const diff = new Date(date).getTime() - Date.now();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function TaskPanel({ entityType, entityId, entityName, tasks: initialTasks, canCreate = false }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const bound = createTaskAction.bind(null);
  const [formState, formAction] = useActionState(bound as any, undefined);

  function handleComplete(taskId: string) {
    startTransition(async () => {
      await completeTaskAction(taskId);
      router.refresh();
    });
  }

  function handleDelete(taskId: string) {
    startTransition(async () => {
      await deleteTaskAction(taskId);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-line)]">
        <h3 className="font-semibold text-[var(--color-ink)] text-sm">
          Tasks <span className="text-[var(--color-ink-dim)] font-normal">({initialTasks.length})</span>
        </h3>
        {canCreate && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium bg-[#F8F9FB] hover:bg-[#EEF2F7] text-[var(--color-ink)] transition-colors"
          >
            <span className="text-base leading-none">+</span> Add task
          </button>
        )}
      </div>

      {showForm && (
        <form
          action={async (fd: FormData) => {
            await (formAction as any)(fd);
            setShowForm(false);
            router.refresh();
          }}
          className="px-5 py-4 border-b border-[var(--color-line)] bg-white space-y-3"
        >
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityId" value={entityId} />
          {entityName && <input type="hidden" name="entityName" value={entityName} />}

          <div>
            <input
              name="title"
              required
              placeholder="Task title"
              className="w-full rounded-xl bg-[#F8F9FB] border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <select
              name="priority"
              defaultValue="medium"
              className="rounded-xl bg-[#F8F9FB] border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input
              type="date"
              name="dueDate"
              className="rounded-xl bg-[#F8F9FB] border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
            <input
              name="assignedTo"
              placeholder="Assignee"
              className="rounded-xl bg-[#F8F9FB] border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>

          {(formState as any)?.error && (
            <p className="text-xs text-red-400">{(formState as any).error}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-3 py-1.5 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
              Cancel
            </button>
            <button type="submit" className="rounded-xl px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
              Create
            </button>
          </div>
        </form>
      )}

      {initialTasks.length === 0 ? (
        <p className="px-5 py-6 text-sm text-[var(--color-ink-dim)] text-center">No tasks yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--color-line)]">
          {initialTasks.map((task) => {
            const completed = task.status === "completed";
            const overdue = isOverdue(task.due_date) && !completed;
            const soon = isDueSoon(task.due_date) && !completed;
            return (
              <li key={task.id} className="flex items-start gap-3 px-5 py-3 hover:bg-white transition-colors group">
                <button
                  onClick={() => !completed && handleComplete(task.id)}
                  disabled={completed || isPending}
                  className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${completed ? "bg-green-500/30 border-green-500/50" : "border-[var(--color-line)] hover:border-indigo-400"}`}
                  aria-label="Complete task"
                >
                  {completed && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                      <polyline points="2 6 5 9 10 3" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-medium ${completed ? "line-through text-[var(--color-ink-dim)]" : "text-[var(--color-ink)]"}`}>
                      {task.title}
                    </span>
                    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.medium}`}>
                      {task.priority}
                    </span>
                    {task.status !== "completed" && (
                      <span className="flex items-center gap-1 text-[10px] text-[var(--color-ink-dim)]">
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[task.status] ?? "bg-gray-400"}`} />
                        {task.status.replace("_", " ")}
                      </span>
                    )}
                    {task.sla_breached && <AlertIcon />}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {task.due_date && (
                      <span className={`text-[11px] ${overdue ? "text-red-400" : soon ? "text-amber-400" : "text-[var(--color-ink-dim)]"}`}>
                        {overdue ? "Overdue: " : "Due: "}{formatDate(task.due_date)}
                      </span>
                    )}
                    {task.assigned_to_name && (
                      <span className="text-[11px] text-[var(--color-ink-dim)]">
                        &#8594; {task.assigned_to_name}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(task.id)}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 mt-0.5 flex-shrink-0 p-1 rounded-lg text-[var(--color-ink-dim)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                  aria-label="Delete task"
                >
                  <TrashIcon />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
