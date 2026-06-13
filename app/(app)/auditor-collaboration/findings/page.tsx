export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { findAllExternalFindings } from "@/lib/repositories/auditor-collaboration-repo";
import { updateFindingStatusAction } from "@/lib/auditor-collaboration/actions";
import { revalidatePath } from "next/cache";
import { AlertTriangle } from "lucide-react";

const SEV_BADGE: Record<string, string> = {
  low: "bg-emerald-500/20 text-emerald-400", medium: "bg-yellow-500/20 text-yellow-400",
  high: "bg-orange-500/20 text-orange-400", critical: "bg-red-500/20 text-red-400",
};

const STATUS_BADGE: Record<string, string> = {
  open:             "bg-red-500/20 text-red-400",
  in_remediation:   "bg-yellow-500/20 text-yellow-400",
  ready_for_review: "bg-blue-500/20 text-blue-400",
  verified:         "bg-emerald-500/20 text-emerald-400",
  closed:           "bg-slate-500/20 text-slate-400",
  accepted:         "bg-purple-500/20 text-purple-400",
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

  const open = findings.filter(f => f.status === "open").length;
  const critical = findings.filter(f => f.severity === "critical").length;
  const high = findings.filter(f => f.severity === "high").length;
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
          <AlertTriangle className="h-5 w-5 text-orange-400" /> Shared Findings™
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">Findings raised by external auditors and assessors across all rooms.</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Open", value: open, color: "text-red-400" },
          { label: "Critical", value: critical, color: "text-red-500" },
          { label: "High", value: high, color: "text-orange-400" },
          { label: "Resolved", value: remediated, color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-[var(--color-ink-dim)] mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <a href="/auditor-collaboration/findings" className={`rounded-full px-3 py-1 text-xs font-medium ${!params.status && !params.severity ? "bg-[var(--color-blue)] text-white" : "bg-white/5 text-[var(--color-ink-dim)] hover:bg-white/10"}`}>All</a>
        {["open","in_remediation","ready_for_review","verified","closed"].map(s => (
          <a key={s} href={`/auditor-collaboration/findings?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${params.status === s ? "bg-[var(--color-blue)] text-white" : "bg-white/5 text-[var(--color-ink-dim)] hover:bg-white/10"}`}>
            {s.replace(/_/g, " ")}
          </a>
        ))}
        <span className="text-[var(--color-line)]">|</span>
        {["critical","high","medium","low"].map(s => (
          <a key={s} href={`/auditor-collaboration/findings?severity=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${params.severity === s ? "bg-orange-500 text-white" : "bg-white/5 text-[var(--color-ink-dim)] hover:bg-white/10"}`}>
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
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[f.status] ?? ""}`}>{f.status.replace(/_/g, " ")}</span>
                    {f.findingType && <span className="rounded-full px-2 py-0.5 text-[10px] bg-white/5 text-[var(--color-ink-dim)]">{TYPE_LABEL[f.findingType] ?? f.findingType}</span>}
                  </div>
                  {f.description && <p className="mt-1 text-xs text-[var(--color-ink-dim)] line-clamp-2">{f.description}</p>}
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-[var(--color-ink-dim)]">
                    {f.framework && <span>{f.framework}</span>}
                    {f.controlRef && <span>· Control: {f.controlRef}</span>}
                    {f.dueDate && <span>· Due {f.dueDate}</span>}
                  </div>
                  {f.recommendation && (
                    <p className="mt-2 text-xs text-sky-300 italic">Recommendation: {f.recommendation}</p>
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
