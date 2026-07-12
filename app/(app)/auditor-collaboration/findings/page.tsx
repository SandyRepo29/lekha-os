export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { findAllExternalFindings } from "@/lib/repositories/auditor-collaboration-repo";
import { updateFindingStatusAction } from "@/lib/auditor-collaboration/actions";
import { revalidatePath } from "next/cache";
import { AlertTriangle } from "lucide-react";
import { AuditorStat, ExternalFindingStatusBadge } from "@/components/auditor-collaboration/auditor-ui";

const SEV_BADGE: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700", medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700", critical: "bg-red-100 text-red-700",
};

const TYPE_LABEL: Record<string, string> = {
  observation: "Observation", non_conformance: "Non-Conformance", opportunity: "Opportunity",
  major_nc: "Major NC", minor_nc: "Minor NC", recommendation: "Recommendation",
};

export default async function ExternalFindingsPage({ searchParams }: { searchParams: Promise<{ status?: string; severity?: string }> }) {
  const session = await requireUser();
  const params = await searchParams;
  const oid = session.org?.id ?? "";
  const findings = await findAllExternalFindings(oid, { status: params.status, severity: params.severity }).catch(() => []);

  const open       = findings.filter(f => f.status === "open").length;
  const critical   = findings.filter(f => f.severity === "critical").length;
  const high       = findings.filter(f => f.severity === "high").length;
  const remediated = findings.filter(f => ["verified", "closed"].includes(f.status)).length;

  async function updateStatus(fd: FormData) {
    "use server";
    await updateFindingStatusAction(fd.get("id") as string, fd.get("status") as string);
    revalidatePath("/auditor-collaboration/findings");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-700" /> Shared Findings™
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">Findings raised by external auditors and assessors across all rooms.</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-3">
        <AuditorStat label="Open"     value={open}       accent={open > 0 ? "danger" : "neutral"} />
        <AuditorStat label="Critical" value={critical}   accent={critical > 0 ? "danger" : "neutral"} />
        <AuditorStat label="High"     value={high}       accent={high > 0 ? "warn" : "neutral"} />
        <AuditorStat label="Resolved" value={remediated} accent="good" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <a href="/auditor-collaboration/findings" className={`rounded-full px-3 py-1 text-xs font-medium ${!params.status && !params.severity ? "bg-[var(--color-blue)] text-white" : "bg-slate-100 text-[var(--color-ink-dim)] hover:bg-slate-100"}`}>All</a>
        {["open","in_remediation","ready_for_review","verified","closed"].map(s => (
          <a key={s} href={`/auditor-collaboration/findings?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${params.status === s ? "bg-[var(--color-blue)] text-white" : "bg-slate-100 text-[var(--color-ink-dim)] hover:bg-slate-100"}`}>
            {s.replace(/_/g, " ")}
          </a>
        ))}
        <span className="text-[var(--color-line)]">|</span>
        {["critical","high","medium","low"].map(s => (
          <a key={s} href={`/auditor-collaboration/findings?severity=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${params.severity === s ? "bg-orange-500 text-white" : "bg-slate-100 text-[var(--color-ink-dim)] hover:bg-slate-100"}`}>
            {s}
          </a>
        ))}
      </div>

      {findings.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-12 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-[var(--color-ink-faint)]" />
          <p className="mt-3 font-semibold">No findings</p>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Auditor findings will appear here once raised in an Audit Room.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {findings.map(f => (
            <div key={f.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{f.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SEV_BADGE[f.severity] ?? ""}`}>{f.severity}</span>
                    <ExternalFindingStatusBadge status={f.status} />
                    {f.findingType && <span className="rounded-full px-2 py-0.5 text-[10px] bg-slate-100 text-[var(--color-ink-dim)]">{TYPE_LABEL[f.findingType] ?? f.findingType}</span>}
                  </div>
                  {f.description && <p className="mt-1 text-xs text-[var(--color-ink-dim)] line-clamp-2">{f.description}</p>}
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-[var(--color-ink-dim)]">
                    {f.framework && <span>{f.framework}</span>}
                    {f.controlRef && <span>· Control: {f.controlRef}</span>}
                    {f.dueDate && <span>· Due {f.dueDate}</span>}
                  </div>
                  {f.recommendation && (
                    <p className="mt-2 text-xs text-sky-700 italic">Recommendation: {f.recommendation}</p>
                  )}
                </div>

                <form action={updateStatus} className="flex items-center gap-2 shrink-0">
                  <input type="hidden" name="id" value={f.id} />
                  <select name="status" defaultValue={f.status}
                    className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-2 py-1 text-xs focus:border-[var(--color-blue)] focus:outline-none">
                    {["open","in_remediation","ready_for_review","verified","closed","accepted"].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-lg bg-[var(--color-blue)] px-2 py-1 text-xs font-semibold text-white hover:opacity-90">Update</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
