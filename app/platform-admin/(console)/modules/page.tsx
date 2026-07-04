export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { getModuleOverridesAction, setModuleOrgOverrideAction, getOrgsForSelectAction } from "@/lib/platform-admin/actions";
import { CheckCircle } from "lucide-react";

const MODULES = [
  { name: "Vendor Hub™",               key: "vendor_hub",             category: "Core GRC",         version: "2.0" },
  { name: "Evidence Vault™",           key: "compliance_management",  category: "Core GRC",         version: "1.0" },
  { name: "Audit Management",          key: "audit_management",       category: "Core GRC",         version: "1.0" },
  { name: "Risk Lens™",               key: "risk_lens",              category: "Core GRC",         version: "1.0" },
  { name: "Control Center™",          key: "control_center",         category: "Core GRC",         version: "1.0" },
  { name: "Policy Governance™",       key: "policy_governance",      category: "Core GRC",         version: "1.0" },
  { name: "DPDP Privacy™",            key: "dpdp_privacy",           category: "Privacy & Legal",  version: "1.0" },
  { name: "Contract Governance™",     key: "contract_governance",    category: "Privacy & Legal",  version: "2.0" },
  { name: "Issue & Remediation Hub™", key: "issue_hub",              category: "Core GRC",         version: "1.0" },
  { name: "Workflow Studio™",         key: "workflow_studio",        category: "Platform",         version: "1.0" },
  { name: "Trust Intelligence™",      key: "trust_intelligence",     category: "Intelligence",     version: "2.0" },
  { name: "Governance Trends™",       key: "governance_trends",      category: "Intelligence",     version: "1.0" },
  { name: "Trust Graph™",            key: "trust_graph",            category: "Intelligence",     version: "1.0" },
  { name: "Trust Score™",            key: "trust_score",            category: "Intelligence",     version: "2.0" },
  { name: "Trust Exchange™",         key: "trust_exchange",         category: "Trust Network",    version: "1.0" },
  { name: "Governance Benchmarking™",key: "benchmarking",           category: "Measure",          version: "1.0" },
  { name: "Integration Hub™",        key: "integration_hub",        category: "Platform",         version: "1.0" },
  { name: "Trust Network™",          key: "trust_network",          category: "Trust Network",    version: "1.0" },
  { name: "Executive Reporting™",    key: "executive_reporting",    category: "Measure",          version: "1.0" },
  { name: "AI Governance™",          key: "ai_governance",          category: "Intelligence",     version: "1.0" },
  { name: "Auditor Collaboration™",  key: "auditor_collaboration",  category: "Core GRC",         version: "1.0" },
  { name: "Trust API Platform™",     key: "api_access",             category: "Trust Network",    version: "1.0" },
  { name: "Trust Verification™",     key: "trust_verification",     category: "Trust Network",    version: "1.0" },
  { name: "Continuous Compliance™",  key: "continuous_compliance",  category: "Improve",          version: "1.0" },
  { name: "Governance Agent Framework™",key:"governance_agents",    category: "Intelligence",     version: "1.0" },
  { name: "Regulatory Intelligence™",key: "regulatory_intelligence",category: "Improve",          version: "1.0" },
  { name: "Asset Intelligence™",     key: "asset_intelligence",     category: "Discover",         version: "1.0" },
  { name: "Security Command Center™",key: "security_command_center",category: "Security",         version: "1.0" },
  { name: "Trust Operations Engine™",key: "trust_operations",       category: "Platform",         version: "1.0" },
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
  const [{ data: overrides }, { data: orgs }] = await Promise.all([
    getModuleOverridesAction(),
    getOrgsForSelectAction(),
  ]);

  const overrideMap = new Map<string, Array<Record<string, unknown>>>();
  for (const ov of (overrides ?? []) as Array<Record<string, unknown>>) {
    const key = ov.flag_key as string;
    if (!overrideMap.has(key)) overrideMap.set(key, []);
    overrideMap.get(key)!.push(ov);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Module Registry</h1>
          <p className="mt-0.5 text-sm text-white/40">{MODULES.length} modules shipped. Per-org overrides control tenant access.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-300">{MODULES.length} Live</span>
        </div>
      </div>

      <div className="rounded-xl border border-[#30363d] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#30363d] bg-white/[0.02]">
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">#</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Module</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Category</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Ver</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Status</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Org Overrides</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Add Override</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]">
            {MODULES.map((m, i) => {
              const modOverrides = overrideMap.get(m.key) ?? [];
              return (
                <tr key={m.name} className="hover:bg-white/[0.015] transition-colors align-top">
                  <td className="px-5 py-3 text-xs text-white/25 tabular-nums">{i + 1}</td>
                  <td className="px-5 py-3">
                    <div className="text-sm font-medium text-white">{m.name}</div>
                    <div className="text-[10px] font-mono text-white/25">{m.key}</div>
                  </td>
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
                  <td className="px-5 py-3">
                    {modOverrides.length === 0 ? (
                      <span className="text-xs text-white/20">None</span>
                    ) : (
                      <div className="space-y-0.5">
                        {modOverrides.map((ov) => (
                          <div key={ov.organization_id as string} className="flex items-center gap-1.5 text-xs">
                            <span className={`rounded-full px-1.5 py-0.5 font-medium ${ov.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                              {ov.enabled ? "on" : "off"}
                            </span>
                            <span className="text-white/50">{ov.org_name as string}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <form action={async (fd: FormData) => {
                      "use server";
                      const orgId = fd.get("org_id") as string;
                      const enabled = fd.get("enabled") === "1";
                      if (orgId) await setModuleOrgOverrideAction(orgId, m.key, enabled);
                    }}>
                      <div className="flex items-center gap-1.5">
                        <select name="org_id" className="rounded border border-[#30363d] bg-[#161b22] px-1.5 py-1 text-[11px] text-white max-w-[130px]">
                          <option value="">Select org…</option>
                          {(orgs ?? []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                        <select name="enabled" className="rounded border border-[#30363d] bg-[#161b22] px-1.5 py-1 text-[11px] text-white">
                          <option value="0">Disable</option>
                          <option value="1">Enable</option>
                        </select>
                        <button type="submit" className="rounded bg-[#007A94] px-2 py-1 text-[11px] font-semibold text-white hover:opacity-80">
                          Set
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
