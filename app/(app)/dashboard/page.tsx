export const dynamic = "force-dynamic";

export const metadata = { title: 'Dashboard — AUDT' };

import Link from "next/link";
import {
  Building2, AlertTriangle, Sparkles, ArrowRight, Plus, ShieldCheck,
  ClipboardCheck, Clock, TrendingUp, Activity, XCircle, ChevronRight,
  Target, Shield, Zap, FileSignature, CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/app-shell/score-ring";
import { requireUser } from "@/lib/auth/session";
import {
  getMetrics, listVendors, countByLifecycleStage,
  type VendorRow, type VendorMetrics,
} from "@/lib/services/vendor-service";
import { type VendorLifecycleStage } from "@/lib/constants/vendor-lifecycle";
import { getTrustIntelligenceOverview } from "@/lib/services/trust-intelligence/trust-intelligence-service";
import { listOrgActivity } from "@/lib/repositories/activity-repo";
import { findContractsByOrg } from "@/lib/repositories/contract-repo";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { demoMetrics, demoVendors } from "@/lib/demo-data";
import { scoreBarGradient } from "@/lib/ui/colors";
import { getOrgTrustLevel } from "@/lib/services/org-trust-score";
import { Suspense } from "react";
import { WelcomeBanner } from "@/components/onboarding/welcome-banner";
import { OnboardingChecklist } from "@/components/onboarding/onboarding-checklist";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(v: number) {
  return v >= 80 ? "text-emerald-400" : v >= 65 ? "text-sky-400" : v >= 50 ? "text-amber-400" : v >= 35 ? "text-orange-400" : "text-red-400";
}

function statusLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Healthy",         color: "text-emerald-400" };
  if (score >= 65) return { label: "Good Standing",   color: "text-sky-400"     };
  if (score >= 50) return { label: "Needs Attention", color: "text-amber-400"   };
  if (score >= 35) return { label: "At Risk",         color: "text-orange-400"  };
  return                   { label: "Critical",        color: "text-red-400"    };
}

function accentBorder(score: number) {
  return score >= 80 ? "border-l-emerald-500/60" : score >= 65 ? "border-l-sky-500/60" : score >= 50 ? "border-l-amber-500/60" : "border-l-red-500/60";
}

function accentBg(score: number) {
  return score >= 80 ? "bg-emerald-500/[0.04]" : score >= 65 ? "bg-sky-500/[0.04]" : score >= 50 ? "bg-amber-500/[0.04]" : "bg-red-500/[0.04]";
}

function vendorIssues(v: VendorRow): string[] {
  const issues: string[] = [];
  if (v.risk === "critical") issues.push("Critical risk level");
  else if (v.risk === "high") issues.push("High risk level");
  if (v.score < 50)          issues.push("Trust score critical");
  else if (v.score < 65)     issues.push("Low trust score");
  if (v.expired > 0)  issues.push(`${v.expired} doc${v.expired > 1 ? "s" : ""} expired`);
  if (v.expiring > 0)          issues.push(`${v.expiring} doc${v.expiring > 1 ? "s" : ""} expiring`);
  return issues.slice(0, 2);
}

function vendorAction(v: VendorRow): { label: string; accent: string } {
  if (v.risk === "critical" || v.score < 40) return { label: "Escalate",   accent: "bg-red-500/15 text-red-400"    };
  if (v.risk === "high"     || v.score < 60) return { label: "Investigate", accent: "bg-amber-500/15 text-amber-400" };
  return                                             { label: "Review",      accent: "bg-sky-500/15 text-sky-400"    };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
      {children}
    </div>
  );
}

function HealthCard({ label, value, color, href, alert }: {
  label: string; value: number; color: "indigo" | "emerald" | "amber" | "red"; href: string; alert?: boolean;
}) {
  const map = {
    indigo:  { text: "text-indigo-400",  bg: "bg-indigo-500/[0.06]",  bar: "#818cf8", border: "border-l-indigo-500/60"  },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/[0.06]", bar: "#34d399", border: "border-l-emerald-500/60" },
    amber:   { text: "text-amber-400",   bg: "bg-amber-500/[0.06]",   bar: "#fbbf24", border: "border-l-amber-500/60"   },
    red:     { text: "text-red-400",     bg: "bg-red-500/[0.06]",     bar: "#f87171", border: "border-l-red-500/60"     },
  };
  const c = map[color];
  return (
    <Link href={href}>
      <div className={cn(
        "rounded-xl border border-l-2 px-4 py-4 transition-colors hover:bg-white/[0.04] cursor-pointer",
        "border-[var(--color-line)]", c.border, alert ? c.bg : ""
      )}>
        <div className={cn("font-[family-name:var(--font-display)] text-2xl font-extrabold", c.text)}>
          {value}
        </div>
        <div className="mt-1 text-xs text-[var(--color-ink-faint)]">{label}</div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await requireUser();

  let metrics: VendorMetrics;
  let allVendors: VendorRow[];
  let lifecycleCounts: Record<VendorLifecycleStage, number> | null = null;
  let trustOverview: Awaited<ReturnType<typeof getTrustIntelligenceOverview>> | null = null;
  let activity: Awaited<ReturnType<typeof listOrgActivity>> = [];
  let expiringContracts = 0;
  let upcomingContractDecisions: Array<{ title: string; vendorName: string | null; daysLeft: number }> = [];

  if (session.demo || !session.org) {
    metrics = demoMetrics;
    allVendors = demoVendors.slice(0, 6).map((v, i) => ({
      id: String(i), name: v.name, category: v.category, status: v.status,
      risk: v.risk, score: v.score, docs: v.docs, expiring: v.expiring,
      expired: v.expired, ownerName: v.ownerName, ownerEmail: v.ownerEmail,
      ownerDepartment: v.ownerDepartment, lifecycleStage: "inventory" as VendorLifecycleStage,
    }));
  } else {
    const [_metrics, _vendors, _lc, _overview, _activity, _contracts] = await Promise.all([
      getMetrics(session.org.id),
      listVendors(session.org.id),
      countByLifecycleStage(session.org.id).catch(() => null),
      getTrustIntelligenceOverview(session.org.id).catch(() => null),
      listOrgActivity(session.org.id, 8).catch(() => []),
      findContractsByOrg(session.org.id).catch(() => [] as Awaited<ReturnType<typeof findContractsByOrg>>),
    ]);
    metrics       = _metrics;
    allVendors    = _vendors;
    lifecycleCounts = _lc;
    trustOverview = _overview;
    activity      = _activity;

    const now = Date.now();
    const in90 = now + 90 * 86_400_000;
    const expiring = _contracts.filter((c) => {
      if (!c.expiryDate) return false;
      const t = new Date(c.expiryDate).getTime();
      return t >= now && t <= in90;
    });
    expiringContracts = expiring.length;
    upcomingContractDecisions = expiring.slice(0, 3).map((c) => ({
      title:      c.title,
      vendorName: c.vendorName ?? null,
      daysLeft:   Math.ceil((new Date(c.expiryDate!).getTime() - now) / 86_400_000),
    }));
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const orgScore  = trustOverview?.orgTrustScore.overall ?? metrics.complianceScore;
  const trustLevel = getOrgTrustLevel(orgScore);

  const trustLevelColor =
    orgScore >= 80 ? "text-emerald-400" : orgScore >= 65 ? "text-sky-400" :
    orgScore >= 50 ? "text-amber-400"   : "text-red-400";

  const scoredVendors = trustOverview?.vendors.allScored ?? [];
  const healthyCount  = scoredVendors.filter((v) => v.trustScore >= 80).length;
  const atRiskCount   = scoredVendors.filter((v) => v.trustScore >= 50 && v.trustScore < 80).length;
  const criticalCount = scoredVendors.filter((v) => v.trustScore < 50).length;
  const empty = metrics.totalVendors === 0;

  const expiredDocs = allVendors.reduce((s, v) => s + (v.expired ?? 0), 0);

  // Lifecycle funnel
  const lc = lifecycleCounts;
  const catalogued = lc ? lc.discover + lc.inventory           : allVendors.filter((v) => (v.docs ?? 0) > 0).length;
  const assessed   = lc ? lc.classify + lc.assess + lc.risk    : allVendors.filter((v) => v.risk !== "high" && v.risk !== "critical").length;
  const compliant  = lc ? lc.comply                             : allVendors.filter((v) => v.score >= 70).length;
  const monitored  = lc ? lc.monitor                           : healthyCount;
  const audited    = lc ? lc.audit + lc.renew                  : 0;
  const offboarded = lc ? lc.offboard                          : 0;
  const awaitingAssessment = lc ? lc.classify + lc.assess      : 0;
  const total = metrics.totalVendors || 1;

  // Lifecycle completion %
  const funnelPct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  // Actionable governance status cards
  const govCards = [
    {
      label: "Compliance",
      score: trustOverview?.orgTrustScore.complianceCoverage ?? metrics.complianceScore,
      href: "/compliance",
      sub: `${trustOverview?.controls.weakCount ?? 0} weak controls`,
      icon: ShieldCheck,
    },
    {
      label: "Risk Posture",
      score: trustOverview?.orgTrustScore.riskPosture ?? 0,
      href: "/risks",
      sub: `${trustOverview?.risks.criticalCount ?? 0} critical risks`,
      icon: AlertTriangle,
    },
    {
      label: "Audit Readiness",
      score: trustOverview?.orgTrustScore.auditReadiness ?? 0,
      href: "/audits",
      sub: `${trustOverview?.audits.totalOpenFindings ?? 0} open findings`,
      icon: ClipboardCheck,
    },
    {
      label: "Vendor Health",
      score: trustOverview?.orgTrustScore.vendorTrust ?? 0,
      href: "/vendors",
      sub: `${allVendors.filter((v) => v.score < 65).length} need review`,
      icon: Building2,
    },
  ];

  // Governance Summary data
  const criticalVendors     = allVendors.filter((v) => v.risk === "critical").length;
  const vendorsNeedReview   = allVendors.filter((v) => v.score < 65).length;
  const openFindings        = trustOverview?.audits.totalOpenFindings ?? 0;
  const criticalFindings    = trustOverview?.audits.openCriticalFindings ?? 0;
  const activeRisks         = trustOverview?.risks.activeCount ?? 0;
  const criticalRisks       = trustOverview?.risks.criticalCount ?? 0;

  // Top vendor to act on (Governance Copilot™ recommendation)
  const topRecommendations = allVendors
    .filter((v) => v.score < 65 || v.risk === "critical" || v.risk === "high")
    .sort((a, b) => {
      if (a.risk === "critical" && b.risk !== "critical") return -1;
      if (b.risk === "critical" && a.risk !== "critical") return  1;
      return a.score - b.score;
    })
    .slice(0, 3)
    .map((v) => ({ ...v, issues: vendorIssues(v), action: vendorAction(v) }));

  // Vendors requiring attention (for the table)
  const vendorsNeedingAction = allVendors
    .filter((v) => v.score < 65 || v.risk === "critical" || v.risk === "high")
    .sort((a, b) => a.score - b.score)
    .slice(0, 6);

  // Trust distribution buckets
  const trustBuckets = [
    { label: "Excellent",      min: 80, max: 101, count: 0, color: "bg-emerald-400/70", text: "text-emerald-400" },
    { label: "Good",           min: 65, max:  80, count: 0, color: "bg-sky-500/60",     text: "text-sky-400"    },
    { label: "Moderate",       min: 50, max:  65, count: 0, color: "bg-amber-500/60",   text: "text-amber-400"  },
    { label: "Poor",           min: 35, max:  50, count: 0, color: "bg-orange-500/60",  text: "text-orange-400" },
    { label: "Critical",       min:  0, max:  35, count: 0, color: "bg-red-500/60",     text: "text-red-400"    },
  ];
  for (const v of allVendors) {
    const bucket = trustBuckets.find((b) => v.score >= b.min && v.score < b.max);
    if (bucket) bucket.count++;
  }
  const maxBucket = Math.max(...trustBuckets.map((b) => b.count), 1);

  // Upcoming Decisions: lifecycle audit/renew stage + low trust + expiring contracts
  const upcomingDecisions: Array<{
    name: string; id?: string; type: string; daysLeft?: number; action: string; urgency: "high" | "medium";
  }> = [
    ...allVendors
      .filter((v) => ["renew", "audit"].includes(v.lifecycleStage))
      .slice(0, 3)
      .map((v) => ({
        name:     v.name,
        id:       v.id,
        type:     v.lifecycleStage === "renew" ? "Contract Renewal" : "Audit Due",
        action:   v.score < 50 ? "Escalate" : "Review",
        urgency:  (v.score < 50 || v.risk === "critical") ? "high" as const : "medium" as const,
      })),
    ...upcomingContractDecisions.map((c) => ({
      name:     c.title,
      type:     `Contract — ${c.vendorName ?? "unknown vendor"}`,
      daysLeft: c.daysLeft,
      action:   "Renew",
      urgency:  c.daysLeft <= 14 ? "high" as const : "medium" as const,
    })),
  ].slice(0, 5);

  return (
    <div className="space-y-6">

      <Suspense fallback={null}><WelcomeBanner /></Suspense>
      <OnboardingChecklist />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Governance Operations Center
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            {session.orgName} · {metrics.totalVendors} vendor{metrics.totalVendors !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/trust-intelligence">
            <Button variant="ghost" size="sm"><TrendingUp className="h-4 w-4" /> Trust Score™</Button>
          </Link>
          <Link href="/operations/command-center">
            <Button variant="ghost" size="sm"><Sparkles className="h-4 w-4" /> Executive View</Button>
          </Link>
          <Link href="/vendors/new">
            <Button variant="primary" size="md"><Plus className="h-4 w-4" /> Add vendor</Button>
          </Link>
        </div>
      </div>

      {/* ── Row 1: Trust Score™ + Vendor Health ──────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">

        {/* Trust Score™ — large primary KPI */}
        <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-[var(--color-line)] p-7"
          style={{ background: "radial-gradient(ellipse at 50% 110%, rgba(99,102,241,.20), transparent 65%)" }}>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
            Organizational Trust Score™
          </div>
          <ScoreRing value={orgScore} size={128} />
          <div className={cn("mt-2 text-base font-bold", trustLevelColor)}>
            {trustLevel.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </div>
          <div className="mt-0.5 text-xs text-[var(--color-ink-faint)]">
            {empty ? "Add vendors to begin" : `${orgScore} / 100`}
          </div>
          <Link href="/trust-intelligence"
            className="mt-4 flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-1.5 text-xs text-[var(--color-ink-dim)] transition-colors hover:bg-white/[0.08] hover:text-[var(--color-ink)]">
            View Trust Breakdown <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Vendor health 4-card grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <HealthCard label="Total Vendors" value={metrics.totalVendors}  color="indigo"  href="/vendors" />
          <HealthCard label="Healthy"       value={healthyCount}          color="emerald" href="/vendors" />
          <HealthCard label="At Risk"       value={atRiskCount}           color="amber"   href="/vendors?risk=medium" />
          <HealthCard label="Critical"      value={criticalCount}         color="red"     href="/vendors?risk=high" alert={criticalCount > 0} />
        </div>
      </div>

      {/* ── Row 2: Actionable Status Cards ───────────────────────────────── */}
      <div>
        <SectionLabel>Governance Status</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {govCards.map((c) => {
            const st = statusLabel(c.score);
            return (
              <Link key={c.label} href={c.href}>
                <div className={cn(
                  "rounded-xl border border-l-2 px-4 py-4 transition-colors hover:bg-white/[0.04] cursor-pointer",
                  "border-[var(--color-line)]", accentBorder(c.score), accentBg(c.score)
                )}>
                  <div className="mb-2 flex items-center gap-1.5">
                    <c.icon className="h-3.5 w-3.5 text-[var(--color-ink-faint)]" />
                    <span className="text-xs text-[var(--color-ink-faint)]">{c.label}</span>
                  </div>
                  <div className={cn("font-[family-name:var(--font-display)] text-2xl font-extrabold", scoreColor(c.score))}>
                    {c.score}<span className="text-sm font-normal text-[var(--color-ink-faint)]">%</span>
                  </div>
                  <div className={cn("mt-1 text-xs font-semibold", st.color)}>{st.label}</div>
                  <div className="mt-0.5 text-[11px] text-[var(--color-ink-faint)]">{c.sub}</div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${c.score}%`, background: scoreBarGradient(c.score) }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Row 3: Governance Summary ─────────────────────────────────────── */}
      <div>
        <SectionLabel>Governance Summary</SectionLabel>
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Left: Key metrics */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-blue)]/10">
                <Target className="h-4 w-4 text-[var(--color-blue)]" />
              </div>
              <span className="font-[family-name:var(--font-display)] text-sm font-semibold">Posture at a Glance</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Trust Score",           value: `${orgScore} — ${trustLevel.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`, danger: orgScore < 50 },
                { label: "Critical Vendors",      value: String(criticalVendors),   danger: criticalVendors > 0 },
                { label: "Vendors Need Review",   value: String(vendorsNeedReview), danger: vendorsNeedReview > 3 },
                { label: "Open Findings",         value: String(openFindings),      danger: criticalFindings > 0 },
                { label: "Critical Risks",        value: String(criticalRisks),     danger: criticalRisks > 0 },
                { label: "Contracts Expiring",    value: String(expiringContracts), danger: expiringContracts > 0 },
                { label: "Expired Documents",     value: String(expiredDocs),       danger: expiredDocs > 0 },
                { label: "Docs Expiring Soon",    value: String(metrics.expiringSoon), danger: metrics.expiringSoon > 3 },
              ].map(({ label, value, danger }) => (
                <div key={label} className={cn(
                  "rounded-lg border px-3 py-2.5",
                  danger ? "border-red-500/20 bg-red-500/[0.04]" : "border-[var(--color-line)] bg-white/[0.02]"
                )}>
                  <div className="text-[10px] text-[var(--color-ink-faint)]">{label}</div>
                  <div className={cn("mt-0.5 text-sm font-bold leading-snug", danger ? "text-red-400" : "text-[var(--color-ink)]")}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Governance Copilot™ — top recommendations */}
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.04] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-500/15">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                </div>
                <span className="font-[family-name:var(--font-display)] text-sm font-semibold">Governance Copilot™</span>
              </div>
              <Link href="/trust-intelligence/executive"
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Ask Copilot <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {topRecommendations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400/60" />
                <p className="text-sm font-semibold text-emerald-400">All vendors healthy</p>
                <p className="text-xs text-[var(--color-ink-faint)]">No immediate actions required.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topRecommendations.map((rec, i) => (
                  <Link key={rec.id} href={`/vendors/${rec.id}`}
                    className="flex items-start gap-3 rounded-xl border border-[var(--color-line)] bg-white/[0.03] p-3.5 transition-colors hover:bg-white/[0.06]">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-xs font-bold text-[var(--color-ink-dim)]">
                      {rec.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-semibold text-[var(--color-ink)]">{rec.name}</span>
                        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold", rec.action.accent)}>
                          {rec.action.label}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[10px] text-[var(--color-ink-faint)]">
                        Trust: {rec.score} · {rec.issues.join(" · ") || "Review required"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 4: Vendor Lifecycle ───────────────────────────────────────── */}
      <div>
        <SectionLabel>Vendor Lifecycle</SectionLabel>
        <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">

          {/* Bottleneck callout */}
          {awaitingAssessment > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="text-xs text-amber-300">
                <strong>{awaitingAssessment} vendor{awaitingAssessment > 1 ? "s" : ""}</strong> awaiting assessment — this is your funnel bottleneck.
              </span>
              <Link href="/vendors" className="ml-auto shrink-0 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                Review →
              </Link>
            </div>
          )}

          {/* Funnel steps */}
          <div className="flex items-center gap-0 overflow-x-auto pb-1">
            {[
              { stage: "Catalogued", count: catalogued, pct: funnelPct(catalogued), href: "/vendors",            note: "discover + inventory" },
              { stage: "Assessed",   count: assessed,   pct: funnelPct(assessed),   href: "/vendors",            note: "classify + assess + risk" },
              { stage: "Compliant",  count: compliant,  pct: funnelPct(compliant),  href: "/compliance",         note: "comply stage" },
              { stage: "Monitored",  count: monitored,  pct: funnelPct(monitored),  href: "/trust-intelligence", note: "monitor stage" },
              { stage: "Audited",    count: audited,    pct: funnelPct(audited),     href: "/audits",             note: "audit + renew" },
            ].map((step, i, arr) => {
              const active = step.count > 0;
              const pctColor = step.pct >= 70 ? "text-emerald-400" : step.pct >= 40 ? "text-amber-400" : "text-red-400";
              return (
                <div key={step.stage} className="flex shrink-0 items-center">
                  <Link href={step.href}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border px-5 py-4 text-center transition-colors hover:bg-white/[0.04] min-w-[100px]",
                      active ? "border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.05]" : "border-[var(--color-line)] opacity-40"
                    )}>
                    <div className={cn("font-[family-name:var(--font-display)] text-2xl font-extrabold",
                      active ? "text-[var(--color-ink)]" : "text-[var(--color-ink-faint)]")}>
                      {step.count}
                    </div>
                    <div className="text-[11px] font-medium text-[var(--color-ink-dim)] whitespace-nowrap">{step.stage}</div>
                    {active && (
                      <div className={cn("text-[10px] font-semibold", pctColor)}>{step.pct}%</div>
                    )}
                  </Link>
                  {i < arr.length - 1 && (
                    <ChevronRight className="mx-1 h-4 w-4 shrink-0 text-[var(--color-ink-faint)]" />
                  )}
                </div>
              );
            })}
            {/* Offboard */}
            <div className="flex shrink-0 items-center">
              <ChevronRight className="mx-1 h-4 w-4 shrink-0 text-[var(--color-ink-faint)]/40" />
              <div className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-5 py-4 text-center min-w-[100px]",
                offboarded > 0 ? "border-[var(--color-line)] opacity-60" : "border-dashed border-[var(--color-line)]/40 opacity-25"
              )}>
                <div className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-[var(--color-ink-faint)]">
                  {offboarded > 0 ? offboarded : "—"}
                </div>
                <div className="text-[11px] font-medium text-[var(--color-ink-faint)] whitespace-nowrap">Offboarded</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 5: Vendors Requiring Attention + Activity ─────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Vendors Requiring Attention */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
              Vendors Requiring Attention
            </div>
            {!empty && (
              <Link href="/vendors" className="flex items-center gap-1 text-xs text-[var(--color-blue)] hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white/[0.01]">
            {vendorsNeedingAction.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400/60" />
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {empty ? "No vendors yet" : "All vendors healthy"}
                </p>
                <p className="text-xs text-[var(--color-ink-dim)]">
                  {empty ? "Add your first vendor to start tracking governance." : "No vendors require immediate attention."}
                </p>
                {empty && (
                  <Link href="/vendors/new" className="mt-1">
                    <Button variant="primary" size="sm"><Plus className="h-4 w-4" /> Add first vendor</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div>
                {/* Table header */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-[var(--color-line)] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
                  <span>Vendor</span>
                  <span className="text-right">Score</span>
                  <span className="w-20 text-right">Action</span>
                </div>
                <div className="divide-y divide-[var(--color-line)]">
                  {vendorsNeedingAction.map((v) => {
                    const issues = vendorIssues(v);
                    const action = vendorAction(v);
                    return (
                      <Link key={v.id} href={`/vendors/${v.id}`}
                        className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[var(--color-ink)]">{v.name}</div>
                          <div className="mt-0.5 truncate text-[10px] text-[var(--color-ink-faint)]">
                            {issues.join(" · ") || v.category || "—"}
                          </div>
                        </div>
                        <div className={cn("text-right text-sm font-bold", scoreColor(v.score))}>{v.score}</div>
                        <div className={cn("w-20 rounded-lg px-2 py-1 text-center text-xs font-semibold", action.accent)}>
                          {action.label}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Governance Activity */}
        <div>
          <SectionLabel>Recent Governance Activity</SectionLabel>
          <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white/[0.01]">
            {activity.length > 0 ? (
              <div className="px-5 py-3">
                <ActivityFeed items={activity} />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Activity className="h-8 w-8 text-[var(--color-ink-faint)]" />
                <p className="text-sm text-[var(--color-ink-dim)]">
                  Governance events will appear here as your team uses AUDT.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 6: Trust Distribution + Upcoming Decisions ───────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Trust Distribution */}
        <div>
          <SectionLabel>Vendor Trust Distribution</SectionLabel>
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
            {metrics.totalVendors === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--color-ink-dim)]">No vendors to display.</p>
            ) : (
              <div className="space-y-3">
                {trustBuckets.map((b) => (
                  <div key={b.label} className="flex items-center gap-3">
                    <span className={cn("w-24 shrink-0 text-xs font-medium", b.text)}>{b.label}</span>
                    <div className="flex-1 h-5 rounded-lg bg-white/[0.04] overflow-hidden">
                      {b.count > 0 && (
                        <div className={cn("h-full rounded-lg", b.color, "transition-all")}
                          style={{ width: `${(b.count / maxBucket) * 100}%` }} />
                      )}
                    </div>
                    <span className="w-6 shrink-0 text-right text-sm font-bold text-[var(--color-ink)]">{b.count}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-ink-faint)]">
              <span>{metrics.totalVendors} vendors total</span>
              <Link href="/trust-intelligence" className="flex items-center gap-1 hover:text-[var(--color-ink)] transition-colors">
                Trust Intelligence™ <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Upcoming Decisions */}
        <div>
          <SectionLabel>Upcoming Decisions</SectionLabel>
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] overflow-hidden">
            {upcomingDecisions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400/60" />
                <p className="text-sm text-[var(--color-ink-dim)]">No upcoming decisions at this time.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-line)]">
                {upcomingDecisions.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--color-ink)]">{d.name}</div>
                      <div className="mt-0.5 text-xs text-[var(--color-ink-faint)]">
                        {d.type}{d.daysLeft ? ` · ${d.daysLeft} days left` : ""}
                      </div>
                    </div>
                    <div className={cn(
                      "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold",
                      d.urgency === "high" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
                    )}>
                      {d.action}
                    </div>
                    {d.id && (
                      <Link href={`/vendors/${d.id}`} className="shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-[var(--color-line)] px-4 py-2.5 flex items-center justify-between">
              <Link href="/operations/command-center" className="flex items-center gap-1 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
                <Sparkles className="h-3.5 w-3.5" /> Full Executive View
              </Link>
              <Link href="/contract-governance/renewals" className="flex items-center gap-1 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
                <FileSignature className="h-3.5 w-3.5" /> Contract Renewals
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
