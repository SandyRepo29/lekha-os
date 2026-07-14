export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getVerificationById, getPrograms } from "@/backend/src/modules/trust-verification/trust-verification-service";
import { startReviewAction, makeDecisionAction, submitEvidenceAction } from "@/backend/src/modules/trust-verification/actions";
import { ShieldCheck, FileText, ClipboardCheck, Award, Clock, CheckCircle, XCircle, Play, Gavel } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    in_review: "bg-[var(--color-blue)]/10 text-[var(--color-blue)]",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    suspended: "bg-orange-100 text-orange-700",
    accepted: "bg-emerald-100 text-emerald-700",
    requires_update: "bg-amber-100 text-amber-700",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status] ?? "bg-slate-100 text-[var(--color-ink-faint)]"}`}>{status.replace(/_/g," ")}</span>;
}

export default async function VerificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const { id } = await params;
  const data = await getVerificationById(orgId, id);
  if (!data) notFound();

  const { verification: v, reviews, evidence, assessment, decisions } = data;
  const programs = await getPrograms(orgId).catch(() => []);
  const program = programs.find((p: any) => p.id === v.programId);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/trust-verification/applications" className="text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-blue)] mb-2 inline-block">← Applications</Link>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">{program?.name ?? "Verification Application"}</h1>
          <div className="mt-1 flex items-center gap-3">
            <StatusBadge status={v.status} />
            <span className="text-xs text-[var(--color-ink-faint)]">Applied {new Date(v.appliedAt).toLocaleDateString()}</span>
            {v.expiresAt && <span className="text-xs text-[var(--color-ink-faint)]">Expires {new Date(v.expiresAt).toLocaleDateString()}</span>}
          </div>
        </div>
        {/* Actions */}
        <div className="flex gap-2">
          {v.status === "pending" && (
            <form action={async (_fd: FormData) => { "use server"; await startReviewAction(v.id); }}>
              <button className="flex items-center gap-1.5 rounded-xl border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-blue)]">
                <Play className="h-3.5 w-3.5" /> Start Review
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Readiness */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
            <h3 className="font-semibold text-sm mb-4">Verification Readiness</h3>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-[var(--color-blue)]">{v.readinessScore ?? "—"}</div>
              <div>
                <div className="text-sm font-medium">Readiness Score</div>
                <div className="text-xs text-[var(--color-ink-dim)]">Trust Score at Apply: {v.trustScoreAtApply ?? "—"}</div>
              </div>
            </div>
            {program && (
              <div className="mt-4 space-y-2">
                {program.requirements?.map((req: any) => (
                  <div key={req.id} className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3.5 w-3.5 text-[var(--color-ink-faint)]" />
                    <span className="text-[var(--color-ink-dim)]">{req.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evidence */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Evidence Submitted ({evidence.length})</h3>
              <span className="text-xs text-[var(--color-ink-faint)]">
                {evidence.filter((e: any) => e.status === "accepted").length} accepted
              </span>
            </div>

            <form action={async (fd: FormData) => { "use server"; await submitEvidenceAction(null, fd); }} className="mb-4 flex gap-2">
              <input type="hidden" name="verificationId" value={v.id} />
              <input name="title" placeholder="Evidence title…" required
                className="flex-1 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]/50" />
              <select name="evidenceType" className="rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:outline-none">
                {["policy","control_test","audit_report","risk_register","vendor_assessment","compliance_report","custom"].map(t => (
                  <option key={t} value={t}>{t.replace(/_/g," ")}</option>
                ))}
              </select>
              <button type="submit" className="rounded-xl bg-[var(--color-blue)]/20 text-[var(--color-blue)] border border-[var(--color-blue)]/30 px-3 py-2 text-xs font-medium">
                Submit
              </button>
            </form>

            {evidence.length > 0 ? (
              <div className="space-y-2">
                {evidence.map((ev: any) => (
                  <div key={ev.id} className="flex items-center justify-between rounded-xl border border-[var(--color-line)]/60 bg-white px-3 py-2.5">
                    <div>
                      <div className="text-sm font-medium">{ev.title}</div>
                      <div className="text-[11px] text-[var(--color-ink-faint)] mt-0.5">{ev.evidenceType.replace(/_/g," ")} · {new Date(ev.submittedAt).toLocaleDateString()}</div>
                    </div>
                    <StatusBadge status={ev.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs text-[var(--color-ink-faint)] py-3">No evidence submitted yet.</p>
            )}
          </div>

          {/* Reviews */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
            <h3 className="font-semibold text-sm mb-3">Review History</h3>
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((r: any) => (
                  <div key={r.id} className="rounded-xl border border-[var(--color-line)]/60 bg-white p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium capitalize">{r.reviewType.replace(/_/g," ")} Review</div>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.reviewerNotes && <p className="text-xs text-[var(--color-ink-dim)]">{r.reviewerNotes}</p>}
                    {r.dueDate && <div className="text-[11px] text-[var(--color-ink-faint)] mt-1">Due: {r.dueDate}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs text-[var(--color-ink-faint)] py-3">No reviews started yet.</p>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Decision panel */}
          {["pending","in_review"].includes(v.status) && (
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Gavel className="h-4 w-4" /> Make Decision
              </h3>
              <form action={async (fd: FormData) => { "use server"; await makeDecisionAction(null, fd); }} className="space-y-3">
                <input type="hidden" name="verificationId" value={v.id} />
                <select name="decision" required className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:outline-none">
                  <option value="">Select decision…</option>
                  <option value="approved">Approved</option>
                  <option value="conditionally_approved">Conditionally Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
                <textarea name="rationale" placeholder="Decision rationale…" rows={3}
                  className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm resize-none focus:outline-none focus:border-[var(--color-blue)]/50" />
                <button type="submit" className="w-full rounded-xl grad-brand py-2 text-sm font-semibold text-white hover:opacity-90">
                  Submit Decision
                </button>
              </form>
            </div>
          )}

          {/* Decision history */}
          {decisions.length > 0 && (
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
              <h3 className="font-semibold text-sm mb-3">Decision History</h3>
              {decisions.map((d: any) => (
                <div key={d.id} className="border-l-2 border-[var(--color-blue)]/30 pl-3 mb-3">
                  <div className="text-sm font-medium capitalize">{d.decision.replace(/_/g," ")}</div>
                  {d.rationale && <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">{d.rationale}</p>}
                  <div className="text-[11px] text-[var(--color-ink-faint)] mt-1">{new Date(d.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}

          {/* Assessment */}
          {assessment && (
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
              <h3 className="font-semibold text-sm mb-3">Assessment</h3>
              <div className="space-y-2">
                {[
                  ["Governance", assessment.governanceScore],
                  ["Risk",       assessment.riskScore],
                  ["Control",    assessment.controlScore],
                  ["Compliance", assessment.complianceScore],
                  ["Privacy",    assessment.privacyScore],
                ].map(([label, score]) => score != null && (
                  <div key={label as string} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-ink-dim)]">{label}</span>
                    <span className="font-medium">{score}</span>
                  </div>
                ))}
                {assessment.aiSummary && (
                  <p className="mt-3 text-xs text-[var(--color-ink-dim)] leading-relaxed border-t border-[var(--color-line)]/50 pt-3">{assessment.aiSummary}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
