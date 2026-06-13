export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { findAllEvidenceRequests } from "@/lib/repositories/auditor-collaboration-repo";
import { reviewEvidenceAction } from "@/lib/auditor-collaboration/actions";
import { revalidatePath } from "next/cache";
import { FileCheck, CheckCircle, XCircle } from "lucide-react";
import { AuditorStat, EvidenceRequestStatusBadge } from "@/components/auditor-collaboration/auditor-ui";

const PRIORITY_BADGE: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-400", medium: "bg-amber-500/20 text-amber-400",
  high: "bg-orange-500/20 text-orange-400", critical: "bg-red-500/20 text-red-400",
};

export default async function EvidenceRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireUser();
  const params = await searchParams;
  const oid = session.org?.id ?? "";
  const requests = await findAllEvidenceRequests(oid, { status: params.status }).catch(() => []);

  const statuses = ["pending", "submitted", "under_review", "accepted", "rejected"];

  async function acceptEvidence(fd: FormData) {
    "use server";
    await reviewEvidenceAction(fd.get("requestId") as string, "accept", fd.get("notes") as string);
    revalidatePath("/auditor-collaboration/evidence");
  }

  async function rejectEvidence(fd: FormData) {
    "use server";
    await reviewEvidenceAction(fd.get("requestId") as string, "reject", fd.get("notes") as string);
    revalidatePath("/auditor-collaboration/evidence");
  }

  const pending   = requests.filter(r => r.status === "pending").length;
  const submitted = requests.filter(r => r.status === "submitted").length;
  const accepted  = requests.filter(r => r.status === "accepted").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-[var(--color-blue)]" /> Evidence Requests™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">Track all evidence requested by auditors and assessors.</p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        <AuditorStat label="Pending"   value={pending}   accent="warn"    />
        <AuditorStat label="Submitted" value={submitted} accent="neutral" />
        <AuditorStat label="Accepted"  value={accepted}  accent="good"    />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <a href="/auditor-collaboration/evidence"
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!params.status ? "bg-[var(--color-blue)] text-white" : "bg-white/5 text-[var(--color-ink-dim)] hover:bg-white/10"}`}>
          All ({requests.length})
        </a>
        {statuses.map(s => (
          <a key={s} href={`/auditor-collaboration/evidence?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${params.status === s ? "bg-[var(--color-blue)] text-white" : "bg-white/5 text-[var(--color-ink-dim)] hover:bg-white/10"}`}>
            {s.replace("_", " ")}
          </a>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-12 text-center">
          <FileCheck className="mx-auto h-10 w-10 text-[var(--color-ink-faint)]" />
          <p className="mt-3 font-semibold">No evidence requests</p>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Evidence requests will appear here once auditors request them from within an Audit Room.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{r.title}</h3>
                    <EvidenceRequestStatusBadge status={r.status} />
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_BADGE[r.priority] ?? ""}`}>{r.priority}</span>
                  </div>
                  {r.description && <p className="mt-1 text-xs text-[var(--color-ink-dim)]">{r.description}</p>}
                  <div className="mt-1 flex gap-3 text-xs text-[var(--color-ink-dim)]">
                    <span>{r.evidenceType?.replace("_", " ")}</span>
                    {r.dueDate && <span>· Due {r.dueDate}</span>}
                  </div>
                </div>

                {r.status === "submitted" && (
                  <div className="flex gap-2 shrink-0">
                    <form action={acceptEvidence}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20">
                        <CheckCircle className="h-3 w-3" /> Accept
                      </button>
                    </form>
                    <form action={rejectEvidence}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20">
                        <XCircle className="h-3 w-3" /> Reject
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {r.reviewerNotes && (
                <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-300">
                  Notes: {r.reviewerNotes}
                </div>
              )}
              {r.rejectionReason && (
                <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-300">
                  Rejection reason: {r.rejectionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
