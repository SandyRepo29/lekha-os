export const dynamic = "force-dynamic";

import { CreditCard, Zap, Building2, FileText, Download } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getBillingOverview, seedDefaultPlans, ensureStarterSubscription } from "@/lib/services/billing-service";
import { TrialBanner } from "@/components/billing/trial-banner";
import { RequestUpgradeModal } from "@/components/billing/request-upgrade-modal";
import { CancelModal } from "@/components/billing/cancel-modal";
import { MarkPaidForm } from "@/components/billing/mark-paid-form";

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  Growth: ["10 users", "All Core GRC modules", "DPDP Privacy™ & Contract Governance™", "Trust Intelligence™", "5 compliance frameworks", "Governance Copilot™ AI"],
  Business: ["50 users", "All 32 modules", "Governance Agent Framework™", "Continuous Compliance™", "Security Command Center™", "Integration Hub™ (35+ connectors)", "Auditor Collaboration™"],
  Enterprise: ["Unlimited users", "Customer Managed Encryption", "Custom SAML/OIDC SSO", "Dedicated Governance Agents™", "Custom frameworks & controls", "SLA guarantees", "Dedicated success manager"],
};

const STATUS_COLORS: Record<string, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  trial: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  cancelled: "border-red-500/30 bg-red-500/10 text-red-400",
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  sent: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  draft: "border-white/20 bg-white/5 text-white/40",
  void: "border-red-500/30 bg-red-500/10 text-red-400",
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

  await seedDefaultPlans();
  await ensureStarterSubscription(session.org.id);

  const overview = await getBillingOverview(session.org.id);
  const { subscription, usage, invoices } = overview;
  const plan = subscription?.plan;

  const isTrial = subscription?.status === "trial";
  const isOwnerOrAdmin = session.org.role === "owner" || session.org.role === "admin";
  const canUpgrade = plan?.name === "Growth" || isTrial;

  const daysLeft = subscription?.currentPeriodEnd
    ? Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Billing</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Manage your subscription, invoices, and usage.</p>
      </div>

      {/* Trial banner */}
      {isTrial && daysLeft !== null && daysLeft <= 7 && (
        <TrialBanner daysLeft={daysLeft} periodEnd={subscription?.currentPeriodEnd ?? null} />
      )}

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
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[subscription?.status ?? "trial"] ?? STATUS_COLORS.trial}`}>
                  {subscription?.status ?? "Trial"}
                </span>
                {isTrial && daysLeft !== null && (
                  <span className="text-xs text-amber-400">
                    {daysLeft <= 0 ? "Trial expired" : `${daysLeft}d left`}
                  </span>
                )}
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
            {subscription?.requestedPlan && (
              <p className="text-xs text-amber-400">
                Upgrade to {subscription.requestedPlan} pending payment.
              </p>
            )}
            {subscription?.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
              <p className="text-xs text-red-400">
                Cancellation scheduled — access until {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-IN")}.
              </p>
            )}
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
            <UsageMeter label="Team members" used={usage.users} max={plan?.maxUsers ?? 10} />
            <UsageMeter label="Vendors" used={usage.vendors} max={plan?.maxVendors ?? 100} />
            <UsageMeter label="Storage" used={0} max={plan?.maxStorageGb ?? 10} />
          </CardContent>
        </Card>
      </div>

      {/* Upgrade CTA */}
      {canUpgrade && isOwnerOrAdmin && (
        <Card className="border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.04] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Upgrade to Business</h3>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Get all 32 modules, 50 users, Governance Agent Framework™, Continuous Compliance™, Security Command Center™, and 35+ integrations. $6,999/year.
          </p>
          <div className="mt-4">
            <RequestUpgradeModal
              currentPlan={plan?.name ?? "Growth"}
              userEmail={session.email}
              userName={session.orgName}
            />
          </div>
        </Card>
      )}
      {plan?.name === "Business" && isOwnerOrAdmin && (
        <Card className="border-purple-500/30 bg-purple-500/[0.04] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Need more? Go Enterprise</h3>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Unlimited users, Customer Managed Encryption, custom SSO, dedicated success manager, and on-premise deployment options.
          </p>
          <div className="mt-4 flex gap-3 items-center">
            <RequestUpgradeModal
              currentPlan="Business"
              userEmail={session.email}
              userName={session.orgName}
            />
            <a href="mailto:sales@audt.tech" className="text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
              or email sales@audt.tech
            </a>
          </div>
        </Card>
      )}

      {/* Payment method */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <Building2 className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Payment method</span>
        </div>
        <Card>
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">
                Bank Transfer
              </span>
              <span className="text-sm text-[var(--color-ink-dim)]">Manual wire / NEFT / RTGS / IMPS</span>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-[var(--color-line)] p-4 text-sm space-y-1.5">
              <p className="text-[var(--color-ink-dim)]"><span className="text-[var(--color-ink-faint)] w-32 inline-block">Account Name</span>AUDT Technologies Pvt. Ltd.</p>
              <p className="text-xs text-[var(--color-ink-faint)] mt-2">After transfer, email the UTR/transaction ID to <a href="mailto:billing@audt.tech" className="text-indigo-400 hover:underline">billing@audt.tech</a> with your invoice number. Subscription activates within 24 hours.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice history */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <FileText className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Invoices</span>
        </div>
        <Card>
          {invoices.length === 0 ? (
            <CardContent className="py-8 text-center">
              <p className="text-sm text-[var(--color-ink-dim)]">No invoices yet. Request an upgrade above to generate your first invoice.</p>
            </CardContent>
          ) : (
            <CardContent className="pt-4 pb-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-line)]">
                    <th className="text-left py-2 text-xs text-[var(--color-ink-faint)] font-medium">Invoice</th>
                    <th className="text-left py-2 text-xs text-[var(--color-ink-faint)] font-medium">Plan</th>
                    <th className="text-left py-2 text-xs text-[var(--color-ink-faint)] font-medium">Amount</th>
                    <th className="text-left py-2 text-xs text-[var(--color-ink-faint)] font-medium">Status</th>
                    <th className="text-left py-2 text-xs text-[var(--color-ink-faint)] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-[var(--color-line)] last:border-0">
                      <td className="py-3">
                        <div className="font-medium text-[var(--color-ink)]">{inv.invoiceNumber}</div>
                        <div className="text-xs text-[var(--color-ink-faint)]">
                          {new Date(inv.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </td>
                      <td className="py-3 text-[var(--color-ink-dim)]">{inv.planName ?? "—"}</td>
                      <td className="py-3 font-medium text-[var(--color-ink)]">
                        ${(inv.amountCents / 100).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${INVOICE_STATUS_COLORS[inv.status] ?? INVOICE_STATUS_COLORS.draft}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/api/v1/invoices/${inv.id}/pdf`}
                            target="_blank"
                            className="flex items-center gap-1 text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors"
                          >
                            <Download className="h-3 w-3" /> PDF
                          </Link>
                          {isOwnerOrAdmin && inv.status === "sent" && (
                            <MarkPaidForm invoiceId={inv.id} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Cancel subscription */}
      {isOwnerOrAdmin && subscription && subscription.status === "active" && !subscription.cancelAtPeriodEnd && (
        <div className="flex justify-center pt-2">
          <CancelModal periodEnd={subscription.currentPeriodEnd ?? null} />
        </div>
      )}
    </div>
  );
}
