export const dynamic = "force-dynamic";

import Link from "next/link";
import { ShieldCheck, Plus, AlertTriangle, CheckCircle2, FileSearch, BookCheck, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreRing } from "@/components/app-shell/score-ring";
import { requireUser } from "@/lib/auth/session";
import { listFrameworks } from "@/lib/services/compliance/framework-service";
import { getGapSummary } from "@/lib/services/compliance/gap-service";
import { FrameworkStatusBadge } from "@/components/compliance/compliance-badges";
import { ComplianceStat, CoverageBar } from "@/components/compliance/compliance-ui";
import { scoreTextColor, scoreLabel } from "@/lib/ui/colors";
import { listEvidence } from "@/lib/services/compliance/evidence-service";

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

  const [frameworks, gapSummary, evidenceItems] = await Promise.all([
    listFrameworks(session.org.id),
    getGapSummary(session.org.id),
    listEvidence(session.org.id, {}),
  ]);

  const scores = frameworks.map((f) => f.readiness?.overallScore ?? 0);
  const overallScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const totalControls = frameworks.reduce((n, f) => n + f.controlCount, 0);
  const implementedFrameworks = frameworks.filter(
    (f) => f.status === "certified" || f.status === "ready"
  ).length;

  // Evidence health metrics
  const totalEvidence    = evidenceItems.length;
  const validEvidence    = evidenceItems.filter((e) => e.status === "approved").length;
  const expiredEvidence  = evidenceItems.filter((e) => e.status === "expired").length;
  const pendingEvidence  = evidenceItems.filter((e) => e.status === "pending_review").length;
  const missingEvidence  = totalControls - Math.min(totalControls, validEvidence);

  // Per-framework audit readiness
  const frameworkReadiness = frameworks.map((fw) => {
    const score = fw.readiness?.overallScore ?? 0;
    const status = score >= 80 ? "Ready" : score >= 50 ? "Needs Review" : "Not Ready";
    const color  = score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
    return { name: fw.name, score, status, color };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Evidence Vault™
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
            title="No compliance frameworks yet"
            description="Start with ISO 27001, SOC 2, DPDP, PCI DSS or HIPAA — or create a custom framework. AUDT ships with 174 pre-built controls ready to map."
            action={
              <div className="flex flex-col items-center gap-2">
                <Link href="/compliance/frameworks/new">
                  <Button variant="primary" size="md">
                    <Plus className="h-4 w-4" /> Add a framework
                  </Button>
                </Link>
                <p className="text-xs text-[var(--color-ink-faint)]">174 pre-built controls · AI gap analysis · PDF reports</p>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          {/* Top metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Overall readiness ring card */}
            <Card className="flex items-center gap-4 p-5">
              <ScoreRing value={overallScore} size={80} />
              <div>
                <p className="text-xs text-[var(--color-ink-faint)]">Overall Readiness</p>
                <p className={`mt-0.5 text-sm font-semibold ${scoreTextColor(overallScore)}`}>
                  {scoreLabel(overallScore)}
                </p>
              </div>
            </Card>

            <Card className="border-l-2 border-l-[var(--color-blue)]/60 p-5">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[var(--color-blue)]" />
                <span className="text-xs text-[var(--color-ink-faint)]">Frameworks</span>
              </div>
              <p className="font-[family-name:var(--font-display)] text-xl font-bold">
                {frameworks.length}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">
                {implementedFrameworks} certified / ready
              </p>
            </Card>

            <Card className="border-l-2 border-l-emerald-500/60 p-5">
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="text-xs text-[var(--color-ink-faint)]">Controls</span>
              </div>
              <p className="font-[family-name:var(--font-display)] text-xl font-bold">
                {totalControls}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">across all frameworks</p>
            </Card>

            <Card
              className={`border-l-2 p-5 ${
                gapSummary.critical > 0
                  ? "border-red-500/25 border-l-red-500/60"
                  : gapSummary.total > 0
                  ? "border-amber-500/25 border-l-amber-500/60"
                  : "border-emerald-500/25 border-l-emerald-500/60"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <span className="text-xs text-[var(--color-ink-faint)]">Open Gaps</span>
              </div>
              <p className="font-[family-name:var(--font-display)] text-xl font-bold">
                {gapSummary.total}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">
                {gapSummary.critical} critical · {gapSummary.high} high
              </p>
            </Card>
          </div>

          {/* Evidence Health Widget + Audit Readiness side-by-side */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Evidence Health Widget */}
            <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-[var(--color-blue)]" />
                <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Evidence Health</h2>
                <Link href="/compliance/evidence" className="ml-auto text-xs text-[var(--color-blue)] hover:underline">View all &rarr;</Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <EvidenceHealthStat label="Valid"           value={validEvidence}   color="text-emerald-400" />
                <EvidenceHealthStat label="Missing"         value={missingEvidence} color="text-red-400" />
                <EvidenceHealthStat label="Expired"         value={expiredEvidence} color="text-amber-400" />
                <EvidenceHealthStat label="Pending Review"  value={pendingEvidence} color="text-[var(--color-blue)]" />
              </div>
              {totalEvidence > 0 && (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-[var(--color-ink-dim)]">
                    <span>Evidence Coverage</span>
                    <span className="font-semibold text-[var(--color-ink)]">
                      {totalControls ? Math.round((validEvidence / totalControls) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${totalControls ? Math.round((validEvidence / totalControls) * 100) : 0}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-ink-faint)]">{totalEvidence} total evidence items</p>
                </div>
              )}
            </div>

            {/* Audit Readiness Widget */}
            <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center gap-2">
                <BookCheck className="h-4 w-4 text-emerald-400" />
                <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Audit Readiness</h2>
              </div>
              {frameworkReadiness.length === 0 ? (
                <p className="text-sm text-[var(--color-ink-dim)]">No frameworks yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {frameworkReadiness.map(({ name, score, status, color }) => (
                    <div key={name} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 flex-1 truncate text-xs text-[var(--color-ink-dim)]">{name}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full bg-[var(--color-blue)]" style={{ width: `${score}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${color}`}>{status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Evidence Intelligence Widget */}
          {totalEvidence > 0 && (
            <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[var(--color-blue)]" />
                <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Evidence Intelligence&#8482;</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <EvidenceHealthStat label="Total Evidence"    value={totalEvidence} color="text-[var(--color-blue)]" />
                <EvidenceHealthStat label="Approved"          value={validEvidence} color="text-emerald-400" />
                <EvidenceHealthStat label="Expired"           value={expiredEvidence} color="text-amber-400" />
                <EvidenceHealthStat label="Controls Covered"  value={`${totalControls ? Math.round((validEvidence / totalControls) * 100) : 0}%`} color="text-emerald-400" />
              </div>
              <div className="mt-3 flex gap-2">
                <Link href="/compliance/evidence" className="text-xs text-[var(--color-blue)] hover:underline">Browse Evidence &rarr;</Link>
                <span className="text-[var(--color-ink-faint)]">&#183;</span>
                <Link href="/compliance/controls" className="text-xs text-[var(--color-blue)] hover:underline">View Controls Coverage &rarr;</Link>
              </div>
            </div>
          )}

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
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold leading-snug">
                              {fw.name}
                            </h3>
                            {fw.version && (
                              <span className="text-xs text-[var(--color-ink-faint)]">
                                v{fw.version}
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5">
                            <FrameworkStatusBadge status={fw.status} />
                          </div>
                        </div>
                        <ScoreRing value={score} size={64} />
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <FrameworkStat label="Controls" value={fw.controlCount} />
                        <FrameworkStat
                          label="Evidence"
                          value={`${fw.readiness?.evidenceCoverage ?? 0}%`}
                        />
                        <FrameworkStat
                          label="Gaps"
                          value={fw.openGapCount}
                          color={fw.openGapCount > 0 ? "text-amber-400" : "text-emerald-400"}
                        />
                      </div>

                      {fw.readiness && (
                        <div className="mt-3 space-y-1.5">
                          <CoverageBar
                            label="Controls"
                            value={fw.readiness.controlCoverage}
                            labelWidth="w-14"
                          />
                          <CoverageBar
                            label="Evidence"
                            value={fw.readiness.evidenceCoverage}
                            labelWidth="w-14"
                          />
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
              <div className="mb-3 flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-amber-400" />
                <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">
                  Open Gaps
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <GapCount label="Critical" value={gapSummary.critical} color="text-red-400" />
                <GapCount label="High"     value={gapSummary.high}     color="text-red-300" />
                <GapCount label="Medium"   value={gapSummary.medium}   color="text-amber-400" />
                <GapCount label="Low"      value={gapSummary.low}      color="text-[var(--color-ink-dim)]" />
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* Small helpers — too specific to the dashboard to extract globally. */

function FrameworkStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div>
      <p className="text-[10px] text-[var(--color-ink-faint)]">{label}</p>
      <p className={`text-sm font-semibold ${color ?? ""}`}>{value}</p>
    </div>
  );
}

function GapCount({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <p className="text-xs text-[var(--color-ink-faint)]">{label}</p>
      <p className={`mt-0.5 font-[family-name:var(--font-display)] text-xl font-bold ${color}`}>
        {value}
      </p>
    </div>
  );
}

function EvidenceHealthStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div>
      <p className="text-[10px] text-[var(--color-ink-faint)]">{label}</p>
      <p className={`mt-0.5 font-[family-name:var(--font-display)] text-xl font-bold ${color}`}>
        {value}
      </p>
    </div>
  );
}
