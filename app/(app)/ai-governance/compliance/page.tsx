export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { findAllCompliance } from "@/lib/repositories/ai-governance-repo";
import { ShieldCheck } from "lucide-react";

const FRAMEWORK_META: Record<string, { label: string; desc: string; color: string }> = {
  iso_42001:        { label: "ISO 42001", desc: "AI Management System Standard", color: "text-blue-700" },
  nist_ai_rmf:      { label: "NIST AI RMF", desc: "AI Risk Management Framework", color: "text-indigo-700" },
  eu_ai_act:        { label: "EU AI Act", desc: "European AI Regulation", color: "text-purple-700" },
  oecd_ai_principles: { label: "OECD AI Principles", desc: "International AI Guidelines", color: "text-cyan-700" },
  dpdp_ai:          { label: "DPDP AI Requirements", desc: "India DPDP Act AI compliance", color: "text-orange-700" },
  internal:         { label: "Internal Policy", desc: "Organization-defined AI governance", color: "text-emerald-700" },
};
const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-500/10 text-gray-400",
  in_progress: "bg-blue-100 text-blue-700",
  compliant: "bg-emerald-100 text-emerald-700",
  partial: "bg-yellow-100 text-yellow-700",
  non_compliant: "bg-red-100 text-red-700",
};

export default async function AiCompliancePage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const records = await findAllCompliance(orgId).catch(() => []);

  const allFrameworks = Object.keys(FRAMEWORK_META);
  const recordMap = Object.fromEntries(records.map(r => [r.framework, r]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-[var(--color-blue)]" /> AI Compliance™
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
          Track readiness against ISO 42001, NIST AI RMF, EU AI Act, OECD, DPDP, and internal AI governance policies.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allFrameworks.map((fw) => {
          const meta = FRAMEWORK_META[fw];
          const rec = recordMap[fw];
          const score = rec ? Number(rec.readinessScore ?? 0) : 0;
          const status = rec?.status ?? "not_started";
          return (
            <div key={fw} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className={`font-semibold ${meta.color}`}>{meta.label}</div>
                  <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">{meta.desc}</div>
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? ""}`}>
                  {status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[var(--color-ink-dim)]">
                  <span>Readiness</span>
                  <span className="font-mono">{score.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#F8F9FB] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--color-blue)] transition-all" style={{ width: `${score}%` }} />
                </div>
              </div>
              {rec && (
                <div className="flex justify-between text-xs text-[var(--color-ink-dim)]">
                  <span>{rec.implementedControls}/{rec.totalControls} controls</span>
                  <span>{rec.openGaps} open gaps</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
