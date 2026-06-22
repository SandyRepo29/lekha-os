export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck, Building2,
  BarChart3, FileSignature, ClipboardCheck, Target, ArrowRight,
  Star, Users2, Activity, ChevronRight, Zap, Shield, CheckCircle2, Clock,
  FileText, LineChart,
} from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getTrustIntelligenceOverview } from "@/lib/services/trust-intelligence/trust-intelligence-service";
import { getSnapshotHistory } from "@/lib/repositories/trust-intelligence-repo";
import { countByLifecycleStage, listVendors, getMetrics } from "@/lib/services/vendor-service";
import { cn } from "@/lib/utils";
import { LIFECYCLE_STAGES, type VendorLifecycleStage } from "@/lib/constants/vendor-lifecycle";

// ─── Role views ───────────────────────────────────────────────────────────────

type Role = "ceo" | "ciso" | "procurement" | "compliance";

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: "ceo",         label: "CEO",        desc: "Overall governance posture" },
  { value: "ciso",        label: "CISO",        desc: "Security & risk exposure" },
  { value: "procurement", label: "Procurement", desc: "Vendor portfolio & contracts" },
  { value: "compliance",  label: "Compliance",  desc: "Frameworks & evidence coverage" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trustLevelLabel(score: number | null): string {
  if (score === null) return "Unscored";
  if (score >= 95) return "Exceptional";
  if (score >= 90) return "Trusted";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Moderate";
  if (score >= 60) return "Needs Attention";
  return "High Concern";
}

function trustLevelColor(score: number | null): string {
  if (score === null) return "text-[var(--color-ink-faint)]";
  if (score >= 90) return "text-emerald-400";
  if (score >= 80) return "text-sky-400";
  if (score >= 70) return "text-amber-400";
  if (score >= 60) return "text-orange-400";
  return "text-red-400";
}

function trustBarColor(score: number | null): string {
  if (score === null) return "bg-white/10";
  if (score >= 90) return "bg-emerald-500/70";
  if (score >= 80) return "bg-sky-500/70";
  if (score >= 70) return "bg-amber-500/70";
  if (score >= 60) return "bg-orange-500/70";
  return "bg-red-500/70";
}

function scoreTrend(history: Array<{ orgTrustScore: number | null }>) {
  if (history.length < 2) return "flat";
  const first = history[0]?.orgTrustScore ?? 0;
  const last  = history[history.length - 1]?.orgTrustScore ?? 0;
  const delta = last - first;
  if (delta > 2) return "up";
  if (delta < -2) return "down";
  return "flat";
}

function fmtDelta(history: Array<{ orgTrustScore: number | null }>) {
  if (history.length < 2) return null;
  const first = history[0]?.orgTrustScore ?? 0;
  const last  = history[history.length - 1]?.orgTrustScore ?? 0;
  const delta = Math.abs(last - first);
  return delta.toFixed(1);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent = "neutral", href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "neutral" | "good" | "warn" | "danger" | "blue";
  href?: string;
}) {
  const border   = accent === "danger" ? "border-red-500/25"      : accent === "warn" ? "border-amber-500/25"  : accent === "good" ? "border-emerald-500/25" : accent === "blue" ? "border-indigo-500/25" : "border-[var(--color-line)]";
  const accentBar= accent === "danger" ? "border-l-red-500/60"    : accent === "warn" ? "border-l-amber-500/60": accent === "good" ? "border-l-emerald-500/60": accent === "blue" ? "border-l-indigo-500/60": "border-l-[var(--color-line-strong)]";
  const bg       = accent === "danger" ? "bg-red-500/[0.04]"      : accent === "warn" ? "bg-amber-500/[0.04]"  : accent === "good" ? "bg-emerald-500/[0.04]" : accent === "blue" ? "bg-indigo-500/[0.04]" : "";
  const valColor = accent === "danger" ? "text-red-400"           : accent === "warn" ? "text-amber-400"        : accent === "good" ? "text-emerald-400"       : accent === "blue" ? "text-indigo-400"       : "text-[var(--color-ink)]";

  const inner = (
    <div className={`rounded-xl border border-l-2 px-4 py-3 ${border} ${accentBar} ${bg} ${href ? "transition-colors hover:bg-white/[0.04]" : ""}`}>
      <div className="text-xs text-[var(--color-ink-faint)]">{label}</div>
      <div className={`mt-1 font-[family-name:var(--font-display)] text-2xl font-bold ${valColor}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{sub}</div>}
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function SectionHeader({
  title, sub, href, hrefLabel = "View all",
}: {
  title: string;
  sub?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-base font-bold">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
          {hrefLabel} <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r   = 38;
  const circ = 2 * Math.PI * r;
  const pct  = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * circ;
  const color = score >= 90 ? "#34d399" : score >= 80 ? "#38bdf8" : score >= 70 ? "#fbbf24" : score >= 60 ? "#fb923c" : "#f87171";

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 50 50)"
        style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
      />
      <text x="50" y="47" textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="18" fontWeight="800" fontFamily="var(--font-display)">{score}</text>
      <text x="50" y="62" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7" fontWeight="600">/ 100</text>
    </svg>
  );
}

// ─── Inline sparkline ─────────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80, h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  const last = data[data.length - 1];
  const color = last >= 80 ? "#34d399" : last >= 70 ? "#fbbf24" : last >= 60 ? "#fb923c" : "#f87171";

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ScoreBar({ label, score, max = 100 }: { label: string; score: number; max?: number }) {
  const pct = Math.round((score / max) * 100);
  const color = score >= 80 ? "bg-emerald-500/70" : score >= 60 ? "bg-amber-500/70" : "bg-red-500/60";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--color-ink-dim)]">{label}</span>
        <span className="font-medium text-[var(--color-ink)]">{score}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ExecutiveCommandCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const session = await requireUser();
  const { role: roleParam } = await searchParams;
  const activeRole: Role = (["ceo","ciso","procurement","compliance"].includes(roleParam ?? "")) ? roleParam as Role : "ceo";

  // ── Fetch all data in parallel ──────────────────────────────────────────────
  let overview: Awaited<ReturnType<typeof getTrustIntelligenceOverview>> | null = null;
  let snapshots: Awaited<ReturnType<typeof getSnapshotHistory>> = [];
  let lifecycleCounts: Record<VendorLifecycleStage, number> | null = null;
  let allVendors: Awaited<ReturnType<typeof listVendors>> = [];
  let vendorMetrics: Awaited<ReturnType<typeof getMetrics>> | null = null;

  if (!session.demo && session.org) {
    [overview, snapshots, lifecycleCounts, allVendors, vendorMetrics] = await Promise.all([
      getTrustIntelligenceOverview(session.org.id).catch(() => null),
      getSnapshotHistory(session.org.id, 30).catch(() => []),
      countByLifecycleStage(session.org.id).catch(() => null),
      listVendors(session.org.id).catch(() => []),
      getMetrics(session.org.id).catch(() => null),
    ]);
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const orgScore      = overview?.orgTrustScore?.overall ?? 0;
  const scoreLabel    = trustLevelLabel(orgScore);
  const trendDir      = scoreTrend(snapshots);
  const trendDelta    = fmtDelta(snapshots);
  const sparkData     = snapshots.map((s) => s.orgTrustScore ?? 0).filter((n) => n > 0);

  // Org trust components
  const comp = overview?.orgTrustScore;
  const components = [
    { label: "Vendor Trust",        score: comp?.vendorTrust       ?? 0 },
    { label: "Risk Posture",        score: comp?.riskPosture        ?? 0 },
    { label: "Control Health",      score: comp?.controlHealth      ?? 0 },
    { label: "Audit Readiness",     score: comp?.auditReadiness     ?? 0 },
    { label: "Compliance Coverage", score: comp?.complianceCoverage ?? 0 },
  ];

  // Vendor portfolio
  const totalVendors    = overview?.vendors?.total ?? vendorMetrics?.totalVendors ?? 0;
  const criticalVendors = allVendors.filter((v) => v.risk === "critical").length;
  const highRiskVendors = allVendors.filter((v) => v.risk === "high").length;
  const monitoredVendors= allVendors.filter((v) => v.lifecycleStage === "monitor").length;
  const reviewDueVendors= allVendors.filter((v) => ["audit", "renew"].includes(v.lifecycleStage)).length;

  // Lifecycle funnel
  const lc = lifecycleCounts;
  const funnelStages = lc ? [
    { label: "Discover",   count: lc.discover,  accent: "sky"     },
    { label: "Inventory",  count: lc.inventory, accent: "indigo"  },
    { label: "Classify",   count: lc.classify,  accent: "purple"  },
    { label: "Assess",     count: lc.assess,    accent: "violet"  },
    { label: "Risk",       count: lc.risk,      accent: "amber"   },
    { label: "Comply",     count: lc.comply,    accent: "teal"    },
    { label: "Monitor",    count: lc.monitor,   accent: "emerald" },
    { label: "Audit",      count: lc.audit,     accent: "blue"    },
    { label: "Renew",      count: lc.renew,     accent: "orange"  },
    { label: "Offboard",   count: lc.offboard,  accent: "red"     },
  ] : [];

  // Risk posture
  const risks = overview?.risks;
  const openRisks      = risks?.activeCount ?? 0;
  const criticalRisks  = risks?.criticalCount ?? 0;
  const highRisks      = risks?.highCount ?? 0;

  // Compliance posture
  const compliance     = overview?.compliance;
  const avgReadiness   = compliance?.avgReadiness ?? 0;
  const frameworks     = compliance?.frameworks ?? [];

  // Trust distribution — use allVendors (which has score field from vendor-service)
  const scoredVendors  = overview?.vendors?.allScored ?? [];
  const trustBuckets   = [
    { label: "Exceptional",     min: 95, max: 100, color: "bg-emerald-400/70" },
    { label: "Trusted",         min: 90, max:  95, color: "bg-emerald-500/50" },
    { label: "Strong",          min: 80, max:  90, color: "bg-sky-500/60"     },
    { label: "Moderate",        min: 70, max:  80, color: "bg-amber-500/60"   },
    { label: "Needs Attention", min: 60, max:  70, color: "bg-orange-500/60"  },
    { label: "High Concern",    min:  0, max:  60, color: "bg-red-500/60"     },
  ].map((b) => ({
    ...b,
    count: allVendors.filter((v) => v.score >= b.min && v.score < b.max).length,
  }));
  const maxBucket = Math.max(...trustBuckets.map((b) => b.count), 1);

  // Upcoming decisions (low trust + high risk)
  const decisions = allVendors
    .filter((v) => v.score < 65 || v.risk === "critical" || v.risk === "high")
    .sort((a, b) => a.score - b.score)
    .slice(0, 8)
    .map((v) => {
      const action = v.score < 50 ? "Escalate" : v.risk === "critical" ? "Reassess" : "Review";
      const urgency = v.score < 50 || v.risk === "critical" ? "high" : "medium";
      return { id: v.id, name: v.name, score: v.score, risk: v.risk, action, urgency, stage: v.lifecycleStage };
    });

  // Action center counts
  const controls       = overview?.controls;
  const audits         = overview?.audits;
  const weakControls   = controls?.weakCount ?? 0;
  const openFindings   = audits?.totalOpenFindings ?? 0;
  const criticalFindings = audits?.openCriticalFindings ?? 0;

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Executive Command Center</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-faint)]">
            Decision intelligence for your governance posture
          </p>
        </div>

        {/* Role switcher */}
        <div className="flex items-center gap-1 rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-1">
          {ROLES.map((r) => (
            <Link
              key={r.value}
              href={`?role=${r.value}`}
              className={cn(
                "shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
                activeRole === r.value
                  ? "bg-white/[0.08] text-[var(--color-ink)]"
                  : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
              )}
              title={r.desc}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Section 1: Organizational Trust Score™ ──────────────────────── */}
      <section className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* Score ring + trend */}
          <div className="flex shrink-0 flex-col items-center gap-3 lg:items-start">
            <div className="flex items-center gap-4">
              <ScoreRing score={orgScore} size={110} />
              <div>
                <div className={`font-[family-name:var(--font-display)] text-lg font-bold ${trustLevelColor(orgScore)}`}>
                  {scoreLabel}
                </div>
                <div className="mt-1 text-xs text-[var(--color-ink-faint)]">Organizational Trust Score™</div>

                {trendDelta && (
                  <div className={cn(
                    "mt-2 flex items-center gap-1 text-xs font-medium",
                    trendDir === "up"   ? "text-emerald-400" :
                    trendDir === "down" ? "text-red-400"      : "text-[var(--color-ink-dim)]"
                  )}>
                    {trendDir === "up"   ? <TrendingUp className="h-3.5 w-3.5"  /> :
                     trendDir === "down" ? <TrendingDown className="h-3.5 w-3.5" /> :
                     <Minus className="h-3.5 w-3.5" />}
                    {trendDir === "flat" ? "Stable" : `${trendDelta} pts`} vs 30 days ago
                  </div>
                )}
                {sparkData.length > 2 && (
                  <div className="mt-2">
                    <Sparkline data={sparkData} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5-component breakdown */}
          <div className="flex-1 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
              Score Components
            </div>
            {components.map((c) => (
              <ScoreBar key={c.label} label={c.label} score={c.score} />
            ))}
          </div>

          {/* Quick stats */}
          <div className="grid shrink-0 grid-cols-2 gap-3 lg:w-56">
            <div className="col-span-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
              Governance Signals
            </div>
            <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2">
              <div className="text-[10px] text-[var(--color-ink-faint)]">Open Risks</div>
              <div className={`text-lg font-bold ${openRisks > 10 ? "text-amber-400" : "text-[var(--color-ink)]"}`}>{openRisks}</div>
            </div>
            <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2">
              <div className="text-[10px] text-[var(--color-ink-faint)]">Critical Risks</div>
              <div className={`text-lg font-bold ${criticalRisks > 0 ? "text-red-400" : "text-emerald-400"}`}>{criticalRisks}</div>
            </div>
            <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2">
              <div className="text-[10px] text-[var(--color-ink-faint)]">Frameworks</div>
              <div className="text-lg font-bold text-[var(--color-ink)]">{compliance?.frameworkCount ?? 0}</div>
            </div>
            <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2">
              <div className="text-[10px] text-[var(--color-ink-faint)]">Avg Readiness</div>
              <div className={`text-lg font-bold ${avgReadiness >= 70 ? "text-emerald-400" : "text-amber-400"}`}>{avgReadiness}%</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Vendor Portfolio ──────────────────────────────────── */}
      {(activeRole === "ceo" || activeRole === "ciso" || activeRole === "procurement") && (
        <section className="space-y-4">
          <SectionHeader
            title="Vendor Portfolio"
            sub={`${totalVendors} vendors across all lifecycle stages`}
            href="/vendors"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total Vendors"    value={totalVendors}     accent="neutral"  href="/vendors" />
            <StatCard label="Critical Risk"    value={criticalVendors}  accent={criticalVendors > 0 ? "danger" : "good"} href="/vendors?risk=critical" />
            <StatCard label="High Risk"        value={highRiskVendors}  accent={highRiskVendors > 3 ? "warn" : "neutral"} href="/vendors?risk=high" />
            <StatCard label="Monitored"        value={monitoredVendors} accent="blue"     href="/vendors" />
            <StatCard label="Audit / Renew"    value={reviewDueVendors} accent={reviewDueVendors > 0 ? "warn" : "neutral"} href="/vendors" />
            <StatCard label="Avg Compliance"   value={`${vendorMetrics?.complianceScore ?? 0}`} sub="/ 100" accent={((vendorMetrics?.complianceScore ?? 0) >= 70) ? "good" : "warn"} />
          </div>
        </section>
      )}

      {/* ── Section 3: Vendor Lifecycle Funnel ───────────────────────────── */}
      {(activeRole === "ceo" || activeRole === "procurement") && funnelStages.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            title="Vendor Lifecycle Funnel"
            sub="Distribution across all 10 governance stages"
            href="/vendors"
          />
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
            <div className="grid grid-cols-5 gap-3 lg:grid-cols-10">
              {funnelStages.map((s, i) => {
                const maxCount = Math.max(...funnelStages.map((fs) => fs.count), 1);
                const heightPct = Math.max(8, (s.count / maxCount) * 100);
                return (
                  <div key={s.label} className="flex flex-col items-center gap-2">
                    <div className="text-sm font-bold text-[var(--color-ink)]">{s.count}</div>
                    <div className="w-full rounded-lg bg-white/[0.04]" style={{ height: "64px" }}>
                      <div
                        className={`w-full rounded-lg transition-all ${
                          i <= 3 ? "bg-indigo-500/40" :
                          i <= 6 ? "bg-emerald-500/40" :
                          i === 7 ? "bg-blue-500/40" :
                          i === 8 ? "bg-amber-500/40" : "bg-red-500/40"
                        }`}
                        style={{ height: `${heightPct}%`, marginTop: `${100 - heightPct}%` }}
                      />
                    </div>
                    <div className="text-center text-[10px] text-[var(--color-ink-faint)] leading-tight">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 4 + 5 side by side (Risk + Compliance) ───────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Section 4: Risk Posture */}
        {(activeRole === "ceo" || activeRole === "ciso") && (
          <section className="space-y-4">
            <SectionHeader title="Risk Posture" sub="Current risk exposure across all categories" href="/risks" />
            <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-4 py-3">
                  <div className="text-xs text-[var(--color-ink-faint)]">Open Risks</div>
                  <div className={`mt-1 text-2xl font-bold font-[family-name:var(--font-display)] ${openRisks > 10 ? "text-amber-400" : "text-[var(--color-ink)]"}`}>{openRisks}</div>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] border-l-2 border-l-red-500/60 px-4 py-3">
                  <div className="text-xs text-[var(--color-ink-faint)]">Critical</div>
                  <div className={`mt-1 text-2xl font-bold font-[family-name:var(--font-display)] ${criticalRisks > 0 ? "text-red-400" : "text-emerald-400"}`}>{criticalRisks}</div>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] border-l-2 border-l-amber-500/60 px-4 py-3">
                  <div className="text-xs text-[var(--color-ink-faint)]">High</div>
                  <div className={`mt-1 text-2xl font-bold font-[family-name:var(--font-display)] ${highRisks > 0 ? "text-amber-400" : "text-[var(--color-ink)]"}`}>{highRisks}</div>
                </div>
                <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-4 py-3">
                  <div className="text-xs text-[var(--color-ink-faint)]">Medium</div>
                  <div className="mt-1 text-2xl font-bold font-[family-name:var(--font-display)] text-[var(--color-ink)]">{risks?.mediumCount ?? 0}</div>
                </div>
              </div>
              {(risks?.byCategory) && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Top Categories</div>
                  {Object.entries(risks.byCategory as Record<string, number>)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([cat, cnt]) => (
                      <div key={cat} className="flex items-center justify-between text-xs">
                        <span className="capitalize text-[var(--color-ink-dim)]">{cat.replace(/_/g, " ")}</span>
                        <span className="font-medium text-[var(--color-ink)]">{cnt}</span>
                      </div>
                    ))}
                </div>
              )}
              <Link href="/risks" className="flex items-center gap-1 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
                <ArrowRight className="h-3.5 w-3.5" /> Open Risk Lens™
              </Link>
            </div>
          </section>
        )}

        {/* Section 5: Compliance Posture */}
        {(activeRole === "ceo" || activeRole === "compliance") && (
          <section className="space-y-4">
            <SectionHeader title="Compliance Posture" sub="Framework coverage and control effectiveness" href="/compliance" />
            <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-4 py-3">
                  <div className="text-xs text-[var(--color-ink-faint)]">Avg Readiness</div>
                  <div className={`mt-1 text-2xl font-bold font-[family-name:var(--font-display)] ${avgReadiness >= 70 ? "text-emerald-400" : "text-amber-400"}`}>{avgReadiness}%</div>
                </div>
                <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-4 py-3">
                  <div className="text-xs text-[var(--color-ink-faint)]">Frameworks</div>
                  <div className="mt-1 text-2xl font-bold font-[family-name:var(--font-display)] text-[var(--color-ink)]">{compliance?.frameworkCount ?? 0}</div>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] border-l-2 border-l-emerald-500/60 px-4 py-3">
                  <div className="text-xs text-[var(--color-ink-faint)]">Healthy Controls</div>
                  <div className="mt-1 text-2xl font-bold font-[family-name:var(--font-display)] text-emerald-400">{controls?.healthyCount ?? 0}</div>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] border-l-2 border-l-red-500/60 px-4 py-3">
                  <div className="text-xs text-[var(--color-ink-faint)]">Weak Controls</div>
                  <div className={`mt-1 text-2xl font-bold font-[family-name:var(--font-display)] ${weakControls > 0 ? "text-red-400" : "text-emerald-400"}`}>{weakControls}</div>
                </div>
              </div>
              {frameworks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Frameworks</div>
                  {frameworks.slice(0, 4).map((f, i) => (
                    <div key={f.frameworkId ?? i} className="flex items-center gap-3">
                      <span className="w-24 truncate text-xs text-[var(--color-ink-dim)]">Framework {i + 1}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full ${f.overallScore >= 70 ? "bg-emerald-500/60" : "bg-amber-500/60"}`}
                          style={{ width: `${f.overallScore}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs text-[var(--color-ink)]">{f.overallScore}%</span>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/compliance" className="flex items-center gap-1 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
                <ArrowRight className="h-3.5 w-3.5" /> Open Evidence Vault™
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* ── Section 6: Trust Distribution ────────────────────────────────── */}
      {allVendors.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Vendor Trust Distribution" sub="How vendor trust scores are distributed across your portfolio" href="/trust-intelligence" />
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
            <div className="space-y-3">
              {trustBuckets.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-xs text-[var(--color-ink-dim)]">{b.label}</span>
                  <div className="flex-1 h-4 rounded-md bg-white/[0.04]">
                    {b.count > 0 && (
                      <div
                        className={`h-full rounded-md ${b.color} transition-all`}
                        style={{ width: `${(b.count / maxBucket) * 100}%` }}
                      />
                    )}
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs font-medium text-[var(--color-ink)]">{b.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-ink-faint)]">
              <span>{allVendors.length} vendors scored</span>
              <Link href="/trust-intelligence" className="flex items-center gap-1 hover:text-[var(--color-ink)] transition-colors">
                View Trust Intelligence™ <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Section 7: Upcoming Decisions ────────────────────────────────── */}
      {decisions.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            title="Upcoming Decisions"
            sub="Vendors requiring executive attention — sorted by governance risk"
            href="/vendors"
            hrefLabel="View all vendors"
          />
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] overflow-hidden">
            <div className="divide-y divide-[var(--color-line)]">
              {decisions.map((d) => (
                <div key={d.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-[var(--color-ink)]">{d.name}</span>
                      <span className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                        d.risk === "critical" ? "bg-red-500/15 text-red-400"       :
                        d.risk === "high"     ? "bg-amber-500/15 text-amber-400"   :
                                               "bg-[var(--color-line)] text-[var(--color-ink-dim)]"
                      )}>{d.risk}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--color-ink-faint)] capitalize">
                      Stage: {d.stage.replace(/_/g, " ")} · Trust score: {d.score}
                    </div>
                  </div>
                  <div className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold",
                    d.urgency === "high" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
                  )}>
                    {d.action}
                  </div>
                  <Link href={`/vendors/${d.id}`} className="shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Sections 8 + 9 side by side (Copilot + Action Center) ───────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Section 8: Governance Copilot™ */}
        <section className="space-y-4">
          <SectionHeader title="Governance Copilot™" sub="AI-powered executive insights" />
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.03] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/15">
                <Zap className="h-4.5 w-4.5 text-indigo-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--color-ink)]">Ask your governance data anything</div>
                <div className="text-xs text-[var(--color-ink-faint)]">Powered by Gemini 2.5 Flash</div>
              </div>
            </div>
            <div className="space-y-2">
              {[
                "What's our overall vendor governance posture?",
                "Which vendors pose the highest risk this quarter?",
                "What are our top compliance gaps?",
                "Summarize our audit readiness for the board.",
              ].map((q) => (
                <Link
                  key={q}
                  href={`/trust-intelligence/executive?q=${encodeURIComponent(q)}`}
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-3 py-2.5 text-xs text-[var(--color-ink-dim)] transition-colors hover:bg-white/[0.06] hover:text-[var(--color-ink)]"
                >
                  <ArrowRight className="h-3 w-3 shrink-0 text-indigo-400" />
                  {q}
                </Link>
              ))}
            </div>
            <Link href="/trust-intelligence/executive" className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/15">
              Open Governance Copilot™ <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Section 9: Action Center */}
        <section className="space-y-4">
          <SectionHeader title="Action Center" sub="Items requiring immediate attention" />
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5 space-y-3">
            {[
              { label: "Vendors needing assessment",  count: allVendors.filter((v) => ["classify","assess"].includes(v.lifecycleStage)).length, icon: Building2, href: "/vendors",  accent: "warn"    },
              { label: "Critical audit findings",      count: criticalFindings,                                                                   icon: ClipboardCheck, href: "/audits/findings", accent: criticalFindings > 0 ? "danger" : "good" },
              { label: "Open audit findings",          count: openFindings,                                                                       icon: Target,   href: "/audits/findings", accent: openFindings > 5 ? "warn" : "neutral"  },
              { label: "Weak controls",                count: weakControls,                                                                       icon: Shield,   href: "/controls",  accent: weakControls > 0 ? "warn" : "good"     },
              { label: "Critical risks",               count: criticalRisks,                                                                      icon: AlertTriangle, href: "/risks",  accent: criticalRisks > 0 ? "danger" : "good"  },
              { label: "Docs expiring in 30 days",     count: vendorMetrics?.expiringSoon ?? 0,                                                   icon: FileText, href: "/vendors",   accent: (vendorMetrics?.expiringSoon ?? 0) > 0 ? "warn" : "neutral" },
            ].map(({ label, count, icon: Icon, href, accent }) => {
              const isGood = accent === "good" || (accent === "neutral" && count === 0);
              return (
                <Link key={label} href={href} className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.05]">
                  <Icon className={cn("h-4 w-4 shrink-0", accent === "danger" ? "text-red-400" : accent === "warn" ? "text-amber-400" : "text-emerald-400")} />
                  <span className="flex-1 text-xs text-[var(--color-ink-dim)]">{label}</span>
                  <span className={cn("text-sm font-bold", accent === "danger" ? "text-red-400" : accent === "warn" ? "text-amber-400" : "text-[var(--color-ink)]")}>{count}</span>
                  {isGood && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60" />}
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Section 10: Board Reporting ───────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          title="Board Reporting"
          sub="Generate and schedule executive-grade governance reports"
          href="/executive-reporting/board-reports"
          hrefLabel="Open Board Reports™"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Board Governance Report",  desc: "Full governance posture",     href: "/executive-reporting/board-reports", icon: BarChart3  },
            { label: "Risk Committee Report",    desc: "Risk exposure & treatment",   href: "/executive-reporting/board-reports", icon: AlertTriangle },
            { label: "Compliance Summary",       desc: "Framework readiness",         href: "/executive-reporting/board-reports", icon: ShieldCheck },
            { label: "Vendor Trust Report",      desc: "Portfolio trust analysis",    href: "/executive-reporting/board-reports", icon: Building2  },
          ].map((r) => (
            <Link
              key={r.label}
              href={r.href}
              className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05]"
            >
              <r.icon className="h-5 w-5 text-[var(--color-ink-faint)]" />
              <div className="mt-2 text-xs font-semibold text-[var(--color-ink)]">{r.label}</div>
              <div className="mt-0.5 text-[10px] text-[var(--color-ink-faint)]">{r.desc}</div>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/executive-reporting"
            className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 py-2.5 text-sm text-[var(--color-ink-dim)] transition-colors hover:bg-white/[0.05] hover:text-[var(--color-ink)]"
          >
            <LineChart className="h-4 w-4" /> Analytics Hub™
          </Link>
          <Link
            href="/executive-reporting/forecasts"
            className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 py-2.5 text-sm text-[var(--color-ink-dim)] transition-colors hover:bg-white/[0.05] hover:text-[var(--color-ink)]"
          >
            <TrendingUp className="h-4 w-4" /> Predictive Analytics™
          </Link>
          <Link
            href="/executive-reporting/scheduled"
            className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 py-2.5 text-sm text-[var(--color-ink-dim)] transition-colors hover:bg-white/[0.05] hover:text-[var(--color-ink)]"
          >
            <Clock className="h-4 w-4" /> Scheduled Reports™
          </Link>
          <Link
            href="/trust-intelligence"
            className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 py-2.5 text-sm text-[var(--color-ink-dim)] transition-colors hover:bg-white/[0.05] hover:text-[var(--color-ink)]"
          >
            <Activity className="h-4 w-4" /> Trust Intelligence™
          </Link>
        </div>
      </section>

    </div>
  );
}
