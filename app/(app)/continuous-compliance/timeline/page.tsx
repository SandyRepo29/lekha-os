export const dynamic = "force-dynamic";

import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getHealthHistory } from "@/lib/repositories/continuous-compliance-repo";
import { CcSubNav } from "@/components/continuous-compliance/cc-ui";

function scoreColor(s: number) {
  if (s >= 80) return "text-emerald-400";
  if (s >= 65) return "text-amber-400";
  return "text-red-400";
}

function scoreBar(s: number) {
  if (s >= 80) return "bg-emerald-500";
  if (s >= 65) return "bg-amber-500";
  return "bg-red-500";
}

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "&#8212;";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ComplianceTimelinePage() {
  const session = await requireUser();

  const history = session.org
    ? await getHealthHistory(session.org.id, 90).catch(() => [])
    : [];

  const sorted = [...history].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );

  const latest = sorted[0];
  const oldest = sorted[sorted.length - 1];
  const drift = latest && oldest ? latest.score - oldest.score : 0;

  return (
    <div className="space-y-6 p-6">
      <CcSubNav />

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Compliance Timeline&#8482;</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          90-day history of your compliance posture &#8212; see how governance improved or drifted over time
        </p>
      </div>

      {/* Summary */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Current Score",   value: `${latest?.score ?? 0}%`,  color: scoreColor(latest?.score ?? 0) },
            { label: "90d Ago",         value: `${oldest?.score ?? 0}%`,  color: scoreColor(oldest?.score ?? 0) },
            { label: "Drift",           value: `${drift > 0 ? "+" : ""}${drift}%`,
              color: drift > 0 ? "text-emerald-400" : drift < 0 ? "text-red-400" : "text-[var(--color-ink-dim)]" },
            { label: "Snapshots",       value: sorted.length,              color: "text-[var(--color-ink)]" },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-xs text-[var(--color-ink-dim)] mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Sparkline-style bar chart */}
      {sorted.length > 0 && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--color-blue)]" />
            Compliance Score History
          </h2>
          <div className="flex items-end gap-1 h-24">
            {[...sorted].reverse().map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${fmtDate(h.createdAt)}: ${h.score}%`}>
                <div
                  className={`w-full rounded-t ${scoreBar(h.score)} min-h-[2px]`}
                  style={{ height: `${Math.max(2, h.score)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-[var(--color-ink-faint)]">
            <span>{fmtDate(oldest?.createdAt)}</span>
            <span>{fmtDate(latest?.createdAt)}</span>
          </div>
        </Card>
      )}

      {/* Timeline events */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-[var(--color-line)] flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold">Compliance Snapshots</h2>
        </div>
        {sorted.length === 0 ? (
          <div className="p-6 text-sm text-[var(--color-ink-dim)] text-center">
            <p className="mb-2">No timeline data yet.</p>
            <p className="text-xs">Run checks on the Overview or Control Monitoring page to generate snapshots.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {sorted.map((h, i) => {
              const prev = sorted[i + 1];
              const change = prev ? h.score - prev.score : 0;
              return (
                <div key={h.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="shrink-0 w-28 text-xs text-[var(--color-ink-dim)]">
                    {fmtDate(h.createdAt)}
                  </div>
                  <div className="flex-1">
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className={`h-full rounded-full ${scoreBar(h.score)}`} style={{ width: `${h.score}%` }} />
                    </div>
                  </div>
                  <div className={`w-12 text-right text-sm font-bold ${scoreColor(h.score)}`}>{h.score}%</div>
                  <div className="w-12 text-right">
                    {change !== 0 ? (
                      <span className={`flex items-center justify-end gap-0.5 text-xs font-medium ${change > 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(change)}%
                      </span>
                    ) : (
                      <span className="flex items-center justify-end text-[var(--color-ink-faint)]">
                        <Minus className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
