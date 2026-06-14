export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/trust-verification/trust-verification-service";
import { ShieldCheck } from "lucide-react";
import { CertificateStatusBadge } from "@/components/trust-verification/verification-ui";

// CSS var-friendly Tailwind class mappings (no hardcoded hex)
const BADGE_TYPE_CLASSES: Record<string, { bg: string; text: string }> = {
  audt_verified:    { bg: "bg-indigo-500/20",  text: "text-indigo-400" },
  trusted_vendor:   { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  privacy_ready:    { bg: "bg-sky-500/20",      text: "text-sky-400" },
  ai_governed:      { bg: "bg-purple-500/20",   text: "text-purple-400" },
  enterprise_ready: { bg: "bg-pink-500/20",     text: "text-pink-400" },
  risk_managed:     { bg: "bg-amber-500/20",    text: "text-amber-400" },
  compliance_ready: { bg: "bg-orange-500/20",   text: "text-orange-400" },
  trust_leader:     { bg: "bg-yellow-500/20",   text: "text-yellow-400" },
  custom:           { bg: "bg-slate-500/20",    text: "text-slate-400" },
};

export default async function BadgesPage() {
  const session = await requireUser();
  const data = await getDashboardData(session.org?.id ?? "").catch(() => null);
  const badges = data?.badges ?? [];
  const active = badges.filter((b: any) => b.status === "active");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Trust Badges™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Active trust badges issued as part of your verification programs.</p>
        </div>
        <div className="text-sm font-semibold text-emerald-400">{active.length} Active Badges</div>
      </div>

      {/* Badge lifecycle legend */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-4">
        <div className="text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide mb-3">Badge Lifecycle</div>
        <div className="flex items-center gap-2 flex-wrap">
          {["Issued","Active","Renewal Due","Expired","Suspended","Revoked"].map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${
                s === "Active"     ? "bg-emerald-400" :
                s === "Expired"    ? "bg-[var(--color-ink-faint)]" :
                s === "Suspended"  ? "bg-orange-400" :
                s === "Revoked"    ? "bg-red-400" :
                s === "Renewal Due"? "bg-amber-400" :
                "bg-[var(--color-blue)]"
              }`} />
              <span className="text-xs text-[var(--color-ink-dim)]">{s}</span>
              {i < 5 && <span className="text-[var(--color-ink-faint)] text-xs">→</span>}
            </div>
          ))}
        </div>
      </div>

      {badges.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge: { id: string; name: string; badgeType: string; status: string; issuedAt: string | Date; expiresAt?: string | Date | null }) => {
            const cls = BADGE_TYPE_CLASSES[badge.badgeType] ?? BADGE_TYPE_CLASSES.custom;
            return (
              <div key={badge.id} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${cls.bg}`}>
                    <ShieldCheck className={`h-5 w-5 ${cls.text}`} />
                  </span>
                  <div>
                    <div className="font-semibold text-sm">{badge.name}</div>
                    <div className="text-[11px] text-[var(--color-ink-faint)] mt-0.5 capitalize">{badge.badgeType.replace(/_/g," ")}</div>
                  </div>
                  <span className="ml-auto"><CertificateStatusBadge status={badge.status} /></span>
                </div>
                <div className="space-y-1 text-xs text-[var(--color-ink-dim)]">
                  <div>Issued: {new Date(badge.issuedAt).toLocaleDateString()}</div>
                  {badge.expiresAt && <div>Expires: {new Date(badge.expiresAt).toLocaleDateString()}</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-12 text-center">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-[var(--color-ink-faint)]" />
          <div className="text-sm font-medium mb-1">No badges issued yet</div>
          <p className="text-xs text-[var(--color-ink-dim)] mb-4">Badges are automatically issued when a verification is approved.</p>
          <Link href="/trust-verification/applications/new" className="inline-flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white">
            Apply for Verification
          </Link>
        </div>
      )}
    </div>
  );
}
