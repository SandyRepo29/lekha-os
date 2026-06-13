export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getTraining } from "@/lib/services/continuous-compliance/continuous-compliance-service";
import { createTrainingAction } from "@/lib/continuous-compliance/actions";
import { GraduationCap, Plus, ArrowLeft } from "lucide-react";
import { StatusBadge, CcStat, HealthBar } from "@/components/continuous-compliance/cc-ui";

const TRAINING_TYPES: Record<string, string> = {
  security_awareness: "Security Awareness", privacy_training: "Privacy Training",
  ai_governance: "AI Governance", vendor_governance: "Vendor Governance", custom: "Custom",
};

export default async function TrainingPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const campaigns = await getTraining(orgId).catch(() => []);
  const active = campaigns.filter(c => c.status === "active").length;
  const avgRate = campaigns.length > 0
    ? Math.round(campaigns.reduce((s, c) => s + c.completionRate, 0) / campaigns.length)
    : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/continuous-compliance" className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Training Compliance™</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">Security awareness, privacy, and AI governance training</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <CcStat label="Active Campaigns" value={active}        accent="blue" />
        <CcStat label="Total Campaigns"  value={campaigns.length} accent="neutral" />
        <CcStat label="Avg Completion"   value={`${avgRate}%`}   accent={avgRate >= 80 ? "good" : "warn"} />
      </div>

      {/* Create form */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-sm">
          <Plus className="h-4 w-4 text-[var(--color-blue)]" /> New Training Campaign
        </h3>
        <form action={createTrainingAction.bind(null, null)} className="grid grid-cols-2 gap-3">
          <input name="title" required placeholder="Campaign title *"
            className="col-span-2 rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]" />
          <select name="trainingType"
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]">
            {Object.entries(TRAINING_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input name="dueDate" type="date"
            className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]" />
          <textarea name="description" rows={2} placeholder="Description (optional)"
            className="col-span-2 rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]" />
          <button type="submit"
            className="col-span-2 rounded-xl grad-brand py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
            Create Campaign
          </button>
        </form>
      </div>

      {campaigns.length > 0 ? (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-blue)]" />
                  <div>
                    <div className="font-semibold text-sm">{c.title}</div>
                    <div className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{TRAINING_TYPES[c.trainingType] ?? c.trainingType}</div>
                    {c.description && <p className="mt-1 text-xs text-[var(--color-ink-faint)]">{c.description}</p>}
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-[var(--color-ink-dim)]">
                  <span>Completion</span>
                  <span>{c.totalCompleted}/{c.totalAssigned} ({c.completionRate}%)</span>
                </div>
                <HealthBar score={c.completionRate} size="sm" />
              </div>
              {c.dueDate && <div className="mt-2 text-[11px] text-[var(--color-ink-faint)]">Due: {new Date(c.dueDate).toLocaleDateString()}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-10 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-[var(--color-ink-faint)] opacity-40" />
          <p className="text-sm text-[var(--color-ink-dim)]">No training campaigns yet. Create your first one above.</p>
        </div>
      )}
    </div>
  );
}
