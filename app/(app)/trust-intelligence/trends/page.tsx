export const dynamic = "force-dynamic";

import { TrendingUp, BarChart2, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { EmptyState } from "@/components/ui/empty-state";
import { getTrends } from "@/lib/services/governance-trends/trends-service";
import { TrendStatCard } from "@/components/trust-intelligence/trend-stat-card";
import { Sparkline } from "@/components/trust-intelligence/sparkline";

export default async function GovernanceTrendsPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={TrendingUp}
          title="Governance Trends™"
          description="Connect Supabase to unlock trend tracking."
        />
      </Card>
    );
  }

  const trends = await getTrends(session.org.id, 90);
  const { metrics: m, points } = trends;

  const metricList = [
    { key: "orgTrust",       label: "Organizational Trust",  color: "#6366f1", ...m.orgTrust,       higherIsBetter: true },
    { key: "vendorTrust",    label: "Vendor Trust",          color: "#8b5cf6", ...m.vendorTrust,    higherIsBetter: true },
    { key: "riskPosture",    label: "Risk Posture",          color: "#06b6d4", ...m.riskPosture,    higherIsBetter: true },
    { key: "controlHealth",  label: "Control Health",        color: "#10b981", ...m.controlHealth,  higherIsBetter: true },
    { key: "auditReadiness", label: "Audit Readiness",       color: "#f59e0b", ...m.auditReadiness, higherIsBetter: true },
    { key: "compliance",     label: "Compliance Coverage",   color: "#ec4899", ...m.compliance,     higherIsBetter: true },
  ] as const;

  const hasData = points.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[var(--color-blue)]" />
            Governance Trends™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            90-day governance posture movement — {points.length} data point{points.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-ink-faint)]">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {points.length > 0
              ? `${points[0].date} → ${points[points.length - 1].date}`
              : "No snapshots yet"}
          </span>
        </div>
      </div>

      {!hasData && (
        <Card className="p-8">
          <EmptyState
            icon={BarChart2}
            title="No trend data yet"
            description="Governance snapshots are taken daily. Check back after the first automated snapshot runs, or use the Executive View to trigger a manual snapshot."
          />
        </Card>
      )}

      {hasData && (
        <>
          {/* Trend stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metricList.map(({ key, label, color, current, change, changePct, direction, higherIsBetter }) => {
              const sparkData = points.map((p) => {
                const map: Record<string, number> = {
                  orgTrust: p.orgTrust, vendorTrust: p.vendorTrust, riskPosture: p.riskPosture,
                  controlHealth: p.controlHealth, auditReadiness: p.auditReadiness, compliance: p.compliance,
                };
                return map[key] ?? 0;
              });

              return (
                <Card key={key} className="p-5 flex items-center justify-between gap-4">
                  <TrendStatCard
                    label={label}
                    current={current}
                    change={change}
                    changePct={changePct}
                    direction={direction}
                    higherIsBetter={higherIsBetter}
                  />
                  <Sparkline data={sparkData} color={color} width={100} height={40} />
                </Card>
              );
            })}
          </div>

          {/* Timeline table */}
          <Card className="p-5">
            <p className="text-sm font-semibold mb-4">Score History</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[var(--color-ink-faint)] border-b border-[var(--color-line)]">
                    <th className="text-left pb-2 pr-4 font-medium">Date</th>
                    <th className="text-right pb-2 pr-3 font-medium">Org Trust</th>
                    <th className="text-right pb-2 pr-3 font-medium">Vendors</th>
                    <th className="text-right pb-2 pr-3 font-medium">Risk</th>
                    <th className="text-right pb-2 pr-3 font-medium">Controls</th>
                    <th className="text-right pb-2 pr-3 font-medium">Audits</th>
                    <th className="text-right pb-2 font-medium">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {[...points].reverse().slice(0, 30).map((p) => (
                    <tr key={p.date} className="hover:bg-white/[0.02]">
                      <td className="py-2 pr-4 text-[var(--color-ink-dim)] font-mono">{p.date}</td>
                      <td className="py-2 pr-3 text-right font-semibold text-[var(--color-ink)]">{p.orgTrust}</td>
                      <td className="py-2 pr-3 text-right text-[var(--color-ink-dim)]">{p.vendorTrust}</td>
                      <td className="py-2 pr-3 text-right text-[var(--color-ink-dim)]">{p.riskPosture}</td>
                      <td className="py-2 pr-3 text-right text-[var(--color-ink-dim)]">{p.controlHealth}</td>
                      <td className="py-2 pr-3 text-right text-[var(--color-ink-dim)]">{p.auditReadiness}</td>
                      <td className="py-2 text-right text-[var(--color-ink-dim)]">{p.compliance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
