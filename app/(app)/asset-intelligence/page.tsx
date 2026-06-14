﻿export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/asset-intelligence/asset-service";
import { AssetSubNav, AssetStat, CriticalityBadge, AssetTypeBadge, AssetStatusBadge } from "@/components/asset-intelligence/asset-ui";
import { Database, Monitor, Cloud, FileText, GitBranch, Brain, Zap, Server, Network, Shield } from "lucide-react";

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  application:      Monitor,
  database:         Database,
  api:              Zap,
  server:           Server,
  cloud_resource:   Cloud,
  data_asset:       FileText,
  business_process: GitBranch,
  ai_system:        Brain,
  network_asset:    Network,
  endpoint:         Shield,
};

export default async function AssetIntelligencePage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const { metrics, recentAssets, alerts, byType, byCriticality } = await getDashboardData(orgId).catch(() => ({
    metrics:      { totalAssets: 0, activeAssets: 0, criticalAssets: 0, openAlerts: 0, assetsWithPii: 0, totalAlerts: 0 },
    recentAssets: [],
    alerts:       [],
    byType:       [],
    byCriticality:[],
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Heading */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Asset Intelligence™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          Enterprise Asset Graph &amp; Trust Mapping Platform — the master inventory connecting every governance entity.
        </p>
      </div>

      <AssetSubNav />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <AssetStat label="Total Assets"    value={metrics.totalAssets}    accent="neutral" href="/asset-intelligence/registry" />
        <AssetStat label="Active"          value={metrics.activeAssets}   accent="good"    href="/asset-intelligence/registry" />
        <AssetStat label="Critical"        value={metrics.criticalAssets} accent="danger"  href="/asset-intelligence/registry?criticality=critical" />
        <AssetStat label="Contains PII"    value={metrics.assetsWithPii}  accent="warn"    href="/asset-intelligence/data-assets" />
        <AssetStat label="Open Alerts"     value={metrics.openAlerts}     accent="danger"  href="/asset-intelligence/alerts" />
        <AssetStat label="Total Alerts"    value={metrics.totalAlerts}    accent="neutral" href="/asset-intelligence/alerts" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Assets */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Recent Assets</h2>
            <Link href="/asset-intelligence/registry" className="text-xs text-[var(--color-blue)] hover:underline">View all â†’</Link>
          </div>
          {recentAssets.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)] py-8 text-center">No assets yet. <Link href="/asset-intelligence/registry" className="text-[var(--color-blue)] hover:underline">Add your first asset â†’</Link></p>
          ) : (
            <div className="space-y-2">
              {recentAssets.map((a: any) => {
                const Icon = TYPE_ICONS[a.assetType] ?? Monitor;
                return (
                  <Link key={a.id} href={`/asset-intelligence/registry/${a.id}`}
                    className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] p-3 hover:bg-white/[0.03] transition-colors">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--color-blue)]/10">
                      <Icon className="h-4 w-4 text-[var(--color-blue)]" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <p className="text-xs text-[var(--color-ink-dim)] truncate">{a.businessUnit ?? a.category ?? a.assetType}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CriticalityBadge level={a.criticality} />
                      <AssetStatusBadge status={a.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Assets by Type */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
            <h2 className="font-semibold text-sm mb-3">By Type</h2>
            {byType.length === 0 ? (
              <p className="text-xs text-[var(--color-ink-dim)]">No data yet</p>
            ) : (
              <div className="space-y-2">
                {byType.map((r: any) => (
                  <div key={r.type} className="flex items-center justify-between text-sm">
                    <AssetTypeBadge type={r.type} />
                    <span className="font-semibold">{Number(r.n)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open Alerts */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Open Alerts</h2>
              <Link href="/asset-intelligence/alerts" className="text-xs text-[var(--color-blue)] hover:underline">All â†’</Link>
            </div>
            {alerts.length === 0 ? (
              <p className="text-xs text-[var(--color-ink-dim)]">No open alerts</p>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 5).map((al: any) => (
                  <div key={al.id} className="rounded-lg border border-[var(--color-line)] p-2 text-xs">
                    <p className="font-medium truncate text-[var(--color-ink)]">{al.title}</p>
                    <p className="text-[var(--color-ink-dim)] capitalize mt-0.5">{al.severity} · {al.alertType?.replace(/_/g," ")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module Nav Grid */}
      <div>
        <h2 className="font-semibold text-sm mb-3">Asset Intelligence™ Modules</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: "/asset-intelligence/registry",      icon: Monitor,    label: "Asset Registry™",        desc: "Full inventory" },
            { href: "/asset-intelligence/data-assets",   icon: FileText,   label: "Data Asset Catalog™",    desc: "PII & data maps" },
            { href: "/asset-intelligence/relationships", icon: GitBranch,  label: "Asset Relationships™",   desc: "Dependency graph" },
            { href: "/asset-intelligence/alerts",        icon: Shield,     label: "Asset Alerts™",          desc: "Governance alerts" },
            { href: "/asset-intelligence/ai",            icon: Brain,      label: "AI Asset Advisor™",      desc: "AI-powered insights" },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href}
              className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors">
              <Icon className="h-5 w-5 text-[var(--color-blue)] mb-2" />
              <p className="text-sm font-medium leading-tight">{label}</p>
              <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Strategic Banner */}
      <div className="rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.04] p-5">
        <h3 className="font-semibold text-sm mb-1 text-[var(--color-blue)]">Asset Intelligence™ — The Master Graph</h3>
        <p className="text-xs text-[var(--color-ink-dim)] max-w-2xl">
          Asset Intelligence™ becomes the central layer connecting Vendors · Risks · Controls · Policies · Contracts · Regulations · AI Systems
          into a unified trust graph. Every governance entity is mapped to assets — answering "Which systems are affected?" for any risk, regulation change, or vendor incident.
        </p>
      </div>
    </div>
  );
}

