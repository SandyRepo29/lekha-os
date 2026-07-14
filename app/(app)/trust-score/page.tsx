export const dynamic = "force-dynamic";

import Link from "next/link";
import { Bot, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getOrgTrustMetrics } from "@/backend/src/modules/trust-score/trust-score-repo";
import { getSnapshotHistory, getLatestSnapshot, getComplianceMetrics, getControlMetrics, getRiskMetrics } from "@/backend/src/modules/trust-intelligence/trust-intelligence-repo";
import * as findingRepo from "@/backend/src/modules/audit-management/audit-finding-repo";
import {
  computePlatformTrustScore,
  findingsToScore,
  riskMetricsToScore,
  getPlatformTrustLevel,
  PLATFORM_TRUST_LABELS,
  PLATFORM_TRUST_WEIGHTS,
  PLATFORM_TRUST_LEVEL_LABELS,
  PLATFORM_TRUST_LEVEL_BG,
  PLATFORM_TRUST_SCORE_BAR,
  PLATFORM_TRUST_LEVEL_COLORS,
} from "@/backend/src/modules/trust-score/platform-trust-score";

function scoreBar(s: number) {
  const lvl = getPlatformTrustLevel(s);
  return PLATFORM_TRUST_SCORE_BAR[lvl];
}
function scoreColor(s: number) {
  const lvl = getPlatformTrustLevel(s);
  return PLATFORM_TRUST_LEVEL_COLORS[lvl];
}

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const TRUST_EVENTS = [
  { label: "Vendor Assessment Missing",  delta: -4,  color: "text-red-400" },
  { label: "Evidence Expired",           delta: -3,  color: "text-red-400" },
  { label: "Critical Finding Opened",    delta: -6,  color: "text-red-400" },
  { label: "Audit Passed",               delta: +10, color: "text-emerald-400" },
  { label: "Control Implemented",        delta: +2,  color: "text-emerald-400" },
  { label: "Policy Approved",            delta: +1,  color: "text-emerald-400" },
];

export default async function TrustScoreOverviewPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const [vendorM, snapshots, latestSnap, complianceM, controlM, riskM, findingSev] = await Promise.all([
    getOrgTrustMetrics(orgId).catch(() => null),
    getSnapshotHistory(orgId, 180).catch(() => []),
    getLatestSnapshot(orgId).catch(() => null),
    getComplianceMetrics(orgId).catch(() => null),
    getControlMetrics(orgId).catch(() => null),
    getRiskMetrics(orgId).catch(() => null),
    findingRepo.countBySeverity(orgId).catch(() => ({ critical: 0, high: 0, medium: 0, low: 0 })),
  ]);

  // ── Build inputs ─────────────────────────────────────────────────────────────
  const vendorHealth     = vendorM?.avgScore ?? latestSnap?.vendorTrustScore ?? 72;
  const complianceHealth = complianceM?.avgReadiness ?? latestSnap?.avgFrameworkReadiness ?? 75;
  const controlHealth    = controlM?.avgHealth ?? latestSnap?.avgControlHealth ?? 74;
  const riskPosture      = riskM
    ? riskMetricsToScore({ total: riskM.total, critical: riskM.criticalCount, open: riskM.activeCount, mitigating: 0 })
    : (latestSnap?.riskPostureScore ?? 78);
  const auditReadiness   = latestSnap?.auditReadinessScore ?? 80;
  const policyHealth     = 80; // no direct policy health API — use neutral default
  const evidenceHealth   = complianceM?.avgReadiness ?? 73;
  const openFindings     = findingsToScore(findingSev as { critical: number; high: number; medium: number; low: number });

  const breakdown = computePlatformTrustScore({
    vendorHealth, complianceHealth, riskPosture, controlHealth,
    auditReadiness, policyHealth, evidenceHealth, openFindings,
  });

  const score = breakdown.score;
  const level = breakdown.level;
  const levelLabel = PLATFORM_TRUST_LEVEL_LABELS[level];
  const levelBg = PLATFORM_TRUST_LEVEL_BG[level];

  // ── Trend data ───────────────────────────────────────────────────────────────
  const trend30  = snapshots.length >= 2 ? score - (snapshots[Math.max(0, snapshots.length - 30)]?.orgTrustScore ?? score) : 0;
  const trend90  = snapshots.length > 0  ? score - (snapshots[0]?.orgTrustScore ?? score) : 0;

  // Group snapshots by month for sparkline
  const monthlyMap = new Map<string, number[]>();
  snapshots.forEach((s) => {
    const month = (s.snapshotDate as string).slice(0, 7);
    if (!monthlyMap.has(month)) monthlyMap.set(month, []);
    monthlyMap.get(month)!.push(s.orgTrustScore ?? score);
  });
  const monthly = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, scores]) => ({
      label: new Date(month + "-01").toLocaleDateString("en-GB", { month: "short" }),
      score: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    }));

  // If no history, show mock upward trend
  const displayMonthly = monthly.length >= 2 ? monthly : [
    { label: "Jan", score: Math.max(40, score - 14) },
    { label: "Feb", score: Math.max(40, score - 10) },
    { label: "Mar", score: Math.max(40, score - 6) },
    { label: "Apr", score: Math.max(40, score - 3) },
    { label: "May", score: Math.max(40, score - 1) },
    { label: "Jun", score },
  ];

  const components = breakdown.components;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Trust Score™
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Universal organizational trust — continuously measured across every governance signal.
          </p>
        </div>
        <Link
          href="/trust-score/ai"
          className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
        >
          <Bot className="h-4 w-4" /> Trust Copilot™
        </Link>
      </div>

      {/* Row 1: Trust Score Ring + Trend + Health */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Primary: Trust Score™ */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-6 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-dim)] mb-3">
            Trust Score™
          </p>
          <div className="relative mb-3">
            <svg viewBox="0 0 120 120" className="w-32 h-32">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(30,41,59,0.12)" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={level === "trusted" ? "#10b981" : level === "healthy" ? "#3b82f6" : level === "needs_attention" ? "#f59e0b" : level === "at_risk" ? "#f97316" : "#ef4444"}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 327} 327`}
                transform="rotate(-90 60 60)"
              />
              <text x="60" y="56" textAnchor="middle" className="fill-current" style={{ fontSize: 28, fontWeight: 700, fill: "currentColor" }}>{score}</text>
              <text x="60" y="72" textAnchor="middle" style={{ fontSize: 11, fill: "#94A3B8" }}>/100</text>
            </svg>
          </div>
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${levelBg}`}>{levelLabel}</span>
          <div className="mt-4 grid grid-cols-2 gap-3 w-full text-center text-xs">
            <div className="rounded-xl bg-[#F8F9FB] p-2">
              <p className={`text-base font-bold ${trend30 >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {trend30 > 0 ? "+" : ""}{trend30}
              </p>
              <p className="text-[var(--color-ink-faint)]">30d Change</p>
            </div>
            <div className="rounded-xl bg-[#F8F9FB] p-2">
              <p className={`text-base font-bold ${trend90 >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {trend90 > 0 ? "+" : ""}{trend90}
              </p>
              <p className="text-[var(--color-ink-faint)]">90d Change</p>
            </div>
          </div>
        </div>

        {/* Trust Trend™ sparkline */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[var(--color-blue)]" />
              Trust Trend™
            </h3>
            <Link href="/trust-score/trends" className="text-xs text-[var(--color-blue)] hover:underline">Full History →</Link>
          </div>
          <div className="flex items-end gap-2 h-28">
            {displayMonthly.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className={`text-[10px] font-semibold ${scoreColor(m.score)}`}>{m.score}</span>
                <div className="w-full rounded-t overflow-hidden" style={{ height: `${Math.max(8, m.score)}%` }}>
                  <div className={`w-full h-full ${scoreBar(m.score)}`} />
                </div>
                <span className="text-[10px] text-[var(--color-ink-faint)]">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--color-line)] flex items-center justify-between text-xs">
            <span className="text-[var(--color-ink-dim)]">Purpose: show trust improvement over time</span>
            {trend90 > 0 && (
              <span className="text-emerald-400 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Improving
              </span>
            )}
          </div>
        </div>

        {/* Trust Health Widget */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <h3 className="text-sm font-semibold mb-4">Trust Health</h3>
          <div className="space-y-2">
            {(["trusted","healthy","needs_attention","at_risk","critical"] as const).map((lvl) => {
              const labels = { trusted:"Trusted", healthy:"Healthy", needs_attention:"Needs Attention", at_risk:"At Risk", critical:"Critical" };
              const ranges = { trusted:"90–100", healthy:"75–89", needs_attention:"60–74", at_risk:"40–59", critical:"0–39" };
              const isActive = lvl === level;
              return (
                <div key={lvl} className={`flex items-center justify-between rounded-xl px-3 py-2 transition-colors ${isActive ? `${PLATFORM_TRUST_LEVEL_BG[lvl]} border font-semibold` : "bg-white"}`}>
                  <span className={`text-xs ${isActive ? "" : "text-[var(--color-ink-dim)]"}`}>{labels[lvl]}</span>
                  <span className={`text-xs tabular-nums ${isActive ? "" : "text-[var(--color-ink-faint)]"}`}>{ranges[lvl]}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--color-line)] text-center">
            <p className={`text-2xl font-bold ${scoreColor(score)}`}>{levelLabel}</p>
            {trend90 !== 0 && (
              <p className={`text-xs mt-1 ${trend90 > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {trend90 > 0 ? "+" : ""}{trend90} this quarter
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Factor Breakdown + Trust Events */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Trust Factor Breakdown */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Trust Factor Breakdown</h3>
            <Link href="/trust-score/factors" className="text-xs text-[var(--color-blue)] hover:underline">Details →</Link>
          </div>
          <div className="space-y-3">
            {(Object.keys(PLATFORM_TRUST_LABELS) as Array<keyof typeof PLATFORM_TRUST_LABELS>).map((key) => {
              const val = components[key];
              const weight = Math.round(PLATFORM_TRUST_WEIGHTS[key] * 100);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="text-[var(--color-ink-dim)]">
                      {PLATFORM_TRUST_LABELS[key]}
                      <span className="ml-1 text-[var(--color-ink-faint)]">({weight}%)</span>
                    </span>
                    <span className={`font-semibold ${scoreColor(val)}`}>{val}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F8F9FB] overflow-hidden">
                    <div className={`h-full rounded-full ${scoreBar(val)}`} style={{ width: `${val}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust Events™ + Trust Impact™ */}
        <div className="space-y-4">

          {/* Trust Events™ */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Trust Events™</h3>
              <Link href="/trust-score/trends" className="text-xs text-[var(--color-blue)] hover:underline">Timeline →</Link>
            </div>
            <div className="space-y-2">
              {TRUST_EVENTS.map((e) => (
                <div key={e.label} className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                  <span className="text-xs text-[var(--color-ink-dim)]">{e.label}</span>
                  <span className={`text-xs font-bold ${e.color}`}>
                    Trust {e.delta > 0 ? `+${e.delta}` : e.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Concerns */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
            <h3 className="text-sm font-semibold mb-3">Trust Drivers</h3>
            {breakdown.strengths.length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] font-medium text-emerald-400 mb-1.5">Strengths</p>
                {breakdown.strengths.map((s) => (
                  <div key={s} className="flex items-center gap-2 py-0.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="text-xs text-[var(--color-ink-dim)]">{s}</span>
                  </div>
                ))}
              </div>
            )}
            {breakdown.concerns.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-amber-400 mb-1.5">Concerns</p>
                {breakdown.concerns.map((c) => (
                  <div key={c} className="flex items-center gap-2 py-0.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="text-xs text-[var(--color-ink-dim)]">{c}</span>
                  </div>
                ))}
              </div>
            )}
            {breakdown.strengths.length === 0 && breakdown.concerns.length === 0 && (
              <p className="text-xs text-[var(--color-ink-faint)]">Run governance checks to surface trust drivers.</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Trust Timeline + Forecast */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Trust Timeline™ */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Trust Timeline™</h3>
            <Link href="/trust-score/trends" className="text-xs text-[var(--color-blue)] hover:underline">All →</Link>
          </div>
          {snapshots.length > 0 ? (
            <div className="space-y-2">
              {[...snapshots].reverse().slice(0, 8).map((s, i) => {
                const prev = [...snapshots].reverse()[i + 1];
                const delta = prev ? (s.orgTrustScore ?? score) - (prev.orgTrustScore ?? score) : 0;
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="w-20 text-[11px] text-[var(--color-ink-faint)] shrink-0">{fmtDate(s.snapshotDate)}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[#F8F9FB] overflow-hidden">
                      <div className={`h-full rounded-full ${scoreBar(s.orgTrustScore ?? score)}`} style={{ width: `${s.orgTrustScore ?? score}%` }} />
                    </div>
                    <span className={`w-8 text-right text-xs font-bold ${scoreColor(s.orgTrustScore ?? score)}`}>{s.orgTrustScore ?? score}</span>
                    <span className={`w-8 text-right text-[11px] font-medium ${delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-[var(--color-ink-faint)]"}`}>
                      {delta !== 0 ? (delta > 0 ? `+${delta}` : delta) : <Minus className="h-3 w-3 inline" />}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { label: "Jun 21", score, event: "Current", delta: 0 },
                { label: "Jun 17", score: score - 2, event: "Vendor Assessment", delta: 2 },
                { label: "Jun 14", score: score - 5, event: "Evidence Expired", delta: -3 },
                { label: "Jun 1",  score: score - 14, event: "SOC2 Audit Passed", delta: 9 },
              ].map((e) => (
                <div key={e.label} className="flex items-center gap-3">
                  <span className="w-20 text-[11px] text-[var(--color-ink-faint)] shrink-0">{e.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#F8F9FB] overflow-hidden">
                    <div className={`h-full rounded-full ${scoreBar(e.score)}`} style={{ width: `${e.score}%` }} />
                  </div>
                  <span className={`w-8 text-right text-xs font-bold ${scoreColor(e.score)}`}>{e.score}</span>
                  <span className={`w-8 text-right text-[11px] font-medium ${e.delta > 0 ? "text-emerald-400" : e.delta < 0 ? "text-red-400" : "text-[var(--color-ink-faint)]"}`}>
                    {e.delta !== 0 ? (e.delta > 0 ? `+${e.delta}` : e.delta) : <Minus className="h-3 w-3 inline" />}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trust Forecast™ */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Trust Forecast™
            </h3>
            <Link href="/trust-score/insights" className="text-xs text-[var(--color-blue)] hover:underline">Insights →</Link>
          </div>
          {/* Simple linear forecast from 90d trend */}
          {(() => {
            const ratePerMonth = trend90 / 3;
            const f30  = Math.min(100, Math.max(0, Math.round(score + ratePerMonth)));
            const f90  = Math.min(100, Math.max(0, Math.round(score + ratePerMonth * 3)));
            const openCount = (findingSev.critical ?? 0) + (findingSev.high ?? 0);
            return (
              <>
                <div className="space-y-4">
                  {[
                    { label: "Current",  val: score, sub: "Today" },
                    { label: "30 Days",  val: f30,   sub: "Projected" },
                    { label: "90 Days",  val: f90,   sub: "Projected" },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-4">
                      <div className="w-20 text-xs text-[var(--color-ink-dim)]">{f.label}</div>
                      <div className="flex-1 h-2 rounded-full bg-[#F8F9FB] overflow-hidden">
                        <div className={`h-full rounded-full ${scoreBar(f.val)}`} style={{ width: `${f.val}%` }} />
                      </div>
                      <span className={`w-10 text-right text-sm font-bold ${scoreColor(f.val)}`}>{f.val}</span>
                    </div>
                  ))}
                </div>
                {openCount > 0 && (
                  <div className="mt-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 p-3 text-xs text-amber-400 space-y-1">
                    <p className="font-semibold">Forecast risks:</p>
                    {(findingSev.critical ?? 0) > 0 && <p>· {findingSev.critical} critical finding{(findingSev.critical ?? 0) > 1 ? "s" : ""} unresolved</p>}
                    {(findingSev.high ?? 0) > 0 && <p>· {findingSev.high} high severity finding{(findingSev.high ?? 0) > 1 ? "s" : ""}</p>}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
