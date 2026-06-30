export const dynamic = "force-dynamic";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getSnapshotHistory } from "@/lib/repositories/trust-intelligence-repo";
import { getPlatformTrustLevel, PLATFORM_TRUST_LEVEL_LABELS, PLATFORM_TRUST_SCORE_BAR, PLATFORM_TRUST_LEVEL_COLORS } from "@/lib/services/platform-trust-score";
import { Card } from "@/components/ui/card";

function sc(s: number) { return PLATFORM_TRUST_LEVEL_COLORS[getPlatformTrustLevel(s)]; }
function sb(s: number) { return PLATFORM_TRUST_SCORE_BAR[getPlatformTrustLevel(s)]; }

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function TrustTrendsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const snapshots = await getSnapshotHistory(orgId, 365).catch(() => []);
  const sorted = [...snapshots].sort((a, b) =>
    new Date(a.snapshotDate as string).getTime() - new Date(b.snapshotDate as string).getTime()
  );

  const latest = sorted[sorted.length - 1];
  const oldest = sorted[0];
  const currentScore = latest?.orgTrustScore ?? 80;

  // Monthly aggregation for sparkline
  const monthlyMap = new Map<string, number[]>();
  sorted.forEach((s) => {
    const month = (s.snapshotDate as string).slice(0, 7);
    if (!monthlyMap.has(month)) monthlyMap.set(month, []);
    monthlyMap.get(month)!.push(s.orgTrustScore ?? currentScore);
  });
  const monthly = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, scores]) => ({
      label: new Date(month + "-01").toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      score: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    }));

  // Quarter stats
  const q30 = sorted.slice(-30);
  const q90 = sorted.slice(-90);
  const avg30 = q30.length ? Math.round(q30.reduce((s, v) => s + (v.orgTrustScore ?? 0), 0) / q30.length) : currentScore;
  const avg90 = q90.length ? Math.round(q90.reduce((s, v) => s + (v.orgTrustScore ?? 0), 0) / q90.length) : currentScore;
  const drift30 = currentScore - avg30;
  const drift90 = currentScore - (oldest?.orgTrustScore ?? currentScore);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Trust Trends&#8482;</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Historical Trust Score&#8482; &#8212; track organizational trust improvement over time.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Current Score",   value: currentScore, color: sc(currentScore) },
          { label: "30d Avg",         value: avg30,        color: sc(avg30) },
          { label: "90d Avg",         value: avg90,        color: sc(avg90) },
          { label: "Annual Drift",    value: `${drift90 > 0 ? "+" : ""}${drift90}`, color: drift90 >= 0 ? "text-emerald-400" : "text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-[var(--color-ink-dim)] mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Monthly sparkline */}
      {monthly.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--color-blue)]" />
            Trust Score&#8482; &#8212; Monthly View
          </h3>
          <div className="flex items-end gap-3 h-32">
            {monthly.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className={`text-[11px] font-semibold ${sc(m.score)}`}>{m.score}</span>
                <div className="w-full rounded-t overflow-hidden" style={{ height: `${Math.max(4, m.score)}%` }}>
                  <div className={`w-full h-full ${sb(m.score)}`} />
                </div>
                <span className="text-[10px] text-[var(--color-ink-faint)]">{m.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Snapshot log */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-[var(--color-line)] flex items-center justify-between">
          <h3 className="text-sm font-semibold">Trust Score&#8482; History</h3>
          <span className="text-xs text-[var(--color-ink-faint)]">{sorted.length} snapshots</span>
        </div>
        {sorted.length === 0 ? (
          <div className="p-6 text-sm text-center text-[var(--color-ink-dim)]">
            <p>No snapshot history yet.</p>
            <p className="text-xs mt-1">Snapshots are recorded daily via the governance snapshot cron job.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {[...sorted].reverse().slice(0, 30).map((s, i) => {
              const prev = [...sorted].reverse()[i + 1];
              const delta = prev ? (s.orgTrustScore ?? 0) - (prev.orgTrustScore ?? 0) : 0;
              const score = s.orgTrustScore ?? 0;
              return (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="shrink-0 w-28 text-xs text-[var(--color-ink-dim)]">{fmtDate(s.snapshotDate)}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#F8F9FB] overflow-hidden">
                    <div className={`h-full rounded-full ${sb(score)}`} style={{ width: `${score}%` }} />
                  </div>
                  <span className={`w-8 text-right text-sm font-bold ${sc(score)}`}>{score}</span>
                  <span className={`w-10 text-right text-xs font-medium ${delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-[var(--color-ink-faint)]"}`}>
                    {delta !== 0 ? (delta > 0 ? `+${delta}` : delta) : <Minus className="h-3 w-3 inline" />}
                  </span>
                  <span className="w-24 text-right">
                    <span className={`text-[11px] rounded-full border px-2 py-0.5 font-medium ${PLATFORM_TRUST_LEVEL_COLORS[getPlatformTrustLevel(score)]}`}>
                      {PLATFORM_TRUST_LEVEL_LABELS[getPlatformTrustLevel(score)]}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
