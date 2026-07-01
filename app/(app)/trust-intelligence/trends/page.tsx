export const dynamic = "force-dynamic";

import Link from "next/link";
import { TrendingUp, BarChart2, Calendar, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { EmptyState } from "@/components/ui/empty-state";
import { getTrends } from "@/lib/services/governance-trends/trends-service";
import { TrendStatCard } from "@/components/trust-intelligence/trend-stat-card";
import { Sparkline } from "@/components/trust-intelligence/sparkline";

const RECOVERY_ACTIONS = [
  { action: "Close Critical Findings",       impact: 4, effort: "Medium", href: "/audits/findings" },
  { action: "Complete Vendor Assessments",   impact: 4, effort: "High",   href: "/vendors" },
  { action: "Implement Weak Controls",       impact: 3, effort: "High",   href: "/controls" },
  { action: "Upload Expiring Evidence",      impact: 2, effort: "Low",    href: "/compliance/evidence" },
  { action: "Complete Pending Audits",       impact: 3, effort: "Medium", href: "/audits" },
  { action: "Review & Approve Policies",     impact: 2, effort: "Low",    href: "/policy-governance" },
];

const EFFORT_COLORS: Record<string, string> = {
  Low:    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  High:   "bg-rose-500/10 text-rose-400 border border-rose-500/20",
};

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

  // Projected Trust Decay™ calculations
  const currentTrust = m.orgTrust.current;
  const proj30  = Math.max(0, Math.min(100, Math.round(currentTrust + (m.orgTrust.change / 3))));
  const proj90  = Math.max(0, Math.min(100, Math.round(currentTrust + m.orgTrust.change)));
  const proj180 = Math.max(0, Math.min(100, Math.round(currentTrust + m.orgTrust.change * 2)));

  function projColor(val: number, base: number) {
    if (val > base) return "text-emerald-400";
    if (val < base) return "text-rose-400";
    return "text-[var(--color-ink-dim)]";
  }

  // Trust Recovery Plan™ — projected score after all actions
  const totalImpact = RECOVERY_ACTIONS.reduce((s, a) => s + a.impact, 0);
  const projAfterRecovery = Math.min(100, currentTrust + totalImpact);

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
                    <tr key={p.date} className="hover:bg-white">
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

          {/* Section 1: Projected Trust Decay™ */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5 space-y-5">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-base font-bold">
                Projected Trust Decay™
              </h2>
              <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">
                Extrapolated trajectory based on the current 90-day trend
              </p>
            </div>

            {/* Forecast stat boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-[var(--color-line)] bg-white p-4 text-center">
                <p className="text-xs text-[var(--color-ink-faint)] mb-1">Current</p>
                <p className="text-2xl font-bold text-[var(--color-ink)]">{currentTrust}</p>
                <p className="text-xs text-[var(--color-ink-faint)] mt-1">score</p>
              </div>
              <div className="rounded-xl border border-[var(--color-line)] bg-white p-4 text-center">
                <p className="text-xs text-[var(--color-ink-faint)] mb-1">30 Days</p>
                <p className={`text-2xl font-bold ${projColor(proj30, currentTrust)}`}>{proj30}</p>
                <p className="text-xs text-[var(--color-ink-faint)] mt-1">projected</p>
              </div>
              <div className="rounded-xl border border-[var(--color-line)] bg-white p-4 text-center">
                <p className="text-xs text-[var(--color-ink-faint)] mb-1">90 Days</p>
                <p className={`text-2xl font-bold ${projColor(proj90, currentTrust)}`}>{proj90}</p>
                <p className="text-xs text-[var(--color-ink-faint)] mt-1">projected</p>
              </div>
              <div className="rounded-xl border border-[var(--color-line)] bg-white p-4 text-center">
                <p className="text-xs text-[var(--color-ink-faint)] mb-1">180 Days</p>
                <p className={`text-2xl font-bold ${projColor(proj180, currentTrust)}`}>{proj180}</p>
                <p className="text-xs text-[var(--color-ink-faint)] mt-1">projected</p>
              </div>
            </div>

            {/* Risk Drivers */}
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink-dim)] uppercase tracking-wide mb-2">
                Risk Drivers
              </p>
              {m.orgTrust.direction === "down" ? (
                <ul className="space-y-1.5">
                  {[
                    "Evidence expiry (if left unresolved)",
                    "Vendor assessments overdue",
                    "Control health declining",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[var(--color-ink-dim)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : m.orgTrust.direction === "up" ? (
                <ul className="space-y-1.5">
                  {[
                    "Governance improvements are ongoing",
                    "Continue current trajectory",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[var(--color-ink-dim)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--color-ink-dim)]">
                  Governance posture is stable — monitor for changes
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Trust Recovery Plan™ */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5 space-y-5">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-base font-bold">
                Trust Recovery Plan™
              </h2>
              <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">
                Actionable steps to improve your Organizational Trust Score™
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-ink-faint)]">Current score:</span>
              <span className="rounded-md bg-[#F8F9FB] border border-[var(--color-line)] px-2 py-0.5 text-sm font-bold text-[var(--color-ink)]">
                {currentTrust}
              </span>
            </div>

            <div className="space-y-2">
              {RECOVERY_ACTIONS.map(({ action, impact, effort, href }) => (
                <div
                  key={action}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white px-4 py-3"
                >
                  <span className="flex-1 text-sm text-[var(--color-ink)] min-w-[160px]">{action}</span>
                  <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                    +{impact} pts
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${EFFORT_COLORS[effort]}`}>
                    Effort: {effort}
                  </span>
                  <Link
                    href={href}
                    className="ml-auto flex items-center gap-1 text-xs text-[var(--color-blue)] hover:underline shrink-0"
                  >
                    Go <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[var(--color-line)] bg-white p-4">
              <p className="text-xs text-[var(--color-ink-faint)] mb-3 font-medium uppercase tracking-wide">
                Projected Trust after all actions
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-center">
                  <p className="text-xs text-[var(--color-ink-faint)] mb-1">Current</p>
                  <span className="text-xl font-bold text-[var(--color-ink)]">{currentTrust}</span>
                </div>
                <ArrowRight className="h-5 w-5 text-[var(--color-blue)] shrink-0" />
                <div className="text-center">
                  <p className="text-xs text-[var(--color-ink-faint)] mb-1">After Recovery</p>
                  <span className="text-xl font-bold text-emerald-400">{projAfterRecovery}</span>
                </div>
                <div className="ml-auto text-right">
                  <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-400">
                    +{totalImpact} pts potential
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
