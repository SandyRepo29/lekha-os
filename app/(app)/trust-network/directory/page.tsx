export const dynamic = "force-dynamic";

import Link from "next/link";
import { Globe, Network, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getNetworkDirectory } from "@/lib/services/trust-network/trust-network-service";

export default async function NetworkDirectoryPage() {
  const session = await requireUser();
  if (!session.org) return null;

  const profiles = await getNetworkDirectory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Network Directory</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">
            Browse and discover organizations with published Trust Profiles.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)]">
          <Network className="h-4 w-4" />
          <span>{profiles.length} published profiles</span>
        </div>
      </div>

      {/* Profiles grid */}
      {profiles.length === 0 ? (
        <Card className="p-12 text-center">
          <Globe className="h-10 w-10 mx-auto text-[var(--color-ink-faint)] mb-3" />
          <p className="font-semibold text-[var(--color-ink-dim)]">No published profiles yet</p>
          <p className="text-sm text-[var(--color-ink-faint)] mt-1">Be the first to publish your Trust Profile.</p>
          <Link href="/trust-exchange/my-profile" className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-blue)] text-white text-sm font-semibold hover:opacity-90">
            Publish Profile
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {profiles.map((p) => (
            <Card key={p.id} className="p-5 hover:border-[var(--color-blue)]/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-blue)]/20 flex items-center justify-center flex-shrink-0">
                  <Globe className="h-5 w-5 text-[var(--color-blue)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.displayName}</p>
                  {p.tagline && <p className="text-xs text-[var(--color-ink-dim)] truncate mt-0.5">{p.tagline}</p>}
                </div>
                {p.trustScore !== null && (
                  <div className="text-center flex-shrink-0">
                    <p className="text-lg font-bold text-[var(--color-blue)]">{p.trustScore}</p>
                    <p className="text-[9px] text-[var(--color-ink-faint)]">Trust</p>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {p.industry && (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-[var(--color-ink-dim)]">{p.industry}</span>
                )}
                {p.country && (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-[var(--color-ink-dim)]">{p.country}</span>
                )}
                {(p.profileCompleteness ?? 0) >= 80 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                    <CheckCircle2 className="h-3 w-3" /> Complete Profile
                  </span>
                )}
              </div>
              {p.profileCompleteness !== null && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-[var(--color-ink-faint)] mb-1">
                    <span>Profile</span>
                    <span>{p.profileCompleteness}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--color-blue)]/60" style={{ width: `${p.profileCompleteness}%` }} />
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
