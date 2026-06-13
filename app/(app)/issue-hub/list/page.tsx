export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, AlertCircle, Clock, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { listIssues } from "@/lib/services/issue-hub/issue-service";
import {
  IssueStatusBadge,
  IssueSeverityBadge,
  IssuePriorityBadge,
  IssueFilterChip,
} from "@/components/issue-hub/issue-ui";

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

      {/* Filters */}
      <Card className="p-4 flex flex-wrap gap-2">
        <IssueFilterChip label="All" active={(sp.status ?? "") === ""} href="/issue-hub/list" />
        {["open", "in_progress", "blocked", "resolved", "closed"].map((s) => (
          <IssueFilterChip
            key={s}
            label={s.replace(/_/g, " ")}
            active={sp.status === s}
            href={`/issue-hub/list?status=${s}`}
          />
        ))}
        <span className="text-[var(--color-line)] self-center">|</span>
        {["critical", "high", "medium", "low"].map((sev) => (
          <IssueFilterChip
            key={sev}
            label={sev}
            active={sp.severity === sev}
            href={`/issue-hub/list?severity=${sev}`}
          />
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
                  const slaBreach = issue.slaBreached;
                  return (
                    <tr
                      key={issue.id}
                      className={`hover:bg-white/[0.02] transition-colors ${slaBreach ? "bg-red-500/[0.025]" : ""}`}
                    >
                      <td className="px-4 py-3 max-w-xs">
                        <Link
                          href={`/issue-hub/${issue.id}`}
                          className="font-medium hover:text-[var(--color-blue)] transition-colors block truncate"
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
                        <div className="flex items-center gap-1.5">
                          <IssueSeverityBadge severity={issue.severity} />
                          {slaBreach && (
                            <span className="text-xs font-semibold text-red-400">SLA!</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <IssuePriorityBadge priority={issue.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <IssueStatusBadge status={issue.status} />
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
