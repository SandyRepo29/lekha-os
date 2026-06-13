export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getVerifications } from "@/lib/services/trust-verification/trust-verification-service";
import { FileText, Plus, CheckCircle, Clock, XCircle, AlertTriangle, Eye, ShieldCheck } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:                { label: "Pending",               cls: "bg-amber-500/10 text-amber-400" },
    in_review:              { label: "In Review",             cls: "bg-[var(--color-blue)]/10 text-[var(--color-blue)]" },
    approved:               { label: "Approved",              cls: "bg-emerald-500/10 text-emerald-400" },
    conditionally_approved: { label: "Conditional",           cls: "bg-teal-500/10 text-teal-400" },
    rejected:               { label: "Rejected",              cls: "bg-red-500/10 text-red-400" },
    suspended:              { label: "Suspended",             cls: "bg-orange-500/10 text-orange-400" },
    revoked:                { label: "Revoked",               cls: "bg-red-700/10 text-red-600" },
    expired:                { label: "Expired",               cls: "bg-white/5 text-[var(--color-ink-faint)]" },
    renewal_required:       { label: "Renewal Required",      cls: "bg-amber-500/10 text-amber-400" },
  };
  const s = map[status] ?? { label: status, cls: "bg-white/5 text-[var(--color-ink-faint)]" };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.cls}`}>{s.label}</span>;
}

export default async function ApplicationsPage() {
  const session = await requireUser();
  const verifications = await getVerifications(session.org?.id ?? "").catch(() => []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Verification Applications</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Apply for trust verification programs and track your application status.</p>
        </div>
        <Link href="/trust-verification/applications/new"
          className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" /> New Application
        </Link>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total",    value: verifications.length,                                           cls: "text-[var(--color-blue)]" },
          { label: "Approved", value: verifications.filter((v: any) => v.status === "approved").length, cls: "text-emerald-400" },
          { label: "Pending",  value: verifications.filter((v: any) => ["pending","in_review"].includes(v.status)).length, cls: "text-amber-400" },
          { label: "Rejected", value: verifications.filter((v: any) => v.status === "rejected").length, cls: "text-red-400" },
        ].map(({ label, value, cls }) => (
          <div key={label} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-4 text-center">
            <div className={`text-2xl font-bold ${cls}`}>{value}</div>
            <div className="text-xs text-[var(--color-ink-dim)]">{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {verifications.length > 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-dim)] font-medium uppercase tracking-wider">
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Readiness</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]/50">
              {verifications.map((v: any) => (
                <tr key={v.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{v.programName ?? "Unknown Program"}</div>
                    <div className="text-xs text-[var(--color-ink-faint)]">
                      {v.readinessScore != null && `Readiness: ${v.readinessScore}`}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                    {v.verificationLevel.replace("level_","Level ")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-white/[0.08]">
                        <div className="h-full rounded-full bg-[var(--color-blue)]" style={{ width: `${v.readinessScore ?? 0}%` }} />
                      </div>
                      <span className="text-xs text-[var(--color-ink-dim)]">{v.readinessScore ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">{new Date(v.appliedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                    {v.expiresAt ? new Date(v.expiresAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3">
                    <Link href={`/trust-verification/applications/${v.id}`}
                      className="flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-2.5 py-1 text-xs font-medium hover:bg-white/[0.07]">
                      <Eye className="h-3 w-3" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-12 text-center">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-[var(--color-ink-faint)]" />
          <div className="text-sm font-medium mb-1">No verification applications yet</div>
          <p className="text-xs text-[var(--color-ink-dim)] mb-4">Apply for an AUDT verification program to get your organization certified and publicly verified.</p>
          <Link href="/trust-verification/applications/new" className="inline-flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Apply for Verification
          </Link>
        </div>
      )}
    </div>
  );
}
