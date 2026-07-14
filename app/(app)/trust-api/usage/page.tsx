export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getUsageAnalytics } from "@/backend/src/modules/trust-api/trust-api-service";
import { BarChart3, TrendingUp, AlertTriangle, Activity, CheckCircle } from "lucide-react";

export default async function UsagePage() {
  const session = await requireUser();
  const analytics = await getUsageAnalytics(session.org?.id ?? "", 30).catch(() => null);

  const successRate = analytics && analytics.total > 0
    ? Math.round(((analytics.total - analytics.errors) / analytics.total) * 100)
    : 100;

  const maxDay = analytics?.dailyCounts.reduce((m, d) => Math.max(m, d.cnt), 1) ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 text-xs text-[var(--color-ink-faint)]">
          <Link href="/trust-api" className="hover:underline">Trust API Platform™</Link> / API Analytics™
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">API Analytics™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Usage metrics, error tracking, and endpoint performance — last 30 days.</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Calls",    value: (analytics?.total ?? 0).toLocaleString(), icon: Activity,       color: "text-[var(--color-blue)]" },
          { label: "Success Rate",   value: `${successRate}%`,                        icon: CheckCircle,    color: "text-emerald-400" },
          { label: "Errors",         value: (analytics?.errors ?? 0).toLocaleString(), icon: AlertTriangle, color: "text-red-400" },
          { label: "Top Endpoints",  value: analytics?.topEndpoints.length ?? 0,       icon: TrendingUp,    color: "text-violet-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
            <Icon className={`mb-3 h-5 w-5 ${color}`} />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-[var(--color-ink-dim)]">{label}</div>
            <div className="mt-0.5 text-[11px] text-[var(--color-ink-faint)]">last 30 days</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily volume chart */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <h2 className="mb-4 font-semibold text-sm">Daily API Calls</h2>
          {(analytics?.dailyCounts.length ?? 0) === 0 ? (
            <div className="py-8 text-center">
              <BarChart3 className="mx-auto mb-2 h-8 w-8 text-[var(--color-ink-faint)]" />
              <p className="text-sm text-[var(--color-ink-faint)]">No API calls recorded yet.</p>
            </div>
          ) : (
            <div className="flex h-40 items-end gap-1">
              {analytics!.dailyCounts.map(d => (
                <div key={d.day} className="group relative flex flex-1 flex-col items-center">
                  <div
                    className="w-full rounded-t-sm bg-[var(--color-blue)]/50 transition-colors group-hover:bg-[var(--color-blue)]"
                    style={{ height: `${Math.max(4, Math.round((d.cnt / maxDay) * 100))}%` }}
                  />
                  <div className="absolute bottom-full mb-1 hidden rounded bg-black/80 px-1.5 py-0.5 text-[10px] whitespace-nowrap group-hover:block">
                    {d.day}: {d.cnt}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top endpoints */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <h2 className="mb-4 font-semibold text-sm">Top Endpoints</h2>
          {(analytics?.topEndpoints.length ?? 0) === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--color-ink-faint)]">No endpoint data yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {analytics!.topEndpoints.map((ep, i) => {
                const pct = Math.round((ep.cnt / analytics!.total) * 100);
                return (
                  <div key={ep.endpoint}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <code className="font-mono text-[var(--color-ink-dim)] truncate max-w-[70%]">{ep.endpoint}</code>
                      <span className="text-[var(--color-ink-faint)]">{ep.cnt} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#EEF2F7]">
                      <div className="h-full rounded-full bg-[var(--color-blue)]/60" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Health Indicators */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h2 className="mb-4 font-semibold text-sm">Platform Health</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Success Rate",
              value: `${successRate}%`,
              status: successRate >= 99 ? "Excellent" : successRate >= 95 ? "Good" : "Needs Attention",
              color: successRate >= 99 ? "text-emerald-400" : successRate >= 95 ? "text-blue-400" : "text-red-400",
            },
            {
              label: "Error Rate",
              value: `${analytics?.total ? Math.round((analytics.errors / analytics.total) * 100) : 0}%`,
              status: (analytics?.errors ?? 0) === 0 ? "No Errors" : "Review Errors",
              color: (analytics?.errors ?? 0) === 0 ? "text-emerald-400" : "text-red-400",
            },
            {
              label: "Active Endpoints",
              value: `${analytics?.topEndpoints.length ?? 0}`,
              status: "Tracking",
              color: "text-violet-400",
            },
          ].map(({ label, value, status, color }) => (
            <div key={label} className="rounded-xl border border-[var(--color-line)]/60 bg-white p-4">
              <div className="text-xs text-[var(--color-ink-dim)]">{label}</div>
              <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
              <div className={`mt-0.5 text-xs ${color}`}>{status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
