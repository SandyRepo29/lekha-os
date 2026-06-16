export const dynamic = "force-dynamic";

import { CreditCard, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getBillingOverview, seedDefaultPlans, ensureStarterSubscription } from "@/lib/services/billing-service";

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  Growth: ["10 users", "All Core GRC modules", "DPDP Privacy™ & Contract Governance™", "Trust Intelligence™", "5 compliance frameworks", "Governance Copilot™ AI"],
  Business: ["50 users", "All 32 modules", "Governance Agent Framework™", "Continuous Compliance™", "Security Command Center™", "Integration Hub™ (35+ connectors)", "Auditor Collaboration™"],
  Enterprise: ["Unlimited users", "Customer Managed Encryption", "Custom SAML/OIDC SSO", "Dedicated Governance Agents™", "Custom frameworks & controls", "SLA guarantees", "Dedicated success manager"],
};

function UsageMeter({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-[var(--color-blue)]";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-[var(--color-ink-dim)]">{label}</span>
        <span className="font-semibold text-[var(--color-ink)]">{used} / {max >= 9999 ? "∞" : max}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${max >= 9999 ? 10 : pct}%` }} />
      </div>
    </div>
  );
}

export default async function BillingPage() {
  const session = await requireUser();

  if (!session.org) {
    return <div className="text-[var(--color-ink-dim)]">No organization found.</div>;
  }

  // Ensure plans exist and org has a subscription
  await seedDefaultPlans();
  await ensureStarterSubscription(session.org.id);

  const overview = await getBillingOverview(session.org.id);
  const { subscription, usage } = overview;
  const plan = subscription?.plan;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Billing</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Manage your subscription and usage.</p>
      </div>

      {/* Current plan */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <CreditCard className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Current plan</span>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <span>{plan?.name ?? "Growth"}</span>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  subscription?.status === "active"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                }`}>
                  {subscription?.status ?? "Trial"}
                </span>
              </CardTitle>
              {plan?.priceYearly === 0 ? (
                <span className="text-sm text-[var(--color-ink-dim)]">Custom pricing</span>
              ) : plan?.priceYearly ? (
                <div className="text-right">
                  <div className="text-sm font-semibold text-[var(--color-ink)]">${plan.priceYearly.toLocaleString()}/yr</div>
                  <div className="text-xs text-[var(--color-ink-faint)]">${plan.priceMonthly}/mo billed annually</div>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--color-ink-dim)]">{plan?.description}</p>
            <div className="flex flex-wrap gap-2">
              {(PLAN_HIGHLIGHTS[plan?.name ?? "Growth"] ?? []).map((f) => (
                <span key={f} className="rounded-full border border-[var(--color-line)] bg-white/[0.03] px-2.5 py-0.5 text-xs text-[var(--color-ink-dim)]">
                  {f}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <Zap className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Usage</span>
        </div>
        <Card>
          <CardContent className="space-y-4 pt-5">
            <UsageMeter label="Team members" used={usage.users} max={plan?.maxUsers ?? 5} />
            <UsageMeter label="Vendors" used={usage.vendors} max={plan?.maxVendors ?? 10} />
            <UsageMeter label="Storage" used={0} max={plan?.maxStorageGb ?? 1} />
          </CardContent>
        </Card>
      </div>

      {/* Upgrade CTA */}
      {plan?.name === "Growth" && (
        <Card className="border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.04] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Upgrade to Business</h3>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Get all 32 modules, 50 users, Governance Agent Framework™, Continuous Compliance™, Security Command Center™, and 35+ integrations. Starting at $6,999/year.
          </p>
          <button className="mt-4 rounded-xl bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white opacity-80 cursor-not-allowed">
            Upgrade plan — coming soon
          </button>
        </Card>
      )}
      {plan?.name === "Business" && (
        <Card className="border-purple-500/30 bg-purple-500/[0.04] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Need more? Go Enterprise</h3>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Unlimited users, Customer Managed Encryption, custom SSO, dedicated success manager, and on-premise deployment options.
          </p>
          <a href="mailto:sales@audt.tech" className="mt-4 inline-block rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white">
            Talk to Sales
          </a>
        </Card>
      )}

      {/* Invoice history */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <CreditCard className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Invoices</span>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-[var(--color-ink-dim)]">No invoices yet. Invoice history will appear here once you have an active paid subscription.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
