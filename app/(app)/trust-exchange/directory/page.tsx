export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getDirectory } from "@/lib/services/trust-exchange/trust-exchange-service";
import { Card } from "@/components/ui/card";
import { Globe, ShieldCheck, TrendingUp, Building2, MapPin } from "lucide-react";
import Link from "next/link";

function TrustScoreRing({ score }: { score: number | null }) {
  if (score === null) return (
    <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center text-xs text-[var(--color-ink-faint)]">—</div>
  );
  const color = score >= 90 ? "border-green-500 text-green-400" : score >= 70 ? "border-yellow-500 text-yellow-400" : "border-red-500 text-red-400";
  return (
    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold ${color}`}>{score}</div>
  );
}

export default async function TrustDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requireUser();
  const params = await searchParams;

  const profiles = await getDirectory({
    industry: params.industry || undefined,
    country: params.country || undefined,
    minTrustScore: params.minScore ? parseInt(params.minScore) : undefined,
    riskLevel: params.riskLevel || undefined,
  });

  const industries = [...new Set(profiles.map((p) => p.industry).filter(Boolean))] as string[];
  const countries = [...new Set(profiles.map((p) => p.country).filter(Boolean))] as string[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vendor Directory™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          Discover verified vendors. Filter by industry, country, trust score, and certifications.
        </p>
      </div>

      {/* Filters */}
      <form method="get" className="flex flex-wrap gap-3">
        <select name="industry" defaultValue={params.industry ?? ""} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-blue)]">
          <option value="">All Industries</option>
          {industries.map((i) => <option key={i} value={i}>{i.replace(/_/g, " ")}</option>)}
        </select>
        <select name="country" defaultValue={params.country ?? ""} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-blue)]">
          <option value="">All Countries</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select name="minScore" defaultValue={params.minScore ?? ""} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-blue)]">
          <option value="">Any Trust Score</option>
          <option value="90">Trust Score ≥ 90</option>
          <option value="80">Trust Score ≥ 80</option>
          <option value="70">Trust Score ≥ 70</option>
        </select>
        <select name="riskLevel" defaultValue={params.riskLevel ?? ""} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-blue)]">
          <option value="">Any Risk Level</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
        </select>
        <button type="submit" className="px-4 py-2 rounded-lg bg-[var(--color-blue)] text-white text-sm font-medium">Apply</button>
        <Link href="/trust-exchange/directory" className="px-4 py-2 rounded-lg border border-[var(--color-line)] text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">Clear</Link>
      </form>

      <p className="text-sm text-[var(--color-ink-dim)]">{profiles.length} verified vendor{profiles.length !== 1 ? "s" : ""} found</p>

      {profiles.length === 0 ? (
        <Card className="p-12 text-center">
          <Globe className="h-12 w-12 text-[var(--color-ink-faint)] mx-auto mb-3" />
          <p className="font-medium">No public profiles yet</p>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">
            Be the first to publish your Trust Profile to the directory.
          </p>
          <Link href="/trust-exchange/my-profile" className="mt-4 inline-block text-sm text-[var(--color-blue)] hover:underline">
            Publish my profile →
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <Card key={p.id} className="p-5 hover:border-[var(--color-blue)]/40 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    {p.logoUrl ? (
                      <img src={p.logoUrl} alt="" className="w-8 h-8 rounded-lg object-contain" />
                    ) : (
                      <Building2 className="h-5 w-5 text-[var(--color-ink-dim)]" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-tight">{p.displayName}</p>
                  </div>
                </div>
                <TrustScoreRing score={p.trustScore} />
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.industry && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[var(--color-ink-dim)] capitalize">{p.industry.replace(/_/g, " ")}</span>
                )}
                {p.riskLevel && p.riskLevel !== "unknown" && (
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${p.riskLevel === "low" ? "bg-green-500/20 text-green-400" : p.riskLevel === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                    {p.riskLevel} risk
                  </span>
                )}
                {Array.isArray(p.certifications) && (p.certifications as string[]).slice(0, 2).map((cert: string) => (
                  <span key={cert} className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{cert}</span>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs text-[var(--color-ink-dim)]">
                {p.country && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.country}</span>
                )}
                {p.privacyScore !== null && (
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Privacy {p.privacyScore}</span>
                )}
                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {p.profileCompleteness}% complete</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
