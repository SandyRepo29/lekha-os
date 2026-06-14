﻿export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getRelationships } from "@/lib/services/asset-intelligence/asset-service";
import { AssetSubNav, AssetTypeBadge } from "@/components/asset-intelligence/asset-ui";
import { GitBranch, ArrowRight } from "lucide-react";

const REL_COLORS: Record<string, string> = {
  depends_on:   "text-blue-400",
  uses:         "text-cyan-400",
  stores:       "text-amber-400",
  processes:    "text-purple-400",
  connects_to:  "text-green-400",
  owned_by:     "text-indigo-400",
  provided_by:  "text-orange-400",
  supports:     "text-teal-400",
  protected_by: "text-emerald-400",
  governed_by:  "text-slate-400",
};

export default async function RelationshipsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const { relationships, assets } = await getRelationships(orgId).catch(() => ({ relationships: [], assets: [] }));

  const assetMap = Object.fromEntries((assets as any[]).map((a: any) => [a.id, a]));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Asset Relationships™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">Dependency mapping and asset relationship graph.</p>
      </div>

      <AssetSubNav />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] border-l-2 border-l-blue-400 p-4">
          <p className="text-xs text-[var(--color-ink-dim)]">Total Relationships</p>
          <p className="text-2xl font-bold text-blue-400">{relationships.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] border-l-2 border-l-red-400 p-4">
          <p className="text-xs text-[var(--color-ink-dim)]">Critical Links</p>
          <p className="text-2xl font-bold text-red-400">{(relationships as any[]).filter((r: any) => r.isCritical).length}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] border-l-2 border-l-purple-400 p-4">
          <p className="text-xs text-[var(--color-ink-dim)]">Assets Mapped</p>
          <p className="text-2xl font-bold text-purple-400">{assets.length}</p>
        </div>
      </div>

      {relationships.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] p-12 text-center">
          <GitBranch className="h-8 w-8 text-[var(--color-ink-dim)] mx-auto mb-3" />
          <p className="text-sm text-[var(--color-ink-dim)]">No relationships mapped yet. Add assets first, then map their dependencies.</p>
          <Link href="/asset-intelligence/registry" className="mt-3 inline-flex text-sm text-[var(--color-blue)] hover:underline">Go to Asset Registry â†’</Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-line)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)]">Source Asset</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)]">Relationship</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)]">Target</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)]">Critical</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {(relationships as any[]).map((r: any) => {
                const source = assetMap[r.sourceAssetId];
                const target = assetMap[r.targetAssetId];
                return (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      {source ? (
                        <div>
                          <Link href={`/asset-intelligence/registry/${source.id}`} className="font-medium hover:text-[var(--color-blue)]">{source.name}</Link>
                          <div className="mt-0.5"><AssetTypeBadge type={source.assetType} /></div>
                        </div>
                      ) : <span className="text-[var(--color-ink-dim)]">â€”</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-3.5 w-3.5 text-[var(--color-ink-dim)]" />
                        <span className={`text-xs font-medium capitalize ${REL_COLORS[r.relationshipType] ?? "text-slate-400"}`}>
                          {r.relationshipType?.replace(/_/g," ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {target ? (
                        <div>
                          <Link href={`/asset-intelligence/registry/${target.id}`} className="font-medium hover:text-[var(--color-blue)]">{target.name}</Link>
                          <div className="mt-0.5"><AssetTypeBadge type={target.assetType} /></div>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--color-ink-dim)]">
                          {r.targetEntityType ? `${r.targetEntityType} entity` : "External"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.isCritical ? <span className="text-xs text-red-400 font-medium">Yes</span> : <span className="text-xs text-[var(--color-ink-dim)]">No</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Trust Graph link */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Trust Graph™ Integration</h3>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Asset nodes and relationships are visible in the full governance Trust Graph™.</p>
        </div>
        <Link href="/trust-intelligence/trust-graph" className="rounded-xl border border-[var(--color-blue)]/30 px-4 py-2 text-sm text-[var(--color-blue)] hover:bg-[var(--color-blue)]/10 transition-colors">
          Open Trust Graph â†’
        </Link>
      </div>
    </div>
  );
}

