﻿export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getAssets } from "@/lib/services/asset-intelligence/asset-service";
import { AssetSubNav, CriticalityBadge, AssetStatusBadge, AssetTypeBadge, AssetTrustBadge } from "@/components/asset-intelligence/asset-ui";
import { Plus, Shield } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";

export default async function AssetRegistryPage({ searchParams }: { searchParams: Promise<{ type?: string; criticality?: string; status?: string; search?: string }> }) {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const params  = await searchParams;
  const search = params.search?.toLowerCase() ?? "";

  let assetList = await getAssets(orgId, {
    type:        params.type,
    criticality: params.criticality,
    status:      params.status,
  }).catch(() => []);

  if (search) assetList = assetList.filter(a => a.name.toLowerCase().includes(search) || (a.businessUnit ?? "").toLowerCase().includes(search));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Asset Registry™</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">{assetList.length} assets in inventory</p>
        </div>
        <Link href="/asset-intelligence/registry/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-blue)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Add Asset
        </Link>
      </div>

      <AssetSubNav />

      {/* Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput placeholder="Search assets&#8230;" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: "All", href: "/asset-intelligence/registry" },
          { label: "Applications", href: "?type=application" },
          { label: "Databases", href: "?type=database" },
          { label: "APIs", href: "?type=api" },
          { label: "Cloud", href: "?type=cloud_resource" },
          { label: "Data Assets", href: "?type=data_asset" },
          { label: "Critical", href: "?criticality=critical" },
          { label: "PII", href: "?dataClass=restricted" },
        ].map(({ label, href }) => (
          <Link key={label} href={href}
            className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-medium text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:border-[var(--color-blue)]/40 transition-colors">
            {label}
          </Link>
        ))}
      </div>

      {assetList.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] p-12 text-center">
          <p className="text-[var(--color-ink-dim)] text-sm">No assets found.</p>
          <Link href="/asset-intelligence/registry/new"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--color-blue)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> Add First Asset
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-line)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] bg-white">
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)]">Asset</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)]">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)]">Environment</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)]">Criticality</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)]">Data Class</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)]">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)]">Trust Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {assetList.map((a) => (
                <tr key={a.id} className="hover:bg-white transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/asset-intelligence/registry/${a.id}`} className="font-medium hover:text-[var(--color-blue)] transition-colors">
                      {a.name}
                    </Link>
                    {a.businessUnit && <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">{a.businessUnit}</p>}
                  </td>
                  <td className="px-4 py-3"><AssetTypeBadge type={a.assetType} /></td>
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)] capitalize">{a.environment}</td>
                  <td className="px-4 py-3"><CriticalityBadge level={a.criticality} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs capitalize text-[var(--color-ink-dim)]">{(a as any).dataClass ?? "—"}</span>
                      {((a as any).containsPii || ((a as any).piiTypes && (a as any).piiTypes.length > 0)) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <Shield className="h-3 w-3" />
                          PII
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3"><AssetStatusBadge status={a.status} /></td>
                  <td className="px-4 py-3"><AssetTrustBadge score={a.trustScore} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

