export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { computeHealthAction } from "@/lib/continuous-compliance/actions";
import * as repo from "@/lib/repositories/continuous-compliance-repo";
import { BarChart3, RefreshCw } from "lucide-react";
import { HealthLevelBadge, HealthBar, CcStat, CcSubNav } from "@/components/continuous-compliance/cc-ui";

const COMPONENTS = [
  { key: "checkSuccessRate",   label: "Check Success Rate",  weight: "30%" },
  { key: "evidenceFreshness",  label: "Evidence Freshness",  weight: "25%" },
  { key: "openSignals",        label: "Signal Reduction",    weight: "20%" },
  { key: "trainingCompletion", label: "Training Completion", weight: "15%" },
  { key: "accessReviewRate",   label: "Access Reviews",      weight: "10%" },
];

export default async function ComplianceHealthPage() {
  const session = await requireUser();
  const oid = session.org?.id ?? "";
  const [latest, history] = await Promise.all([
    repo.getLatestHealthScore(oid).catch(() => null),
    repo.getHealthHistory(oid, 30).catch(() => []),
  ]);

  return (
    <div className="space-y-6 p-6">
      <CcSubNav />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Compliance Health™</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">Organization-wide compliance health score</p>
        </div>
        <form action={async () => { "use server"; await computeHealthAction(); }}>
          <button type="submit"
            className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2 text-sm font-medium hover:bg-[#F8F9FB] transition-colors">
            <RefreshCw className="h-4 w-4" /> Recompute
          </button>
        </form>
      </div>

      {latest ? (
        <>
          {/* Main score card */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-5xl font-bold">{latest.score}</div>
                <div className="mt-2">
                  <HealthLevelBadge level={latest.level} />
                </div>
                <p className="mt-2 text-xs text-[var(--color-ink-faint)]">Last updated {new Date(latest.snapshotAt).toLocaleString()}</p>
              </div>
              <div className="flex-1 max-w-xs">
                <HealthBar score={latest.score} />
                <div className="mt-2 flex justify-between text-[10px] text-[var(--color-ink-faint)]">
                  <span>Critical</span><span>Needs Attention</span><span>Excellent</span>
                </div>
              </div>
            </div>
          </div>

          {/* Component breakdown */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
            <h3 className="mb-4 font-semibold text-sm">Score Components</h3>
            <div className="space-y-3">
              {COMPONENTS.map(c => {
                const val = (latest as Record<string, unknown>)[c.key] as number | null | undefined;
                const score = val != null ? val : 80;
                return (
                  <div key={c.key}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium">{c.label}</span>
                      <div className="flex items-center gap-2 text-[var(--color-ink-dim)]">
                        <span className="text-[10px] opacity-60">weight {c.weight}</span>
                        <span>{score}%</span>
                      </div>
                    </div>
                    <HealthBar score={score} size="sm" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* History table */}
          {history.length > 1 && (
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
              <h3 className="mb-4 font-semibold text-sm">Health History (30 days)</h3>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {history.slice().reverse().map(h => (
                  <div key={h.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white">
                    <span className="w-28 text-[11px] text-[var(--color-ink-faint)]">{new Date(h.snapshotAt).toLocaleDateString()}</span>
                    <div className="flex-1">
                      <HealthBar score={h.score} size="sm" />
                    </div>
                    <span className="w-10 text-right text-xs font-semibold">{h.score}</span>
                    <HealthLevelBadge level={h.level} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-10 text-center">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-[var(--color-ink-faint)] opacity-40" />
          <p className="text-sm text-[var(--color-ink-dim)]">No health score computed yet.</p>
          <p className="mt-1 text-xs text-[var(--color-ink-faint)]">Click Recompute to generate your first health score.</p>
        </div>
      )}
    </div>
  );
}
