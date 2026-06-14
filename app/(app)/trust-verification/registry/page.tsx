export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getPublicRegistry } from "@/lib/services/trust-verification/trust-verification-service";
import { Globe, ExternalLink, ShieldCheck, Search } from "lucide-react";

export default async function RegistryPage({ searchParams }: { searchParams: Promise<{ minScore?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const minScore = params.minScore ? Number(params.minScore) : undefined;
  const registry = await getPublicRegistry({ minScore }).catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Trust Registry™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Public searchable registry of AUDT-verified organizations.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2">
          <Globe className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">{registry.length} Verified</span>
        </div>
      </div>

      {/* Search / Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-faint)]" />
          <input placeholder="Search by organization, certificate ID…"
            className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-[var(--color-blue)]/50" />
        </div>
        <form>
          <select name="minScore" defaultValue={params.minScore ?? ""}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => e.target.form?.submit()}
            className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2.5 text-sm focus:outline-none">
            <option value="">All scores</option>
            <option value="80">Score ≥ 80</option>
            <option value="85">Score ≥ 85</option>
            <option value="90">Score ≥ 90</option>
          </select>
        </form>
      </div>

      {registry.length > 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-dim)] font-medium uppercase tracking-wider">
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Trust Score</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]/50">
              {registry.map((r: { id: string; displayName: string; industry?: string | null; programName: string; verificationLevel: string; trustScore?: number | null; publishedAt: string | Date; expiresAt?: string | Date | null; certificateId: string }) => (
                <tr key={r.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="font-medium">{r.displayName}</span>
                    </div>
                    {r.industry && <div className="text-xs text-[var(--color-ink-faint)] mt-0.5 pl-6">{r.industry}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">{r.programName}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">{r.verificationLevel.replace("level_","Level ")}</td>
                  <td className="px-4 py-3">
                    {r.trustScore != null ? (
                      <span className={`font-semibold ${r.trustScore >= 90 ? "text-emerald-400" : r.trustScore >= 80 ? "text-[var(--color-blue)]" : "text-amber-400"}`}>
                        {r.trustScore}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">{new Date(r.publishedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">{r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3">
                    <a href={`/verify/${r.certificateId}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[var(--color-blue)] hover:underline">
                      <ExternalLink className="h-3 w-3" /> Verify
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-12 text-center">
          <Globe className="mx-auto mb-4 h-10 w-10 text-[var(--color-ink-faint)]" />
          <div className="text-sm font-medium mb-1">Registry is empty</div>
          <p className="text-xs text-[var(--color-ink-dim)]">Verified organizations will appear here once certifications are approved and published.</p>
        </div>
      )}
    </div>
  );
}
