export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/trust-api/trust-api-service";
import {
  Zap, Key, Webhook, BarChart3, Code2, BookOpen, Bot, ArrowRight,
  Globe, TrendingUp, Activity, Sparkles,
} from "lucide-react";
import { TrustAPIStat, ApiKeyStatusBadge, ApiPlanBadge } from "@/components/trust-api/trust-api-ui";

const NAV = [
  { href: "/trust-api/catalog",  icon: Globe,     label: "API Catalog",       description: "Browse 8 Trust API products" },
  { href: "/trust-api/portal",   icon: BookOpen,  label: "Developer Portal™", description: "Docs, SDKs, sandbox & explorer" },
  { href: "/trust-api/keys",     icon: Key,       label: "API Keys",          description: "Manage keys & registered clients" },
  { href: "/trust-api/webhooks", icon: Webhook,   label: "Webhook Platform™", description: "Subscribe to trust events" },
  { href: "/trust-api/usage",    icon: BarChart3, label: "API Analytics™",    description: "Usage metrics & error tracking" },
  { href: "/trust-api/ai",       icon: Bot,       label: "AI API Advisor™",   description: "AI docs, integration guidance & chat" },
];

const EVENTS = [
  "trust.score.updated", "vendor.verified", "badge.issued",
  "risk.created", "audit.completed", "ai.trust.updated",
];

export default async function TrustApiPage() {
  const session = await requireUser();
  const dash = await getDashboardData(session.org?.id ?? "").catch(() => null);
  const metrics = dash?.metrics;
  const products = dash?.products ?? [];

  const successRate = metrics && metrics.totalCalls30d > 0
    ? Math.round(((metrics.totalCalls30d - metrics.errorCalls30d) / metrics.totalCalls30d) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Trust API Platform™
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Transform AUDT into Trust Infrastructure — expose governance intelligence to your ecosystem.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/trust-api/ai" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-white/[0.04] transition-colors">
            <Sparkles className="h-3.5 w-3.5" />
            AI API Builder&#8482;
          </Link>
          <Link
            href="/trust-api/portal"
            className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-2 text-sm font-medium hover:bg-white/[0.07] transition-colors"
          >
            <BookOpen className="h-4 w-4" /> Docs
          </Link>
          <Link
            href="/trust-api/keys"
            className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            <Key className="h-4 w-4" /> Issue API Key
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <TrustAPIStat label="API Clients"  value={metrics?.totalClients ?? 0}                         sub={`${metrics?.activeClients ?? 0} active`}          accent="neutral" href="/trust-api/keys" />
        <TrustAPIStat label="Active Keys"  value={metrics?.activeKeys ?? 0}                            sub={`${metrics?.totalKeys ?? 0} total`}               accent="good"    href="/trust-api/keys" />
        <TrustAPIStat label="Calls (30d)"  value={(metrics?.totalCalls30d ?? 0).toLocaleString()}      sub={`${successRate}% success rate`}                   accent="neutral" href="/trust-api/usage" />
        <TrustAPIStat label="Webhooks"     value={metrics?.activeWebhooks ?? 0}                        sub={`${metrics?.totalWebhooks ?? 0} registered`}      accent="warn"    href="/trust-api/webhooks" />
      </div>

      {/* Module Nav */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-[var(--color-ink-dim)] uppercase tracking-wider">Platform Modules</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NAV.map(({ href, icon: Icon, label, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5 transition-colors hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/[0.04]"
            >
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06]">
                <Icon className="h-5 w-5 text-[var(--color-blue)]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm">{label}</span>
                  <ArrowRight className="h-4 w-4 text-[var(--color-ink-faint)] transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Available APIs */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm">API Product Catalog</h3>
            <Link href="/trust-api/catalog" className="text-xs text-[var(--color-blue)] hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {products.slice(0, 6).map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-[var(--color-line)]/60 bg-white/[0.02] px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">{p.rateLimitPerDay.toLocaleString()} req/day · {p.tier}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  p.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                  p.status === "beta"   ? "bg-amber-500/10 text-amber-400" :
                  "bg-white/5 text-[var(--color-ink-faint)]"
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
            {products.length === 0 && (
              <p className="py-4 text-center text-xs text-[var(--color-ink-faint)]">API products loading…</p>
            )}
          </div>
        </div>

        {/* Webhook Events */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Webhook Events</h3>
            <Link href="/trust-api/webhooks" className="text-xs text-[var(--color-blue)] hover:underline">Manage →</Link>
          </div>
          <div className="space-y-2">
            {EVENTS.map(event => (
              <div key={event} className="flex items-center gap-3 rounded-xl border border-[var(--color-line)]/60 bg-white/[0.02] px-3 py-2.5">
                <Zap className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                <code className="text-xs font-mono text-[var(--color-ink-dim)]">{event}</code>
              </div>
            ))}
          </div>

          {/* Strategic callout */}
          <div className="mt-4 rounded-xl border border-[var(--color-blue)]/25 bg-[var(--color-blue)]/[0.06] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-blue)]">
              <TrendingUp className="h-3.5 w-3.5" /> Strategic Vision
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-ink-dim)]">
              AUDT → Trust Infrastructure. APIs make your governance data consumable by procurement systems, ERP platforms, and partner ecosystems.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Clients */}
      {(metrics?.recentClients?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Recent API Clients</h3>
            <Link href="/trust-api/keys" className="text-xs text-[var(--color-blue)] hover:underline">Manage →</Link>
          </div>
          <div className="divide-y divide-[var(--color-line)]/50">
            {metrics!.recentClients.map((c: { id: string; name: string; clientType: string; plan: string; status: string }) => (
              <div key={c.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-[var(--color-ink-faint)]">{c.clientType} · <ApiPlanBadge plan={c.plan} /></div>
                </div>
                <ApiKeyStatusBadge status={c.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
