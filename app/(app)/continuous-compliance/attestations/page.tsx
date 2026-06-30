export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getAttestations } from "@/lib/services/continuous-compliance/continuous-compliance-service";
import { createAttestationAction } from "@/lib/continuous-compliance/actions";
import { BookOpen, Plus } from "lucide-react";
import { StatusBadge, CcStat, HealthBar, CcSubNav } from "@/components/continuous-compliance/cc-ui";

const POLICY_TYPES: Record<string, string> = {
  security_policy: "Security Policy", acceptable_use: "Acceptable Use",
  privacy_policy: "Privacy Policy", ai_policy: "AI Policy",
  vendor_policy: "Vendor Policy", custom: "Custom",
};

export default async function AttestationsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const attestations = await getAttestations(orgId).catch(() => []);

  const active   = attestations.filter(a => a.status === "active").length;
  const avgRate  = attestations.length > 0
    ? Math.round(attestations.reduce((s, a) => s + a.completionRate, 0) / attestations.length)
    : 0;

  return (
    <div className="space-y-6 p-6">
      <CcSubNav />

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Compliance Attestations™</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Policy sign-offs and workforce compliance sign-ons</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <CcStat label="Active"        value={active}        accent="blue" />
        <CcStat label="Total"         value={attestations.length} accent="neutral" />
        <CcStat label="Avg Completion" value={`${avgRate}%`} accent={avgRate >= 80 ? "good" : "warn"} />
      </div>

      {/* Create form */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-sm">
          <Plus className="h-4 w-4 text-[var(--color-blue)]" /> New Attestation
        </h3>
        <form action={createAttestationAction.bind(null, null)} className="grid grid-cols-2 gap-3">
          <input name="title" required placeholder="Attestation title *"
            className="col-span-2 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]" />
          <select name="policyType"
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]">
            {Object.entries(POLICY_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input name="dueDate" type="date"
            className="rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]" />
          <textarea name="description" rows={2} placeholder="Description (optional)"
            className="col-span-2 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]" />
          <button type="submit"
            className="col-span-2 rounded-xl grad-brand py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
            Create Attestation
          </button>
        </form>
      </div>

      {/* Attestation list */}
      {attestations.length > 0 ? (
        <div className="space-y-3">
          {attestations.map(att => (
            <div key={att.id} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-blue)]" />
                  <div>
                    <div className="font-semibold text-sm">{att.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-ink-dim)]">
                      <span>{POLICY_TYPES[att.policyType] ?? att.policyType}</span>
                      <span>·</span><span>v{att.version}</span>
                    </div>
                    {att.description && <p className="mt-1 text-xs text-[var(--color-ink-faint)]">{att.description}</p>}
                  </div>
                </div>
                <StatusBadge status={att.status} />
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-[var(--color-ink-dim)]">
                  <span>Completion</span>
                  <span>{att.totalCompleted}/{att.totalAssigned} ({att.completionRate}%)</span>
                </div>
                <HealthBar score={att.completionRate} size="sm" />
              </div>
              {att.dueDate && (
                <div className="mt-2 text-[11px] text-[var(--color-ink-faint)]">Due: {new Date(att.dueDate).toLocaleDateString()}</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-10 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-[var(--color-ink-faint)] opacity-40" />
          <p className="text-sm text-[var(--color-ink-dim)]">No attestations yet. Create your first one above.</p>
        </div>
      )}
    </div>
  );
}
