export const dynamic = "force-dynamic";

import Link from "next/link";
import { BarChart3, TrendingUp, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getLatestSnapshot } from "@/backend/src/modules/trust-intelligence/trust-intelligence-repo";
import { getPlatformTrustLevel, PLATFORM_TRUST_LEVEL_LABELS, PLATFORM_TRUST_LEVEL_BG, PLATFORM_TRUST_LEVEL_COLORS } from "@/backend/src/modules/trust-score/platform-trust-score";

// Industry baseline trust scores (same pattern as benchmarking module)
const BASELINES: Record<string, { avg: number; top25: number; label: string }> = {
  technology:          { avg: 74, top25: 86, label: "Technology" },
  financial_services:  { avg: 78, top25: 89, label: "Financial Services" },
  healthcare:          { avg: 72, top25: 84, label: "Healthcare" },
  manufacturing:       { avg: 67, top25: 79, label: "Manufacturing" },
  professional_services: { avg: 71, top25: 83, label: "Professional Services" },
};

function percentile(score: number, avg: number): number {
  // Normal distribution approximation
  const z = (score - avg) / 10;
  return Math.min(99, Math.max(1, Math.round(50 + z * 34)));
}

export default async function TrustBenchmarkingPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const snap = await getLatestSnapshot(orgId).catch(() => null);
  const orgScore = snap?.orgTrustScore ?? 80;

  const allIndustryAvg = Math.round(
    Object.values(BASELINES).reduce((s, b) => s + b.avg, 0) / Object.values(BASELINES).length
  );
  const pct = percentile(orgScore, allIndustryAvg);
  const level = getPlatformTrustLevel(orgScore);

  const maturityLabel = orgScore >= 90 ? "Trust Leader" : orgScore >= 75 ? "Advanced" : orgScore >= 60 ? "Developing" : orgScore >= 40 ? "Emerging" : "Reactive";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Trust Benchmarking™</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            Compare your Trust Score™ against industry peers and benchmarks.
          </p>
        </div>
        <Link href="/benchmarking" className="text-xs text-[var(--color-blue)] hover:underline">
          Full Governance Benchmarking™ →
        </Link>
      </div>

      {/* Headline comparison */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 text-center">
          <p className="text-xs text-[var(--color-ink-dim)] mb-2">Your Trust Score™</p>
          <p className={`text-5xl font-bold ${PLATFORM_TRUST_LEVEL_COLORS[level]}`}>{orgScore}</p>
          <span className={`mt-2 inline-block rounded-full border px-3 py-1 text-xs font-semibold ${PLATFORM_TRUST_LEVEL_BG[level]}`}>
            {PLATFORM_TRUST_LEVEL_LABELS[level]}
          </span>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-xs text-[var(--color-ink-dim)] mb-2">Industry Average</p>
          <p className="text-5xl font-bold text-[var(--color-ink)]">{allIndustryAvg}</p>
          <p className={`mt-2 text-sm font-semibold ${orgScore >= allIndustryAvg ? "text-emerald-400" : "text-red-400"}`}>
            {orgScore >= allIndustryAvg ? `+${orgScore - allIndustryAvg} above average` : `${orgScore - allIndustryAvg} below average`}
          </p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-xs text-[var(--color-ink-dim)] mb-2">Percentile Rank</p>
          <p className="text-5xl font-bold text-[var(--color-blue)]">{pct}th</p>
          <p className="mt-2 text-sm text-[var(--color-ink-dim)]">{maturityLabel}</p>
        </Card>
      </div>

      {/* Industry comparison */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[var(--color-blue)]" />
          Industry Comparison
        </h3>
        <div className="space-y-4">
          {Object.entries(BASELINES).map(([key, b]) => {
            const yourPct = percentile(orgScore, b.avg);
            const isAbove = orgScore >= b.avg;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="font-medium">{b.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--color-ink-faint)]">Avg: {b.avg}</span>
                    <span className="text-[var(--color-ink-faint)]">Top 25%: {b.top25}</span>
                    <span className={`font-semibold ${isAbove ? "text-emerald-400" : "text-red-400"}`}>
                      You: {orgScore} ({isAbove ? "+" : ""}{orgScore - b.avg})
                    </span>
                  </div>
                </div>
                <div className="relative h-3 rounded-full bg-[#F8F9FB] overflow-hidden">
                  {/* Industry avg marker */}
                  <div className="absolute top-0 h-full w-0.5 bg-white/20" style={{ left: `${b.avg}%` }} />
                  {/* Top 25% marker */}
                  <div className="absolute top-0 h-full w-0.5 bg-indigo-400/40" style={{ left: `${b.top25}%` }} />
                  {/* Your score */}
                  <div
                    className={`h-full rounded-full ${isAbove ? "bg-emerald-500" : "bg-red-500"}`}
                    style={{ width: `${orgScore}%` }}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-4 pt-1 text-[11px] text-[var(--color-ink-faint)]">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-0.5 bg-white/20" /> Industry avg</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-0.5 bg-indigo-400/40" /> Top 25%</span>
          </div>
        </div>
      </Card>

      {/* Maturity levels */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-400" />
          Trust Maturity Model™
        </h3>
        <div className="space-y-2">
          {[
            { label: "Trust Leader",  range: "90–100", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Advanced",      range: "75–89",  color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20" },
            { label: "Developing",    range: "60–74",  color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
            { label: "Emerging",      range: "40–59",  color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20" },
            { label: "Reactive",      range: "0–39",   color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
          ].map((m) => {
            const isActive = m.label === maturityLabel;
            return (
              <div key={m.label} className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${isActive ? m.bg + " " + m.color : "border-[var(--color-line)] text-[var(--color-ink-dim)]"}`}>
                <span className={`text-sm font-medium ${isActive ? "font-bold" : ""}`}>{m.label} {isActive && "← You"}</span>
                <span className="text-xs tabular-nums">{m.range}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Board reporting summary */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-400" />
          Board Reporting Summary
        </h3>
        <div className="rounded-xl bg-indigo-500/[0.04] border border-indigo-500/20 p-4">
          <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">
            Your organization has a Trust Score™ of <strong className={PLATFORM_TRUST_LEVEL_COLORS[level]}>{orgScore} ({PLATFORM_TRUST_LEVEL_LABELS[level]})</strong>,
            placing you in the <strong>{pct}th percentile</strong> across all industries with an average of {allIndustryAvg}.
            Your governance maturity is classified as <strong>{maturityLabel}</strong>.
          </p>
        </div>
        <div className="mt-3 text-right">
          <Link href="/executive-reporting/board-reports" className="text-xs text-[var(--color-blue)] hover:underline">
            Generate Board Report →
          </Link>
        </div>
      </Card>
    </div>
  );
}
