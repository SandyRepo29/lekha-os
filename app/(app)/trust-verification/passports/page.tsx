export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getTrustPassport } from "@/lib/services/trust-verification/trust-verification-service";
import { Lock, ShieldCheck, Award, Globe, ExternalLink, Star } from "lucide-react";

export default async function PassportsPage() {
  const session = await requireUser();
  const passport = await getTrustPassport(session.org?.id ?? "").catch(() => null);
  const activeCerts = passport?.activeCerts ?? [];
  const activeBadges = passport?.activeBadges ?? [];
  const registry = passport?.registry ?? [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Trust Passport™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Your public-facing trust identity — certifications, badges, and proof of governance.</p>
      </div>

      {/* Passport Card */}
      <div className="rounded-2xl border border-[var(--color-blue)]/20 bg-gradient-to-br from-[var(--color-blue)]/[0.08] to-violet-500/[0.05] p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--color-blue)]/20">
              <Lock className="h-6 w-6 text-[var(--color-blue)]" />
            </div>
            <div>
              <div className="font-bold text-lg">Trust Passport™</div>
              <div className="text-xs text-[var(--color-ink-dim)]">Issued by AUDT Trust Verification Authority™</div>
            </div>
          </div>
          {activeCerts.length > 0 && (
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">Verified ✓</span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Active Certificates", value: activeCerts.length, icon: Award,       color: "text-violet-400" },
            { label: "Active Badges",        value: activeBadges.length, icon: ShieldCheck, color: "text-emerald-400" },
            { label: "Registry Entries",     value: registry.length,     icon: Globe,       color: "text-[var(--color-blue)]" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl bg-white/[0.06] p-3 text-center">
              <Icon className={`mx-auto mb-1 h-4 w-4 ${color}`} />
              <div className="text-lg font-bold">{value}</div>
              <div className="text-[11px] text-[var(--color-ink-dim)]">{label}</div>
            </div>
          ))}
        </div>

        {/* Active Certificates */}
        {activeCerts.length > 0 && (
          <div className="space-y-2 mb-4">
            <div className="text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">Certificates</div>
            {activeCerts.map((cert: any) => (
              <div key={cert.id} className="flex items-center justify-between rounded-xl bg-white/[0.06] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-[var(--color-blue)]" />
                  <div>
                    <div className="text-sm font-medium font-mono">{cert.certificateNumber}</div>
                    <div className="text-[11px] text-[var(--color-ink-faint)]">Expires {new Date(cert.expiresAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <a href={cert.publicUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[var(--color-blue)] hover:underline">
                  <ExternalLink className="h-3 w-3" /> View
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Active Badges */}
        {activeBadges.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">Badges</div>
            <div className="flex flex-wrap gap-2">
              {activeBadges.map((badge: any) => (
                <span key={badge.id}
                  className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  {badge.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeCerts.length === 0 && activeBadges.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--color-blue)]/30 p-6 text-center">
            <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-[var(--color-ink-faint)]" />
            <div className="text-sm font-medium mb-1">No active certifications yet</div>
            <p className="text-xs text-[var(--color-ink-dim)] mb-3">Apply for a verification program to build your Trust Passport™.</p>
            <Link href="/trust-verification/applications/new"
              className="inline-flex items-center gap-1.5 rounded-xl grad-brand px-3 py-1.5 text-xs font-semibold text-white">
              <ShieldCheck className="h-3.5 w-3.5" /> Apply Now
            </Link>
          </div>
        )}
      </div>

      {/* All certificates history */}
      {(passport?.allCerts ?? []).length > 0 && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <h3 className="font-semibold text-sm mb-4">Certificate History</h3>
          <div className="space-y-2">
            {passport!.allCerts.map((cert: any) => (
              <div key={cert.id} className="flex items-center justify-between rounded-xl border border-[var(--color-line)]/60 bg-white/[0.02] px-3 py-2.5">
                <div className="font-mono text-xs font-medium">{cert.certificateNumber}</div>
                <div className="text-xs text-[var(--color-ink-dim)]">{new Date(cert.issuedAt).toLocaleDateString()} — {new Date(cert.expiresAt).toLocaleDateString()}</div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  cert.status === "active"   ? "bg-emerald-500/10 text-emerald-400" :
                  cert.status === "expired"  ? "bg-white/5 text-[var(--color-ink-faint)]" :
                  "bg-red-500/10 text-red-400"
                }`}>{cert.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
