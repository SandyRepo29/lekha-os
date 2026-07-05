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
import { ComplianceStat, CoverageBar } from "@/components/compliance/compliance-ui";

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
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] transition-colors hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" /> Frameworks
      </Link>

      {/* Header card */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start gap-5">
          <ScoreRing value={score} size={96} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
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

            {fw.readiness && (
              <div className="mt-4 max-w-sm space-y-2">
                <CoverageBar label="Control coverage"  value={fw.readiness.controlCoverage} />
                <CoverageBar label="Evidence coverage" value={fw.readiness.evidenceCoverage} />
                <CoverageBar label="Policy coverage"   value={fw.readiness.policyCoverage} />
              </div>
            )}
          </div>

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

      {/* Control status summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ComplianceStat label="Implemented"     value={summary.implemented}   color="text-emerald-700" />
        <ComplianceStat label="Partial"         value={summary.partial}       color="text-amber-700" />
        <ComplianceStat label="Not Implemented" value={summary.notImplemented} />
        <ComplianceStat label="N/A"             value={summary.notApplicable} color="text-[var(--color-ink-faint)]" />
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
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" /> Add control
            </Button>
          </Link>
        </div>

        {controls.length === 0 ? (
          <Card>
            <EmptyState
              icon={FileSearch}
              title="No controls yet"
              description="Add controls manually or seed from a built-in template."
              action={
                <Link href={`/compliance/frameworks/${id}/controls/new`}>
                  <Button variant="primary" size="sm">
                    <Plus className="h-4 w-4" /> Add first control
                  </Button>
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
                    <Th className="w-24">Ref</Th>
                    <Th>Control</Th>
                    <Th>Category</Th>
                    <Th>Priority</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Evidence</Th>
                    <th className="w-8 px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {controls.map((control) => (
                    <tr
                      key={control.id}
                      className="border-b border-[var(--color-line)] transition-colors last:border-0 hover:bg-white"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-[var(--color-ink-dim)]">
                        {control.controlRef}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-[var(--color-ink)]">{control.name}</p>
                        {control.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-ink-faint)]">
                            {control.description}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-[var(--color-ink-dim)]">
                        {control.category ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <ControlPriorityBadge priority={control.priority} />
                      </td>
                      <td className="px-5 py-3">
                        <ControlStatusSelect
                          controlId={control.id}
                          frameworkId={id}
                          currentStatus={control.status}
                        />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`text-sm font-medium ${
                            control.evidenceCount > 0
                              ? "text-emerald-700"
                              : "text-[var(--color-ink-faint)]"
                          }`}
                        >
                          {control.evidenceCount}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
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
            <span className="ml-2 text-sm font-normal text-[var(--color-ink-faint)]">
              ({gaps.length})
            </span>
          </h2>
          <Card>
            <div className="divide-y divide-[var(--color-line)]">
              {gaps.slice(0, 10).map((gap) => (
                <div key={gap.id} className="flex items-start gap-3 px-5 py-3.5">
                  <GapSeverityBadge severity={gap.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--color-ink)]">{gap.description}</p>
                    <p className="mt-0.5 text-xs capitalize text-[var(--color-ink-faint)]">
                      {gap.gapType.replace(/_/g, " ")}
                      {gap.isAiDetected && " · AI detected"}
                    </p>
                  </div>
                </div>
              ))}
              {gaps.length > 10 && (
                <p className="px-5 py-3 text-xs text-[var(--color-ink-faint)]">
                  +{gaps.length - 10} more gaps — view all on the{" "}
                  <Link href="/compliance/gaps" className="text-[var(--color-blue)] hover:underline">
                    Gaps page
                  </Link>
                </p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)] ${className}`}
    >
      {children}
    </th>
  );
}
