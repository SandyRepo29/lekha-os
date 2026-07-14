export const dynamic = "force-dynamic";

export const metadata = { title: 'Executive Reporting™ — AUDT' };

import { requireUser } from "@/lib/auth/session";
import { getDashboardData, computeKpis } from "@/backend/src/modules/executive-reporting/executive-reporting-service";
import Link from "next/link";
import {
  BarChart3, TrendingUp, FileText, Clock, Brain, Building2,
  AlertTriangle, Shield, ShieldCheck, Gavel, ArrowUpRight,
  LayoutDashboard, Users, Target, RefreshCw,
} from "lucide-react";
import { ExecStat, KpiBadge, ReportStatusBadge } from "@/components/executive-reporting/executive-ui";

const DASHBOARD_TYPES = [
  { key: "ceo",        label: "CEO Dashboard™",        icon: Building2,     desc: "Org trust, risk exposure, vendor health, benchmark position", color: "var(--color-blue)" },
  { key: "cro",        label: "CRO Dashboard™",        icon: AlertTriangle, desc: "Risk heatmap, velocity, reduction trends, forecast",          color: "#f59e0b" },
  { key: "ciso",       label: "CISO Dashboard™",       icon: Shield,        desc: "Control health, vendor security risk, policy compliance",     color: "#10b981" },
  { key: "compliance", label: "Compliance Dashboard™", icon: ShieldCheck,   desc: "Framework readiness, coverage, gaps, attestations",           color: "#8b5cf6" },
  { key: "board",      label: "Board Dashboard™",      icon: Gavel,         desc: "Trust score, risk posture, maturity, strategic recommendations", color: "#ef4444" },
  { key: "custom",     label: "Custom Dashboard™",     icon: LayoutDashboard, desc: "Build your own dashboard with the widget library",          color: "var(--color-ink-dim)" },
];

const NAV_LINKS = [
  { href: "/executive-reporting/analytics",   icon: BarChart3,   label: "Analytics Hub™" },
  { href: "/executive-reporting/board-reports", icon: FileText,  label: "Board Reporting™" },
  { href: "/executive-reporting/scheduled",   icon: Clock,       label: "Scheduled Reports™" },
  { href: "/executive-reporting/forecasts",   icon: TrendingUp,  label: "Predictive Analytics™" },
  { href: "/executive-reporting/scorecards",  icon: Target,      label: "Executive Scorecards™" },
  { href: "/executive-reporting/ai",          icon: Brain,       label: "AI Executive Analyst™" },
];

/** KPIs where a higher value is a concern (danger/warn) rather than good */
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

export default async function ExecutiveReportingPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const [ceoData, kpis] = await Promise.all([
    getDashboardData(orgId, "ceo").catch(() => null),
    computeKpis(orgId).catch(() => []),
  ]);

  const displayKpis = (ceoData?.kpis ?? kpis).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Executive Reporting &#38; Analytics™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Board-ready governance intelligence — dashboards, reports, forecasts, and AI-powered decision support.
          </p>
        </div>
        <Link
          href="/executive-reporting/ai"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Brain className="h-4 w-4" />
          AI Executive Analyst™
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {displayKpis.map((kpi) => {
          const val = Number(kpi.currentValue ?? 0);
          const accent = kpiAccent(kpi.kpiKey, val);
          const trend = (kpi.trend ?? "stable") as "up" | "down" | "stable";
          return (
            <ExecStat
              key={kpi.kpiKey}
              label={kpi.kpiName}
              value={val.toFixed(0)}
              accent={accent}
              sub={
                trend !== "stable"
                  ? trend === "up"
                    ? "↑ trending up"
                    : "↓ trending down"
                  : undefined
              }
            />
          );
        })}
      </div>

      {/* Dashboard Type Cards */}
      <div>
        <h2 className="mb-4 text-base font-semibold">Executive Dashboards™</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DASHBOARD_TYPES.map(({ key, label, icon: Icon, desc, color }) => (
            <Link
              key={key}
              href={`/executive-reporting/dashboard/${key}`}
              className="group flex flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5 transition-all hover:border-[var(--color-blue)]/40 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${color}22` }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <span className="font-semibold text-sm">{label}</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[var(--color-ink-dim)] opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="text-xs text-[var(--color-ink-dim)] leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Module Navigation */}
      <div>
        <h2 className="mb-4 text-base font-semibold">Analytics Modules</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_LINKS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4 hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/5 transition-all"
            >
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-blue)]/10">
                <Icon className="h-4 w-4 text-[var(--color-blue)]" />
              </div>
              <span className="font-medium text-sm">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      {(ceoData?.recentReports ?? []).length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent Reports</h2>
            <Link href="/executive-reporting/board-reports" className="text-xs text-[var(--color-blue)] hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)]">
            {(ceoData?.recentReports ?? []).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-[var(--color-ink-dim)]" />
                  <div>
                    <div className="text-sm font-medium">{r.name}</div>
                    <div className="text-xs text-[var(--color-ink-dim)]">
                      {r.format.toUpperCase()} · {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <ReportStatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
