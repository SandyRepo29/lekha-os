export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  Shield,
  ArrowUpCircle,
  History,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getIssueDetail } from "@/lib/services/issue-hub/issue-service";
import { generateIssueNarrative } from "@/lib/services/issue-hub/ai-issue-service";
import {
  updateIssueStatusAction,
  deleteIssueAction,
  addCommentAction,
  addTaskAction,
  completeTaskAction,
  escalateIssueAction,
} from "@/lib/issue-hub/actions";
import { redirect } from "next/navigation";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400",
  high: "bg-orange-500/20 text-orange-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  low: "bg-blue-500/20 text-blue-400",
  informational: "bg-slate-500/20 text-slate-400",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400",
  assigned: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-indigo-500/20 text-indigo-400",
  blocked: "bg-red-500/20 text-red-400",
  pending_review: "bg-purple-500/20 text-purple-400",
  resolved: "bg-green-500/20 text-green-400",
  closed: "bg-gray-500/20 text-gray-400",
  accepted_risk: "bg-orange-500/20 text-orange-400",
  deferred: "bg-slate-500/20 text-slate-400",
};

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d as string).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser();

  if (session.demo || !session.org) notFound();

  const issue = await getIssueDetail(session.org.id, id);
  if (!issue) notFound();

  const narrative = await generateIssueNarrative(session.org.id, issue).catch(() => null);

  async function handleStatusChange(formData: FormData) {
    "use server";
    const status = formData.get("status") as string;
    const notes = formData.get("resolutionNotes") as string;
    await updateIssueStatusAction(id, status, notes || undefined);
  }

  async function handleDelete() {
    "use server";
    await deleteIssueAction(id);
    redirect("/issue-hub/list");
  }

  async function handleAddComment(formData: FormData) {
    "use server";
    const content = formData.get("content") as string;
    await addCommentAction(id, content);
  }

  async function handleAddTask(formData: FormData) {
    "use server";
    await addTaskAction(id, formData);
  }

  async function handleEscalate(formData: FormData) {
    "use server";
    await escalateIssueAction(id, formData);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[issue.severity] ?? ""}`}
            >
              {issue.severity}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[issue.status] ?? ""}`}
            >
              {issue.status.replace(/_/g, " ")}
            </span>
            {issue.slaBreached && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-700/20 text-red-400">
                SLA Breached
              </span>
            )}
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">{issue.title}</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">
            {issue.issueType.replace(/_/g, " ")}
            {issue.sourceModule ? ` · ${issue.sourceModule}` : ""}
            {" · Created "}{formatDate(issue.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/issue-hub/list`}>
            <Button variant="outline" size="sm">Back</Button>
          </Link>
          <form action={handleDelete}>
            <Button variant="outline" size="sm" type="submit" className="text-red-400 border-red-500/30 hover:bg-red-500/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          {issue.description && (
            <Card className="p-5">
              <h2 className="font-semibold mb-2 text-sm">Description</h2>
              <p className="text-sm text-[var(--color-ink-dim)] whitespace-pre-wrap">{issue.description}</p>
            </Card>
          )}

          {/* AI Narrative */}
          {narrative && (
            <Card className="p-5 border-indigo-500/20">
              <h2 className="font-semibold mb-2 text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                AI Analysis
              </h2>
              <p className="text-sm text-[var(--color-ink-dim)]">{narrative}</p>
            </Card>
          )}

          {/* Tasks */}
          <Card className="p-5">
            <h2 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              Tasks ({issue.tasks.length})
            </h2>
            <div className="space-y-2 mb-4">
              {issue.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-3 rounded-xl p-2 bg-white/[0.02]">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-[var(--color-ink-dim)]" : ""}`}>
                      {task.title}
                    </p>
                    {task.ownerName && (
                      <p className="text-xs text-[var(--color-ink-dim)]">{task.ownerName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-ink-dim)]">{formatDate(task.dueDate)}</span>
                    {task.status !== "completed" && (
                      <form action={async () => { "use server"; await completeTaskAction(task.id, id); }}>
                        <button type="submit" className="text-xs text-green-400 hover:text-green-300 transition-colors">
                          Complete
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
              {issue.tasks.length === 0 && (
                <p className="text-xs text-[var(--color-ink-dim)]">No tasks yet.</p>
              )}
            </div>
            <form action={handleAddTask} className="flex gap-2">
              <input
                name="title"
                placeholder="Add a task..."
                className="flex-1 rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-1.5 text-sm outline-none focus:border-indigo-500/50"
              />
              <Button type="submit" size="sm" variant="outline">Add</Button>
            </form>
          </Card>

          {/* Comments */}
          <Card className="p-5">
            <h2 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-400" />
              Comments ({issue.comments.length})
            </h2>
            <div className="space-y-3 mb-4">
              {issue.comments.map((c) => (
                <div key={c.id} className="rounded-xl p-3 bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{c.authorName ?? "Unknown"}</span>
                    <span className="text-xs text-[var(--color-ink-dim)]">{formatDate(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[var(--color-ink-dim)]">{c.content}</p>
                </div>
              ))}
              {issue.comments.length === 0 && (
                <p className="text-xs text-[var(--color-ink-dim)]">No comments yet.</p>
              )}
            </div>
            <form action={handleAddComment} className="flex gap-2">
              <input
                name="content"
                placeholder="Add a comment..."
                className="flex-1 rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-1.5 text-sm outline-none focus:border-indigo-500/50"
              />
              <Button type="submit" size="sm" variant="outline">Post</Button>
            </form>
          </Card>

          {/* History */}
          {issue.history.length > 0 && (
            <Card className="p-5">
              <h2 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <History className="h-4 w-4 text-[var(--color-ink-dim)]" />
                Change History
              </h2>
              <div className="space-y-2">
                {issue.history.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 text-xs text-[var(--color-ink-dim)]">
                    <span className="font-medium">{h.changedByName ?? "System"}</span>
                    <span>changed</span>
                    <span className="font-medium">{h.fieldChanged}</span>
                    {h.oldValue && <span>from <em>{h.oldValue}</em></span>}
                    {h.newValue && <span>to <em className="text-indigo-300">{h.newValue}</em></span>}
                    <span className="ml-auto">{formatDate(h.createdAt)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Metadata */}
          <Card className="p-5">
            <h2 className="font-semibold mb-3 text-sm">Details</h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-dim)]">Priority</dt>
                <dd className="font-medium">{issue.priority.toUpperCase()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-dim)]">Owner</dt>
                <dd className="font-medium">{issue.ownerName ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-dim)]">Assignee</dt>
                <dd className="font-medium">{issue.assigneeName ?? "Unassigned"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-dim)]">Due Date</dt>
                <dd className="font-medium">{formatDate(issue.dueDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-dim)]">SLA Days</dt>
                <dd className="font-medium">{issue.slaDays}d</dd>
              </div>
            </dl>
          </Card>

          {/* Status update */}
          <Card className="p-5">
            <h2 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Update Status
            </h2>
            <form action={handleStatusChange} className="space-y-3">
              <select
                name="status"
                defaultValue={issue.status}
                className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
              >
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="pending_review">Pending Review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="accepted_risk">Accepted Risk</option>
                <option value="deferred">Deferred</option>
              </select>
              <textarea
                name="resolutionNotes"
                rows={2}
                placeholder="Resolution notes (optional)..."
                className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-indigo-500/50 resize-none"
              />
              <Button type="submit" size="sm" className="w-full">Update Status</Button>
            </form>
          </Card>

          {/* Escalate */}
          <Card className="p-5">
            <h2 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-orange-400" /> Escalate
            </h2>
            <form action={handleEscalate} className="space-y-3">
              <select
                name="escalatedTo"
                className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
              >
                <option value="manager">Manager</option>
                <option value="department_head">Department Head</option>
                <option value="executive">Executive</option>
                <option value="board">Board</option>
              </select>
              <textarea
                name="reason"
                rows={2}
                required
                placeholder="Reason for escalation..."
                className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-indigo-500/50 resize-none"
              />
              <Button type="submit" size="sm" variant="outline" className="w-full text-orange-400 border-orange-500/30">
                Escalate Issue
              </Button>
            </form>
          </Card>

          {/* Escalations */}
          {issue.escalations.length > 0 && (
            <Card className="p-5">
              <h2 className="font-semibold mb-3 text-sm">Escalations</h2>
              <div className="space-y-2">
                {issue.escalations.map((esc) => (
                  <div key={esc.id} className="text-xs text-[var(--color-ink-dim)] rounded-xl p-2 bg-white/[0.02]">
                    <p className="font-medium text-orange-400">→ {esc.escalatedTo.replace(/_/g, " ")}</p>
                    <p className="mt-0.5">{esc.reason}</p>
                    <p className="mt-1">{formatDate(esc.createdAt)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Exceptions */}
          {issue.exceptions.length > 0 && (
            <Card className="p-5">
              <h2 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-400" />
                Exception Requests
              </h2>
              <div className="space-y-2">
                {issue.exceptions.map((exc) => (
                  <div key={exc.id} className="text-xs text-[var(--color-ink-dim)] rounded-xl p-2 bg-white/[0.02]">
                    <p className="font-medium capitalize">{exc.status}</p>
                    <p className="mt-0.5 line-clamp-2">{exc.businessJustification}</p>
                    {exc.approverName && <p className="mt-1">Approver: {exc.approverName}</p>}
                  </div>
                ))}
              </div>
              <Link href="/issue-hub/exceptions" className="block mt-2 text-xs text-indigo-400 hover:text-indigo-300">
                Manage exceptions →
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
