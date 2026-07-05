export const dynamic = "force-dynamic";

export const metadata = { title: 'Asset Intelligence™ — AUDT' };

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/asset-intelligence/asset-service";
import { AssetSubNav, AssetStat, CriticalityBadge, AssetTypeBadge, AssetStatusBadge, AlertSeverityBadge } from "@/components/asset-intelligence/asset-ui";
import { Database, Monitor, Cloud, FileText, GitBranch, Brain, Zap, Server, Network, Shield, AlertTriangle, TrendingUp, Activity, Download } from "lucide-react";

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
    metrics:       { totalAssets: 0, activeAssets: 0, criticalAssets: 0, openAlerts: 0, assetsWithPii: 0, totalAlerts: 0 },
    recentAssets:  [],
    alerts:        [],
    byType:        [],
    byCriticality: [],
  }));

  // Governance-focused metrics derived from available data
  const assetsWithRegulatedData = metrics.assetsWithPii;
  const assetsWithVendorDeps = (byType as any[])
    .filter((r: any) => ["application", "database", "api", "cloud_resource", "ai_system", "vendor_service"].includes(r.type))
    .reduce((s: number, r: any) => s + Number(r.n), 0);

  return (
    <div className="space-y-6 p-6">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Asset Intelligence™</h1>
          <span className="text-xs text-[var(--color-ink-dim)] border border-[var(--color-line)] rounded px-2 py-0.5">REST API available</span>
        </div>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          Business Asset Intelligence &amp; Dependency Mapping — understand how vendors, assets, data, controls, and risks connect across your organization.
        </p>
      </div>

      <AssetSubNav />

      {/* Export actions */}
      <div className="flex items-center gap-2">
        <a
          href="/api/v1/assets/export/csv"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[#F8F9FB]"
        >
          <Download className="h-3.5 w-3.5" />
          Export Assets CSV
        </a>
      </div>

      {/* Empty-state callout */}
      {metrics.totalAssets === 0 && (
        <div className="rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.04] p-5 flex items-start gap-4">
          <Monitor className="h-6 w-6 text-[var(--color-blue)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-blue)]">No assets in the registry yet</p>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)]">
              Add assets to the registry to enable Trust Mapping, PII tracking, and dependency analysis.
            </p>
            <Link href="/asset-intelligence/registry/new" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-blue)] px-4 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity">
              Add your first asset →
            </Link>
          </div>
        </div>
      )}

      {/* Governance KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <AssetStat label="Total Assets"             value={metrics.totalAssets}     accent="neutral" href="/asset-intelligence/registry" />
        <AssetStat label="Critical Assets"          value={metrics.criticalAssets}  accent="danger"  href="/asset-intelligence/registry?criticality=critical" />
        <AssetStat label="Regulated Data Assets"    value={assetsWithRegulatedData} accent="warn"    href="/asset-intelligence/data-assets" />
        <AssetStat label="With Vendor Dependencies" value={assetsWithVendorDeps}    accent="purple"  href="/asset-intelligence/relationships" />
        <AssetStat label="Assets At Risk"           value={metrics.openAlerts}      accent="danger"  href="/asset-intelligence/alerts" />
        <AssetStat label="Open Asset Risks"         value={metrics.totalAlerts}     accent="warn"    href="/asset-intelligence/alerts" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Assets */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Critical &amp; Recent Assets</h2>
            <Link href="/asset-intelligence/registry" className="text-xs text-[var(--color-blue)] hover:underline">View all →</Link>
          </div>
          {recentAssets.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)] py-8 text-center">
              No assets yet.{" "}
              <Link href="/asset-intelligence/registry/new" className="text-[var(--color-blue)] hover:underline">Add your first asset →</Link>
            </p>
          ) : (
            <div className="space-y-2">
              {recentAssets.map((a: any) => {
                const Icon = TYPE_ICONS[a.assetType] ?? Monitor;
                return (
                  <Link key={a.id} href={`/asset-intelligence/registry/${a.id}`}
                    className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] p-3 hover:bg-white transition-colors">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--color-blue)]/10">
                      <Icon className="h-4 w-4 text-[var(--color-blue)]" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <p className="text-xs text-[var(--color-ink-dim)] truncate">
                        {a.businessUnit ?? a.category ?? a.assetType}
                        {a.containsPii && <span className="ml-1.5 text-amber-400">· PII</span>}
                      </p>
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
          {/* Asset Risk Insights */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Asset Risk Insights
            </h2>
            <div className="space-y-2.5">
              {[
                { label: "Critical Assets At Risk",    value: Math.min(metrics.criticalAssets, alerts.length), color: "text-red-400"    },
                { label: "Assets With Regulated Data", value: assetsWithRegulatedData,                         color: "text-amber-400"  },
                { label: "With Vendor Dependencies",   value: assetsWithVendorDeps,                            color: "text-orange-400" },
                { label: "Open Governance Alerts",     value: metrics.openAlerts,                              color: "text-yellow-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-ink-dim)]">{label}</span>
                  <span className={`text-sm font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Open Alerts */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Open Alerts</h2>
              <Link href="/asset-intelligence/alerts" className="text-xs text-[var(--color-blue)] hover:underline">All →</Link>
            </div>
            {alerts.length === 0 ? (
              <p className="text-xs text-[var(--color-ink-dim)]">No open alerts</p>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 4).map((al: any) => (
                  <div key={al.id} className="rounded-lg border border-[var(--color-line)] p-2 text-xs">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <p className="font-medium truncate text-[var(--color-ink)]">{al.title}</p>
                      <AlertSeverityBadge severity={al.severity} />
                    </div>
                    <p className="text-[var(--color-ink-dim)] capitalize">{al.alertType?.replace(/_/g, " ")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* By Type + By Criticality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--color-blue)]" /> Assets by Type
          </h2>
          {byType.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-dim)]">No data yet</p>
          ) : (
            <div className="space-y-2">
              {(byType as any[]).map((r: any) => (
                <div key={r.type} className="flex items-center justify-between">
                  <AssetTypeBadge type={r.type} />
                  <span className="text-sm font-semibold">{Number(r.n)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-400" /> Assets by Criticality
          </h2>
          {byCriticality.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-dim)]">No data yet</p>
          ) : (
            <div className="space-y-2">
              {(byCriticality as any[]).map((r: any) => (
                <div key={r.criticality} className="flex items-center justify-between">
                  <CriticalityBadge level={r.criticality} />
                  <span className="text-sm font-semibold">{Number(r.n)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Module Nav Grid */}
      <div>
        <h2 className="font-semibold text-sm mb-3">Asset Intelligence™ Modules</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: "/asset-intelligence/registry",        icon: Monitor,       label: "Asset Registry™",     desc: "Full inventory"       },
            { href: "/asset-intelligence/data-assets",     icon: FileText,      label: "Data Asset Catalog™", desc: "PII & data maps"      },
            { href: "/asset-intelligence/relationships",   icon: GitBranch,     label: "Relationships™",      desc: "Dependency graph"     },
            { href: "/asset-intelligence/impact-analysis", icon: AlertTriangle, label: "Impact Analysis™",    desc: "Failure scenarios"    },
            { href: "/asset-intelligence/alerts",          icon: Shield,        label: "Asset Alerts™",       desc: "Governance alerts"    },
            { href: "/asset-intelligence/ai",              icon: Brain,         label: "Asset Copilot™",      desc: "AI-powered insights"  },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href}
              className="rounded-2xl border border-[var(--color-line)] bg-white p-4 hover:bg-[#F8F9FB] transition-colors">
              <Icon className="h-5 w-5 text-[var(--color-blue)] mb-2" />
              <p className="text-sm font-medium leading-tight">{label}</p>
              <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Repositioned Banner */}
      <div className="rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.04] p-5">
        <h3 className="font-semibold text-sm mb-1 text-[var(--color-blue)]">Business Asset Intelligence — The Governance Dependency Layer</h3>
        <p className="text-xs text-[var(--color-ink-dim)] max-w-2xl">
          Asset Intelligence™ answers the governance questions that matter: Which assets support your business? Which vendors are they exposed to?
          Which data do they contain? What controls protect them? And what is the blast radius if a vendor fails or a critical asset goes down?
        </p>
      </div>
    </div>
  );
}
