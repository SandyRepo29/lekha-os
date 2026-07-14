export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { findAllRisks } from "@/backend/src/modules/ai-governance/ai-governance-repo";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { AIGovStat, AIRiskLevelBadge } from "@/components/ai-governance/ai-governance-ui";

const CATEGORY_LABELS: Record<string, string> = {
  hallucination: "Hallucination", bias: "Bias", privacy_leakage: "Privacy Leakage",
  copyright_risk: "Copyright Risk", prompt_injection: "Prompt Injection",
  data_poisoning: "Data Poisoning", model_drift: "Model Drift",
  regulatory_risk: "Regulatory Risk", security_risk: "Security Risk",
  vendor_dependency: "Vendor Dependency", explainability_risk: "Explainability",
  autonomous_decision_risk: "Autonomous Decision", other: "Other",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-700", mitigating: "bg-[var(--color-blue)]/10 text-[var(--color-blue)]",
  accepted: "bg-yellow-100 text-yellow-700", closed: "bg-emerald-100 text-emerald-700",
};

export default async function AiRisksPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const risks = await findAllRisks(orgId).catch(() => []);

  const open = risks.filter(r => r.status === "open").length;
  const critical = risks.filter(r => r.riskLevel === "critical").length;
  const high = risks.filter(r => r.riskLevel === "high").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-700" /> AI Risk Register™
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">AI-specific risks across hallucination, bias, privacy, security, and regulatory domains.</p>
        </div>
        <Link href="/ai-governance/risks/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Risk
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <AIGovStat label="Open Risks" value={open} accent={open > 0 ? "danger" : "neutral"} />
        <AIGovStat label="Critical" value={critical} accent={critical > 0 ? "danger" : "neutral"} />
        <AIGovStat label="High" value={high} accent={high > 0 ? "warn" : "neutral"} />
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-[var(--color-ink-dim)] text-xs">
              <th className="px-4 py-3 text-left font-medium">Risk</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Level</th>
              <th className="px-4 py-3 text-left font-medium">Score</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {risks.map((r) => (
              <tr key={r.id} className="hover:bg-white">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.title}</div>
                  {r.description && <div className="text-xs text-[var(--color-ink-dim)]">{r.description.slice(0, 60)}</div>}
                </td>
                <td className="px-4 py-3 text-[var(--color-ink-dim)]">{CATEGORY_LABELS[r.riskCategory] ?? r.riskCategory}</td>
                <td className="px-4 py-3">
                  <AIRiskLevelBadge level={r.riskLevel} />
                </td>
                <td className="px-4 py-3 font-mono">{r.likelihood * r.impact}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] ?? ""}`}>{r.status}</span>
                </td>
              </tr>
            ))}
            {risks.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-[var(--color-ink-dim)]">No AI risks registered yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
