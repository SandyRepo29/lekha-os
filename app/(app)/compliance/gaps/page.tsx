export const dynamic = "force-dynamic";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listGaps, getGapSummary } from "@/lib/services/compliance/gap-service";
import { listFrameworks } from "@/lib/services/compliance/framework-service";
import { GapSeverityBadge } from "@/components/compliance/compliance-badges";
import { ResolveGapButton } from "@/components/compliance/resolve-gap-button";
import { RunGapAnalysisButton } from "@/components/compliance/framework-actions";

const GAP_TYPE_LABELS: Record<string, string> = {
  not_implemented:  "Not Implemented",
  unmapped_control: "Unmapped Control",
  missing_evidence: "Missing Evidence",
  expired_evidence: "Expired Evidence",
  expired_policy:   "Expired Policy",
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
        <EmptyState icon={AlertTriangle} title="Gap analysis" description="Connect Supabase to view compliance gaps." />
      </Card>
    );
  }

  const [frameworks, allGaps, summary] = await Promise.all([
    listFrameworks(session.org.id),
    listGaps(session.org.id, fwFilter || undefined, false),
    getGapSummary(session.org.id, fwFilter || undefined),
  ]);

  // Apply additional client-side filters
  const gaps = allGaps.filter((g) => {
    if (sevFilter && g.severity !== sevFilter) return false;
    if (typeFilter && g.gapType !== typeFilter) return false;
    return true;
  });

  // Build framework lookup map
  const fwMap = new Map(frameworks.map((f) => [f.id, f.name]));

  // Gap type breakdown (from full unfiltered list)
  const typeBreakdown = Object.entries(summary.byType).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Gap Analysis
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)]">
            {summary.total} open gap{summary.total !== 1 ? "s" : ""}
            {fwFilter && frameworks.find((f) => f.id === fwFilter)
              ? ` in ${frameworks.find((f) => f.id === fwFilter)?.name}`
              : " across all frameworks"}
          </p>
        </div>
        {/* Re-run buttons per framework */}
        <div className="flex flex-wrap items-center gap-2">
          {frameworks.slice(0, 3).map((fw) => (
            <RunGapAnalysisButton key={fw.id} frameworkId={fw.id} />
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <SummaryCard label="Total"    value={summary.total}    />
        <SummaryCard label="Critical" value={summary.critical} color="text-red-400"  accent={summary.critical > 0 ? "danger" : undefined} />
        <SummaryCard label="High"     value={summary.high}     color="text-red-300"  accent={summary.high > 0 ? "danger" : undefined} />
        <SummaryCard label="Medium"   value={summary.medium}   color="text-amber-400" accent={summary.medium > 0 ? "warn" : undefined} />
        <SummaryCard label="Low"      value={summary.low}      color="text-[var(--color-ink-dim)]" />
      </div>

      {/* Gap type breakdown chips */}
      {typeBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {typeBreakdown.map(([type, count]) => (
            <Link
              key={type}
              href={typeFilter === type ? (fwFilter ? `?framework=${fwFilter}` : "?") : `?${fwFilter ? `framework=${fwFilter}&` : ""}type=${type}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === type
                  ? "border-[var(--color-blue)]/50 bg-[var(--color-blue)]/10 text-[var(--color-blue)]"
                  : "border-[var(--color-line)] text-[var(--color-ink-dim)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)]"
              }`}
            >
              {GAP_TYPE_LABELS[type] ?? type} ({count})
            </Link>
          ))}
        </div>
      )}

      {/* Framework filter */}
      {frameworks.length > 1 && (
        <div className="flex flex-wrap gap-2 text-sm">
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
      <div className="flex flex-wrap gap-2 text-sm">
        <FilterChip href={fwFilter ? `?framework=${fwFilter}` : "?"} label="All severity" active={!sevFilter} />
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
          {/* Group by framework */}
          {groupByFramework(gaps, fwMap).map(({ frameworkId, frameworkName, items }) => (
            <div key={frameworkId}>
              <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-white/[0.01] px-5 py-3">
                <Link
                  href={`/compliance/frameworks/${frameworkId}`}
                  className="font-[family-name:var(--font-display)] text-sm font-semibold hover:text-[var(--color-blue)] transition-colors"
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
                    <div className="min-w-0 flex-1 space-y-0.5">
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

      {/* Run analysis hint */}
      {frameworks.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 text-sm text-[var(--color-ink-dim)]">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 shrink-0 text-amber-400" />
            <p>
              <span className="font-medium text-[var(--color-ink)]">Gaps are not live — </span>
              run gap analysis from any framework detail page to refresh. Gaps are
              re-detected each time: resolved gaps stay resolved, new gaps are added.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Helpers ------------------------------------------------

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

function SummaryCard({
  label, value, color, accent,
}: {
  label: string;
  value: number;
  color?: string;
  accent?: "danger" | "warn";
}) {
  const border =
    accent === "danger" ? "border-red-500/25" :
    accent === "warn"   ? "border-amber-500/25" :
    "border-[var(--color-line)]";
  return (
    <Card className={`px-4 py-3 ${border}`}>
      <p className="text-xs text-[var(--color-ink-faint)]">{label}</p>
      <p className={`mt-1 font-[family-name:var(--font-display)] text-xl font-bold ${color ?? "text-[var(--color-ink)]"}`}>
        {value}
      </p>
    </Card>
  );
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-[var(--color-blue)]/50 bg-[var(--color-blue)]/10 text-[var(--color-blue)]"
          : "border-[var(--color-line)] text-[var(--color-ink-dim)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)]"
      }`}
    >
      {label}
    </Link>
  );
}
