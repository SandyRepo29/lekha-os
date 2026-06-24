export const dynamic = "force-dynamic";

import Link from "next/link";
import { Network, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getOrgTrustMetrics } from "@/lib/repositories/trust-score-repo";
import { CcSubNav } from "@/components/continuous-compliance/cc-ui";

function scoreColor(s: number) {
  if (s >= 80) return "text-emerald-400";
  if (s >= 60) return "text-amber-400";
  return "text-red-400";
}

function scoreBar(s: number) {
  if (s >= 80) return "bg-emerald-500";
  if (s >= 60) return "bg-amber-500";
  return "bg-red-500";
}

export default async function VendorCompliancePage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <div className="space-y-6 p-6">
        <CcSubNav />
        <Card className="p-8 text-center">
          <Network className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
          <p className="font-semibold">Vendor Compliance&#8482;</p>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">Connect Supabase to view vendor compliance data.</p>
        </Card>
      </div>
    );
  }

  const vendorM = await getOrgTrustMetrics(session.org.id).catch(() => null);

  const allVendors = vendorM ? [...vendorM.topVendors, ...vendorM.lowVendors] : [];
  const compliant  = allVendors.filter((v) => (v.trustScore ?? 0) >= 80);
  const atRisk     = allVendors.filter((v) => (v.trustScore ?? 0) >= 60 && (v.trustScore ?? 0) < 80);
  const nonComp    = allVendors.filter((v) => (v.trustScore ?? 0) < 60);
  const avgScore   = vendorM?.avgScore ?? 0;

  return (
    <div className="space-y-6 p-6">
      <CcSubNav />

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Vendor Compliance&#8482;</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">Third-party governance posture and compliance status</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Avg Trust Score",   value: `${avgScore}%`,    color: scoreColor(avgScore) },
          { label: "Compliant (&#8805;80)", value: compliant.length,  color: "text-emerald-400" },
          { label: "At Risk (60&#8211;79)",  value: atRisk.length,     color: "text-amber-400" },
          { label: "Non-Compliant",      value: nonComp.length,    color: nonComp.length > 0 ? "text-red-400" : "text-emerald-400" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-[var(--color-ink-dim)] mb-1" dangerouslySetInnerHTML={{ __html: s.label }} />
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Non-Compliant Vendors */}
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-[var(--color-line)] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h2 className="text-sm font-semibold">Non-Compliant Vendors</h2>
          </div>
          {nonComp.length === 0 ? (
            <div className="p-6 flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              All vendors meet compliance threshold.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {nonComp.map((v) => (
                <div key={v.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{v.name}</p>
                    <p className="text-xs text-[var(--color-ink-dim)]">Trust score below threshold</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24">
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full bg-red-500" style={{ width: `${v.trustScore}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-red-400 w-8 text-right">{v.trustScore}</span>
                    <Link href={`/vendors/${v.id}`} className="text-xs text-[var(--color-blue)] hover:underline">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* At-Risk Vendors */}
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-[var(--color-line)] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold">At-Risk Vendors</h2>
          </div>
          {atRisk.length === 0 ? (
            <div className="p-6 flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              No at-risk vendors.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {atRisk.map((v) => (
                <div key={v.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{v.name}</p>
                    <p className="text-xs text-[var(--color-ink-dim)]">Approaching non-compliance</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24">
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${v.trustScore}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-amber-400 w-8 text-right">{v.trustScore}</span>
                    <Link href={`/vendors/${v.id}`} className="text-xs text-[var(--color-blue)] hover:underline">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Compliant Vendors */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-[var(--color-line)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold">Compliant Vendors</h2>
          </div>
          <Link href="/vendors" className="text-xs text-[var(--color-blue)] hover:underline">All Vendors &#8594;</Link>
        </div>
        {compliant.length === 0 ? (
          <div className="p-6 text-sm text-[var(--color-ink-dim)]">
            No vendors have reached the compliance threshold yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Trust Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {compliant.map((v) => (
                  <tr key={v.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <Link href={`/vendors/${v.id}`} className="font-medium hover:text-[var(--color-blue)] transition-colors">
                        {v.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${v.trustScore}%` }} />
                        </div>
                        <span className={`text-sm font-bold ${scoreColor(v.trustScore)}`}>{v.trustScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                        Compliant
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
