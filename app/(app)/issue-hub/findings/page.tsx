export const dynamic = "force-dynamic";

import Link from "next/link";
import { AlertCircle, Plus, CheckCircle2, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import * as findingRepo from "@/lib/repositories/audit-finding-repo";
import { findIssuesByOrg } from "@/lib/repositories/issue-repo";
import { IssueSeverityBadge } from "@/components/issue-hub/issue-ui";
import { SeverityBadge, FindingStatusBadge } from "@/components/audit/audit-status-badge";

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "&#8212;";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function FindingsPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string; source?: string }>;
}) {
  const session = await requireUser();
  const sp = await searchParams;

  if (session.demo || !session.org) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
        <p className="font-semibold">Findings</p>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">Connect Supabase to view findings.</p>
      </Card>
    );
  }

  const [auditFindings, issues] = await Promise.all([
    findingRepo.findByOrg(session.org.id, sp.severity ? { severity: sp.severity } : {}).catch(() => []),
    findIssuesByOrg(session.org.id, {}).catch(() => []),
  ]);

  const sourceLabels: Record<string, string> = {
    audit_finding:       "Audit Finding",
    compliance_gap:      "Compliance",
    control_failure:     "Control Failure",
    policy_gap:          "Policy Gap",
    risk:                "Risk",
    vendor_issue:        "Vendor",
    privacy_issue:       "Privacy",
    security_incident:   "Security",
    contract_obligation: "Contract",
    custom:              "Custom",
  };

  const totalAuditOpen = auditFindings.filter((f) => f.status !== "closed").length;
  const totalIssueOpen = issues.filter((i) => !["resolved","closed","accepted_risk","deferred"].includes(i.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Findings</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            All governance findings across audits, controls, compliance, and issues
          </p>
        </div>
        <Link href="/issue-hub/new">
          <Button><Plus className="h-4 w-4" /> New Issue</Button>
        </Link>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Audit Findings", value: auditFindings.length, color: "text-red-400" },
          { label: "Open Audit", value: totalAuditOpen, color: "text-amber-400" },
          { label: "Issues", value: issues.length, color: "text-[var(--color-ink)]" },
          { label: "Open Issues", value: totalIssueOpen, color: "text-amber-400" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-[var(--color-ink-dim)] mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Audit Findings */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-[var(--color-line)] flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            Audit Findings
          </h2>
          <Link href="/audits/findings" className="text-xs text-[var(--color-blue)] hover:underline">
            Open in Audit Management &#8594;
          </Link>
        </div>
        {auditFindings.length === 0 ? (
          <div className="p-6 flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            No audit findings yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Severity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Trust Impact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {auditFindings.slice(0, 20).map((f) => {
                  const impact = f.severity === "critical" ? -10 : f.severity === "high" ? -5 : f.severity === "medium" ? -2 : -1;
                  return (
                    <tr key={f.id} className="hover:bg-white">
                      <td className="px-5 py-3">
                        <Link href={`/audits/${f.auditId}/findings`} className="font-medium hover:text-[var(--color-blue)] transition-colors">
                          {f.title}
                        </Link>
                        {f.description && (
                          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5 line-clamp-1">{f.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3"><SeverityBadge severity={f.severity} /></td>
                      <td className="px-4 py-3"><FindingStatusBadge status={f.status} /></td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-red-400">{impact} pts</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--color-ink-dim)]">Audit</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Issues as Findings */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-[var(--color-line)] flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-400" />
            Issues Registry
          </h2>
          <Link href="/issue-hub/list" className="text-xs text-[var(--color-blue)] hover:underline">
            Open in Issues &#8594;
          </Link>
        </div>
        {issues.length === 0 ? (
          <div className="p-6 flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            No issues yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Severity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Trust Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {issues.slice(0, 20).map((issue) => {
                  const impact = issue.severity === "critical" ? -10 : issue.severity === "high" ? -5 : issue.severity === "medium" ? -2 : -1;
                  return (
                    <tr key={issue.id} className="hover:bg-white">
                      <td className="px-5 py-3">
                        <Link href={`/issue-hub/${issue.id}`} className="font-medium hover:text-[var(--color-blue)] transition-colors">
                          {issue.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--color-ink-dim)]">
                          {sourceLabels[issue.sourceModule ?? ""] ?? sourceLabels[issue.issueType ?? ""] ?? "Custom"}
                        </span>
                      </td>
                      <td className="px-4 py-3"><IssueSeverityBadge severity={issue.severity} /></td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--color-ink-dim)]">{issue.ownerName ?? "&#8212;"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--color-ink-dim)]">{formatDate(issue.dueDate)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-red-400">{impact} pts</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
