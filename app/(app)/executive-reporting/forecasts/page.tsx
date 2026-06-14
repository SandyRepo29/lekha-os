export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { generateForecasts } from "@/lib/services/executive-reporting/executive-reporting-service";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { GenerateForecastsButton } from "./generate-forecasts-button";
import { ForecastBadge, ExecStat } from "@/components/executive-reporting/executive-ui";

const HORIZON_LABELS: Record<number, string> = { 30: "30 Days", 90: "90 Days", 180: "6 Months" };

const METRIC_LABELS: Record<string, string> = {
  org_trust_score: "Org Trust Score™",
  control_health:  "Control Health™",
  open_risks:      "Open Risks",
};

/** Open risks is inverse (higher = worse) */
const INVERSE_METRICS = new Set(["open_risks"]);

export default async function ForecastsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const forecasts = await generateForecasts(orgId).catch(() => []);

  type Forecast = (typeof forecasts)[number];
  const byMetric: Record<string, Forecast[]> = {};
  for (const f of forecasts) {
    if (!byMetric[f.metricName]) byMetric[f.metricName] = [];
    byMetric[f.metricName].push(f);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/executive-reporting" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
            <ArrowLeft className="h-3.5 w-3.5" />
            Executive Reporting™
          </Link>
          <h1 className="text-2xl font-bold">Predictive Analytics™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            AI-powered forecasts for trust score, risk exposure, and control health.
          </p>
        </div>
        <GenerateForecastsButton />
      </div>

      {/* Summary strip */}
      {Object.keys(byMetric).length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(byMetric).map(([metricName, metricForecasts]) => {
            const sorted = [...metricForecasts].sort((a, b) => (Number(a.horizonDays) ?? 0) - (Number(b.horizonDays) ?? 0));
            const current = Number(sorted[0]?.currentValue ?? 0);
            const longest = sorted[sorted.length - 1];
            const fVal = Number(longest?.forecastValue ?? 0);
            const delta = fVal - current;
            const isInverse = INVERSE_METRICS.has(metricName);
            const isImproving = isInverse ? delta < -1 : delta > 1;
            const acc = isImproving ? "good" : delta < -1 && !isInverse ? "danger" : "neutral";
            return (
              <ExecStat
                key={metricName}
                label={METRIC_LABELS[metricName] ?? metricName}
                value={current.toFixed(0)}
                accent={acc}
                sub={`${delta > 0 ? "+" : ""}${delta.toFixed(1)} by 6mo`}
              />
            );
          })}
        </div>
      )}

      {/* Forecast cards by metric */}
      {Object.entries(byMetric).map(([metricName, metricForecasts]) => {
        const sorted = [...metricForecasts].sort((a, b) => (Number(a.horizonDays) ?? 0) - (Number(b.horizonDays) ?? 0));
        const current = Number(sorted[0]?.currentValue ?? 0);
        const longestForecast = sorted[sorted.length - 1];
        const forecastVal = Number(longestForecast?.forecastValue ?? 0);
        const delta = forecastVal - current;
        const isInverse = INVERSE_METRICS.has(metricName);
        const forecastTrend = delta > 1 ? "improving" : delta < -1 ? (isInverse ? "improving" : "declining") : "stable";

        return (
          <div key={metricName} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold">{METRIC_LABELS[metricName] ?? metricName}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-bold">{current.toFixed(0)}</span>
                  <span className="text-xs text-[var(--color-ink-dim)]">current</span>
                  <ForecastBadge trend={forecastTrend} />
                  <span className="text-sm text-[var(--color-ink-dim)]">
                    {delta > 0 ? "+" : ""}{delta.toFixed(1)} over {HORIZON_LABELS[longestForecast?.horizonDays ?? 180]}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {sorted.map((f) => {
                const fVal = Number(f.forecastValue ?? 0);
                const conf = Number(f.confidenceScore ?? 0);
                const d = fVal - current;
                const horizon = f.horizonDays ?? 30;
                const chip =
                  d > 1
                    ? "bg-emerald-500/10 text-emerald-400"
                    : d < -1
                    ? "bg-red-500/10 text-red-400"
                    : "bg-[var(--color-line)] text-[var(--color-ink-dim)]";
                return (
                  <div key={f.id} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] p-4">
                    <span className="inline-block rounded-full bg-[var(--color-blue)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-blue)] mb-2">
                      {HORIZON_LABELS[horizon] ?? `${horizon}d`}
                    </span>
                    <div className="flex items-end gap-2">
                      <span className="text-xl font-bold">{fVal.toFixed(0)}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium mb-0.5 ${chip}`}>
                        {d > 0 ? "+" : ""}{d.toFixed(1)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-[var(--color-ink-dim)]">
                      {(conf * 100).toFixed(0)}% confidence
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-[var(--color-line)]">
                      <div className="h-1 rounded-full bg-[var(--color-blue)]" style={{ width: `${conf * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {forecasts.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--color-line)] p-10 text-center">
          <TrendingUp className="mx-auto h-10 w-10 text-[var(--color-ink-dim)] mb-3" />
          <p className="font-medium">No forecasts generated yet</p>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Click &ldquo;Generate Forecasts&rdquo; to run the predictive engine.</p>
        </div>
      )}
    </div>
  );
}
