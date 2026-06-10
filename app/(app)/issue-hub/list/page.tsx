export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, AlertCircle, Clock, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { listIssues } from "@/lib/services/issue-hub/issue-service";

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

const PRIORITY_LABELS: Record<string, string> = {
  p1: "P1 — Critical",
  p2: "P2 — High",
  p3: "P3 — Medium",
  p4: "P4 — Low",
  p5: "P5 — Informational",
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(d: string | null | undefined, status: string) {
  if (!d || ["resolved", "closed", "accepted_risk", "deferred"].includes(status)) return false;
  return new Date(d) < new Date();
}

export default async function IssueListPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    severity?: string;
    priority?: string;
    issueType?: string;
    search?: string;
  }>;
}) {
  const session = await requireUser();
  const sp = await searchParams;

  if (session.demo || !session.org) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
        <p className="text-sm text-[var(--color-ink-dim)]">Connect Supabase to view issues.</p>
      </Card>
    );
  }

  const issues = await listIssues(session.org.id, {
    status: sp.status,
    severity: sp.severity,
    priority: sp.priority,
    issueType: sp.issueType,
    search: sp.search,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Issue Registry™</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            {issues.length} issue{issues.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/issue-hub/new">
          <Button>
            <Plus className="h-4 w-4" /> New Issue
          </Button>
        </Link>
      </div>

      {/* Status filters */}
      <Card className="p-4 flex flex-wrap gap-2">
        {["", "open", "in_progress", "blocked", "resolved", "closed"].map((s) => (
          <Link
            key={s}
            href={`/issue-hub/list${s ? `?status=${s}` : ""}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              (sp.status ?? "") === s
                ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40"
                : "bg-white/5 text-[var(--color-ink-dim)] hover:bg-white/10"
            }`}
          >
            {s === "" ? "All" : s.replace(/_/g, " ")}
          </Link>
        ))}
        <span className="text-[var(--color-line)]">|</span>
        {["critical", "high", "medium", "low"].map((sev) => (
          <Link
            key={sev}
            href={`/issue-hub/list?severity=${sev}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              sp.severity === sev
                ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40"
                : "bg-white/5 text-[var(--color-ink-dim)] hover:bg-white/10"
            }`}
          >
            {sev}
          </Link>
        ))}
      </Card>

      {issues.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
          <p className="font-semibold">No issues found</p>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">
            Create your first issue to start tracking governance remediations.
          </p>
          <div className="mt-4">
            <Link href="/issue-hub/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> New Issue
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Issue</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Severity</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Priority</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Assignee</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Due Date</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Tasks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {issues.map((issue) => {
                  const overdue = isOverdue(issue.dueDate, issue.status);
                  return (
                    <tr key={issue.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 max-w-xs">
                        <Link
                          href={`/issue-hub/${issue.id}`}
                          className="font-medium hover:text-indigo-400 transition-colors block truncate"
                        >
                          {issue.title}
                        </Link>
                        {issue.sourceModule && (
                          <p className="text-xs text-[var(--color-ink-dim)]">
                            {issue.sourceModule} · {issue.issueType.replace(/_/g, " ")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[issue.severity] ?? ""}`}>
                          {issue.severity}
                        </span>
                        {issue.slaBreached && (
                          <span className="ml-1 text-xs text-red-400 font-medium">SLA!</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                        {PRIORITY_LABELS[issue.priority] ?? issue.priority}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[issue.status] ?? ""}`}>
                          {issue.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {issue.assigneeName ? (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-dim)]">
                            <User className="h-3.5 w-3.5" />
                            <span>{issue.assigneeName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-ink-dim)]">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[var(--color-ink-dim)]" />
                          <span className={overdue ? "text-red-400 font-medium" : ""}>
                            {formatDate(issue.dueDate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                        {issue.taskCount}
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
