export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { findAllControls } from "@/lib/repositories/ai-governance-repo";
import Link from "next/link";
import { Shield, Plus } from "lucide-react";
import { AIGovStat } from "@/components/ai-governance/ai-governance-ui";

const CAT_LABELS: Record<string, string> = {
  human_oversight: "Human Oversight", output_review: "Output Review",
  prompt_logging: "Prompt Logging", model_approval: "Model Approval",
  data_classification: "Data Classification", access_control: "Access Control",
  vendor_review: "Vendor Review", model_monitoring: "Model Monitoring",
  content_filtering: "Content Filtering", red_team_testing: "Red Team Testing", other: "Other",
};
const STATUS_COLORS: Record<string, string> = {
  implemented: "bg-emerald-500/10 text-emerald-400",
  partially_implemented: "bg-yellow-500/10 text-yellow-400",
  planned: "bg-blue-500/10 text-blue-400",
  not_applicable: "bg-gray-500/10 text-gray-400",
};
const EFFECT_COLORS: Record<string, string> = {
  effective: "text-emerald-400", partially_effective: "text-yellow-400",
  ineffective: "text-red-400", not_tested: "text-[var(--color-ink-dim)]",
};

export default async function AiControlsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const controls = await findAllControls(orgId).catch(() => []);

  const implemented = controls.filter(c => c.status === "implemented").length;
  const partial = controls.filter(c => c.status === "partially_implemented").length;
  const planned = controls.filter(c => c.status === "planned").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-[var(--color-blue)]" /> AI Controls™
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Governance controls covering human oversight, monitoring, access, and red team testing.</p>
        </div>
        <Link href="/ai-governance/controls/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Control
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <AIGovStat label="Total" value={controls.length} accent="neutral" />
        <AIGovStat label="Implemented" value={implemented} accent={implemented > 0 ? "good" : "neutral"} />
        <AIGovStat label="Partial" value={partial} accent={partial > 0 ? "warn" : "neutral"} />
        <AIGovStat label="Planned" value={planned} accent="neutral" />
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-[var(--color-ink-dim)] text-xs">
              <th className="px-4 py-3 text-left font-medium">Control</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Effectiveness</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {controls.map((c) => (
              <tr key={c.id} className="hover:bg-white">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  {c.description && <div className="text-xs text-[var(--color-ink-dim)]">{c.description.slice(0, 60)}</div>}
                </td>
                <td className="px-4 py-3 text-[var(--color-ink-dim)]">{CAT_LABELS[c.controlCategory] ?? c.controlCategory}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] ?? ""}`}>{c.status?.replace(/_/g, " ")}</span>
                </td>
                <td className={`px-4 py-3 text-sm font-medium ${EFFECT_COLORS[c.effectiveness ?? "not_tested"] ?? ""}`}>
                  {c.effectiveness?.replace(/_/g, " ") ?? "not tested"}
                </td>
              </tr>
            ))}
            {controls.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-[var(--color-ink-dim)]">No controls defined yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
