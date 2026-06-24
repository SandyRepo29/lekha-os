export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getVendorTrustMetrics } from "@/lib/repositories/trust-intelligence-repo";
import { OrgTrustBadge } from "@/components/trust-intelligence/org-trust-badge";
import { TrustStat } from "@/components/trust-intelligence/trust-intelligence-ui";
import { TRUST_LEVEL_LABELS, getTrustLevel } from "@/lib/services/trust-score";

export default async function VendorTrustPage() {
  const session = await requireUser();
  if (!session.org) return null;

  const metrics = await getVendorTrustMetrics(session.org.id);

  // --- Phase 6: Trust Concentration Analysis™ ---
  const sorted = [...metrics.allScored].sort((a, b) => a.trustScore - b.trustScore);
  const totalRisk = sorted.reduce((sum, v) => sum + (100 - v.trustScore), 0);
  const top5Risk = sorted.slice(0, 5);
  const top5RiskSum = top5Risk.reduce((sum, v) => sum + (100 - v.trustScore), 0);
  const top5Pct = totalRisk > 0 ? Math.round((top5RiskSum / totalRisk) * 100) : 0;

  // --- Phase 5: Trust Velocity™ ---
  const highPerformers = metrics.allScored.filter((v) => v.trustScore >= 80).slice(0, 5);
  const atRisk = metrics.allScored.filter((v) => v.trustScore < 60).slice(0, 5);
  const watchList = metrics.allScored.filter((v) => v.trustScore >= 60 && v.trustScore < 80).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Vendor Trust View</h2>
        <p className="text-sm text-[var(--color-ink-dim)]">Trust Score&#8482; across your vendor portfolio</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TrustStat label="Total Active Vendors" value={metrics.total} accent="neutral" />
        <TrustStat label="Scored Vendors" value={metrics.scoredCount} sub={`${metrics.total - metrics.scoredCount} unscored`} accent="neutral" />
        <TrustStat
          label="Avg Trust Score"
          value={metrics.avgScore}
          sub={metrics.avgScore > 0 ? TRUST_LEVEL_LABELS[getTrustLevel(metrics.avgScore)] : "N/A"}
          accent={metrics.avgScore >= 80 ? "good" : metrics.avgScore >= 60 ? "warn" : "danger"}
        />
        <TrustStat
          label="High Concern Vendors"
          value={metrics.allScored.filter((v) => v.trustScore < 60).length}
          sub="Trust Score < 60"
          accent="danger"
        />
      </div>

      {/* Top & Bottom vendors */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold mb-4 text-emerald-400">Top Trusted Vendors</p>
          {metrics.top10.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-faint)]">No scored vendors yet.</p>
          ) : (
            <div className="space-y-2">
              {metrics.top10.map((v, i) => (
                <Link key={v.id} href={`/vendors/${v.id}`}>
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/[0.03] transition-colors">
                    <span className="text-xs text-[var(--color-ink-faint)] w-4">{i + 1}</span>
                    <span className="flex-1 text-sm text-[var(--color-ink)]">{v.name}</span>
                    <OrgTrustBadge score={v.trustScore} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold mb-4 text-red-400">Lowest Trust Vendors</p>
          {metrics.bottom10.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-faint)]">No scored vendors yet.</p>
          ) : (
            <div className="space-y-2">
              {metrics.bottom10.map((v, i) => (
                <Link key={v.id} href={`/vendors/${v.id}`}>
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/[0.03] transition-colors">
                    <span className="text-xs text-[var(--color-ink-faint)] w-4">{i + 1}</span>
                    <span className="flex-1 text-sm text-[var(--color-ink)]">{v.name}</span>
                    <OrgTrustBadge score={v.trustScore} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Phase 5 — Trust Velocity™ */}
      {metrics.allScored.length > 0 && (
        <Card className="p-5 rounded-2xl border-[var(--color-line)] bg-[var(--color-bg-2)]/60">
          <p className="text-sm font-semibold mb-4">Trust Velocity&#8482;</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* High Performers */}
            <div>
              <p className="text-xs font-semibold text-emerald-400 mb-2">High Performers</p>
              {highPerformers.length === 0 ? (
                <p className="text-xs text-[var(--color-ink-faint)]">None above 80</p>
              ) : (
                <div className="space-y-1.5">
                  {highPerformers.map((v) => (
                    <Link key={v.id} href={`/vendors/${v.id}`}>
                      <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.03] transition-colors">
                        <span className="text-emerald-400 text-xs">&#8593;</span>
                        <span className="flex-1 text-xs text-[var(--color-ink)] truncate">{v.name}</span>
                        <OrgTrustBadge score={v.trustScore} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* At Risk */}
            <div>
              <p className="text-xs font-semibold text-red-400 mb-2">At Risk</p>
              {atRisk.length === 0 ? (
                <p className="text-xs text-[var(--color-ink-faint)]">None below 60</p>
              ) : (
                <div className="space-y-1.5">
                  {atRisk.map((v) => (
                    <Link key={v.id} href={`/vendors/${v.id}`}>
                      <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.03] transition-colors">
                        <span className="text-red-400 text-xs">&#8595;</span>
                        <span className="flex-1 text-xs text-[var(--color-ink)] truncate">{v.name}</span>
                        <OrgTrustBadge score={v.trustScore} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Watch List */}
            <div>
              <p className="text-xs font-semibold text-yellow-400 mb-2">Watch List</p>
              {watchList.length === 0 ? (
                <p className="text-xs text-[var(--color-ink-faint)]">None in 60&#8212;79 range</p>
              ) : (
                <div className="space-y-1.5">
                  {watchList.map((v) => (
                    <Link key={v.id} href={`/vendors/${v.id}`}>
                      <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.03] transition-colors">
                        <span className="text-yellow-400 text-xs">&#8594;</span>
                        <span className="flex-1 text-xs text-[var(--color-ink)] truncate">{v.name}</span>
                        <OrgTrustBadge score={v.trustScore} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Phase 6 — Trust Concentration Analysis™ */}
      {metrics.allScored.length > 0 && (
        <Card className="p-5 rounded-2xl border-[var(--color-line)] bg-[var(--color-bg-2)]/60">
          <p className="text-sm font-semibold mb-1">Trust Concentration Analysis&#8482;</p>
          <p className="text-xs text-[var(--color-ink-dim)] mb-4">Which vendors create the most trust risk exposure?</p>
          {top5Risk.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-faint)]">No scored vendors yet.</p>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {top5Risk.map((v) => {
                  const riskExposure = 100 - v.trustScore;
                  const pctOfTotal = totalRisk > 0 ? Math.round((riskExposure / totalRisk) * 100) : 0;
                  return (
                    <div key={v.id} className="flex items-center gap-3">
                      <Link href={`/vendors/${v.id}`} className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-[var(--color-ink)] truncate">{v.name}</span>
                          <OrgTrustBadge score={v.trustScore} />
                          <span className="ml-auto text-xs text-[var(--color-ink-faint)] shrink-0">
                            Risk: {riskExposure} pts &middot; {pctOfTotal}% of total
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-red-500/70"
                            style={{ width: `${pctOfTotal}%` }}
                          />
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-[var(--color-ink-dim)] border-t border-[var(--color-line)] pt-3">
                Top 5 vendors account for{" "}
                <span className="font-semibold text-red-400">{top5Pct}%</span> of total trust risk exposure.
              </p>
            </>
          )}
        </Card>
      )}

      {/* All scored vendors */}
      <Card className="p-5">
        <p className="text-sm font-semibold mb-4">All Scored Vendors</p>
        {metrics.allScored.length === 0 ? (
          <p className="text-xs text-[var(--color-ink-faint)]">Run Trust Score&#8482; on vendors to populate this view.</p>
        ) : (
          <div className="space-y-1">
            {metrics.allScored.map((v, i) => (
              <Link key={v.id} href={`/vendors/${v.id}`}>
                <div className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/[0.03] transition-colors">
                  <span className="text-xs text-[var(--color-ink-faint)] w-6 text-right">{i + 1}</span>
                  <span className="flex-1 text-sm text-[var(--color-ink)]">{v.name}</span>
                  <div className="w-40">
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${v.trustScore >= 80 ? "bg-emerald-500" : v.trustScore >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${v.trustScore}%` }}
                      />
                    </div>
                  </div>
                  <OrgTrustBadge score={v.trustScore} showScore />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
