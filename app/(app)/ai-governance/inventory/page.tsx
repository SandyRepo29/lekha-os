export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { findAllSystems } from "@/lib/repositories/ai-governance-repo";
import Link from "next/link";
import { Layers, Plus, Bot } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  commercial: "Commercial", open_source: "Open Source", internal: "Internal",
  agent: "Agent", rag: "RAG System", llm_app: "LLM App", workflow: "Workflow",
};
const RISK_COLORS: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-400", moderate: "bg-yellow-500/10 text-yellow-400",
  high: "bg-orange-500/10 text-orange-400", critical: "bg-red-500/10 text-red-400",
  prohibited: "bg-purple-500/10 text-purple-400",
};
const STATUS_COLORS: Record<string, string> = {
  approved: "bg-emerald-500/10 text-emerald-400", pending: "bg-yellow-500/10 text-yellow-400",
  under_review: "bg-blue-500/10 text-blue-400", rejected: "bg-red-500/10 text-red-400",
  decommissioned: "bg-gray-500/10 text-gray-400",
};

export default async function AiInventoryPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const systems = await findAllSystems(orgId).catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-[var(--color-blue)]" /> AI Inventory™
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Central registry of all AI systems in use across your organization.
          </p>
        </div>
        <Link href="/ai-governance/inventory/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> Add System
        </Link>
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-[var(--color-ink-dim)] text-xs">
              <th className="px-4 py-3 text-left font-medium">System</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Vendor</th>
              <th className="px-4 py-3 text-left font-medium">Risk</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Trust Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {systems.map((s) => (
              <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-[var(--color-blue)]" />
                    <div>
                      <div className="font-medium">{s.name}</div>
                      {s.purpose && <div className="text-xs text-[var(--color-ink-dim)]">{s.purpose.slice(0, 60)}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--color-ink-dim)]">{TYPE_LABELS[s.systemType] ?? s.systemType}</td>
                <td className="px-4 py-3 text-[var(--color-ink-dim)]">{s.vendorName ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${RISK_COLORS[s.riskClassification] ?? ""}`}>
                    {s.riskClassification}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.approvalStatus] ?? ""}`}>
                    {s.approvalStatus?.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-sm">
                  {s.aiTrustScore ? `${Number(s.aiTrustScore).toFixed(0)}/100` : "—"}
                </td>
              </tr>
            ))}
            {systems.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-[var(--color-ink-dim)]">
                No AI systems registered. Add your first system to get started.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
