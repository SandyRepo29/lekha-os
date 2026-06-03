export const dynamic = "force-dynamic";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listGaps, getGapSummary } from "@/lib/services/compliance/gap-service";
import { listFrameworks } from "@/lib/services/compliance/framework-service";
import { GapSeverityBadge } from "@/components/compliance/compliance-badges";
import { ResolveGapButton } from "@/components/compliance/resolve-gap-button";
import { RunGapAnalysisButton } from "@/components/compliance/framework-actions";
import { ComplianceStat, FilterChip } from "@/components/compliance/compliance-ui";

const GAP_TYPE_LABELS: Record<string, string> = {
  not_implemented:     "Not Implemented",
  unmapped_control:    "Unmapped Control",
  missing_evidence:    "Missing Evidence",
  expired_evidence:    "Expired Evidence",
  expired_policy:      "Expired Policy",
  incomplete_coverage: "Incomplete Coverage",
};

export default async function GapsPage({
  searchParams,
}: {
  searchParams: Promise<{ framework?: string; severity?: string; type?: string }>;
}) {
  const session = await requireUser();
  const { framework: fwFilter, severity: sevFilter, type: typeFilter } = await searchParams;

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={AlertTriangle}
          title="Gap analysis"
          description="Connect Supabase to view compliance gaps."
        />
      </Card>
    );
  }

  const [frameworks, allGaps, summary] = await Promise.all([
    listFrameworks(session.org.id),
    listGaps(session.org.id, fwFilter || undefined, false),
    getGapSummary(session.org.id, fwFilter || undefined),
  ]);

  // Apply severity/type filters (URL-driven, server-side)
  const gaps = allGaps.filter((g) => {
    if (sevFilter && g.severity !== sevFilter) return false;
    if (typeFilter && g.gapType !== typeFilter) return false;
    return true;
  });

  const fwMap      = new Map(frameworks.map((f) => [f.id, f.name]));
  const typeBreakdown = Object.entries(summary.byType).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Gap Analysis
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            {summary.total} open gap{summary.total !== 1 ? "s" : ""}
            {fwFilter && frameworks.find((f) => f.id === fwFilter)
              ? ` in ${frameworks.find((f) => f.id === fwFilter)?.name}`
              : " across all frameworks"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {frameworks.slice(0, 3).map((fw) => (
            <RunGapAnalysisButton key={fw.id} frameworkId={fw.id} />
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <ComplianceStat label="Total"    value={summary.total} />
        <ComplianceStat label="Critical" value={summary.critical} color="text-red-400"   accent={summary.critical > 0 ? "danger" : undefined} />
        <ComplianceStat label="High"     value={summary.high}     color="text-red-300"   accent={summary.high > 0 ? "danger" : undefined} />
        <ComplianceStat label="Medium"   value={summary.medium}   color="text-amber-400" accent={summary.medium > 0 ? "warn" : undefined} />
        <ComplianceStat label="Low"      value={summary.low}      color="text-[var(--color-ink-dim)]" />
      </div>

      {/* Gap type chips */}
      {typeBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {typeBreakdown.map(([type, count]) => (
            <FilterChip
              key={type}
              href={
                typeFilter === type
                  ? fwFilter ? `?framework=${fwFilter}` : "/compliance/gaps"
                  : `?${fwFilter ? `framework=${fwFilter}&` : ""}type=${type}`
              }
              label={`${GAP_TYPE_LABELS[type] ?? type} (${count})`}
              active={typeFilter === type}
            />
          ))}
        </div>
      )}

      {/* Framework filter */}
      {frameworks.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <FilterChip href="/compliance/gaps" label="All frameworks" active={!fwFilter} />
          {frameworks.map((fw) => (
            <FilterChip
              key={fw.id}
              href={`?framework=${fw.id}`}
              label={fw.name}
              active={fwFilter === fw.id}
            />
          ))}
        </div>
      )}

      {/* Severity filter */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          href={fwFilter ? `?framework=${fwFilter}` : "/compliance/gaps"}
          label="All severity"
          active={!sevFilter}
        />
        {["critical", "high", "medium", "low"].map((sev) => (
          <FilterChip
            key={sev}
            href={`?${fwFilter ? `framework=${fwFilter}&` : ""}severity=${sev}`}
            label={sev.charAt(0).toUpperCase() + sev.slice(1)}
            active={sevFilter === sev}
          />
        ))}
      </div>

      {/* Gap list */}
      {gaps.length === 0 ? (
        <Card>
          <EmptyState
            icon={summary.total === 0 ? CheckCircle2 : AlertTriangle}
            title={summary.total === 0 ? "No open gaps" : "No gaps match these filters"}
            description={
              summary.total === 0
                ? "All controls are implemented and evidenced. Run gap analysis on a framework to refresh."
                : "Try clearing the filters above."
            }
          />
        </Card>
      ) : (
        <Card>
          {groupByFramework(gaps, fwMap).map(({ frameworkId, frameworkName, items }) => (
            <div key={frameworkId}>
              <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-white/[0.01] px-5 py-3">
                <Link
                  href={`/compliance/frameworks/${frameworkId}`}
                  className="font-[family-name:var(--font-display)] text-sm font-semibold transition-colors hover:text-[var(--color-blue)]"
                >
                  {frameworkName}
                </Link>
                <span className="text-xs text-[var(--color-ink-faint)]">
                  {items.length} gap{items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y divide-[var(--color-line)]">
                {items.map((gap) => (
                  <div key={gap.id} className="flex items-start gap-3 px-5 py-3.5">
                    <GapSeverityBadge severity={gap.severity} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm text-[var(--color-ink)]">{gap.description}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[var(--color-line)] bg-white/[0.03] px-2 py-0.5 text-[10px] text-[var(--color-ink-faint)]">
                          {GAP_TYPE_LABELS[gap.gapType] ?? gap.gapType}
                        </span>
                        {gap.isAiDetected && (
                          <span className="rounded-full border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10 px-2 py-0.5 text-[10px] text-[var(--color-blue)]">
                            AI detected
                          </span>
                        )}
                      </div>
                    </div>
                    <ResolveGapButton gapId={gap.id} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Refresh hint */}
      {frameworks.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <div className="flex items-start gap-3">
            <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-sm text-[var(--color-ink-dim)]">
              <span className="font-medium text-[var(--color-ink)]">Gaps are not live. </span>
              Run gap analysis from a framework page to refresh. Resolved gaps are preserved;
              new gaps are added each run.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

type GapRow = Awaited<ReturnType<typeof listGaps>>[number];

function groupByFramework(
  gaps: GapRow[],
  fwMap: Map<string, string>
): { frameworkId: string; frameworkName: string; items: GapRow[] }[] {
  const map = new Map<string, GapRow[]>();
  for (const gap of gaps) {
    const arr = map.get(gap.frameworkId) ?? [];
    arr.push(gap);
    map.set(gap.frameworkId, arr);
  }
  return [...map.entries()].map(([frameworkId, items]) => ({
    frameworkId,
    frameworkName: fwMap.get(frameworkId) ?? "Unknown framework",
    items,
  }));
}
