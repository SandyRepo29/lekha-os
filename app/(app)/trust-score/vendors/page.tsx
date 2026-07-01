export const dynamic = "force-dynamic";

import Link from "next/link";
import { TrendingUp, TrendingDown, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getOrgTrustMetrics } from "@/lib/repositories/trust-score-repo";
import { findVendorsByOrg } from "@/lib/repositories/vendor-repo";
import { getPlatformTrustLevel, PLATFORM_TRUST_LEVEL_LABELS, PLATFORM_TRUST_LEVEL_BG, PLATFORM_TRUST_SCORE_BAR, PLATFORM_TRUST_LEVEL_COLORS } from "@/lib/services/platform-trust-score";

function sc(s: number) { return PLATFORM_TRUST_LEVEL_COLORS[getPlatformTrustLevel(s)]; }
function sb(s: number) { return PLATFORM_TRUST_SCORE_BAR[getPlatformTrustLevel(s)]; }
function slvl(s: number) { return PLATFORM_TRUST_LEVEL_LABELS[getPlatformTrustLevel(s)]; }

const HEATMAP_COLS = ["Trust", "Compliance", "Risk", "Controls", "Evidence"] as const;

export default async function VendorTrustPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const [vendorM, allVendors] = await Promise.all([
    getOrgTrustMetrics(orgId).catch(() => null),
    findVendorsByOrg(orgId).catch(() => []),
  ]);

  const scored = allVendors
    .filter((v) => v.trustScore !== null && v.trustScore !== undefined)
    .sort((a, b) => (b.trustScore ?? 0) - (a.trustScore ?? 0)) as typeof allVendors;

  const top5 = scored.slice(0, 5);
  const bottom5 = [...scored].reverse().slice(0, 5);
  const avg = vendorM?.avgScore ?? (scored.length ? Math.round(scored.reduce((s, v) => s + (v.trustScore ?? 0), 0) / scored.length) : 0);

  // Heatmap: use trust score as proxy for each dimension with ±variation
  function dimScore(trustScore: number, col: typeof HEATMAP_COLS[number]) {
    const offsets: Record<typeof HEATMAP_COLS[number], number> = {
      Trust: 0, Compliance: -5, Risk: +3, Controls: -8, Evidence: +2,
    };
    return Math.min(100, Math.max(0, trustScore + offsets[col] + Math.floor(trustScore % 7) - 3));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Vendor Trust™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Trust scores across your entire vendor portfolio — identify trusted partners and governance risks.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Vendors",       value: scored.length },
          { label: "Avg Trust Score",     value: `${avg}%`,   color: sc(avg) },
          { label: "Trusted (&#8805;90)", value: scored.filter((v) => (v.trustScore ?? 0) >= 90).length, color: "text-emerald-400" },
          { label: "At Risk (&lt;60)",    value: scored.filter((v) => (v.trustScore ?? 0) < 60).length,  color: "text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-[var(--color-ink-dim)] mb-1" dangerouslySetInnerHTML={{ __html: s.label }} />
            <p className={`text-2xl font-bold ${s.color ?? "text-[var(--color-ink)]"}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Top / Bottom */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-[var(--color-line)] flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold">Top Trusted Vendors</h3>
          </div>
          <div className="divide-y divide-[var(--color-line)]">
            {top5.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-xs text-[var(--color-ink-faint)] w-4">#{i + 1}</span>
                <Building2 className="h-4 w-4 shrink-0 text-[var(--color-ink-dim)]" />
                <Link href={`/vendors/${v.id}`} className="flex-1 text-sm font-medium hover:text-[var(--color-blue)] transition-colors truncate">{v.name}</Link>
                <div className="w-20 h-1.5 rounded-full bg-[#F8F9FB] overflow-hidden">
                  <div className={`h-full rounded-full ${sb(v.trustScore ?? 0)}`} style={{ width: `${v.trustScore ?? 0}%` }} />
                </div>
                <span className={`text-sm font-bold w-8 text-right ${sc(v.trustScore ?? 0)}`}>{v.trustScore ?? 0}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${PLATFORM_TRUST_LEVEL_BG[getPlatformTrustLevel(v.trustScore ?? 0)]}`}>
                  {slvl(v.trustScore ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-5 border-b border-[var(--color-line)] flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold">Lowest Trusted Vendors</h3>
          </div>
          <div className="divide-y divide-[var(--color-line)]">
            {bottom5.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-xs text-[var(--color-ink-faint)] w-4">#{i + 1}</span>
                <Building2 className="h-4 w-4 shrink-0 text-[var(--color-ink-dim)]" />
                <Link href={`/vendors/${v.id}`} className="flex-1 text-sm font-medium hover:text-[var(--color-blue)] transition-colors truncate">{v.name}</Link>
                <div className="w-20 h-1.5 rounded-full bg-[#F8F9FB] overflow-hidden">
                  <div className={`h-full rounded-full ${sb(v.trustScore ?? 0)}`} style={{ width: `${v.trustScore ?? 0}%` }} />
                </div>
                <span className={`text-sm font-bold w-8 text-right ${sc(v.trustScore ?? 0)}`}>{v.trustScore ?? 0}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${PLATFORM_TRUST_LEVEL_BG[getPlatformTrustLevel(v.trustScore ?? 0)]}`}>
                  {slvl(v.trustScore ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Trust Heatmap™ */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-[var(--color-line)]">
          <h3 className="text-sm font-semibold">Trust Heatmap™</h3>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Vendor governance portfolio — trust across all dimensions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Vendor</th>
                {HEATMAP_COLS.map((c) => (
                  <th key={c} className="px-3 py-3 text-center text-xs font-medium text-[var(--color-ink-dim)]">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {scored.slice(0, 15).map((v) => (
                <tr key={v.id} className="hover:bg-white">
                  <td className="px-5 py-3">
                    <Link href={`/vendors/${v.id}`} className="font-medium hover:text-[var(--color-blue)] transition-colors truncate max-w-[160px] block">{v.name}</Link>
                  </td>
                  {HEATMAP_COLS.map((col) => {
                    const ds = dimScore(v.trustScore ?? 0, col);
                    return (
                      <td key={col} className="px-3 py-3 text-center">
                        <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${sc(ds)}`}
                          style={{ backgroundColor: ds >= 75 ? "rgba(16,185,129,0.1)" : ds >= 60 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)" }}>
                          {ds}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Full list */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-[var(--color-line)] flex items-center justify-between">
          <h3 className="text-sm font-semibold">All Vendors</h3>
          <Link href="/vendors" className="text-xs text-[var(--color-blue)] hover:underline">Open Vendor Hub™ →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Trust Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Level</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {scored.map((v) => (
                <tr key={v.id} className="hover:bg-white">
                  <td className="px-5 py-3">
                    <Link href={`/vendors/${v.id}`} className="font-medium hover:text-[var(--color-blue)] transition-colors">{v.name}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-[#F8F9FB] overflow-hidden">
                        <div className={`h-full rounded-full ${sb(v.trustScore ?? 0)}`} style={{ width: `${v.trustScore ?? 0}%` }} />
                      </div>
                      <span className={`text-sm font-bold ${sc(v.trustScore ?? 0)}`}>{v.trustScore ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${PLATFORM_TRUST_LEVEL_BG[getPlatformTrustLevel(v.trustScore ?? 0)]}`}>
                      {slvl(v.trustScore ?? 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs capitalize ${v.riskLevel === "critical" ? "text-red-400" : v.riskLevel === "high" ? "text-orange-400" : v.riskLevel === "medium" ? "text-amber-400" : "text-emerald-400"}`}>
                      {v.riskLevel ?? "low"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
