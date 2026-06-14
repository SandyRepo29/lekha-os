export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { computeKpis } from "@/lib/services/executive-reporting/executive-reporting-service";
import Link from "next/link";
import { ArrowLeft, Shield, AlertTriangle, ShieldCheck, Building2, FileText, Target } from "lucide-react";
import { ExecStat, ScorecardStatusBadge } from "@/components/executive-reporting/executive-ui";

const SCORECARDS = [
  {
    key: "trust",
    label: "Trust Scorecard™",
    icon: Shield,
    color: "var(--color-blue)",
    metrics: [
      { kpiKey: "org_trust_score", label: "Org Trust Score™", target: 80 },
      { kpiKey: "active_vendors",  label: "Active Vendors",   target: null },
      { kpiKey: "monitoring_alerts", label: "Open Alerts",    target: 0, inverse: true },
    ],
  },
  {
    key: "risk",
    label: "Risk Scorecard™",
    icon: AlertTriangle,
    color: "#f59e0b",
    metrics: [
      { kpiKey: "open_risks",    label: "Open Risks",    target: 5,  inverse: true },
      { kpiKey: "open_findings", label: "Open Findings", target: 3,  inverse: true },
      { kpiKey: "open_capas",    label: "Open CAPAs",    target: 5,  inverse: true },
    ],
  },
  {
    key: "control",
    label: "Control Scorecard™",
    icon: ShieldCheck,
    color: "#10b981",
    metrics: [
      { kpiKey: "control_health",        label: "Control Health™",   target: 80 },
      { kpiKey: "compliance_frameworks", label: "Active Frameworks", target: null },
    ],
  },
  {
    key: "vendor",
    label: "Vendor Scorecard™",
    icon: Building2,
    color: "#6366f1",
    metrics: [
      { kpiKey: "active_vendors", label: "Active Vendors", target: null },
    ],
  },
  {
    key: "contract",
    label: "Contract Scorecard™",
    icon: FileText,
    color: "#8b5cf6",
    metrics: [
      { kpiKey: "contracts", label: "Active Contracts", target: null },
    ],
  },
  {
    key: "governance",
    label: "Governance Scorecard™",
    icon: Target,
    color: "#ef4444",
    metrics: [
      { kpiKey: "open_issues",          label: "Open Issues", target: 5, inverse: true },
      { kpiKey: "compliance_frameworks", label: "Frameworks", target: 3 },
    ],
  },
];

type ScoreStatus = "green" | "amber" | "red" | "info";

function scoreStatus(current: number, target: number | null, inverse = false): ScoreStatus {
  if (target === null) return "info";
  if (inverse) return current <= target ? "green" : current <= target * 2 ? "amber" : "red";
  return current >= target ? "green" : current >= target * 0.7 ? "amber" : "red";
}

const STATUS_COLORS: Record<ScoreStatus, string> = {
  green: "text-emerald-400",
  amber: "text-amber-400",
  red:   "text-red-400",
  info:  "text-[var(--color-blue)]",
};

export default async function ScorecardsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const kpis = await computeKpis(orgId).catch(() => []);
  const kpiMap = Object.fromEntries(kpis.map((k) => [k.kpiKey, Number(k.currentValue ?? 0)]));

  const onTrack  = SCORECARDS.filter(({ metrics }) => {
    const rows = metrics.map((m) => scoreStatus(kpiMap[m.kpiKey] ?? 0, m.target ?? null, m.inverse));
    return rows.every((s) => s === "green" || s === "info");
  }).length;
  const atRisk = SCORECARDS.filter(({ metrics }) => {
    const rows = metrics.map((m) => scoreStatus(kpiMap[m.kpiKey] ?? 0, m.target ?? null, m.inverse));
    return rows.some((s) => s === "red");
  }).length;
  const monitor = SCORECARDS.length - onTrack - atRisk;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/executive-reporting" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Executive Reporting™
        </Link>
        <h1 className="text-2xl font-bold">Executive Scorecards™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
          At-a-glance governance performance across all domains.
        </p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        <ExecStat label="On Track"  value={onTrack}              accent={onTrack > 0 ? "good" : "neutral"} />
        <ExecStat label="Monitor"   value={monitor}              accent={monitor > 0 ? "warn" : "neutral"} />
        <ExecStat label="Attention" value={atRisk}               accent={atRisk > 0 ? "danger" : "neutral"} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SCORECARDS.map(({ key, label, icon: Icon, color, metrics }) => {
          const metricRows = metrics.map((m) => {
            const val    = kpiMap[m.kpiKey] ?? 0;
            const status = scoreStatus(val, m.target ?? null, m.inverse);
            return { ...m, val, status };
          });

          const allGreen     = metricRows.every((m) => m.status === "green" || m.status === "info");
          const anyRed       = metricRows.some((m) => m.status === "red");
          const overallStatus = allGreen ? "green" : anyRed ? "red" : "amber";

          return (
            <div key={key} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${color}22` }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <span className="font-semibold text-sm">{label}</span>
                </div>
                <ScorecardStatusBadge status={overallStatus} />
              </div>

              <div className="space-y-3">
                {metricRows.map((m) => (
                  <div key={m.kpiKey} className="flex items-center justify-between">
                    <span className="text-xs text-[var(--color-ink-dim)]">{m.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${STATUS_COLORS[m.status as ScoreStatus]}`}>{m.val.toFixed(0)}</span>
                      {m.target !== null && m.target !== undefined && (
                        <span className="text-xs text-[var(--color-ink-dim)]">/ {m.target} target</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
