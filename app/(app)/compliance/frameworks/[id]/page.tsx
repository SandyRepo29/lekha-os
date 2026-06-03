export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, FileSearch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreRing } from "@/components/app-shell/score-ring";
import { requireUser } from "@/lib/auth/session";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { getFramework } from "@/lib/services/compliance/framework-service";
import { listControls, getStatusSummary } from "@/lib/services/compliance/control-service";
import { listGaps } from "@/lib/services/compliance/gap-service";
import { getCachedInsight } from "@/lib/services/compliance/ai-compliance-service";
import {
  FrameworkStatusBadge,
  ControlStatusBadge,
  ControlPriorityBadge,
  GapSeverityBadge,
} from "@/components/compliance/compliance-badges";
import {
  DeleteFramework,
  RunGapAnalysisButton,
  ControlStatusSelect,
  DeleteControl,
} from "@/components/compliance/framework-actions";
import {
  FrameworkSummaryPanel,
  ReadinessExplanationPanel,
} from "@/components/compliance/framework-ai-panels";
import { scoreTextColor } from "@/lib/ui/colors";

export default async function FrameworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser();
  if (session.demo || !session.org) notFound();

  const aiEnabled = isGeminiConfigured();

  const [fw, controls, gaps, summary, summaryInsight, readinessInsight] = await Promise.all([
    getFramework(session.org.id, id),
    listControls(session.org.id, id),
    listGaps(session.org.id, id, false),
    getStatusSummary(session.org.id, id),
    getCachedInsight(session.org.id, "framework_summary", id),
    getCachedInsight(session.org.id, "readiness_explanation", id),
  ]);

  if (!fw) notFound();

  const score = fw.readiness?.overallScore ?? 0;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/compliance/frameworks"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Frameworks
      </Link>

      {/* Header */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start gap-5">
          {/* Score ring */}
          <ScoreRing value={score} size={96} />

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                {fw.name}
              </h1>
              {fw.version && (
                <span className="text-sm text-[var(--color-ink-faint)]">v{fw.version}</span>
              )}
              <FrameworkStatusBadge status={fw.status} />
            </div>
            {fw.description && (
              <p className="mt-1 text-sm text-[var(--color-ink-dim)]">{fw.description}</p>
            )}
            {fw.owner && (
              <p className="mt-1 text-xs text-[var(--color-ink-faint)]">Owner: {fw.owner}</p>
            )}

            {/* Readiness breakdown bars */}
            {fw.readiness && (
              <div className="mt-4 space-y-2 max-w-sm">
                <ReadinessBar label="Control coverage" value={fw.readiness.controlCoverage} />
                <ReadinessBar label="Evidence coverage" value={fw.readiness.evidenceCoverage} />
                <ReadinessBar label="Policy coverage" value={fw.readiness.policyCoverage} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <RunGapAnalysisButton frameworkId={id} />
            <Link href={`/compliance/frameworks/${id}/controls/new`}>
              <Button variant="primary" size="sm">
                <Plus className="h-4 w-4" /> Add control
              </Button>
            </Link>
            <DeleteFramework frameworkId={id} frameworkName={fw.name} />
          </div>
        </div>
      </Card>

      {/* Control status summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Implemented" value={summary.implemented} color="text-emerald-400" />
        <MiniStat label="Partial" value={summary.partial} color="text-amber-400" />
        <MiniStat label="Not Implemented" value={summary.notImplemented} color="text-[var(--color-ink-dim)]" />
        <MiniStat label="N/A" value={summary.notApplicable} color="text-[var(--color-ink-faint)]" />
      </div>

      {/* AI insights */}
      <Card className="p-5 space-y-3">
        <FrameworkSummaryPanel
          frameworkId={id}
          content={summaryInsight?.content ?? null}
          generatedAt={summaryInsight?.generatedAt ?? null}
          aiEnabled={aiEnabled}
        />
        <ReadinessExplanationPanel
          frameworkId={id}
          content={readinessInsight?.content ?? null}
          generatedAt={readinessInsight?.generatedAt ?? null}
          aiEnabled={aiEnabled}
        />
      </Card>

      {/* Controls table */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
            Controls
            <span className="ml-2 text-sm font-normal text-[var(--color-ink-faint)]">
              ({controls.length})
            </span>
          </h2>
          <Link href={`/compliance/frameworks/${id}/controls/new`}>
            <Button variant="ghost" size="sm"><Plus className="h-4 w-4" /> Add control</Button>
          </Link>
        </div>

        {controls.length === 0 ? (
          <Card>
            <EmptyState
              icon={FileSearch}
              title="No controls yet"
              description="Add controls manually or run gap analysis once controls are added."
              action={
                <Link href={`/compliance/frameworks/${id}/controls/new`}>
                  <Button variant="primary" size="sm"><Plus className="h-4 w-4" /> Add first control</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-line)] text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-ink-faint)] uppercase tracking-wide w-24">Ref</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-ink-faint)] uppercase tracking-wide">Control</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-ink-faint)] uppercase tracking-wide">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-ink-faint)] uppercase tracking-wide">Priority</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-ink-faint)] uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-ink-faint)] uppercase tracking-wide text-right">Evidence</th>
                    <th className="px-4 py-3 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {controls.map((control) => (
                    <tr
                      key={control.id}
                      className="border-b border-[var(--color-line)] last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[var(--color-ink-dim)]">
                        {control.controlRef}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--color-ink)]">{control.name}</p>
                        {control.description && (
                          <p className="mt-0.5 text-xs text-[var(--color-ink-faint)] line-clamp-1">
                            {control.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                        {control.category ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <ControlPriorityBadge priority={control.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <ControlStatusSelect
                          controlId={control.id}
                          frameworkId={id}
                          currentStatus={control.status}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${control.evidenceCount > 0 ? "text-emerald-400" : "text-[var(--color-ink-faint)]"}`}>
                          {control.evidenceCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DeleteControl controlId={control.id} frameworkId={id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Open gaps */}
      {gaps.length > 0 && (
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold">
            Open Gaps
            <span className="ml-2 text-sm font-normal text-[var(--color-ink-faint)]">({gaps.length})</span>
          </h2>
          <Card>
            <div className="divide-y divide-[var(--color-line)]">
              {gaps.slice(0, 10).map((gap) => (
                <div key={gap.id} className="flex items-start gap-3 px-5 py-3">
                  <GapSeverityBadge severity={gap.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--color-ink)]">{gap.description}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-ink-faint)] capitalize">
                      {gap.gapType.replace(/_/g, " ")}
                      {gap.isAiDetected && " · AI detected"}
                    </p>
                  </div>
                </div>
              ))}
              {gaps.length > 10 && (
                <p className="px-5 py-3 text-xs text-[var(--color-ink-faint)]">
                  +{gaps.length - 10} more gaps · run analysis to refresh
                </p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ReadinessBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 75
      ? "bg-emerald-500"
      : value >= 50
      ? "bg-[var(--color-blue)]"
      : value >= 25
      ? "bg-amber-500"
      : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-xs text-[var(--color-ink-faint)]">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className={`w-10 text-right text-xs font-semibold ${scoreTextColor(value)}`}>{value}%</span>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs text-[var(--color-ink-faint)]">{label}</p>
      <p className={`mt-1 font-[family-name:var(--font-display)] text-2xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}
