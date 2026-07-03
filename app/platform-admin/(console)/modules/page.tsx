export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { CheckCircle } from "lucide-react";

const MODULES = [
  { name: "Vendor Hub™",               category: "Core GRC",         status: "live", version: "2.0" },
  { name: "Evidence Vault™",           category: "Core GRC",         status: "live", version: "1.0" },
  { name: "Audit Management",               category: "Core GRC",         status: "live", version: "1.0" },
  { name: "Risk Lens™",               category: "Core GRC",         status: "live", version: "1.0" },
  { name: "Control Center™",          category: "Core GRC",         status: "live", version: "1.0" },
  { name: "Policy Governance™",       category: "Core GRC",         status: "live", version: "1.0" },
  { name: "DPDP Privacy™",            category: "Privacy & Legal",  status: "live", version: "1.0" },
  { name: "Contract Governance™",     category: "Privacy & Legal",  status: "live", version: "2.0" },
  { name: "Issue & Remediation Hub™", category: "Core GRC",         status: "live", version: "1.0" },
  { name: "Workflow Studio™",         category: "Platform",         status: "live", version: "1.0" },
  { name: "Trust Intelligence™",      category: "Intelligence",     status: "live", version: "2.0" },
  { name: "Governance Trends™",       category: "Intelligence",     status: "live", version: "1.0" },
  { name: "Continuous Monitoring™",   category: "Intelligence",     status: "live", version: "1.0" },
  { name: "Trust Graph™",            category: "Intelligence",     status: "live", version: "1.0" },
  { name: "Trust Score™",            category: "Intelligence",     status: "live", version: "2.0" },
  { name: "Trust Exchange™",         category: "Trust Network",    status: "live", version: "1.0" },
  { name: "Governance Benchmarking™","category": "Measure",        status: "live", version: "1.0" },
  { name: "Integration Hub™",        category: "Platform",         status: "live", version: "1.0" },
  { name: "Trust Network™",          category: "Trust Network",    status: "live", version: "1.0" },
  { name: "Executive Reporting™",    category: "Measure",          status: "live", version: "1.0" },
  { name: "AI Governance™",          category: "Intelligence",     status: "live", version: "1.0" },
  { name: "Auditor Collaboration™",  category: "Core GRC",         status: "live", version: "1.0" },
  { name: "Trust API Platform™",     category: "Trust Network",    status: "live", version: "1.0" },
  { name: "Trust Verification™",     category: "Trust Network",    status: "live", version: "1.0" },
  { name: "Continuous Compliance™",  category: "Improve",          status: "live", version: "1.0" },
  { name: "Governance Agent Framework™","category":"Intelligence", status: "live", version: "1.0" },
  { name: "Regulatory Intelligence™","category": "Improve",        status: "live", version: "1.0" },
  { name: "Asset Intelligence™",     category: "Discover",         status: "live", version: "1.0" },
  { name: "Security Command Center™","category": "Security",       status: "live", version: "1.0" },
  { name: "Trust Operations Engine™","category": "Platform",       status: "live", version: "1.0" },
  { name: "Settings & Org Management",    category: "Platform",         status: "live", version: "1.0" },
  { name: "Platform Services",            category: "Platform",         status: "live", version: "1.0" },
];

const CATEGORY_COLOR: Record<string, string> = {
  "Core GRC":       "bg-violet-500/20 text-violet-300",
  "Privacy & Legal":"bg-pink-500/20 text-pink-300",
  "Intelligence":   "bg-[#00B8D9]/20 text-[#00B8D9]",
  "Trust Network":  "bg-emerald-500/20 text-emerald-300",
  "Measure":        "bg-amber-500/20 text-amber-300",
  "Improve":        "bg-blue-500/20 text-blue-300",
  "Security":       "bg-red-500/20 text-red-300",
  "Discover":       "bg-orange-500/20 text-orange-300",
  "Platform":       "bg-white/10 text-white/50",
};

export default async function ModulesPage() {
  await requirePlatformUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Module Registry</h1>
          <p className="mt-0.5 text-sm text-white/40">{MODULES.length} modules shipped across all customer-journey groups.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-300">{MODULES.length} Live</span>
        </div>
      </div>

      <div className="rounded-xl border border-[#30363d] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#30363d] bg-white/[0.02]">
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">#</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Module</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Category</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Version</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]">
            {MODULES.map((m, i) => (
              <tr key={m.name} className="hover:bg-white/[0.015] transition-colors">
                <td className="px-5 py-3 text-xs text-white/25 tabular-nums">{i + 1}</td>
                <td className="px-5 py-3 text-sm font-medium text-white">{m.name}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${CATEGORY_COLOR[m.category] ?? "bg-white/5 text-white/40"}`}>
                    {m.category}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs font-mono text-white/40">v{m.version}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Live
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
