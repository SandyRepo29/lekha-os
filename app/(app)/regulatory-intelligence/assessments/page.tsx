export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getAssessments } from "@/backend/src/modules/regulatory-intelligence/regulatory-service";
import { RegSubNav, RegStat, SeverityBadge } from "@/components/regulatory-intelligence/reg-ui";
import { Scale, Plus } from "lucide-react";

const ASSESSMENT_STATUS_STYLES: Record<string, string> = {
  draft:       "bg-white/10 text-[var(--color-ink-faint)] border-[var(--color-line)]",
  in_progress: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  completed:   "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  approved:    "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

export default async function AssessmentsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const assessments = await getAssessments(orgId).catch(() => []);

  const completed = assessments.filter(a => a.status === "completed" || a.status === "approved").length;
  const highImpact = assessments.filter(a => a.impactLevel === "high" || a.impactLevel === "critical").length;

  return (
    <div className="space-y-6 p-6">
      <RegSubNav />

      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Impact Assessments™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Analyze the impact of regulatory changes on controls, policies, risks, vendors, and contracts.</p>
        </div>
        <Link
          href="/regulatory-intelligence/assessments/new"
          className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New Assessment
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RegStat label="Total Assessments" value={assessments.length} accent="neutral" />
        <RegStat label="Completed"         value={completed}          accent="good" />
        <RegStat label="High Impact"       value={highImpact}         accent={highImpact > 0 ? "danger" : "neutral"} />
        <RegStat label="Draft"             value={assessments.filter(a => a.status === "draft").length} accent="warn" />
      </div>

      {assessments.length > 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-[var(--color-ink-faint)]">
                  <th className="px-4 py-3 text-left font-medium">Assessment</th>
                  <th className="px-4 py-3 text-left font-medium">Impact Level</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Affected</th>
                  <th className="px-4 py-3 text-left font-medium">Effort</th>
                  <th className="px-4 py-3 text-left font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]/40">
                {assessments.map(a => (
                  <tr key={a.id} className="hover:bg-white transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold max-w-[220px]">{a.title}</div>
                      {a.summary && <div className="mt-0.5 text-[var(--color-ink-faint)] max-w-[220px] truncate">{a.summary}</div>}
                    </td>
                    <td className="px-4 py-3"><SeverityBadge severity={a.impactLevel} /></td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${ASSESSMENT_STATUS_STYLES[a.status] ?? "bg-white/10 text-[var(--color-ink-faint)] border-[var(--color-line)]"}`}>
                        {a.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">
                      {[
                        a.affectedControls ? `${a.affectedControls}c` : null,
                        a.affectedPolicies ? `${a.affectedPolicies}p` : null,
                        a.affectedRisks ? `${a.affectedRisks}r` : null,
                      ].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 capitalize text-[var(--color-ink-dim)]">{a.remediationEffort ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-faint)]">
                      {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg-2)]/40 py-16">
          <Scale className="h-10 w-10 text-[var(--color-blue)] opacity-40" />
          <div className="text-center">
            <p className="font-semibold text-sm">No impact assessments yet</p>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)]">Create an assessment to analyze the impact of a regulatory change on your governance posture.</p>
          </div>
          <Link href="/regulatory-intelligence/assessments/new" className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> New Assessment
          </Link>
        </div>
      )}
    </div>
  );
}
