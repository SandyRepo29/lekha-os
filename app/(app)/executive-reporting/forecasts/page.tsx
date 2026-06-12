export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { generateForecasts } from "@/lib/services/executive-reporting/executive-reporting-service";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { GenerateForecastsButton } from "./generate-forecasts-button";

const HORIZON_LABELS: Record<number, string> = { 30: "30 Days", 90: "90 Days", 180: "6 Months" };

const METRIC_LABELS: Record<string, string> = {
  org_trust_score: "Org Trust Score™",
  control_health: "Control Health™",
  open_risks: "Open Risks",
};

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
    <div className="space-y-8">
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

      {/* Forecast cards by metric */}
      {Object.entries(byMetric).map(([metricName, metricForecasts]) => {
        const sorted = [...metricForecasts].sort((a, b) => (Number(a.horizonDays) ?? 0) - (Number(b.horizonDays) ?? 0));
        const current = Number(sorted[0]?.currentValue ?? 0);
        const longestForecast = sorted[sorted.length - 1];
        const forecastVal = Number(longestForecast?.forecastValue ?? 0);
        const delta = forecastVal - current;
        const TrendIcon = delta > 1 ? TrendingUp : delta < -1 ? TrendingDown : Minus;
        const trendColor = delta > 1 ? "text-emerald-400" : delta < -1 ? "text-red-400" : "text-[var(--color-ink-dim)]";

        return (
          <div key={metricName} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold">{METRIC_LABELS[metricName] ?? metricName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold">{current.toFixed(0)}</span>
                  <span className="text-xs text-[var(--color-ink-dim)]">current</span>
                  <TrendIcon className={`h-4 w-4 ml-2 ${trendColor}`} />
                  <span className={`text-sm font-medium ${trendColor}`}>
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
                const FIcon = d > 1 ? TrendingUp : d < -1 ? TrendingDown : Minus;
                const fc = d > 1 ? "text-emerald-400" : d < -1 ? "text-red-400" : "text-[var(--color-ink-dim)]";
                return (
                  <div key={f.id} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] p-4">
                    <div className="text-xs text-[var(--color-ink-dim)] mb-2">{HORIZON_LABELS[f.horizonDays ?? 30]}</div>
                    <div className="flex items-end gap-2">
                      <span className="text-xl font-bold">{fVal.toFixed(0)}</span>
                      <div className={`flex items-center gap-0.5 text-xs pb-0.5 ${fc}`}>
                        <FIcon className="h-3 w-3" />
                        {d > 0 ? "+" : ""}{d.toFixed(1)}
                      </div>
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
