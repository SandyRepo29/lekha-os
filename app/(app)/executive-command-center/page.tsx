export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck, Building2,
  BarChart3, FileSignature, ClipboardCheck, Target, ArrowRight,
  ChevronRight, Zap, Shield, CheckCircle2, Clock, FileText, LineChart,
  Sparkles, BookOpen, Activity, Star, AlertCircle, Info,
} from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getTrustIntelligenceOverview } from "@/lib/services/trust-intelligence/trust-intelligence-service";
import { getSnapshotHistory } from "@/lib/repositories/trust-intelligence-repo";
import { countByLifecycleStage, listVendors, getMetrics } from "@/lib/services/vendor-service";
import { findContractsByOrg } from "@/lib/repositories/contract-repo";
import { cn } from "@/lib/utils";
import { type VendorLifecycleStage } from "@/lib/constants/vendor-lifecycle";

// ─── Role views ───────────────────────────────────────────────────────────────

type Role = "ceo" | "ciso" | "procurement" | "compliance";

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: "ceo",         label: "CEO",        desc: "Overall governance posture" },
  { value: "ciso",        label: "CISO",        desc: "Security & risk exposure" },
  { value: "procurement", label: "Procurement", desc: "Vendor portfolio & contracts" },
  { value: "compliance",  label: "Compliance",  desc: "Frameworks & evidence coverage" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trustLevelLabel(score: number): string {
  if (score >= 95) return "Exceptional";
  if (score >= 90) return "Trusted";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Moderate";
  if (score >= 60) return "Needs Attention";
  return "High Concern";
}

function trustLevelColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 80) return "text-sky-400";
  if (score >= 70) return "text-amber-400";
  if (score >= 60) return "text-orange-400";
  return "text-red-400";
}

function scoreBarColor(score: number) {
  return score >= 80 ? "bg-emerald-500/70" : score >= 60 ? "bg-amber-500/70" : "bg-red-500/60";
}

function deltaSign(history: Array<{ orgTrustScore: number | null }>) {
  if (history.length < 2) return null;
  const d = (history[history.length - 1]?.orgTrustScore ?? 0) - (history[0]?.orgTrustScore ?? 0);
  return { value: Math.abs(d).toFixed(1), dir: d > 2 ? "up" : d < -2 ? "down" : "flat" };
}

function contractRec(score: number): { label: string; color: string } {
  if (score >= 75) return { label: "Renew",    color: "text-emerald-400 bg-emerald-500/12" };
  if (score >= 55) return { label: "Review",   color: "text-amber-400 bg-amber-500/12"    };
  return             { label: "Exit",     color: "text-red-400 bg-red-500/12"        };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
      {children}
    </div>
  );
}

function SectionHeader({ title, sub, href, hrefLabel = "View all" }: {
  title: string; sub?: string; href?: string; hrefLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between">
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

function ScoreRing({ score, size = 110 }: { score: number; size?: number }) {
  const r = 38, circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circ;
  const color = score >= 90 ? "#34d399" : score >= 80 ? "#38bdf8" : score >= 70 ? "#fbbf24" : score >= 60 ? "#fb923c" : "#f87171";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} transform="rotate(-90 50 50)"
        style={{ filter: `drop-shadow(0 0 8px ${color}70)` }} />
      <text x="50" y="47" textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="20" fontWeight="800" fontFamily="var(--font-display)">{score}</text>
      <text x="50" y="63" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7" fontWeight="600">/ 100</text>
    </svg>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const w = 80, h = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  const last = data[data.length - 1];
  const col = last >= 80 ? "#34d399" : last >= 70 ? "#fbbf24" : last >= 60 ? "#fb923c" : "#f87171";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70">
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--color-ink-dim)]">{label}</span>
        <span className="font-medium text-[var(--color-ink)]">{score}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full transition-all ${scoreBarColor(score)}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

// Priority / impact / urgency badge helpers
function PriorityBadge({ level }: { level: "critical" | "high" | "medium" | "low" }) {
  const map = {
    critical: "bg-red-500/15 text-red-400",
    high:     "bg-amber-500/15 text-amber-400",
    medium:   "bg-sky-500/15 text-sky-400",
    low:      "bg-emerald-500/15 text-emerald-400",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide", map[level])}>{level}</span>;
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

  // ── Data fetches ────────────────────────────────────────────────────────────
  let overview: Awaited<ReturnType<typeof getTrustIntelligenceOverview>> | null = null;
  let snapshots: Awaited<ReturnType<typeof getSnapshotHistory>> = [];
  let lifecycleCounts: Record<VendorLifecycleStage, number> | null = null;
  let allVendors: Awaited<ReturnType<typeof listVendors>> = [];
  let vendorMetrics: Awaited<ReturnType<typeof getMetrics>> | null = null;
  let contracts: Awaited<ReturnType<typeof findContractsByOrg>> = [];

  if (!session.demo && session.org) {
    [overview, snapshots, lifecycleCounts, allVendors, vendorMetrics, contracts] = await Promise.all([
      getTrustIntelligenceOverview(session.org.id).catch(() => null),
      getSnapshotHistory(session.org.id, 30).catch(() => []),
      countByLifecycleStage(session.org.id).catch(() => null),
      listVendors(session.org.id).catch(() => []),
      getMetrics(session.org.id).catch(() => null),
      findContractsByOrg(session.org.id).catch(() => [] as Awaited<ReturnType<typeof findContractsByOrg>>),
    ]);
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const orgScore     = overview?.orgTrustScore?.overall ?? 0;
  const scoreLabel   = trustLevelLabel(orgScore);
  const trend        = deltaSign(snapshots);
  const sparkData    = snapshots.map((s) => s.orgTrustScore ?? 0).filter(Boolean);
  const comp         = overview?.orgTrustScore;
  const risks        = overview?.risks;
  const compliance   = overview?.compliance;
  const controls     = overview?.controls;
  const audits       = overview?.audits;

  const components = [
    { label: "Vendor Trust",        score: comp?.vendorTrust       ?? 0 },
    { label: "Risk Posture",        score: comp?.riskPosture        ?? 0 },
    { label: "Control Health",      score: comp?.controlHealth      ?? 0 },
    { label: "Audit Readiness",     score: comp?.auditReadiness     ?? 0 },
    { label: "Compliance Coverage", score: comp?.complianceCoverage ?? 0 },
  ];

  const totalVendors     = overview?.vendors?.total ?? vendorMetrics?.totalVendors ?? 0;
  const criticalVendors  = allVendors.filter((v) => v.risk === "critical").length;
  const highRiskVendors  = allVendors.filter((v) => v.risk === "high").length;
  const monitoredVendors = allVendors.filter((v) => v.lifecycleStage === "monitor").length;
  const reviewDueVendors = allVendors.filter((v) => ["audit","renew"].includes(v.lifecycleStage)).length;
  const openRisks        = risks?.activeCount ?? 0;
  const criticalRisks    = risks?.criticalCount ?? 0;
  const highRisks        = risks?.highCount     ?? 0;
  const avgReadiness     = compliance?.avgReadiness ?? 0;
  const frameworks       = compliance?.frameworks ?? [];
  const weakControls     = controls?.weakCount ?? 0;
  const openFindings     = audits?.totalOpenFindings ?? 0;
  const criticalFindings = audits?.openCriticalFindings ?? 0;

  // Lifecycle funnel
  const lc = lifecycleCounts;
  const funnelStages = lc ? [
    { label: "Discover",  count: lc.discover  },
    { label: "Inventory", count: lc.inventory },
    { label: "Classify",  count: lc.classify  },
    { label: "Assess",    count: lc.assess    },
    { label: "Risk",      count: lc.risk      },
    { label: "Comply",    count: lc.comply    },
    { label: "Monitor",   count: lc.monitor   },
    { label: "Audit",     count: lc.audit     },
    { label: "Renew",     count: lc.renew     },
    { label: "Offboard",  count: lc.offboard  },
  ] : [];
  const funnelMax = Math.max(...funnelStages.map((s) => s.count), 1);

  // Trust distribution
  const trustBuckets = [
    { label: "Exceptional",     min: 95, max: 101, color: "bg-emerald-400/70", text: "text-emerald-400" },
    { label: "Trusted",         min: 90, max:  95, color: "bg-emerald-500/50", text: "text-emerald-400" },
    { label: "Strong",          min: 80, max:  90, color: "bg-sky-500/60",     text: "text-sky-400"     },
    { label: "Moderate",        min: 70, max:  80, color: "bg-amber-500/60",   text: "text-amber-400"   },
    { label: "Needs Attention", min: 60, max:  70, color: "bg-orange-500/60",  text: "text-orange-400"  },
    { label: "High Concern",    min:  0, max:  60, color: "bg-red-500/60",     text: "text-red-400"     },
  ].map((b) => ({ ...b, count: allVendors.filter((v) => v.score >= b.min && v.score < b.max).length }));
  const maxBucket = Math.max(...trustBuckets.map((b) => b.count), 1);

  // Trust distribution trend from snapshots — compare avg vendor trust score direction
  const prevVendorTrust = snapshots[0]?.vendorTrustScore ?? null;
  const currVendorTrust = snapshots[snapshots.length - 1]?.vendorTrustScore ?? null;
  const trustTrendDelta = (prevVendorTrust !== null && currVendorTrust !== null)
    ? +(currVendorTrust - prevVendorTrust).toFixed(1) : null;

  // Contract & Renewal Intelligence
  const now = Date.now();
  const in90 = now + 90 * 86_400_000;
  const expiringContracts = contracts
    .filter((c) => {
      if (!c.expiryDate) return false;
      const t = new Date(c.expiryDate).getTime();
      return t >= now && t <= in90;
    })
    .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())
    .slice(0, 6)
    .map((c) => {
      const daysLeft = Math.ceil((new Date(c.expiryDate!).getTime() - now) / 86_400_000);
      const vendorScore = allVendors.find((v) => v.name === c.vendorName)?.score ?? 70;
      const rec = contractRec(vendorScore);
      return { ...c, daysLeft, vendorScore, rec };
    });

  const contractStats = {
    total:  expiringContracts.length,
    renew:  expiringContracts.filter((c) => c.rec.label === "Renew").length,
    review: expiringContracts.filter((c) => c.rec.label === "Review").length,
    exit:   expiringContracts.filter((c) => c.rec.label === "Exit").length,
  };

  // Risk Concentration — which vendors drive the most risk (high/critical risk)
  const riskVendors = allVendors
    .filter((v) => v.risk === "critical" || v.risk === "high")
    .map((v) => ({
      ...v,
      riskWeight: v.risk === "critical" ? 3 : 2,
    }));
  const totalRiskWeight = riskVendors.reduce((s, v) => s + v.riskWeight, 0) || 1;
  const riskConcentration = riskVendors
    .sort((a, b) => b.riskWeight - a.riskWeight)
    .slice(0, 5)
    .map((v) => ({ ...v, pct: Math.round((v.riskWeight / totalRiskWeight) * 100) }));
  const top5Pct = riskConcentration.reduce((s, v) => s + v.pct, 0);

  // Upcoming Decisions — enhanced with priority/impact/confidence
  const upcomingDecisions = allVendors
    .filter((v) => v.score < 65 || v.risk === "critical" || v.risk === "high")
    .sort((a, b) => a.score - b.score)
    .slice(0, 6)
    .map((v) => {
      const priority: "critical" | "high" | "medium" | "low" =
        v.risk === "critical" || v.score < 40 ? "critical" :
        v.risk === "high"     || v.score < 55 ? "high"     :
        v.score < 65                          ? "medium"   : "low";
      const impact: "high" | "medium" | "low" =
        v.risk === "critical" ? "high" : v.risk === "high" ? "high" : "medium";
      const confidence = Math.min(98, 70 + Math.round((100 - v.score) * 0.28));
      const action =
        v.score < 40 || v.risk === "critical" ? "Escalate"   :
        v.score < 55 || v.risk === "high"     ? "Reassess"   :
        v.lifecycleStage === "renew"           ? "Renew"      : "Review";
      return { id: v.id, name: v.name, score: v.score, risk: v.risk, priority, impact, confidence, action, stage: v.lifecycleStage };
    });

  // Action center items grouped by severity
  const actionItems = [
    { group: "critical", label: "Critical vendors",           count: criticalVendors,                                             icon: Building2,     href: "/vendors?risk=critical" },
    { group: "critical", label: "Critical audit findings",     count: criticalFindings,                                            icon: ClipboardCheck, href: "/audits/findings"        },
    { group: "critical", label: "Critical risks open",         count: criticalRisks,                                               icon: AlertTriangle,  href: "/risks"                  },
    { group: "high",     label: "Vendors awaiting assessment", count: allVendors.filter((v) => ["classify","assess"].includes(v.lifecycleStage)).length, icon: Building2, href: "/vendors" },
    { group: "high",     label: "Open audit findings",         count: openFindings,                                                icon: Target,         href: "/audits/findings"        },
    { group: "high",     label: "Weak controls",               count: weakControls,                                                icon: Shield,         href: "/controls"               },
    { group: "medium",   label: "High risk vendors",           count: highRiskVendors,                                             icon: AlertTriangle,  href: "/vendors?risk=high"      },
    { group: "medium",   label: "Docs expiring in 30 days",    count: vendorMetrics?.expiringSoon ?? 0,                            icon: FileText,       href: "/vendors"                },
    { group: "medium",   label: "Contracts expiring in 90d",   count: expiringContracts.length,                                   icon: FileSignature,  href: "/contract-governance/renewals" },
  ] as const;

  type ActionGroup = "critical" | "high" | "medium";

  const groupedActions = (["critical", "high", "medium"] as ActionGroup[]).map((g) => ({
    group: g,
    items: actionItems.filter((a) => a.group === g && a.count > 0),
    color: g === "critical" ? { icon: "text-red-400", label: "Critical", badge: "bg-red-500/15 text-red-400" } :
           g === "high"     ? { icon: "text-amber-400", label: "High",   badge: "bg-amber-500/15 text-amber-400" } :
                              { icon: "text-sky-400",   label: "Medium",  badge: "bg-sky-500/15 text-sky-400" },
  })).filter((g) => g.items.length > 0);

  // ── Executive Briefing (data-derived narrative) ─────────────────────────────
  const topDecisionVendor = upcomingDecisions[0];
  const complianceTrend   = trend?.dir === "up" ? "improved" : trend?.dir === "down" ? "declined" : "remains stable";
  const briefingLines: string[] = [];
  briefingLines.push(`Trust posture is ${scoreLabel.toLowerCase()} at ${orgScore}/100.`);
  if (criticalVendors > 0) briefingLines.push(`${criticalVendors} critical vendor${criticalVendors > 1 ? "s" : ""} require immediate review.`);
  if (openFindings > 0)    briefingLines.push(`${openFindings} audit finding${openFindings > 1 ? "s" : ""} remain${openFindings === 1 ? "s" : ""} open${criticalFindings > 0 ? `, including ${criticalFindings} critical` : ""}.`);
  if (trend?.value)        briefingLines.push(`Overall governance score has ${complianceTrend} by ${trend.value} pts over the past 30 days.`);
  if (expiringContracts.length > 0) briefingLines.push(`${expiringContracts.length} contract${expiringContracts.length > 1 ? "s" : ""} expir${expiringContracts.length === 1 ? "es" : "e"} within 90 days.`);
  if (criticalRisks > 0)  briefingLines.push(`${criticalRisks} critical risk${criticalRisks > 1 ? "s" : ""} require${criticalRisks === 1 ? "s" : ""} treatment.`);
  if (weakControls > 0)   briefingLines.push(`${weakControls} control${weakControls > 1 ? "s" : ""} are below health threshold.`);

  return (
    <div className="space-y-7">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Executive Command Center</h1>
          <p className="mt-0.5 text-sm text-[var(--color-ink-faint)]">Decision intelligence for your governance posture</p>
        </div>
        <div className="flex items-center gap-1 rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-1">
          {ROLES.map((r) => (
            <Link key={r.value} href={`?role=${r.value}`}
              className={cn("shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
                activeRole === r.value
                  ? "bg-white/[0.08] text-[var(--color-ink)]"
                  : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
              )}
              title={r.desc}>{r.label}</Link>
          ))}
        </div>
      </div>

      {/* ══ ROW 1: Organizational Trust Score™ ══════════════════════════════ */}
      <section className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

          <div className="flex shrink-0 flex-col items-center gap-3 lg:items-start">
            <div className="flex items-center gap-5">
              <ScoreRing score={orgScore} size={120} />
              <div>
                <div className={cn("font-[family-name:var(--font-display)] text-xl font-bold", trustLevelColor(orgScore))}>
                  {scoreLabel}
                </div>
                <div className="mt-1 text-xs text-[var(--color-ink-faint)]">Organizational Trust Score™</div>
                {trend && (
                  <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium",
                    trend.dir === "up" ? "text-emerald-400" : trend.dir === "down" ? "text-red-400" : "text-[var(--color-ink-dim)]")}>
                    {trend.dir === "up"   ? <TrendingUp className="h-3.5 w-3.5"  /> :
                     trend.dir === "down" ? <TrendingDown className="h-3.5 w-3.5" /> :
                     <Minus className="h-3.5 w-3.5" />}
                    {trend.dir === "flat" ? "Stable" : `${trend.value} pts`} vs 30 days
                  </div>
                )}
                {sparkData.length > 2 && <div className="mt-2"><Sparkline data={sparkData} /></div>}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Score Components</div>
            {components.map((c) => <ScoreBar key={c.label} label={c.label} score={c.score} />)}
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 lg:w-52">
            <div className="col-span-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Signals</div>
            {[
              { label: "Open Risks",    value: openRisks,     danger: openRisks > 10 },
              { label: "Critical",      value: criticalRisks, danger: criticalRisks > 0 },
              { label: "Frameworks",    value: compliance?.frameworkCount ?? 0, danger: false },
              { label: "Avg Readiness", value: `${avgReadiness}%`, danger: avgReadiness < 60 },
            ].map(({ label, value, danger }) => (
              <div key={label} className="rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2">
                <div className="text-[10px] text-[var(--color-ink-faint)]">{label}</div>
                <div className={cn("text-lg font-bold", danger ? "text-red-400" : "text-[var(--color-ink)]")}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ROW 2: Executive Briefing ════════════════════════════════════════ */}
      <section className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.06] to-purple-500/[0.03] p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-500/15">
            <BookOpen className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-base font-bold">Executive Briefing</h2>
            <p className="text-xs text-[var(--color-ink-faint)]">Governance summary · updated now</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          {/* Narrative */}
          <div className="space-y-2">
            {briefingLines.map((line, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                  i === 0 ? (orgScore >= 70 ? "bg-emerald-400" : orgScore >= 50 ? "bg-amber-400" : "bg-red-400") :
                  line.includes("critical") || line.includes("Critical") ? "bg-red-400" :
                  line.includes("improved") ? "bg-emerald-400" : "bg-indigo-400"
                )} />
                <p className="text-sm leading-relaxed text-[var(--color-ink-dim)]">{line}</p>
              </div>
            ))}
            {briefingLines.length === 0 && (
              <p className="text-sm text-[var(--color-ink-dim)]">Add vendors and configure governance modules to generate your executive briefing.</p>
            )}
          </div>

          {/* Recommended priority */}
          <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] p-4">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
              Recommended Priority
            </div>
            {topDecisionVendor ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/15 text-xs font-bold text-red-400">
                    {topDecisionVendor.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--color-ink)]">{topDecisionVendor.name}</div>
                    <div className="text-[10px] text-[var(--color-ink-faint)]">Trust score: {topDecisionVendor.score} · {topDecisionVendor.risk} risk</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/vendors/${topDecisionVendor.id}`}
                    className="rounded-lg bg-indigo-500/15 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-500/25 transition-colors">
                    View Vendor →
                  </Link>
                  <Link href="/risks"
                    className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-dim)] hover:bg-white/[0.08] transition-colors">
                    View Risks
                  </Link>
                  <Link href="/trust-intelligence/recommendations"
                    className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-dim)] hover:bg-white/[0.08] transition-colors">
                    Recommendations
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400/70" />
                <span className="text-sm text-emerald-400">No urgent actions identified.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ ROW 3: Governance Copilot™ ══════════════════════════════════════ */}
      <section className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.03] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3 shrink-0">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/15">
              <Sparkles className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-base font-bold">Governance Copilot™</h2>
              <p className="text-xs text-[var(--color-ink-faint)]">AI-powered executive analysis · Gemini 2.5 Flash</p>
            </div>
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            {[
              "What is our vendor governance posture?",
              "Which vendors pose the highest risk?",
              "Are we audit ready?",
              "Summarize our top compliance gaps.",
            ].map((q) => (
              <Link key={q}
                href={`/trust-intelligence/executive?q=${encodeURIComponent(q)}`}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-3 py-2 text-xs text-[var(--color-ink-dim)] transition-colors hover:bg-white/[0.06] hover:text-[var(--color-ink)]">
                <ArrowRight className="h-3 w-3 shrink-0 text-indigo-400" />
                {q}
              </Link>
            ))}
          </div>
          <Link href="/trust-intelligence/executive"
            className="shrink-0 flex items-center gap-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/15">
            Open Copilot™ <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ══ ROW 4: Vendor Portfolio + Lifecycle Funnel ══════════════════════ */}
      {(activeRole === "ceo" || activeRole === "ciso" || activeRole === "procurement") && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">

          {/* Portfolio */}
          <section>
            <SectionHeader title="Vendor Portfolio" sub={`${totalVendors} vendors across all lifecycle stages`} href="/vendors" />
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total",       value: totalVendors,     accent: "text-[var(--color-ink)]",    border: "border-[var(--color-line)]"      },
                { label: "Critical Risk", value: criticalVendors, accent: criticalVendors > 0 ? "text-red-400" : "text-[var(--color-ink)]",   border: criticalVendors > 0 ? "border-l-2 border-l-red-500/60 border-red-500/25" : "border-[var(--color-line)]" },
                { label: "High Risk",   value: highRiskVendors,   accent: highRiskVendors > 3 ? "text-amber-400" : "text-[var(--color-ink)]", border: highRiskVendors > 3 ? "border-l-2 border-l-amber-500/60 border-amber-500/25" : "border-[var(--color-line)]" },
                { label: "Monitored",   value: monitoredVendors,  accent: "text-sky-400",               border: "border-[var(--color-line)]"      },
                { label: "Audit/Renew", value: reviewDueVendors,  accent: reviewDueVendors > 0 ? "text-amber-400" : "text-[var(--color-ink)]", border: "border-[var(--color-line)]" },
                { label: "Avg Score",   value: vendorMetrics?.complianceScore ?? 0,  accent: (vendorMetrics?.complianceScore ?? 0) >= 70 ? "text-emerald-400" : "text-amber-400", border: "border-[var(--color-line)]" },
              ].map(({ label, value, accent, border }) => (
                <div key={label} className={cn("rounded-xl border bg-white/[0.02] px-3 py-3", border)}>
                  <div className="text-[10px] text-[var(--color-ink-faint)]">{label}</div>
                  <div className={cn("mt-1 font-[family-name:var(--font-display)] text-xl font-bold", accent)}>{value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Lifecycle Funnel */}
          {funnelStages.length > 0 && (
            <section>
              <SectionHeader title="Vendor Lifecycle" sub="Distribution across 10 governance stages" href="/vendors" />
              <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-4">
                <div className="grid grid-cols-10 gap-1">
                  {funnelStages.map((s, i) => {
                    const heightPct = Math.max(8, (s.count / funnelMax) * 100);
                    const col = i <= 3 ? "bg-indigo-500/40" : i <= 6 ? "bg-emerald-500/40" : i === 7 ? "bg-blue-500/40" : i === 8 ? "bg-amber-500/40" : "bg-red-500/40";
                    return (
                      <div key={s.label} className="flex flex-col items-center gap-1">
                        <div className="text-[10px] font-bold text-[var(--color-ink)]">{s.count}</div>
                        <div className="w-full rounded-md bg-white/[0.04]" style={{ height: "52px" }}>
                          <div className={cn("w-full rounded-md transition-all", col)}
                            style={{ height: `${heightPct}%`, marginTop: `${100 - heightPct}%` }} />
                        </div>
                        <div className="text-center text-[8px] leading-tight text-[var(--color-ink-faint)]">{s.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* ══ ROW 5: Risk Posture + Audit & Compliance Readiness ══════════════ */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Risk Posture */}
        {(activeRole === "ceo" || activeRole === "ciso") && (
          <section>
            <SectionHeader title="Risk Posture" sub="Current risk exposure across all categories" href="/risks" />
            <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Open Risks",  value: openRisks,    danger: openRisks > 10,    warn: false },
                  { label: "Critical",    value: criticalRisks, danger: criticalRisks > 0, warn: false },
                  { label: "High",        value: highRisks,     danger: false, warn: highRisks > 0 },
                  { label: "Medium",      value: risks?.mediumCount ?? 0, danger: false, warn: false },
                ].map(({ label, value, danger, warn }) => (
                  <div key={label} className={cn("rounded-xl border px-4 py-3",
                    danger ? "border-red-500/20 bg-red-500/[0.04] border-l-2 border-l-red-500/60" :
                    warn   ? "border-amber-500/20 bg-amber-500/[0.04] border-l-2 border-l-amber-500/60" :
                    "border-[var(--color-line)] bg-white/[0.03]")}>
                    <div className="text-xs text-[var(--color-ink-faint)]">{label}</div>
                    <div className={cn("mt-1 font-[family-name:var(--font-display)] text-2xl font-bold",
                      danger ? "text-red-400" : warn ? "text-amber-400" : "text-[var(--color-ink)]")}>{value}</div>
                  </div>
                ))}
              </div>
              {risks?.byCategory && (
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Top Categories</div>
                  {Object.entries(risks.byCategory as Record<string, number>)
                    .sort((a, b) => b[1] - a[1]).slice(0, 4)
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

        {/* Audit & Compliance Readiness */}
        {(activeRole === "ceo" || activeRole === "compliance") && (
          <section>
            <SectionHeader title="Audit & Compliance Readiness"
              sub="Readiness across frameworks, controls, evidence, and audit requirements"
              href="/compliance" />
            <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Overall Readiness",  value: `${avgReadiness}%`,                  good: avgReadiness >= 70  },
                  { label: "Frameworks Active",   value: compliance?.frameworkCount ?? 0,      good: (compliance?.frameworkCount ?? 0) > 0 },
                  { label: "Healthy Controls",    value: controls?.healthyCount ?? 0,          good: true  },
                  { label: "Weak Controls",       value: weakControls,                         good: weakControls === 0 },
                  { label: "Audit Readiness",     value: `${comp?.auditReadiness ?? 0}%`,      good: (comp?.auditReadiness ?? 0) >= 70 },
                  { label: "Open Findings",       value: openFindings,                         good: openFindings === 0 },
                ].map(({ label, value, good }) => (
                  <div key={label} className={cn("rounded-xl border px-3 py-2.5",
                    good ? "border-[var(--color-line)] bg-white/[0.02]" :
                    "border-red-500/20 bg-red-500/[0.03] border-l-2 border-l-red-500/50")}>
                    <div className="text-[10px] text-[var(--color-ink-faint)]">{label}</div>
                    <div className={cn("mt-0.5 font-[family-name:var(--font-display)] text-lg font-bold",
                      good ? "text-[var(--color-ink)]" : "text-red-400")}>{value}</div>
                  </div>
                ))}
              </div>
              {frameworks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Framework Readiness</div>
                  {frameworks.slice(0, 4).map((f, i) => {
                    const status = f.overallScore >= 80 ? { label: "Ready",   color: "text-emerald-400" } :
                                   f.overallScore >= 60 ? { label: "Partial",  color: "text-amber-400"  } :
                                                          { label: "At Risk",  color: "text-red-400"    };
                    return (
                      <div key={f.frameworkId ?? i} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 truncate text-xs text-[var(--color-ink-dim)]">Framework {i + 1}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                          <div className={cn("h-full rounded-full", f.overallScore >= 70 ? "bg-emerald-500/60" : "bg-amber-500/60")}
                            style={{ width: `${f.overallScore}%` }} />
                        </div>
                        <span className="w-8 text-right text-xs text-[var(--color-ink)]">{f.overallScore}%</span>
                        <span className={cn("w-14 shrink-0 text-right text-[10px] font-semibold", status.color)}>{status.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <Link href="/compliance" className="flex items-center gap-1 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
                <ArrowRight className="h-3.5 w-3.5" /> Open Evidence Vault™
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* ══ ROW 6: Trust Distribution + Contract & Renewal Intelligence ══════ */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Trust Distribution with trend */}
        <section>
          <SectionHeader title="Vendor Trust Distribution"
            sub="Portfolio composition by trust level" href="/trust-intelligence" />
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
            {trustTrendDelta !== null && (
              <div className={cn("mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                trustTrendDelta > 0 ? "border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-400" :
                trustTrendDelta < 0 ? "border-red-500/20 bg-red-500/[0.04] text-red-400" :
                "border-[var(--color-line)] text-[var(--color-ink-dim)]")}>
                {trustTrendDelta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> :
                 trustTrendDelta < 0 ? <TrendingDown className="h-3.5 w-3.5" /> :
                 <Minus className="h-3.5 w-3.5" />}
                Avg vendor trust {trustTrendDelta > 0 ? "improved" : trustTrendDelta < 0 ? "declined" : "unchanged"}
                {trustTrendDelta !== 0 && ` by ${Math.abs(trustTrendDelta)} pts`} over 30 days
              </div>
            )}
            <div className="space-y-2.5">
              {trustBuckets.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className={cn("w-32 shrink-0 text-xs font-medium", b.text)}>{b.label}</span>
                  <div className="flex-1 h-4 rounded-md bg-white/[0.04] overflow-hidden">
                    {b.count > 0 && (
                      <div className={cn("h-full rounded-md transition-all", b.color)}
                        style={{ width: `${(b.count / maxBucket) * 100}%` }} />
                    )}
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs font-bold text-[var(--color-ink)]">{b.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-ink-faint)]">
              <span>{allVendors.length} vendors · avg score {allVendors.length ? Math.round(allVendors.reduce((s, v) => s + v.score, 0) / allVendors.length) : 0}</span>
              <Link href="/trust-intelligence" className="flex items-center gap-1 hover:text-[var(--color-ink)] transition-colors">
                Trust Intelligence™ <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>

        {/* Contract & Renewal Intelligence */}
        <section>
          <SectionHeader title="Contract & Renewal Intelligence"
            sub="Renewals due in the next 90 days" href="/contract-governance/renewals"
            hrefLabel="View all renewals" />
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] overflow-hidden">
            {/* Stats strip */}
            <div className="grid grid-cols-4 divide-x divide-[var(--color-line)] border-b border-[var(--color-line)]">
              {[
                { label: "Due",    value: contractStats.total,  color: "text-[var(--color-ink)]" },
                { label: "Renew",  value: contractStats.renew,  color: "text-emerald-400" },
                { label: "Review", value: contractStats.review, color: "text-amber-400"   },
                { label: "Exit",   value: contractStats.exit,   color: "text-red-400"     },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center py-3">
                  <div className={cn("font-[family-name:var(--font-display)] text-xl font-bold", color)}>{value}</div>
                  <div className="text-[10px] text-[var(--color-ink-faint)]">{label}</div>
                </div>
              ))}
            </div>
            {/* Contract rows */}
            {expiringContracts.length === 0 ? (
              <div className="flex items-center gap-2 px-5 py-8 justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-400/60" />
                <span className="text-sm text-[var(--color-ink-dim)]">No contracts expiring in 90 days.</span>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-line)]">
                {expiringContracts.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs font-semibold text-[var(--color-ink)]">
                        {c.vendorName ?? c.title}
                      </div>
                      <div className="text-[10px] text-[var(--color-ink-faint)]">
                        {c.daysLeft} days · Trust: {c.vendorScore}
                      </div>
                    </div>
                    <span className={cn("shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-semibold", c.rec.color)}>
                      {c.rec.label}
                    </span>
                    <Link href="/contract-governance/renewals"
                      className="shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ══ ROW 7: Risk Concentration + Upcoming Decisions ══════════════════ */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Risk Concentration */}
        <section>
          <SectionHeader title="Risk Concentration"
            sub="Vendors driving the highest risk exposure" href="/risks" />
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
            {riskConcentration.length === 0 ? (
              <div className="flex items-center gap-2 py-6 justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-400/60" />
                <span className="text-sm text-[var(--color-ink-dim)]">No high or critical risk vendors.</span>
              </div>
            ) : (
              <>
                <div className="mb-4 space-y-3">
                  {riskConcentration.map((v, i) => (
                    <Link key={v.id} href={`/vendors/${v.id}`}
                      className="flex items-center gap-3 group">
                      <span className="w-5 shrink-0 text-xs text-[var(--color-ink-faint)]">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="truncate text-xs font-medium text-[var(--color-ink)] group-hover:text-[var(--color-blue)] transition-colors">{v.name}</span>
                          <span className={cn("ml-2 shrink-0 text-xs font-bold",
                            v.risk === "critical" ? "text-red-400" : "text-amber-400")}>{v.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06]">
                          <div className={cn("h-full rounded-full", v.risk === "critical" ? "bg-red-500/60" : "bg-amber-500/60")}
                            style={{ width: `${v.pct}%` }} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {riskConcentration.length >= 3 && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2.5">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />
                    <p className="text-xs text-amber-300/80">
                      Top {riskConcentration.length} vendors account for <strong>{top5Pct}%</strong> of organizational risk exposure.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Upcoming Decisions — enhanced */}
        <section>
          <SectionHeader title="Upcoming Decisions"
            sub="Vendors requiring executive attention — sorted by priority"
            href="/vendors" hrefLabel="View all vendors" />
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] overflow-hidden">
            {upcomingDecisions.length === 0 ? (
              <div className="flex items-center gap-2 px-5 py-8 justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-400/60" />
                <span className="text-sm text-[var(--color-ink-dim)]">No pending decisions.</span>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-line)]">
                {upcomingDecisions.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="truncate text-xs font-semibold text-[var(--color-ink)]">{d.name}</span>
                        <PriorityBadge level={d.priority} />
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-[var(--color-ink-faint)]">
                        <span>Impact: {d.impact}</span>
                        <span>Confidence: {d.confidence}%</span>
                        <span>Score: {d.score}</span>
                      </div>
                    </div>
                    <div className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold",
                      d.action === "Escalate" ? "bg-red-500/15 text-red-400" :
                      d.action === "Reassess" ? "bg-amber-500/15 text-amber-400" :
                      d.action === "Renew"    ? "bg-emerald-500/15 text-emerald-400" :
                                               "bg-sky-500/15 text-sky-400")}>
                      {d.action}
                    </div>
                    <Link href={`/vendors/${d.id}`}
                      className="shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ══ ROW 8: Board Reporting ══════════════════════════════════════════ */}
      <section>
        <SectionHeader title="Board Reporting"
          sub="Generate and schedule board-grade governance reports"
          href="/executive-reporting/board-reports" hrefLabel="Open Board Reports™" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-3">
          {[
            { label: "Board Governance Report",  desc: "Full trust posture for board",     href: "/executive-reporting/board-reports", icon: BarChart3,    formats: "PDF · XLSX · PPTX" },
            { label: "Risk Committee Report",     desc: "Risk exposure & treatment",        href: "/executive-reporting/board-reports", icon: AlertTriangle, formats: "PDF · XLSX"        },
            { label: "Compliance Summary",        desc: "Framework readiness overview",     href: "/executive-reporting/board-reports", icon: ShieldCheck,   formats: "PDF"               },
            { label: "Vendor Trust Report",       desc: "Portfolio trust analysis",         href: "/executive-reporting/board-reports", icon: Building2,    formats: "PDF · XLSX"        },
          ].map((r) => (
            <Link key={r.label} href={r.href}
              className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05]">
              <r.icon className="h-5 w-5 text-[var(--color-ink-faint)]" />
              <div className="mt-2 text-xs font-semibold text-[var(--color-ink)]">{r.label}</div>
              <div className="mt-0.5 text-[10px] text-[var(--color-ink-faint)]">{r.desc}</div>
              <div className="mt-2 text-[9px] font-medium text-indigo-400/70">{r.formats}</div>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Analytics Hub™",        href: "/executive-reporting",           icon: LineChart    },
            { label: "Predictive Analytics™", href: "/executive-reporting/forecasts", icon: TrendingUp   },
            { label: "Scheduled Reports™",    href: "/executive-reporting/scheduled", icon: Clock        },
            { label: "Trust Intelligence™",   href: "/trust-intelligence",            icon: Activity     },
          ].map((l) => (
            <Link key={l.label} href={l.href}
              className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 py-2 text-xs text-[var(--color-ink-dim)] transition-colors hover:bg-white/[0.05] hover:text-[var(--color-ink)]">
              <l.icon className="h-3.5 w-3.5" />{l.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ══ ROW 9: Action Center (grouped by severity) ══════════════════════ */}
      <section>
        <SectionHeader title="Action Center" sub="Items requiring executive attention — grouped by priority" />
        {groupedActions.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] px-5 py-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">No pending actions — governance posture is clean.</span>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {groupedActions.map(({ group, items, color }) => (
              <div key={group} className={cn("rounded-2xl border p-4 space-y-2",
                group === "critical" ? "border-red-500/20 bg-red-500/[0.03]" :
                group === "high"     ? "border-amber-500/20 bg-amber-500/[0.03]" :
                "border-[var(--color-line)] bg-white/[0.02]")}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", color.badge)}>
                    {color.label}
                  </span>
                  <span className="text-xs text-[var(--color-ink-faint)]">{items.length} item{items.length > 1 ? "s" : ""}</span>
                </div>
                {items.map(({ label, count, icon: Icon, href }) => (
                  <Link key={label} href={href}
                    className="flex items-center gap-2.5 rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.05]">
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", color.icon)} />
                    <span className="flex-1 text-xs text-[var(--color-ink-dim)]">{label}</span>
                    <span className={cn("text-sm font-bold", color.icon)}>{count}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
