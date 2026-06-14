export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Building2,
  FileText,
  CalendarClock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Plus,
  ShieldCheck,
  BarChart3,
  Scale,
  ClipboardList,
  Lock,
  FileSignature,
  Bot,
  Users,
  Globe,
  Plug,
  BadgeCheck,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/app-shell/score-ring";
import { requireUser } from "@/lib/auth/session";
import {
  getMetrics,
  listVendors,
  deriveInsights,
  type VendorRow,
  type VendorMetrics,
} from "@/lib/services/vendor-service";
import { getTrustIntelligenceOverview } from "@/lib/services/trust-intelligence/trust-intelligence-service";
import { listOrgActivity } from "@/lib/repositories/activity-repo";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { demoMetrics, demoVendors } from "@/lib/demo-data";
import { riskTone } from "@/lib/ui-maps";
import { scoreBarGradient, scoreLabelColor, scoreLabel } from "@/lib/ui/colors";
import { getOrgTrustLevel, ORG_TRUST_COMPONENT_LABELS } from "@/lib/services/org-trust-score";

const COMPONENT_KEYS = ["vendorTrust", "riskPosture", "controlHealth", "auditReadiness", "complianceCoverage"] as const;
const COMPONENT_WEIGHTS: Record<string, number> = { vendorTrust: 25, riskPosture: 25, controlHealth: 20, auditReadiness: 15, complianceCoverage: 15 };

export default async function DashboardPage() {
  const session = await requireUser();

  let metrics: VendorMetrics;
  let recent: VendorRow[];

  if (session.demo || !session.org) {
    metrics = demoMetrics;
    recent = demoVendors.slice(0, 5).map((v, i) => ({
      id: String(i), name: v.name, category: v.category,
      status: v.status, risk: v.risk, score: v.score,
      docs: v.docs, expiring: v.expiring,
      ownerName: v.ownerName, ownerEmail: v.ownerEmail, ownerDepartment: v.ownerDepartment, expired: v.expired,
    }));
  } else {
    [metrics, recent] = await Promise.all([
      getMetrics(session.org.id),
      listVendors(session.org.id).then((v) => v.slice(0, 5)),
    ]);
  }

  const insights = deriveInsights(metrics);
  const empty = metrics.totalVendors === 0;

  const activity = (!session.demo && session.org)
    ? await listOrgActivity(session.org.id, 8)
    : [];

  // Cross-module trust intelligence
  let trustOverview: Awaited<ReturnType<typeof getTrustIntelligenceOverview>> | null = null;
  if (!session.demo && session.org) {
    try {
      trustOverview = await getTrustIntelligenceOverview(session.org.id);
    } catch {
      // graceful fallback
    }
  }

  const orgScore = trustOverview?.orgTrustScore.overall ?? metrics.complianceScore;
  const trustLevel = getOrgTrustLevel(orgScore);

  const trustLevelColor =
    orgScore >= 90 ? "text-emerald-400"
    : orgScore >= 80 ? "text-blue-400"
    : orgScore >= 70 ? "text-indigo-400"
    : orgScore >= 60 ? "text-amber-400"
    : "text-red-400";

  const components = trustOverview
    ? COMPONENT_KEYS.map((key) => ({
        key,
        label: ORG_TRUST_COMPONENT_LABELS[key],
        value: trustOverview.orgTrustScore[key],
        weight: COMPONENT_WEIGHTS[key],
      }))
    : [];

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Governance Dashboard</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            {session.orgName} · organizational trust posture at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/trust-intelligence">
            <Button variant="ghost" size="sm">
              <BarChart3 className="h-4 w-4" /> Trust Intelligence™
            </Button>
          </Link>
          <Link href="/vendors/new">
            <Button variant="primary" size="md"><Plus className="h-4 w-4" /> Add vendor</Button>
          </Link>
        </div>
      </div>

      {/* Hero row: Org Trust Score + components */}
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">

        {/* Org Trust Score™ ring */}
        <Card className="relative flex flex-col items-center justify-center overflow-hidden p-6">
          <div className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 110%, rgba(99,102,241,.22), transparent 65%)" }} />
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
              Org Trust Score™
            </div>
            <ScoreRing value={orgScore} size={120} />
            <div className={`mt-2 text-sm font-bold ${trustLevelColor}`}>{trustLevel}</div>
            <div className="mt-0.5 text-xs text-[var(--color-ink-faint)]">
              {empty ? "Add vendors to begin" : `${metrics.totalVendors} vendor${metrics.totalVendors !== 1 ? "s" : ""} tracked`}
            </div>
            <Link href="/trust-intelligence" className="mt-3 text-xs text-[var(--color-blue)] hover:underline flex items-center gap-1">
              Full breakdown <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        {/* Component breakdown */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-ink-dim)] uppercase tracking-wider">
              Score Components
            </h2>
            <span className="text-xs text-[var(--color-ink-faint)]">5-component governance engine</span>
          </div>
          {components.length > 0 ? (
            <div className="space-y-3">
              {components.map((c) => {
                const color = c.value >= 80 ? "#34d399" : c.value >= 60 ? "#60a5fa" : c.value >= 40 ? "#fbbf24" : "#f87171";
                return (
                  <div key={c.key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-[var(--color-ink-dim)]">{c.label}</span>
                      <span className="font-bold tabular-nums" style={{ color }}>{c.value}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${c.value}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Vendors" value={metrics.totalVendors} color="text-indigo-400" />
              <MiniStat label="Documents" value={metrics.totalDocuments} color="text-blue-400" />
              <MiniStat label="Expiring" value={metrics.expiringSoon} color={metrics.expiringSoon > 0 ? "text-amber-400" : "text-[var(--color-ink-dim)]"} />
              <MiniStat label="High Risk" value={metrics.highRisk} color={metrics.highRisk > 0 ? "text-red-400" : "text-[var(--color-ink-dim)]"} />
            </div>
          )}
        </Card>
      </div>

      {/* Cross-module KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Vendors"
          value={metrics.totalVendors}
          sub={`${metrics.highRisk} high risk`}
          icon={Building2}
          accent="indigo"
          href="/vendors"
          alert={metrics.highRisk > 0}
        />
        <KpiCard
          label="Active Risks"
          value={trustOverview?.risks.activeCount ?? "—"}
          sub={trustOverview ? `${trustOverview.risks.criticalCount} critical` : "view risks"}
          icon={AlertTriangle}
          accent={trustOverview && trustOverview.risks.criticalCount > 0 ? "danger" : "neutral"}
          href="/risks"
          alert={!!trustOverview && trustOverview.risks.criticalCount > 0}
        />
        <KpiCard
          label="Open Findings"
          value={trustOverview?.audits.totalOpenFindings ?? "—"}
          sub={trustOverview ? `${trustOverview.audits.openCriticalFindings} critical` : "view audits"}
          icon={ClipboardList}
          accent={trustOverview && trustOverview.audits.openCriticalFindings > 0 ? "danger" : "neutral"}
          href="/audits/findings"
          alert={!!trustOverview && trustOverview.audits.openCriticalFindings > 0}
        />
        <KpiCard
          label="Control Health"
          value={trustOverview ? `${trustOverview.controls.avgHealth}%` : "—"}
          sub={trustOverview ? `${trustOverview.controls.weakCount} weak` : "view controls"}
          icon={ShieldCheck}
          accent={trustOverview && trustOverview.controls.weakCount > 2 ? "warn" : "blue"}
          href="/controls"
          alert={!!trustOverview && trustOverview.controls.weakCount > 2}
        />
      </div>

      {/* Module quick-access grid */}
      <div>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
          Governance Modules
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <ModuleTile href="/vendors" icon={Building2} label="Vendor Hub™" color="indigo" />
          <ModuleTile href="/compliance" icon={FileText} label="Evidence Vault™" color="blue" />
          <ModuleTile href="/risks" icon={AlertTriangle} label="Risk Lens™" color="red" />
          <ModuleTile href="/controls" icon={ShieldCheck} label="Control Center™" color="emerald" />
          <ModuleTile href="/audits" icon={ClipboardList} label="Audit Management" color="purple" />
          <ModuleTile href="/policy-governance" icon={Scale} label="Policy Governance™" color="sky" />
          <ModuleTile href="/dpdp-privacy" icon={Lock} label="DPDP Privacy™" color="pink" />
          <ModuleTile href="/contract-governance" icon={FileSignature} label="Contract Governance™" color="orange" />
          <ModuleTile href="/issue-hub" icon={Activity} label="Issue Hub™" color="rose" />
          <ModuleTile href="/trust-intelligence" icon={BarChart3} label="Trust Intelligence™" color="violet" />
          <ModuleTile href="/ai-governance" icon={Bot} label="AI Governance™" color="cyan" />
          <ModuleTile href="/executive-reporting" icon={TrendingUp} label="Executive Reporting™" color="amber" />
          <ModuleTile href="/auditor-collaboration" icon={Users} label="Auditor Collab™" color="teal" />
          <ModuleTile href="/trust-verification" icon={BadgeCheck} label="Trust Verification™" color="green" />
          <ModuleTile href="/trust-exchange" icon={Globe} label="Trust Network™" color="indigo" />
          <ModuleTile href="/integration-hub" icon={Plug} label="Integration Hub™" color="slate" />
        </div>
      </div>

      {/* AI Insights */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-blue)]/10">
              <Sparkles className="h-4 w-4 text-[var(--color-blue)]" />
            </div>
            <h2 className="font-[family-name:var(--font-display)] font-semibold">Governance Copilot™</h2>
          </div>
          <span className="text-xs text-[var(--color-ink-faint)]">Based on your current data</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((insight, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-xl border p-3.5 ${
              insight.tone === "danger" ? "border-red-500/20 bg-red-500/[0.06]"
              : insight.tone === "warn" ? "border-amber-500/20 bg-amber-500/[0.06]"
              : insight.tone === "live" ? "border-emerald-500/20 bg-emerald-500/[0.06]"
              : "border-[var(--color-line)] bg-white/[0.02]"
            }`}>
              <span className={`mt-0.5 shrink-0 text-base ${
                insight.tone === "danger" ? "text-red-400"
                : insight.tone === "warn" ? "text-amber-400"
                : insight.tone === "live" ? "text-emerald-400"
                : "text-[var(--color-blue)]"
              }`}>
                {insight.tone === "danger" ? "⚠" : insight.tone === "warn" ? "◔" : insight.tone === "live" ? "✓" : "✦"}
              </span>
              <span className="text-sm leading-relaxed text-[var(--color-ink)]">{insight.text}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Bottom row: recent vendors + activity */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Recent vendors */}
        <Card>
          <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[var(--color-ink-faint)]" />
              <h2 className="font-[family-name:var(--font-display)] font-semibold">Recent Vendors</h2>
            </div>
            {!empty && (
              <Link href="/vendors" className="flex items-center gap-1 text-xs font-medium text-[var(--color-blue)] hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {empty ? (
            <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
              <Building2 className="h-8 w-8 text-[var(--color-ink-faint)]" />
              <p className="font-semibold text-[var(--color-ink)]">No vendors yet</p>
              <p className="max-w-xs text-sm text-[var(--color-ink-dim)]">Add your first vendor to start tracking documents, risk and compliance.</p>
              <Link href="/vendors/new" className="mt-1">
                <Button variant="primary" size="sm"><Plus className="h-4 w-4" /> Add first vendor</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {recent.map((v) => (
                <Link key={v.id} href={`/vendors/${v.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.02]">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-xs font-bold text-[var(--color-ink-dim)]">
                    {v.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{v.name}</div>
                    <div className="text-xs text-[var(--color-ink-faint)]">{v.category ?? "—"}</div>
                  </div>
                  <Badge tone={riskTone(v.risk)} className="hidden sm:inline-flex">{v.risk}</Badge>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${v.score}%`, background: scoreBarGradient(v.score) }} />
                    </div>
                    <span className="w-7 text-right text-xs font-bold">{v.score}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Activity feed */}
        <Card>
          <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--color-ink-faint)]" />
              <h2 className="font-[family-name:var(--font-display)] font-semibold">Recent Activity</h2>
            </div>
          </div>
          {activity.length > 0 ? (
            <div className="px-5 py-3">
              <ActivityFeed items={activity} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
              <Activity className="h-8 w-8 text-[var(--color-ink-faint)]" />
              <p className="text-sm text-[var(--color-ink-dim)]">Activity will appear here as your team uses AUDT.</p>
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, accent, alert, href }: {
  label: string;
  value: number | string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "indigo" | "blue" | "warn" | "danger" | "neutral";
  alert?: boolean;
  href?: string;
}) {
  const borderColor =
    accent === "danger" && alert ? "border-red-500/30"
    : accent === "warn" && alert ? "border-amber-500/30"
    : accent === "indigo" ? "border-indigo-500/20"
    : accent === "blue" ? "border-blue-500/20"
    : "border-[var(--color-line)]";

  const bgColor =
    accent === "danger" && alert ? "bg-red-500/[0.06]"
    : accent === "warn" && alert ? "bg-amber-500/[0.06]"
    : "";

  const iconColor =
    accent === "danger" ? "text-red-400"
    : accent === "warn" ? "text-amber-400"
    : accent === "indigo" ? "text-indigo-400"
    : accent === "blue" ? "text-[var(--color-blue)]"
    : "text-[var(--color-ink-faint)]";

  const valColor =
    accent === "danger" && alert ? "text-red-400"
    : accent === "warn" && alert ? "text-amber-400"
    : "text-[var(--color-ink)]";

  const leftBar =
    accent === "danger" && alert ? "border-l-2 border-l-red-500"
    : accent === "warn" && alert ? "border-l-2 border-l-amber-500"
    : accent === "indigo" ? "border-l-2 border-l-indigo-500"
    : accent === "blue" ? "border-l-2 border-l-blue-400"
    : "";

  const inner = (
    <Card className={`p-4 ${borderColor} ${bgColor} ${leftBar} transition-colors ${href ? "hover:bg-white/[0.05] cursor-pointer" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-ink-dim)]">{label}</span>
        <span className={`rounded-lg bg-white/[0.04] p-1.5 ${iconColor}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className={`mt-2 font-[family-name:var(--font-display)] text-2xl font-extrabold ${valColor}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--color-ink-faint)]">{sub}</div>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

const MODULE_COLORS: Record<string, string> = {
  indigo: "text-indigo-400 bg-indigo-500/10 group-hover:bg-indigo-500/20",
  blue: "text-blue-400 bg-blue-500/10 group-hover:bg-blue-500/20",
  red: "text-red-400 bg-red-500/10 group-hover:bg-red-500/20",
  emerald: "text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500/20",
  purple: "text-purple-400 bg-purple-500/10 group-hover:bg-purple-500/20",
  sky: "text-sky-400 bg-sky-500/10 group-hover:bg-sky-500/20",
  pink: "text-pink-400 bg-pink-500/10 group-hover:bg-pink-500/20",
  orange: "text-orange-400 bg-orange-500/10 group-hover:bg-orange-500/20",
  rose: "text-rose-400 bg-rose-500/10 group-hover:bg-rose-500/20",
  violet: "text-violet-400 bg-violet-500/10 group-hover:bg-violet-500/20",
  cyan: "text-cyan-400 bg-cyan-500/10 group-hover:bg-cyan-500/20",
  amber: "text-amber-400 bg-amber-500/10 group-hover:bg-amber-500/20",
  teal: "text-teal-400 bg-teal-500/10 group-hover:bg-teal-500/20",
  green: "text-green-400 bg-green-500/10 group-hover:bg-green-500/20",
  slate: "text-slate-400 bg-slate-500/10 group-hover:bg-slate-500/20",
};

function ModuleTile({ href, icon: Icon, label, color }: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}) {
  const cls = MODULE_COLORS[color] ?? MODULE_COLORS.indigo;
  return (
    <Link href={href}
      className="group flex flex-col items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-4 text-center transition-all hover:bg-white/[0.05] hover:border-white/10">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${cls}`}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <span className="text-xs font-medium leading-tight text-[var(--color-ink-dim)] group-hover:text-[var(--color-ink)]">
        {label}
      </span>
    </Link>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-white/[0.02] p-3 text-center">
      <div className={`font-[family-name:var(--font-display)] text-xl font-bold ${color}`}>{value}</div>
      <div className="mt-0.5 text-xs text-[var(--color-ink-faint)]">{label}</div>
    </div>
  );
}
