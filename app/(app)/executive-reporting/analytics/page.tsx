export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getAnalyticsOverview, computeKpis } from "@/lib/services/executive-reporting/executive-reporting-service";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { ExecStat, KpiBadge } from "@/components/executive-reporting/executive-ui";

const CATEGORY_GROUPS = [
  { label: "Trust Analytics™",    color: "var(--color-blue)", keys: ["org_trust_score"] },
  { label: "Risk Analytics™",     color: "#f59e0b",           keys: ["open_risks", "open_findings", "open_capas"] },
  { label: "Vendor Analytics™",   color: "#10b981",           keys: ["active_vendors"] },
  { label: "Control Analytics™",  color: "#8b5cf6",           keys: ["control_health", "compliance_frameworks"] },
  { label: "Issue Analytics™",    color: "#ef4444",           keys: ["open_issues", "monitoring_alerts"] },
  { label: "Contract Analytics™", color: "#6366f1",           keys: ["contracts"] },
];

/** KPIs where higher = worse */
const INVERSE_KPIS = new Set(["open_risks", "open_findings", "open_capas", "monitoring_alerts", "open_issues"]);

function kpiAccent(key: string, value: number): "danger" | "warn" | "good" | "neutral" {
  if (INVERSE_KPIS.has(key)) {
    if (value === 0) return "good";
    if (value <= 3) return "warn";
    return "danger";
  }
  if (key === "org_trust_score" || key === "control_health") {
    if (value >= 80) return "good";
    if (value >= 60) return "warn";
    return "danger";
  }
  return "neutral";
}

export default async function AnalyticsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const [overview, kpis] = await Promise.all([
    getAnalyticsOverview(orgId).catch(() => ({ kpis: [], snapshotHistory: [], reports: [] })),
    computeKpis(orgId).catch(() => []),
  ]);

  const kpiMap = Object.fromEntries(kpis.map((k) => [k.kpiKey, k]));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/executive-reporting" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Executive Reporting™
        </Link>
        <h1 className="text-2xl font-bold">Analytics Hub™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
          Cross-module governance analytics combining data from all AUDT modules.
        </p>
      </div>

      {/* KPI summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {kpis.slice(0, 10).map((kpi) => {
          const val = Number(kpi.currentValue ?? 0);
          const accent = kpiAccent(kpi.kpiKey, val);
          const trend = (kpi.trend ?? "stable") as "up" | "down" | "stable";
          return (
            <ExecStat
              key={kpi.kpiKey}
              label={kpi.kpiName}
              value={val.toFixed(0)}
              accent={accent}
              sub={trend !== "stable" ? (trend === "up" ? "↑ up" : "↓ down") : undefined}
            />
          );
        })}
      </div>

      {/* Category groups */}
      <div className="space-y-6">
        <h2 className="text-base font-semibold">Analytics Categories</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_GROUPS.map(({ label, color, keys }) => {
            const groupKpis = keys.map((k) => kpiMap[k]).filter(Boolean);
            return (
              <div
                key={label}
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5"
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                  <span className="font-semibold text-sm">{label}</span>
                </div>
                <div className="space-y-3">
                  {groupKpis.length > 0 ? groupKpis.map((kpi) => {
                    if (!kpi) return null;
                    const val = Number(kpi.currentValue ?? 0);
                    const pct = Math.min(100, val > 100 ? (val / 200) * 100 : val);
                    return (
                      <div key={kpi.kpiKey}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[var(--color-ink-dim)]">{kpi.kpiName}</span>
                          <span className="font-mono font-semibold">{val.toFixed(0)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--color-line)]">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-xs text-[var(--color-ink-dim)]">No data available</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Snapshot history */}
      {overview.snapshotHistory.length > 0 && (
        <div>
          <h2 className="mb-4 text-base font-semibold">Snapshot History</h2>
          <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-dim)]">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Trust Score</th>
                  <th className="px-4 py-3 font-medium text-right">Open Risks</th>
                  <th className="px-4 py-3 font-medium text-right">Control Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {overview.snapshotHistory.slice(-10).reverse().map((snap) => {
                  const kd = snap.kpiData as Record<string, number>;
                  return (
                    <tr key={snap.id} className="hover:bg-[var(--color-blue)]/5">
                      <td className="px-4 py-3 text-[var(--color-ink-dim)]">{String(snap.snapshotDate)}</td>
                      <td className="px-4 py-3 text-right font-mono">{kd?.org_trust_score?.toFixed?.(0) ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-mono">{kd?.open_risks ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-mono">{kd?.control_health?.toFixed?.(0) ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {overview.snapshotHistory.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--color-line)] p-10 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-[var(--color-ink-dim)] mb-3" />
          <p className="font-medium">No snapshot history yet</p>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Snapshots are taken daily. Visit again tomorrow to see trends.</p>
        </div>
      )}
    </div>
  );
}
