export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getApiCatalog } from "@/lib/services/trust-api/trust-api-service";
import { Globe, Zap, Shield, Brain, BarChart3, Network, FileCheck, TrendingUp } from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  trust: Globe, vendor: Shield, ai: Brain, benchmark: BarChart3,
  verification: FileCheck, network: Network, governance: TrendingUp, compliance: FileCheck,
};

const TIER_COLORS: Record<string, string> = {
  free: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  growth: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  business: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  enterprise: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const PLAN_LIMITS = {
  free:       { label: "Free",       daily: "100",     monthly: "1,000",   color: "text-emerald-400" },
  growth:     { label: "Growth",     daily: "1,000",   monthly: "10,000",  color: "text-blue-400"    },
  business:   { label: "Business",   daily: "5,000",   monthly: "50,000",  color: "text-violet-400"  },
  enterprise: { label: "Enterprise", daily: "Unlimited", monthly: "Unlimited", color: "text-amber-400" },
};

export default async function ApiCatalogPage() {
  await requireUser();
  const products = await getApiCatalog().catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-xs text-[var(--color-ink-faint)]">
            <Link href="/trust-api" className="hover:underline">Trust API Platform™</Link> / Catalog
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">API Product Catalog</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            {products.length} Trust API products — consume governance intelligence programmatically.
          </p>
        </div>
        <Link
          href="/trust-api/keys"
          className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          <Zap className="h-4 w-4" /> Get API Key
        </Link>
      </div>

      {/* Plan comparison */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(PLAN_LIMITS).map(([tier, info]) => (
          <div key={tier} className={`rounded-2xl border p-4 ${TIER_COLORS[tier]}`}>
            <div className={`text-sm font-bold ${info.color}`}>{info.label}</div>
            <div className="mt-2 text-xs text-[var(--color-ink-dim)]">{info.daily} req/day</div>
            <div className="text-xs text-[var(--color-ink-faint)]">{info.monthly}/month</div>
          </div>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {products.map(p => {
          const Icon = CATEGORY_ICONS[p.category] ?? Globe;
          const tierInfo = PLAN_LIMITS[p.tier as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;
          const endpoints = (p.endpoints ?? []) as string[];
          return (
            <div key={p.id} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06]">
                    <Icon className="h-5 w-5 text-[var(--color-blue)]" />
                  </span>
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{p.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${TIER_COLORS[p.tier]}`}>
                    {tierInfo.label}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    p.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                    p.status === "beta"   ? "bg-amber-500/10 text-amber-400" :
                    "bg-white/5 text-[var(--color-ink-faint)]"
                  }`}>
                    {p.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                {endpoints.map((ep, i) => (
                  <code key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-1.5 text-[11px] font-mono text-[var(--color-ink-dim)]">
                    <span className="text-emerald-400 font-semibold">GET</span> {ep}
                  </code>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-[var(--color-ink-faint)]">
                  {p.rateLimitPerDay.toLocaleString()}/day · {p.rateLimitPerMonth.toLocaleString()}/month
                </span>
                <span className="text-[var(--color-ink-faint)]">API {p.version}</span>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-12 text-center">
          <Globe className="mx-auto mb-3 h-10 w-10 text-[var(--color-ink-faint)]" />
          <p className="text-sm font-medium">API catalog loading</p>
          <p className="mt-1 text-xs text-[var(--color-ink-faint)]">Run the migration to seed the product catalog.</p>
        </div>
      )}
    </div>
  );
}
