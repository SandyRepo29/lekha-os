export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getRegulations } from "@/lib/services/regulatory-intelligence/regulatory-service";
import { RegSubNav, RegStat, CategoryBadge } from "@/components/regulatory-intelligence/reg-ui";
import { BookOpen, Plus, Globe, Shield, Lock, Brain } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";

export default async function RegLibraryPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const sp = await searchParams;
  const search = sp.search?.toLowerCase() ?? "";
  let regs = await getRegulations(orgId).catch(() => []);
  if (search) regs = regs.filter(r => r.name.toLowerCase().includes(search) || (r.shortName ?? "").toLowerCase().includes(search));

  const byCategory = regs.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + 1;
    return acc;
  }, {});

  const active = regs.filter(r => r.status === "active").length;
  const applicable = regs.filter(r => r.isApplicable).length;

  return (
    <div className="space-y-6 p-6">
      <RegSubNav />

      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Regulation Library™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Central repository of all applicable regulations across jurisdictions and industries.</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput placeholder="Search regulations&#8230;" />
          <Link
            href="/regulatory-intelligence/library/new"
            className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add Regulation
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RegStat label="Total Regulations" value={regs.length}  accent="neutral" />
        <RegStat label="Active"            value={active}       accent="good" />
        <RegStat label="Applicable"        value={applicable}   accent="purple" />
        <RegStat label="Categories"        value={Object.keys(byCategory).length} accent="neutral" />
      </div>

      {/* Category Breakdown */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h3 className="mb-3 text-sm font-semibold">By Category</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(byCategory).map(([cat, cnt]) => (
            <div key={cat} className="flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5">
              <CategoryBadge category={cat} />
              <span className="text-xs font-medium">{cnt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Regulation Table */}
      {regs.length > 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-[var(--color-ink-faint)]">
                  <th className="px-4 py-3 text-left font-medium">Regulation</th>
                  <th className="px-4 py-3 text-left font-medium">Authority</th>
                  <th className="px-4 py-3 text-left font-medium">Country</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Version</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]/40">
                {regs.map(r => (
                  <tr key={r.id} className="hover:bg-white transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{r.shortName ?? r.name}</div>
                      <div className="mt-0.5 text-[var(--color-ink-faint)] max-w-[220px] truncate">{r.name}</div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">{r.authority ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3 text-[var(--color-ink-faint)]" />
                        <span className="text-[var(--color-ink-dim)]">{r.country ?? "Global"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><CategoryBadge category={r.category} /></td>
                    <td className="px-4 py-3 text-[var(--color-ink-faint)]">{r.version ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        r.status === "active" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : r.status === "retired" ? "bg-white/10 text-[var(--color-ink-faint)] border-[var(--color-line)]"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg-2)]/40 py-16">
          <BookOpen className="h-10 w-10 text-[var(--color-blue)] opacity-40" />
          <div className="text-center">
            <p className="font-semibold text-sm">No regulations in library</p>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)]">18 built-in regulations are seeded at setup. Run the seed script to populate.</p>
          </div>
        </div>
      )}
    </div>
  );
}
