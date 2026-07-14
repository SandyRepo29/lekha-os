export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { findAllAssessments } from "@/backend/src/modules/auditor-collaboration/auditor-collaboration-repo";
import { ClipboardList } from "lucide-react";
import { AuditorStat } from "@/components/auditor-collaboration/auditor-ui";

const STATUS_BADGE: Record<string, string> = {
  planning:    "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed:   "bg-emerald-100 text-emerald-700",
  cancelled:   "bg-red-100 text-red-700",
};

const TYPE_LABELS: Record<string, string> = {
  iso_27001:     "ISO 27001",
  soc2:          "SOC 2",
  dpdp:          "DPDP",
  ai_governance: "AI Governance",
  vendor:        "Vendor",
  privacy:       "Privacy",
  custom:        "Custom",
};

export default async function AssessmentProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireUser();
  const params = await searchParams;
  const oid = session.org?.id ?? "";
  const assessments = await findAllAssessments(oid, { status: params.status }).catch(() => []);

  const inProgress = assessments.filter(a => a.status === "in_progress").length;
  const completed = assessments.filter(a => a.status === "completed").length;
  const avgCompletion = assessments.length
    ? Math.round(assessments.reduce((sum, a) => sum + a.completionPct, 0) / assessments.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-sky-700" /> Assessment Projects™
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">Track ISO, SOC 2, DPDP, AI Governance and custom assessment engagements.</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3">
        <AuditorStat label="In Progress"     value={inProgress}          accent="neutral" />
        <AuditorStat label="Completed"       value={completed}           accent="good" />
        <AuditorStat label="Avg Completion"  value={`${avgCompletion}%`} accent="neutral" />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <a href="/auditor-collaboration/assessments" className={`rounded-full px-3 py-1 text-xs font-medium ${!params.status ? "bg-[var(--color-blue)] text-white" : "bg-slate-100 text-[var(--color-ink-dim)] hover:bg-slate-100"}`}>All</a>
        {["planning","in_progress","completed","cancelled"].map(s => (
          <a key={s} href={`/auditor-collaboration/assessments?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${params.status === s ? "bg-[var(--color-blue)] text-white" : "bg-slate-100 text-[var(--color-ink-dim)] hover:bg-slate-100"}`}>
            {s.replace("_", " ")}
          </a>
        ))}
      </div>

      {assessments.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-12 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-[var(--color-ink-faint)]" />
          <p className="mt-3 font-semibold">No assessments yet</p>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Assessments are created inside Audit Rooms.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map(a => (
            <div key={a.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm truncate flex-1">{a.name}</h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[a.status] ?? ""}`}>
                  {a.status.replace("_", " ")}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--color-ink-dim)]">
                <span className="rounded-full bg-slate-100 px-2 py-0.5">{TYPE_LABELS[a.assessmentType] ?? a.assessmentType}</span>
                {a.startDate && <span>{a.startDate} → {a.endDate ?? "TBD"}</span>}
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[var(--color-ink-dim)]">Completion</span>
                  <span className="font-medium text-sky-700">{a.completionPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${a.completionPct}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-slate-100 p-2">
                  <div className="font-bold text-red-700">{a.openFindings}</div>
                  <div className="text-[var(--color-ink-dim)] text-[10px]">Findings</div>
                </div>
                <div className="rounded-lg bg-slate-100 p-2">
                  <div className="font-bold text-yellow-700">{a.pendingEvidence}</div>
                  <div className="text-[var(--color-ink-dim)] text-[10px]">Pending</div>
                </div>
                <div className="rounded-lg bg-slate-100 p-2">
                  <div className="font-bold text-blue-700">{a.completedMilestones}/{a.totalMilestones}</div>
                  <div className="text-[var(--color-ink-dim)] text-[10px]">Milestones</div>
                </div>
              </div>

              {a.aiReadinessScore !== null && a.aiReadinessScore !== undefined && (
                <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-xs">
                  <span className="text-[var(--color-ink-dim)]">AI Readiness Score: </span>
                  <span className="font-bold text-sky-700">{Number(a.aiReadinessScore).toFixed(0)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
