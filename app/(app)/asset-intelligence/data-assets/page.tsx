﻿export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getAssets } from "@/lib/services/asset-intelligence/asset-service";
import { AssetSubNav, CriticalityBadge, AssetStatusBadge } from "@/components/asset-intelligence/asset-ui";
import { FileText, ShieldAlert } from "lucide-react";

export default async function DataAssetsPage() {
  const session    = await requireUser();
  const orgId = session.org?.id ?? "";
  const dataAssets = await getAssets(orgId, { type: "data_asset" }).catch(() => []);
  const piiAssets  = await getAssets(orgId).then(a => a.filter((x: any) => x.containsPii)).catch(() => []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Data Asset Catalog™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">Data collections, PII inventories, and cross-border data flows.</p>
      </div>

      <AssetSubNav />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] border-l-2 border-l-blue-400 p-4">
          <p className="text-xs text-[var(--color-ink-dim)]">Data Assets</p>
          <p className="text-2xl font-bold text-blue-400">{dataAssets.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] border-l-2 border-l-amber-400 p-4">
          <p className="text-xs text-[var(--color-ink-dim)]">Contains PII</p>
          <p className="text-2xl font-bold text-amber-400">{piiAssets.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] border-l-2 border-l-red-400 p-4">
          <p className="text-xs text-[var(--color-ink-dim)]">Cross-Border</p>
          <p className="text-2xl font-bold text-red-400">{piiAssets.filter((x: any) => x.isCrossB).length}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] border-l-2 border-l-purple-400 p-4">
          <p className="text-xs text-[var(--color-ink-dim)]">Sensitive</p>
          <p className="text-2xl font-bold text-purple-400">{piiAssets.filter((x: any) => x.containsSensitive).length}</p>
        </div>
      </div>

      {/* PII Assets */}
      {piiAssets.length > 0 && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.03] p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <h2 className="font-semibold text-sm text-amber-400">Assets Containing PII</h2>
          </div>
          <div className="space-y-2">
            {piiAssets.map((a: any) => (
              <Link key={a.id} href={`/asset-intelligence/registry/${a.id}`}
                className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] p-3 hover:bg-white/[0.03] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-[var(--color-ink-dim)]">{a.assetType} · {a.dataClass ?? "unclassified"}{a.isCrossB ? " · cross-border" : ""}</p>
                </div>
                <CriticalityBadge level={a.criticality} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All Data Assets */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">Data Asset Registry</h2>
          <Link href="/asset-intelligence/registry/new" className="text-xs text-[var(--color-blue)] hover:underline">+ Add Data Asset</Link>
        </div>
        {dataAssets.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-dim)] text-center py-8">No data assets registered yet. <Link href="/asset-intelligence/registry/new" className="text-[var(--color-blue)] hover:underline">Add one â†’</Link></p>
        ) : (
          <div className="space-y-2">
            {dataAssets.map((a: any) => (
              <Link key={a.id} href={`/asset-intelligence/registry/${a.id}`}
                className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] p-3 hover:bg-white/[0.03] transition-colors">
                <FileText className="h-4 w-4 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.name}</p>
                  <p className="text-xs text-[var(--color-ink-dim)] truncate">
                    {a.dataClass ?? "unclassified"}{a.containsPii ? " · PII" : ""}{a.isCrossB ? " · cross-border" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <CriticalityBadge level={a.criticality} />
                  <AssetStatusBadge status={a.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* DPDP Link */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">DPDP Privacy™ Integration</h3>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Link data assets to consent records, DSRs, and retention policies in DPDP Privacy™.</p>
        </div>
        <Link href="/dpdp-privacy" className="rounded-xl border border-[var(--color-blue)]/30 px-4 py-2 text-sm text-[var(--color-blue)] hover:bg-[var(--color-blue)]/10 transition-colors">
          Go to DPDP â†’
        </Link>
      </div>
    </div>
  );
}

