export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { findAllVendors } from "@/lib/repositories/ai-governance-repo";
import Link from "next/link";
import { Building2, Plus, Shield, Lock } from "lucide-react";

const RISK_COLORS: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700", moderate: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700", critical: "bg-red-100 text-red-700",
};
const POSTURE_ICONS: Record<string, string> = {
  strong: "text-emerald-700", adequate: "text-yellow-700", weak: "text-red-700", unknown: "text-[var(--color-ink-dim)]",
};

export default async function AiVendorsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const vendors = await findAllVendors(orgId).catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[var(--color-blue)]" /> AI Vendor Governance™
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Govern AI vendors like third parties — track privacy posture, security, contracts, and trust.</p>
        </div>
        <Link href="/ai-governance/vendors/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Vendor
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v) => (
          <div key={v.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{v.name}</div>
                <div className="text-xs text-[var(--color-ink-dim)]">{v.vendorType}</div>
              </div>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${RISK_COLORS[v.riskRating] ?? ""}`}>{v.riskRating}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Lock className={`h-3 w-3 ${POSTURE_ICONS[v.privacyPosture ?? "unknown"]}`} />
                <span className="text-[var(--color-ink-dim)]">Privacy:</span>
                <span className={POSTURE_ICONS[v.privacyPosture ?? "unknown"]}>{v.privacyPosture ?? "unknown"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className={`h-3 w-3 ${POSTURE_ICONS[v.securityPosture ?? "unknown"]}`} />
                <span className="text-[var(--color-ink-dim)]">Security:</span>
                <span className={POSTURE_ICONS[v.securityPosture ?? "unknown"]}>{v.securityPosture ?? "unknown"}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--color-ink-dim)]">
              <span>Contract: {v.contractStatus ?? "none"}</span>
              <span className="font-mono">{v.trustScore ? `Trust: ${Number(v.trustScore).toFixed(0)}` : "Not scored"}</span>
            </div>
          </div>
        ))}
        {vendors.length === 0 && (
          <div className="col-span-3 py-12 text-center text-[var(--color-ink-dim)]">No AI vendors added yet.</div>
        )}
      </div>
    </div>
  );
}
