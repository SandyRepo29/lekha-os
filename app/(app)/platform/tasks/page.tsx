export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getOrgTasks, getTaskDashboard } from "@/backend/src/modules/platform/task-service";
import { completeTaskAction, deleteTaskAction } from "@/backend/src/modules/platform/task-actions";
import { Card } from "@/components/ui/card";
import { CheckSquare, Plus, AlertCircle, Clock, User } from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ status?: string; priority?: string; assignedTo?: string }>;
}

function priorityBadge(priority: string) {
  const styles: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    low: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${styles[priority] ?? styles.low}`}
    >
      {priority}
    </span>
  );
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    open: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    in_progress: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
    overdue: "bg-red-500/20 text-red-400 border border-red-500/30",
    completed: "bg-green-500/20 text-green-400 border border-green-500/30",
    cancelled: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  };
  const labels: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    overdue: "Overdue",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.open}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function entityChip(entityType?: string | null) {
  if (!entityType) return null;
  const labels: Record<string, string> = {
    vendor: "Vendor",
    risk: "Risk",
    audit: "Audit",
    finding: "Finding",
    capa: "CAPA",
    control: "Control",
    issue: "Issue",
    contract: "Contract",
    policy: "Policy",
    evidence: "Evidence",
    framework: "Framework",
    regulation: "Regulation",
    asset: "Asset",
    ai_system: "AI System",
  };
  return (
    <span className="inline-flex items-center rounded-md bg-[#F8F9FB] px-2 py-0.5 text-xs text-[var(--color-ink-dim)]">
      {labels[entityType] ?? entityType}
    </span>
  );
}

function isOverdue(task: { dueDate?: Date | string | null; status: string }): boolean {
  if (task.status === "completed" || task.status === "cancelled") return false;
  if (!task.dueDate) return false;
  return new Date(task.dueDate) < new Date();
}

function formatDate(d?: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function groupTasks(tasks: any[]) {
  const overdue: any[] = [];
  const open: any[] = [];
  const inProgress: any[] = [];
  const completed: any[] = [];
  const rest: any[] = [];

  for (const t of tasks) {
    if (isOverdue(t) || t.status === "overdue") {
      overdue.push(t);
    } else if (t.status === "completed") {
      completed.push(t);
    } else if (t.status === "in_progress") {
      inProgress.push(t);
    } else if (t.status === "open") {
      open.push(t);
    } else {
      rest.push(t);
    }
  }

  return [...overdue, ...open, ...inProgress, ...completed, ...rest];
}

interface TaskRowProps {
  task: any;
}

async function CompleteButton({ taskId }: { taskId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const action = completeTaskAction.bind(null, taskId) as any;
  return (
    <form action={action}>
      <button
        type="submit"
        className="rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400 transition hover:bg-green-500/20"
      >
        Complete
      </button>
    </form>
  );
}

async function DeleteButton({ taskId }: { taskId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const action = deleteTaskAction.bind(null, taskId) as any;
  return (
    <form action={action}>
      <button
        type="submit"
        className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
      >
        Delete
      </button>
    </form>
  );
}

export default async function TaskHubPage({ searchParams }: Props) {
  const session = await requireUser();
  const orgId = session.org!.id;
  const sp = await searchParams;

  const statusFilter = sp.status;
  const priorityFilter = sp.priority;
  const assignedToFilter = sp.assignedTo;

  const [dashboard, rawTasks] = await Promise.all([
    getTaskDashboard(orgId),
    getOrgTasks(orgId, {
      status: statusFilter,
      priority: priorityFilter,
      assignedTo: assignedToFilter,
    }),
  ]);

  const tasks = groupTasks(rawTasks as any[]);

  const filterChips = [
    { label: "All", value: undefined },
    { label: "Open", value: "open" },
    { label: "In Progress", value: "in_progress" },
    { label: "Overdue", value: "overdue" },
    { label: "Completed", value: "completed" },
  ];

  function chipHref(value: string | undefined) {
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    if (priorityFilter) params.set("priority", priorityFilter);
    if (assignedToFilter) params.set("assignedTo", assignedToFilter);
    const qs = params.toString();
    return `/platform/tasks${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--color-ink-dim)]">
        <Link href="/platform" className="hover:text-[var(--color-ink)]">
          Platform
        </Link>
        <span>/</span>
        <span className="text-[var(--color-ink)]">Tasks</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckSquare className="h-6 w-6 text-indigo-400" />
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
            Task Hub
          </h1>
        </div>
        <Link
          href="/platform/tasks/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Task
        </Link>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-l-2 border-l-indigo-500 bg-white p-4">
          <p className="text-xs text-[var(--color-ink-dim)]">Total</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">{dashboard.total}</p>
        </Card>
        <Card className="border-l-2 border-l-blue-500 bg-white p-4">
          <p className="text-xs text-[var(--color-ink-dim)]">Open</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">{dashboard.open}</p>
        </Card>
        <Card className="border-l-2 border-l-red-500 bg-red-500/[0.04] p-4">
          <p className="text-xs text-red-400">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{dashboard.overdue}</p>
        </Card>
        <Card className="border-l-2 border-l-green-500 bg-white p-4">
          <p className="text-xs text-[var(--color-ink-dim)]">Completed Today</p>
          <p className="mt-1 text-2xl font-bold text-green-400">{dashboard.completedToday}</p>
        </Card>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {filterChips.map((chip) => {
          const active = statusFilter === chip.value || (!statusFilter && chip.value === undefined);
          return (
            <Link
              key={chip.label}
              href={chipHref(chip.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                  : "border-[var(--color-line)] bg-white text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]"
              }`}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>

      {/* Tasks Table */}
      <Card className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <CheckSquare className="h-10 w-10 text-[var(--color-ink-dim)]" />
            <p className="text-sm text-[var(--color-ink-dim)]">No tasks found</p>
            <Link
              href="/platform/tasks/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Create first task
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {/* Table header */}
            <div className="hidden grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-dim)] sm:grid">
              <span>Priority</span>
              <span>Task</span>
              <span>Source</span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> Assigned
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Due
              </span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {tasks.map((task: any) => {
              const overdue = isOverdue(task);
              const dueDate = task.dueDate ? new Date(task.dueDate) : null;
              const duePast = dueDate && dueDate < new Date() && task.status !== "completed";

              return (
                <div
                  key={task.id}
                  className={`grid grid-cols-1 gap-3 px-4 py-3 transition hover:bg-white sm:grid-cols-[auto_1fr_auto_auto_auto_auto_auto] sm:items-center sm:gap-4 ${
                    overdue ? "bg-red-500/[0.04]" : ""
                  }`}
                >
                  {/* Priority */}
                  <div>{priorityBadge(task.priority ?? "medium")}</div>

                  {/* Title */}
                  <div>
                    <p className="text-sm font-medium text-[var(--color-ink)]">{task.title}</p>
                    {task.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-ink-dim)]">
                        {task.description}
                      </p>
                    )}
                    {task.entityName && (
                      <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">
                        Re: {task.entityName}
                      </p>
                    )}
                  </div>

                  {/* Entity type chip */}
                  <div>{entityChip(task.entityType)}</div>

                  {/* Assigned to */}
                  <div className="flex items-center gap-1 text-xs text-[var(--color-ink-dim)]">
                    <User className="h-3 w-3 shrink-0" />
                    <span className="max-w-[80px] truncate">
                      {task.assignedToName ?? "Unassigned"}
                    </span>
                  </div>

                  {/* Due date */}
                  <div
                    className={`flex items-center gap-1 text-xs ${duePast ? "font-medium text-red-400" : "text-[var(--color-ink-dim)]"}`}
                  >
                    {duePast && <AlertCircle className="h-3 w-3 shrink-0" />}
                    <span>{formatDate(task.dueDate)}</span>
                  </div>

                  {/* Status */}
                  <div>{statusBadge(overdue && task.status !== "completed" ? "overdue" : (task.status ?? "open"))}</div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {task.status !== "completed" && task.status !== "cancelled" && (
                      <CompleteButton taskId={task.id} />
                    )}
                    <DeleteButton taskId={task.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
