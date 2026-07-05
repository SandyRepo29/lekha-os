export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getAssets, getRelationships } from "@/lib/services/asset-intelligence/asset-service";
import { AssetSubNav, CriticalityBadge, AssetTypeBadge } from "@/components/asset-intelligence/asset-ui";
import { AlertTriangle, Building2, Database, GitBranch, Shield, Zap } from "lucide-react";

type ImpactLevel = "critical" | "high" | "medium" | "low";

const IMPACT_STYLES: Record<ImpactLevel, string> = {
  critical: "bg-red-100 border-red-200 text-red-800",
  high:     "bg-orange-100 border-orange-200 text-orange-700",
  medium:   "bg-amber-100 border-amber-200 text-amber-700",
  low:      "bg-emerald-100 border-emerald-200 text-emerald-700",
};

function assetImpact(assets: any[]): ImpactLevel {
  const hasMC = assets.some((a) => a.criticality === "mission_critical");
  const hasCrit = assets.some((a) => a.criticality === "critical");
  const hasHigh = assets.some((a) => a.criticality === "high");
  if (hasMC) return "critical";
  if (hasCrit) return "high";
  if (hasHigh) return "medium";
  return "low";
}

export default async function ImpactAnalysisPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const [assetList, { relationships }] = await Promise.all([
    getAssets(orgId, {}).catch(() => []),
    getRelationships(orgId).catch(() => ({ relationships: [], assets: [] })),
  ]);

  // Build vendor -> assets dependency map from relationships
  // where targetEntityType = 'vendor' or from asset.vendorId field
  const vendorAssets: Record<string, { vendorId: string; vendorName: string; assets: any[] }> = {};

  // Use assets that have a vendorId field (direct dependency)
  for (const asset of assetList) {
    if ((asset as any).vendorId) {
      const vid = (asset as any).vendorId as string;
      const vname = (asset as any).vendorName ?? vid;
      if (!vendorAssets[vid]) vendorAssets[vid] = { vendorId: vid, vendorName: vname, assets: [] };
      vendorAssets[vid].assets.push(asset);
    }
  }

  // Also pick up vendor relationships
  for (const rel of relationships as any[]) {
    if (rel.targetEntityType === "vendor" && rel.targetEntityId) {
      const vid = rel.targetEntityId as string;
      const vname = rel.targetEntityName ?? vid;
      if (!vendorAssets[vid]) vendorAssets[vid] = { vendorId: vid, vendorName: vname, assets: [] };
      const sourceAsset = assetList.find((a) => a.id === rel.sourceAssetId);
      if (sourceAsset && !vendorAssets[vid].assets.find((a) => a.id === sourceAsset.id)) {
        vendorAssets[vid].assets.push(sourceAsset);
      }
    }
  }

  const vendorScenarios = Object.values(vendorAssets).sort(
    (a, b) => b.assets.length - a.assets.length
  );

  // Critical asset failure scenarios
  const criticalAssets = assetList.filter(
    (a) => (a as any).criticality === "critical" || (a as any).criticality === "mission_critical"
  );

  // PII/regulated data exposure scenarios
  const piiAssets = assetList.filter((a) => (a as any).containsPii);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Impact Analysis™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          Understand business impact caused by vendor failure, asset failure, or control failure across your governance landscape.
        </p>
      </div>

      <AssetSubNav />

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Vendor Failure Scenarios",   value: vendorScenarios.length,  color: "text-red-400"    },
          { label: "Critical Assets Exposed",    value: criticalAssets.length,   color: "text-orange-400" },
          { label: "Regulated Data Assets",      value: piiAssets.length,        color: "text-amber-400"  },
          { label: "Total Asset Dependencies",   value: relationships.length,    color: "text-blue-400"   },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-[var(--color-line)] bg-white p-4">
            <p className="text-xs text-[var(--color-ink-dim)] mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Vendor Failure Scenarios */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4 text-red-400" />
          <h2 className="font-semibold text-sm">Vendor Failure Impact Scenarios</h2>
          <span className="ml-auto text-xs text-[var(--color-ink-dim)]">What happens if this vendor becomes unavailable?</span>
        </div>

        {vendorScenarios.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center">
            <Building2 className="h-8 w-8 text-[var(--color-ink-faint)] mx-auto mb-2" />
            <p className="text-sm text-[var(--color-ink-dim)]">No vendor dependencies mapped yet.</p>
            <p className="text-xs text-[var(--color-ink-faint)] mt-1">
              Link vendors to assets in the{" "}
              <Link href="/asset-intelligence/relationships" className="text-[var(--color-blue)] hover:underline">Relationships</Link> tab or via the asset registry.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {vendorScenarios.map((scenario) => {
              const impact = assetImpact(scenario.assets);
              const hasPii = scenario.assets.some((a) => a.containsPii);
              return (
                <div key={scenario.vendorId} className="rounded-xl border border-[var(--color-line)] p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-medium text-sm">{scenario.vendorName}</p>
                      <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">
                        {scenario.assets.length} dependent asset{scenario.assets.length !== 1 ? "s" : ""}
                        {hasPii && <span className="ml-2 text-amber-400">· Contains PII</span>}
                      </p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${IMPACT_STYLES[impact]}`}>
                      {impact} Impact
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {scenario.assets.map((a: any) => (
                      <Link key={a.id} href={`/asset-intelligence/registry/${a.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-white px-2.5 py-1 text-xs hover:bg-[#F8F9FB] transition-colors">
                        <AssetTypeBadge type={a.assetType} />
                        <span className="font-medium">{a.name}</span>
                        <CriticalityBadge level={a.criticality} />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Critical Asset Failure Scenarios */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          <h2 className="font-semibold text-sm">Critical Asset Failure Scenarios</h2>
          <span className="ml-auto text-xs text-[var(--color-ink-dim)]">What governance gaps exist if this asset fails?</span>
        </div>

        {criticalAssets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center">
            <p className="text-sm text-[var(--color-ink-dim)]">No critical assets found. Add critical assets via the Registry.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {criticalAssets.slice(0, 10).map((asset: any) => {
              const impactLevel: ImpactLevel = asset.criticality === "mission_critical" ? "critical" : "high";
              return (
                <div key={asset.id} className="rounded-xl border border-[var(--color-line)] p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <Link href={`/asset-intelligence/registry/${asset.id}`}
                        className="font-medium text-sm hover:text-[var(--color-blue)] transition-colors">
                        {asset.name}
                      </Link>
                      <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">
                        {asset.businessUnit ?? asset.assetType}
                        {asset.containsPii && <span className="ml-2 text-amber-400">· PII</span>}
                        {asset.containsSensitive && <span className="ml-2 text-orange-400">· Sensitive Data</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CriticalityBadge level={asset.criticality} />
                      <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${IMPACT_STYLES[impactLevel]}`}>
                        {impactLevel} Impact
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-[var(--color-ink-dim)]">
                    {asset.environment && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[var(--color-line)] px-2 py-0.5 capitalize">
                        {asset.environment}
                      </span>
                    )}
                    {asset.cloudProvider && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[var(--color-line)] px-2 py-0.5">
                        {asset.cloudProvider}
                      </span>
                    )}
                    <Link href={`/asset-intelligence/impact-analysis`}
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--color-blue)]/30 px-2 py-0.5 text-[var(--color-blue)] hover:bg-[var(--color-blue)]/5">
                      <GitBranch className="h-3 w-3" /> View Dependencies
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Regulated Data Exposure Scenarios */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-amber-400" />
          <h2 className="font-semibold text-sm">Regulated Data Exposure Scenarios</h2>
          <span className="ml-auto text-xs text-[var(--color-ink-dim)]">What PII &amp; regulated data is at risk?</span>
        </div>

        {piiAssets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center">
            <p className="text-sm text-[var(--color-ink-dim)]">No assets marked as containing PII or regulated data.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--color-line)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-white">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)]">Asset</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)]">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)]">Data Class</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)]">Criticality</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)]">Exposure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {piiAssets.map((asset: any) => {
                  const exposure: ImpactLevel =
                    asset.criticality === "mission_critical" ? "critical" :
                    asset.criticality === "critical" ? "high" :
                    asset.criticality === "high" ? "medium" : "low";
                  return (
                    <tr key={asset.id} className="hover:bg-white transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/asset-intelligence/registry/${asset.id}`}
                          className="font-medium hover:text-[var(--color-blue)] transition-colors">
                          {asset.name}
                        </Link>
                        {asset.businessUnit && (
                          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">{asset.businessUnit}</p>
                        )}
                      </td>
                      <td className="px-4 py-3"><AssetTypeBadge type={asset.assetType} /></td>
                      <td className="px-4 py-3">
                        <span className="text-xs capitalize text-amber-400 font-medium">
                          {asset.dataClass ?? "PII"}
                        </span>
                      </td>
                      <td className="px-4 py-3"><CriticalityBadge level={asset.criticality} /></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${IMPACT_STYLES[exposure]}`}>
                          {exposure}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon:  Zap,
            color: "text-[var(--color-blue)]",
            title: "Map Vendor Dependencies",
            desc:  "Link vendors to assets to see full failure impact scenarios.",
            href:  "/asset-intelligence/relationships",
            cta:   "View Relationships",
          },
          {
            icon:  Database,
            color: "text-amber-400",
            title: "Review Data Classifications",
            desc:  "Ensure all PII and regulated data assets are properly classified.",
            href:  "/asset-intelligence/data-assets",
            cta:   "Data Asset Catalog",
          },
          {
            icon:  Shield,
            color: "text-emerald-400",
            title: "Add Controls to Critical Assets",
            desc:  "Improve governance coverage by linking controls to critical assets.",
            href:  "/controls/library",
            cta:   "Control Library",
          },
        ].map(({ icon: Icon, color, title, desc, href, cta }) => (
          <div key={title} className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <Icon className={`h-5 w-5 ${color} mb-3`} />
            <p className="font-semibold text-sm mb-1">{title}</p>
            <p className="text-xs text-[var(--color-ink-dim)] mb-3">{desc}</p>
            <Link href={href} className="text-xs text-[var(--color-blue)] hover:underline">{cta} →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
