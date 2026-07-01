export const dynamic = "force-dynamic";

export const metadata = { title: 'Trust Intelligence™ — AUDT' };

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getTrustIntelligenceOverview, getGovernanceTimeline } from "@/lib/services/trust-intelligence/trust-intelligence-service";
import { getSnapshotHistory } from "@/lib/repositories/trust-intelligence-repo";
import { OrgTrustScoreRing, OrgTrustBadge } from "@/components/trust-intelligence/org-trust-badge";
import { ComponentBar, TrustStat } from "@/components/trust-intelligence/trust-intelligence-ui";
import { ORG_TRUST_COMPONENT_LABELS, ORG_TRUST_COMPONENT_WEIGHTS } from "@/lib/services/org-trust-score";

export default async function TrustIntelligencePage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={Sparkles}
          title="Trust Intelligence™"
          description="Connect Supabase to unlock Organizational Trust Intelligence."
        />
      </Card>
    );
  }

  const [overview, timeline, snapshots] = await Promise.all([
    getTrustIntelligenceOverview(session.org.id),
    getGovernanceTimeline(session.org.id, 10),
    getSnapshotHistory(session.org.id, 30).catch(() => [] as Awaited<ReturnType<typeof getSnapshotHistory>>),
  ]);

  const { orgTrustScore: score } = overview;

  const components = [
    { key: "vendorTrust"        as const, value: score.vendorTrust },
    { key: "riskPosture"        as const, value: score.riskPosture },
    { key: "controlHealth"      as const, value: score.controlHealth },
    { key: "auditReadiness"     as const, value: score.auditReadiness },
    { key: "complianceCoverage" as const, value: score.complianceCoverage },
  ];

  // ── Trust Explainability™ ────────────────────────────────────────────────
  type ExplainRow = {
    key: typeof components[number]["key"];
    label: string;
    score: number;
    contribution: number;
    baseline: number;
    netImpact: number;
  };

  const explainRows: ExplainRow[] = components.map(({ key, value }) => {
    const weight = ORG_TRUST_COMPONENT_WEIGHTS[key];
    const contribution = Math.round(value * weight);
    const baseline = Math.round(70 * weight);
    const netImpact = contribution - baseline;
    return {
      key,
      label: ORG_TRUST_COMPONENT_LABELS[key],
      score: value,
      contribution,
      baseline,
      netImpact,
    };
  });

  const positiveRows = explainRows.filter((r) => r.netImpact > 0);
  const negativeRows = explainRows.filter((r) => r.netImpact <= 0);
  const positiveSum = positiveRows.reduce((s, r) => s + r.netImpact, 0);
  const negativeSum = negativeRows.reduce((s, r) => s + r.netImpact, 0);

  // ── Trust Change Analysis™ ───────────────────────────────────────────────
  const currentScore = score.overall;
  const oldestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const previousScore: number | null = oldestSnapshot
    ? (typeof (oldestSnapshot as Record<string, unknown>).overallScore === "number"
        ? (oldestSnapshot as Record<string, unknown>).overallScore as number
        : typeof (oldestSnapshot as Record<string, unknown>).overall === "number"
          ? (oldestSnapshot as Record<string, unknown>).overall as number
          : null)
    : null;
  const scoreDelta = previousScore !== null ? currentScore - previousScore : null;

  const rootCauses: string[] =
    score.detractors.length >= 3
      ? score.detractors.slice(0, 3)
      : score.detractors.length > 0
      ? score.detractors
      : [
          "Insufficient vendor trust score data",
          "Open critical risks without treatment plans",
          "Control health below governance threshold",
        ];

  // ── Governance Momentum™ ─────────────────────────────────────────────────
  type MomentumDir = "improving" | "stable" | "declining";
  type MomentumRow = {
    key: typeof components[number]["key"];
    label: string;
    dir: MomentumDir;
    delta: number | null;
  };

  const hasEnoughHistory = snapshots.length >= 2;

  const momentumRows: MomentumRow[] = components.map(({ key, value }) => {
    if (!hasEnoughHistory) {
      return { key, label: ORG_TRUST_COMPONENT_LABELS[key], dir: "stable", delta: null };
    }
    const oldest = snapshots[snapshots.length - 1] as Record<string, unknown>;
    const oldVal =
      typeof oldest[key] === "number"
        ? (oldest[key] as number)
        : null;
    const delta = oldVal !== null ? Math.round(value - oldVal) : null;
    const dir: MomentumDir =
      delta === null
        ? "stable"
        : delta > 2
        ? "improving"
        : delta < -2
        ? "declining"
        : "stable";
    return { key, label: ORG_TRUST_COMPONENT_LABELS[key], dir, delta };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[var(--color-blue)]" />
            Trust Intelligence™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            Organizational governance command center
          </p>
        </div>
        <Link href="/trust-intelligence/executive">
          <Button variant="ghost" size="md">Executive View</Button>
        </Link>
      </div>

      {/* Org Trust Score hero */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 flex flex-col items-center justify-center gap-4 lg:col-span-1">
          <OrgTrustScoreRing score={score.overall} size={140} />
          <div className="text-center">
            <OrgTrustBadge score={score.overall} />
            <p className="mt-2 text-xs text-[var(--color-ink-faint)]">Organizational Trust Score™</p>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2 space-y-4">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Component Breakdown</p>
          <div className="space-y-3">
            {components.map(({ key, value }) => {
              const momentum = momentumRows.find((m) => m.key === key);
              const trendArrow =
                momentum?.dir === "improving" ? (
                  <span className="text-emerald-400 text-xs font-bold" title={`+${momentum.delta} pts`}>↑</span>
                ) : momentum?.dir === "declining" ? (
                  <span className="text-red-400 text-xs font-bold" title={`${momentum.delta} pts`}>↓</span>
                ) : null;
              return (
                <div key={key} className="flex items-center gap-2">
                  <div className="flex-1">
                    <ComponentBar
                      label={ORG_TRUST_COMPONENT_LABELS[key]}
                      score={value}
                      weight={ORG_TRUST_COMPONENT_WEIGHTS[key]}
                    />
                  </div>
                  {trendArrow && <div className="shrink-0 w-4 text-center">{trendArrow}</div>}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Metrics row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <TrustStat label="Vendors" value={overview.vendors.total} sub={`${overview.vendors.scoredCount} scored · avg ${overview.vendors.avgScore}`} accent="neutral" />
        <TrustStat label="Active Risks" value={overview.risks.activeCount} sub={`${overview.risks.criticalCount} critical`} accent={overview.risks.criticalCount > 0 ? "danger" : "warn"} />
        <TrustStat label="Controls" value={overview.controls.totalCount} sub={`${overview.controls.weakCount} weak · avg ${overview.controls.avgHealth}`} accent="neutral" />
        <TrustStat label="Open Findings" value={overview.audits.totalOpenFindings} sub={`${overview.audits.openCriticalFindings} critical`} accent={overview.audits.openCriticalFindings > 0 ? "danger" : "warn"} />
        <TrustStat label="Compliance" value={`${overview.compliance.avgReadiness}%`} sub={`${overview.compliance.frameworkCount} framework${overview.compliance.frameworkCount !== 1 ? "s" : ""}`} accent={overview.compliance.avgReadiness >= 75 ? "good" : overview.compliance.avgReadiness >= 50 ? "warn" : "danger"} />
      </div>

      {/* Drivers & Detractors */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold text-emerald-400 mb-3">Trust Drivers™</p>
          {score.drivers.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-faint)]">No positive drivers detected yet.</p>
          ) : (
            <ul className="space-y-2">
              {score.drivers.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-red-400 mb-3">Trust Detractors™</p>
          {score.detractors.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-faint)]">No detractors detected.</p>
          ) : (
            <ul className="space-y-2">
              {score.detractors.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Trust Explainability™ ─────────────────────────────────────────── */}
      <Card className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)]">Trust Explainability™</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">
            How each component is contributing to or hurting your overall score
          </p>
        </div>

        {/* Positive Contributors */}
        {positiveRows.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Positive Contributors</p>
            <div className="space-y-1">
              {positiveRows.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between rounded-lg bg-emerald-500/5 border border-emerald-500/15 px-3 py-2"
                >
                  <span className="text-sm text-[var(--color-ink)]">{row.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--color-ink-dim)]">{row.score} pts</span>
                    <span className="text-xs text-[var(--color-ink-faint)]">{row.contribution} contributed</span>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-xs font-semibold">
                      +{row.netImpact} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Negative Contributors */}
        {negativeRows.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-red-400 uppercase tracking-wide">Negative Contributors</p>
            <div className="space-y-1">
              {negativeRows.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between rounded-lg bg-red-500/5 border border-red-500/15 px-3 py-2"
                >
                  <span className="text-sm text-[var(--color-ink)]">{row.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--color-ink-dim)]">{row.score} pts</span>
                    <span className="text-xs text-[var(--color-ink-faint)]">{row.contribution} contributed</span>
                    <span className="rounded-full bg-red-500/20 text-red-400 px-2 py-0.5 text-xs font-semibold">
                      {row.netImpact} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="rounded-lg bg-white border border-[var(--color-line)] px-3 py-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-ink-dim)]">
          <span>Score explained:</span>
          <span className="text-emerald-400 font-medium">+{positiveSum} positive</span>
          <span className="text-red-400 font-medium">{negativeSum} negative</span>
          <span className="text-[var(--color-ink)]">
            net {positiveSum + negativeSum >= 0 ? "+" : ""}{positiveSum + negativeSum} vs 70-point baseline
          </span>
        </div>
      </Card>

      {/* ── Trust Change Analysis™ ────────────────────────────────────────── */}
      <Card className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)]">Trust Change Analysis™</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">
            Score movement over the last 30 days
          </p>
        </div>

        {/* Score delta strip */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-[family-name:var(--font-display)] text-[var(--color-ink)]">
              {currentScore}
            </span>
            <span className="text-xs text-[var(--color-ink-faint)]">current</span>
          </div>

          {scoreDelta !== null ? (
            <>
              <div className="flex items-center gap-1">
                {scoreDelta > 0 ? (
                  <span className="text-emerald-400 font-semibold text-lg">↑</span>
                ) : scoreDelta < 0 ? (
                  <span className="text-red-400 font-semibold text-lg">↓</span>
                ) : (
                  <span className="text-[var(--color-ink-faint)] font-semibold text-lg">→</span>
                )}
                <span
                  className={`text-sm font-semibold ${
                    scoreDelta > 0
                      ? "text-emerald-400"
                      : scoreDelta < 0
                      ? "text-red-400"
                      : "text-[var(--color-ink-dim)]"
                  }`}
                >
                  {scoreDelta > 0 ? "+" : ""}{scoreDelta} pts
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-semibold text-[var(--color-ink-dim)]">{previousScore}</span>
                <span className="text-xs text-[var(--color-ink-faint)]">30 days ago</span>
              </div>
            </>
          ) : (
            <span className="text-xs text-[var(--color-ink-faint)]">No previous snapshot — take a snapshot daily to track changes</span>
          )}

          {/* Trend alert chips */}
          {scoreDelta !== null && scoreDelta < -5 && (
            <span className="ml-auto rounded-full bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 text-xs font-semibold">
              Trust is declining — immediate action required
            </span>
          )}
          {scoreDelta !== null && scoreDelta > 3 && (
            <span className="ml-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-semibold">
              Trust is improving
            </span>
          )}
        </div>

        {/* Root cause list */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">Root Cause Analysis</p>
          <ul className="space-y-1.5">
            {rootCauses.map((cause, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                {cause}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "/trust-intelligence/recommendations", label: "View Recommendations" },
          { href: "/trust-intelligence/executive", label: "Executive View" },
          { href: "/trust-intelligence/risks", label: "Risk Insights" },
        ].map(({ href, label }) => (
          <Link key={href} href={href}>
            <Card className="p-4 hover:bg-[#F8F9FB] transition-colors cursor-pointer flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
              <span className="text-[var(--color-blue)] text-sm">→</span>
            </Card>
          </Link>
        ))}
      </div>

      {/* Governance Timeline */}
      <Card className="p-5">
        <p className="text-sm font-semibold mb-4">Governance Timeline</p>
        {timeline.length === 0 ? (
          <p className="text-xs text-[var(--color-ink-faint)]">No governance events yet.</p>
        ) : (
          <div className="space-y-2">
            {timeline.slice(0, 10).map((event) => (
              <div key={event.id} className="flex items-center gap-3 text-xs">
                <span className="text-[var(--color-ink-faint)] w-32 shrink-0">
                  {new Date(event.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[var(--color-ink-dim)] font-mono">
                  {event.action}
                </span>
                {event.actorName && (
                  <span className="text-[var(--color-ink-faint)]">by {event.actorName}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Governance Momentum™ ──────────────────────────────────────────── */}
      <Card className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">Governance Momentum™</p>
            <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">
              Component-level trend direction over the last 30 days
            </p>
          </div>
          {!hasEnoughHistory && (
            <span className="rounded-full bg-[#F8F9FB] border border-[var(--color-line)] text-[var(--color-ink-faint)] px-3 py-1 text-xs">
              Run daily snapshots to track momentum
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {momentumRows.map((row) => (
            <div
              key={row.key}
              className="rounded-xl border border-[var(--color-line)] bg-white p-3 flex items-center justify-between gap-2"
            >
              <span className="text-sm text-[var(--color-ink-dim)] truncate">{row.label}</span>
              <div className="flex items-center gap-2 shrink-0">
                {row.dir === "improving" && (
                  <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold flex items-center gap-1">
                    ↑ Improving
                  </span>
                )}
                {row.dir === "stable" && (
                  <span className="rounded-full bg-[#EEF2F7] text-[var(--color-ink-faint)] border border-[var(--color-line)] px-2 py-0.5 text-xs font-semibold flex items-center gap-1">
                    → Stable
                  </span>
                )}
                {row.dir === "declining" && (
                  <span className="rounded-full bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 text-xs font-semibold flex items-center gap-1">
                    ↓ Declining
                  </span>
                )}
                {row.delta !== null && (
                  <span
                    className={`text-xs font-mono ${
                      row.delta > 0
                        ? "text-emerald-400"
                        : row.delta < 0
                        ? "text-red-400"
                        : "text-[var(--color-ink-faint)]"
                    }`}
                  >
                    {row.delta > 0 ? "+" : ""}{row.delta}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
