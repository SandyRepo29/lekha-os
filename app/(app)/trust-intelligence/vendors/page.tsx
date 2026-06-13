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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Vendor Trust View</h2>
        <p className="text-sm text-[var(--color-ink-dim)]">Trust Score™ across your vendor portfolio</p>
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

      {/* All scored vendors */}
      <Card className="p-5">
        <p className="text-sm font-semibold mb-4">All Scored Vendors</p>
        {metrics.allScored.length === 0 ? (
          <p className="text-xs text-[var(--color-ink-faint)]">Run Trust Score™ on vendors to populate this view.</p>
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
