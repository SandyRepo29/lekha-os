export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getControlMetrics } from "@/lib/repositories/trust-intelligence-repo";
import { TrustStat } from "@/components/trust-intelligence/trust-intelligence-ui";
import { ControlHealthBadge } from "@/components/controls/control-health-badge";

export default async function ControlHealthPage() {
  const session = await requireUser();
  if (!session.org) return null;

  const metrics = await getControlMetrics(session.org.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Control Health</h2>
        <p className="text-sm text-[var(--color-ink-dim)]">Control Health™ from Control Center™</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TrustStat label="Total Controls" value={metrics.totalCount} accent="neutral" />
        <TrustStat label="Avg Health Score" value={metrics.avgHealth} sub="0–100 scale" accent={metrics.avgHealth >= 80 ? "good" : "warn"} />
        <TrustStat label="Healthy Controls" value={metrics.healthyCount} sub="Health ≥ 80" accent="good" />
        <TrustStat label="Weak Controls" value={metrics.weakCount} sub="Health < 60" accent={metrics.weakCount > 0 ? "danger" : "neutral"} />
      </div>

      <Card className="p-5">
        <p className="text-sm font-semibold mb-4 text-red-400">Weakest Controls</p>
        {metrics.weakControls.length === 0 ? (
          <p className="text-xs text-[var(--color-ink-faint)]">No weak controls. Excellent health!</p>
        ) : (
          <div className="space-y-2">
            {metrics.weakControls.map((c) => (
              <Link key={c.id} href={`/controls/${c.id}`}>
                <div className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/[0.03] transition-colors">
                  <span className="flex-1 text-sm text-[var(--color-ink)]">{c.name}</span>
                  <div className="w-32">
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{ width: `${c.healthScore}%` }}
                      />
                    </div>
                  </div>
                  <ControlHealthBadge score={c.healthScore} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Health distribution */}
      <Card className="p-5">
        <p className="text-sm font-semibold mb-4">Health Distribution</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
            <p className="text-lg font-bold text-emerald-400">{metrics.healthyCount}</p>
            <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Healthy (≥80)</p>
          </div>
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-center">
            <p className="text-lg font-bold text-yellow-400">{metrics.totalCount - metrics.healthyCount - metrics.weakCount}</p>
            <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Moderate (60–79)</p>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
            <p className="text-lg font-bold text-red-400">{metrics.weakCount}</p>
            <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Weak (&lt;60)</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-sm font-semibold mb-2">Go Deeper</p>
        <Link href="/controls">
          <span className="text-sm text-[var(--color-blue)] hover:underline">Open Control Center™ →</span>
        </Link>
      </Card>
    </div>
  );
}
