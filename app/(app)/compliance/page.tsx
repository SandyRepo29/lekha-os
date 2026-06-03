export const dynamic = "force-dynamic";

import Link from "next/link";
import { ShieldCheck, Plus, AlertTriangle, CheckCircle2, FileSearch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreRing } from "@/components/app-shell/score-ring";
import { requireUser } from "@/lib/auth/session";
import { listFrameworks } from "@/lib/services/compliance/framework-service";
import { getGapSummary } from "@/lib/services/compliance/gap-service";
import { FrameworkStatusBadge } from "@/components/compliance/compliance-badges";
import { scoreTextColor, scoreLabel } from "@/lib/ui/colors";

export default async function ComplianceDashboardPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={ShieldCheck}
          title="Compliance module"
          description="Connect Supabase to start managing compliance frameworks, controls and evidence."
        />
      </Card>
    );
  }

  const [frameworks, gapSummary] = await Promise.all([
    listFrameworks(session.org.id),
    getGapSummary(session.org.id),
  ]);

  const scores = frameworks.map((f) => f.readiness?.overallScore ?? 0);
  const overallScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const totalControls = frameworks.reduce((n, f) => n + f.controlCount, 0);
  const implementedFrameworks = frameworks.filter(
    (f) => f.status === "certified" || f.status === "ready"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Compliance
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            {frameworks.length} framework{frameworks.length !== 1 ? "s" : ""} ·{" "}
            {totalControls} controls tracked
          </p>
        </div>
        <Link href="/compliance/frameworks/new">
          <Button variant="primary" size="md">
            <Plus className="h-4 w-4" /> Add framework
          </Button>
        </Link>
      </div>

      {frameworks.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title="No frameworks yet"
            description="Add your first compliance framework — ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA or custom."
            action={
              <Link href="/compliance/frameworks/new">
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4" /> Add framework
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {/* Top metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex items-center gap-4 p-5">
              <ScoreRing value={overallScore} size={80} />
              <div>
                <p className="text-xs text-[var(--color-ink-faint)]">Overall Readiness</p>
                <p className={`mt-0.5 text-sm font-semibold ${scoreTextColor(overallScore)}`}>
                  {scoreLabel(overallScore)}
                </p>
              </div>
            </Card>

            <StatCard
              icon={<ShieldCheck className="h-5 w-5 text-[var(--color-blue)]" />}
              label="Frameworks"
              value={String(frameworks.length)}
              sub={`${implementedFrameworks} certified / ready`}
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              label="Controls"
              value={String(totalControls)}
              sub="across all frameworks"
            />
            <StatCard
              icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
              label="Open Gaps"
              value={String(gapSummary.total)}
              sub={`${gapSummary.critical} critical · ${gapSummary.high} high`}
              accent={gapSummary.critical > 0 ? "danger" : gapSummary.total > 0 ? "warn" : "good"}
            />
          </div>

          {/* Frameworks grid */}
          <div>
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold">
              Frameworks
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {frameworks.map((fw) => {
                const score = fw.readiness?.overallScore ?? 0;
                return (
                  <Link key={fw.id} href={`/compliance/frameworks/${fw.id}`}>
                    <Card className="cursor-pointer p-5 transition-colors hover:border-[var(--color-line-strong)] hover:bg-white/[0.05]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-[family-name:var(--font-display)] font-semibold text-sm leading-snug">
                              {fw.name}
                            </h3>
                            {fw.version && (
                              <span className="text-xs text-[var(--color-ink-faint)]">v{fw.version}</span>
                            )}
                          </div>
                          <div className="mt-1.5">
                            <FrameworkStatusBadge status={fw.status} />
                          </div>
                        </div>
                        <ScoreRing value={score} size={64} />
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-[var(--color-ink-faint)]">Controls</p>
                          <p className="font-semibold text-sm">{fw.controlCount}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[var(--color-ink-faint)]">Evidence</p>
                          <p className="font-semibold text-sm">
                            {fw.readiness?.evidenceCoverage ?? 0}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[var(--color-ink-faint)]">Gaps</p>
                          <p className={`font-semibold text-sm ${fw.openGapCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                            {fw.openGapCount}
                          </p>
                        </div>
                      </div>

                      {fw.readiness && (
                        <div className="mt-3 space-y-1.5">
                          <CoverageBar label="Controls" value={fw.readiness.controlCoverage} />
                          <CoverageBar label="Evidence" value={fw.readiness.evidenceCoverage} />
                        </div>
                      )}
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Gap summary strip */}
          {gapSummary.total > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileSearch className="h-4 w-4 text-amber-400" />
                <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">
                  Open Gaps
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <GapStat label="Critical" value={gapSummary.critical} color="text-red-400" />
                <GapStat label="High" value={gapSummary.high} color="text-red-300" />
                <GapStat label="Medium" value={gapSummary.medium} color="text-amber-400" />
                <GapStat label="Low" value={gapSummary.low} color="text-[var(--color-ink-dim)]" />
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: "good" | "warn" | "danger";
}) {
  const border =
    accent === "danger"
      ? "border-red-500/25"
      : accent === "warn"
      ? "border-amber-500/25"
      : accent === "good"
      ? "border-emerald-500/25"
      : "border-[var(--color-line)]";
  return (
    <Card className={`p-5 ${border}`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-[var(--color-ink-faint)]">{label}</span></div>
      <p className="font-[family-name:var(--font-display)] text-2xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{sub}</p>}
    </Card>
  );
}

function CoverageBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 75 ? "bg-emerald-500" : value >= 50 ? "bg-[var(--color-blue)]" : value >= 25 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-[10px] text-[var(--color-ink-faint)]">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right text-[10px] text-[var(--color-ink-dim)]">{value}%</span>
    </div>
  );
}

function GapStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-ink-faint)]">{label}</p>
      <p className={`mt-0.5 font-[family-name:var(--font-display)] text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
