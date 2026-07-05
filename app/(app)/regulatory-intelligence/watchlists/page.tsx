export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getWatchlists } from "@/lib/services/regulatory-intelligence/regulatory-service";
import { RegSubNav, RegStat } from "@/components/regulatory-intelligence/reg-ui";
import { Bell, Plus, Eye } from "lucide-react";
import { DeleteWatchlistButton } from "@/components/regulatory-intelligence/watchlist-actions";

const WATCH_TYPE_LABELS: Record<string, string> = {
  regulation: "Regulation",
  country: "Country",
  regulator: "Regulator",
  industry: "Industry",
  framework: "Framework",
  topic: "Topic",
};

export default async function WatchlistsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const watchlists = await getWatchlists(orgId).catch(() => []);

  const active = watchlists.filter(w => w.isActive).length;

  return (
    <div className="space-y-6 p-6">
      <RegSubNav />

      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Regulatory Watchlists™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Monitor regulators, countries, industries, and frameworks — get alerted when something changes.</p>
        </div>
        <Link
          href="/regulatory-intelligence/watchlists/new"
          className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New Watchlist
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <RegStat label="Total Watchlists" value={watchlists.length} accent="neutral" />
        <RegStat label="Active"           value={active}            accent="good" />
        <RegStat label="Alert Enabled"    value={watchlists.filter(w => w.alertOnChange).length} accent="purple" />
      </div>

      {/* Suggested Watchlists */}
      {watchlists.length === 0 && (
        <div className="rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.04] p-5">
          <h3 className="mb-3 font-semibold text-sm text-[var(--color-blue)]">Suggested Watchlists</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              "India Privacy (DPDP)",
              "EU AI Regulation",
              "Financial Services",
              "Healthcare Compliance",
              "Cloud Security",
              "ISO Standards",
            ].map(name => (
              <Link
                key={name}
                href={`/regulatory-intelligence/watchlists/new?name=${encodeURIComponent(name)}`}
                className="rounded-xl border border-[var(--color-blue)]/20 bg-white px-3 py-2.5 text-xs font-medium hover:bg-[var(--color-blue)]/[0.06] transition-colors"
              >
                + {name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {watchlists.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {watchlists.map(w => (
            <div key={w.id} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 shrink-0 text-[var(--color-blue)]" />
                  <span className="font-semibold text-sm">{w.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {w.isActive && (
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Active</span>
                  )}
                  <DeleteWatchlistButton watchlistId={w.id} />
                </div>
              </div>
              {w.description && <p className="mt-2 text-xs text-[var(--color-ink-dim)]">{w.description}</p>}
              <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--color-ink-faint)]">
                <span className="rounded-full border border-[var(--color-line)] bg-[#F8F9FB] px-2 py-0.5">
                  {WATCH_TYPE_LABELS[w.watchType] ?? w.watchType}
                </span>
                {w.alertOnChange && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Bell className="h-3 w-3" /> Alerts on
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg-2)]/40 py-16">
          <Bell className="h-10 w-10 text-[var(--color-blue)] opacity-40" />
          <div className="text-center">
            <p className="font-semibold text-sm">No watchlists yet</p>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)]">Create watchlists to monitor regulators, countries, and topics that matter to your organization.</p>
          </div>
          <Link href="/regulatory-intelligence/watchlists/new" className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Create Watchlist
          </Link>
        </div>
      )}
    </div>
  );
}
