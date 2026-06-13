export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/trust-verification/trust-verification-service";
import { ShieldCheck } from "lucide-react";

const BADGE_COLORS: Record<string, string> = {
  audt_verified:     "#6366f1",
  trusted_vendor:    "#10b981",
  privacy_ready:     "#0ea5e9",
  ai_governed:       "#a855f7",
  enterprise_ready:  "#ec4899",
  risk_managed:      "#f59e0b",
  compliance_ready:  "#f97316",
  trust_leader:      "#eab308",
  custom:            "#6b7280",
};

export default async function BadgesPage() {
  const session = await requireUser();
  const data = await getDashboardData(session.org?.id ?? "").catch(() => null);
  const badges = data?.badges ?? [];
  const active = badges.filter((b: any) => b.status === "active");

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Trust Badges™</h1>
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
          {badges.map((badge: any) => {
            const color = BADGE_COLORS[badge.badgeType] ?? "#6366f1";
            const isActive = badge.status === "active";
            return (
              <div key={badge.id} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${color}20` }}>
                    <ShieldCheck className="h-5 w-5" style={{ color }} />
                  </span>
                  <div>
                    <div className="font-semibold text-sm">{badge.name}</div>
                    <div className="text-[11px] text-[var(--color-ink-faint)] mt-0.5 capitalize">{badge.badgeType.replace(/_/g," ")}</div>
                  </div>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    isActive ? "bg-emerald-500/10 text-emerald-400" :
                    badge.status === "suspended" ? "bg-orange-500/10 text-orange-400" :
                    badge.status === "revoked"   ? "bg-red-500/10 text-red-400" :
                    "bg-white/5 text-[var(--color-ink-faint)]"
                  }`}>{badge.status}</span>
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
