export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getDashboardData, computeKpis } from "@/backend/src/modules/executive-reporting/executive-reporting-service";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Shield, AlertTriangle, ShieldCheck, Gavel, Building2,
  LayoutDashboard, TrendingUp, TrendingDown, Minus, BarChart3, Target,
  RefreshCw, FileText, Clock,
} from "lucide-react";
import { ExecStat } from "@/components/executive-reporting/executive-ui";

const DASHBOARD_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  kpiKeys: string[];
}> = {
  ceo: {
    label: "CEO Dashboard™",
    icon: Building2,
    color: "var(--color-blue)",
    description: "Organizational trust, top risks, vendor exposure, benchmark position, and trust trend.",
    kpiKeys: ["org_trust_score", "open_risks", "active_vendors", "monitoring_alerts", "open_issues"],
  },
  cro: {
    label: "CRO Dashboard™",
    icon: AlertTriangle,
    color: "#f59e0b",
    description: "Risk heatmap, open risks, critical findings, CAPAs, and risk velocity.",
    kpiKeys: ["open_risks", "open_findings", "open_capas", "monitoring_alerts", "control_health"],
  },
  ciso: {
    label: "CISO Dashboard™",
    icon: Shield,
    color: "#10b981",
    description: "Control health, vendor security risk, policy compliance, monitoring alerts, and evidence coverage.",
    kpiKeys: ["control_health", "open_findings", "monitoring_alerts", "compliance_frameworks", "open_capas"],
  },
  compliance: {
    label: "Compliance Dashboard™",
    icon: ShieldCheck,
    color: "#8b5cf6",
    description: "Framework readiness, compliance coverage, open gaps, policy health, and audit readiness.",
    kpiKeys: ["compliance_frameworks", "open_findings", "open_capas", "control_health", "open_issues"],
  },
  board: {
    label: "Board Dashboard™",
    icon: Gavel,
    color: "#ef4444",
    description: "Trust score, risk posture, governance maturity, compliance status, and strategic recommendations.",
    kpiKeys: ["org_trust_score", "open_risks", "control_health", "compliance_frameworks", "active_vendors"],
  },
  custom: {
    label: "Custom Dashboard™",
    icon: LayoutDashboard,
    color: "var(--color-ink-dim)",
    description: "All KPIs — configure your own dashboard with the widget library.",
    kpiKeys: [],
  },
};

const KPI_LABEL: Record<string, string> = {
  org_trust_score: "Org Trust Score™",
  active_vendors: "Active Vendors",
  open_risks: "Open Risks",
  control_health: "Control Health™",
  open_findings: "Open Findings",
  open_capas: "Open CAPAs",
  compliance_frameworks: "Frameworks",
  monitoring_alerts: "Alerts",
  open_issues: "Open Issues",
  contracts: "Contracts",
};

const KPI_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  org_trust_score: Shield,
  active_vendors: Building2,
  open_risks: AlertTriangle,
  control_health: ShieldCheck,
  open_findings: Target,
  open_capas: RefreshCw,
  compliance_frameworks: ShieldCheck,
  monitoring_alerts: AlertTriangle,
  open_issues: Target,
  contracts: FileText,
};

const QUICK_LINKS: Record<string, { label: string; href: string }[]> = {
  ceo: [
    { label: "Trust Intelligence™", href: "/trust-intelligence" },
    { label: "Risk Lens™", href: "/risks" },
    { label: "Governance Benchmarking™", href: "/benchmarking" },
  ],
  cro: [
    { label: "Risk Register", href: "/risks/list" },
    { label: "Risk Treatments", href: "/risks/treatments" },
    { label: "AI Risk Officer", href: "/risks/ai" },
  ],
  ciso: [
    { label: "Control Center™", href: "/controls" },
    { label: "Audit Findings", href: "/audits/findings" },
    { label: "Continuous Monitoring™", href: "/trust-intelligence/monitoring" },
  ],
  compliance: [
    { label: "Compliance Frameworks", href: "/compliance/frameworks" },
    { label: "Compliance Gaps", href: "/compliance/gaps" },
    { label: "AI Compliance Officer", href: "/compliance/ai" },
  ],
  board: [
    { label: "Board Reports", href: "/executive-reporting/board-reports" },
    { label: "Trust Intelligence™", href: "/trust-intelligence/executive" },
    { label: "Predictive Analytics™", href: "/executive-reporting/forecasts" },
  ],
  custom: [
    { label: "Analytics Hub™", href: "/executive-reporting/analytics" },
    { label: "Executive Scorecards™", href: "/executive-reporting/scorecards" },
    { label: "AI Executive Analyst™", href: "/executive-reporting/ai" },
  ],
};

export default async function DashboardTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const config = DASHBOARD_CONFIG[type];
  if (!config) notFound();

  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const [data, allKpis] = await Promise.all([
    getDashboardData(orgId, type).catch(() => null),
    computeKpis(orgId).catch(() => []),
  ]);

  const Icon = config.icon;
  const kpiMap = Object.fromEntries(allKpis.map((k) => [k.kpiKey, k]));
  const displayKeys = config.kpiKeys.length > 0 ? config.kpiKeys : allKpis.map((k) => k.kpiKey);
  const displayKpis = displayKeys.map((k) => kpiMap[k]).filter(Boolean);
  const quickLinks = QUICK_LINKS[type] ?? [];

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/executive-reporting"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Executive Reporting™
        </Link>
        <div className="flex items-center gap-4">
          <div
            className="grid h-12 w-12 place-items-center rounded-xl"
            style={{ background: `${config.color}22` }}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{config.label}</h1>
            <p className="mt-0.5 text-sm text-[var(--color-ink-dim)]">{config.description}</p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {displayKpis.map((kpi) => {
          if (!kpi) return null;
          const KpiIcon = KPI_ICONS[kpi.kpiKey] ?? BarChart3;
          const val = Number(kpi.currentValue ?? 0);
          const trend = kpi.trend;
          const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
          const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-[var(--color-ink-dim)]";
          return (
            <div
              key={kpi.kpiKey}
              className="flex flex-col gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5"
            >
              <div className="flex items-center justify-between">
                <KpiIcon className="h-4 w-4 text-[var(--color-ink-dim)]" />
                <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
              </div>
              <div className="text-3xl font-bold" style={{ color: config.color }}>
                {val.toFixed(0)}
                {kpi.unit === "/100" && <span className="text-base font-normal text-[var(--color-ink-dim)]">/100</span>}
              </div>
              <div className="text-xs text-[var(--color-ink-dim)]">{KPI_LABEL[kpi.kpiKey] ?? kpi.kpiName}</div>
            </div>
          );
        })}
      </div>

      {/* All KPIs table (for custom / board) */}
      {(type === "custom" || type === "board") && allKpis.length > 0 && (
        <div>
          <h2 className="mb-4 text-base font-semibold">All Governance KPIs</h2>
          <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-dim)]">
                  <th className="px-4 py-3 font-medium">KPI</th>
                  <th className="px-4 py-3 font-medium text-right">Current</th>
                  <th className="px-4 py-3 font-medium text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {allKpis.map((kpi) => {
                  const trend = kpi.trend;
                  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
                  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-[var(--color-ink-dim)]";
                  return (
                    <tr key={kpi.kpiKey} className="hover:bg-[var(--color-blue)]/5">
                      <td className="px-4 py-3 font-medium">{kpi.kpiName}</td>
                      <td className="px-4 py-3 text-right font-mono">{Number(kpi.currentValue ?? 0).toFixed(0)}</td>
                      <td className="px-4 py-3 text-right">
                        <TrendIcon className={`h-3.5 w-3.5 ml-auto ${trendColor}`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick links */}
      {quickLinks.length > 0 && (
        <div>
          <h2 className="mb-4 text-base font-semibold">Quick Access</h2>
          <div className="flex flex-wrap gap-3">
            {quickLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-4 py-2.5 text-sm font-medium hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/5 transition-all"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Generate report CTA */}
      <div className="flex items-center gap-4 rounded-xl border border-[var(--color-line)] bg-gradient-to-r from-[var(--color-blue)]/5 to-transparent p-5">
        <FileText className="h-8 w-8 text-[var(--color-blue)] shrink-0" />
        <div className="flex-1">
          <div className="font-semibold">Generate Board Report</div>
          <div className="text-sm text-[var(--color-ink-dim)]">Create a board-ready PDF report from this dashboard&apos;s data.</div>
        </div>
        <Link
          href="/executive-reporting/board-reports"
          className="shrink-0 rounded-lg bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Generate Report
        </Link>
      </div>
    </div>
  );
}
