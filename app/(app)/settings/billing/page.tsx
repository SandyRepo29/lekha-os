export const dynamic = "force-dynamic";

import {
  CreditCard,
  Zap,
  Building2,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getSubscriptionStatus } from "@/lib/services/billing/subscription-engine";
import {
  listInvoicesByOrg,
  getOrgCredits,
  getPrimaryBankDetails,
} from "@/lib/repositories/billing-engine-repo";
import { getBillingOverview, seedDefaultPlans, ensureStarterSubscription } from "@/lib/services/billing-service";

// ─── Plan highlights ──────────────────────────────────────────────────────────

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  Starter: [
    "5 users",
    "Vendor Hub&#8482; (50 vendors)",
    "Evidence Vault&#8482;",
    "Basic compliance frameworks",
    "Community support",
  ],
  Growth: [
    "10 users",
    "All Core GRC modules",
    "DPDP Privacy&#8482; &amp; Contract Governance&#8482;",
    "Trust Intelligence&#8482;",
    "5 compliance frameworks",
    "Governance Copilot&#8482; AI",
  ],
  Business: [
    "50 users",
    "All 32 modules",
    "Governance Agent Framework&#8482;",
    "Continuous Compliance&#8482;",
    "Security Command Center&#8482;",
    "Integration Hub&#8482; (35+ connectors)",
    "Auditor Collaboration&#8482;",
  ],
  Enterprise: [
    "Unlimited users",
    "Customer Managed Encryption",
    "Custom SAML/OIDC SSO",
    "Dedicated Governance Agents&#8482;",
    "Custom frameworks &amp; controls",
    "SLA guarantees",
    "Dedicated success manager",
  ],
};

// ─── Status colours ───────────────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { color: string; label: string; icon: React.ReactNode }
> = {
  trial: {
    color: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    label: "Trial",
    icon: <Clock className="h-3 w-3" />,
  },
  active: {
    color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    label: "Active",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  grace_period: {
    color: "border-red-500/30 bg-red-500/10 text-red-400",
    label: "Grace Period",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  suspended: {
    color: "border-red-500/30 bg-red-500/10 text-red-400",
    label: "Suspended",
    icon: <XCircle className="h-3 w-3" />,
  },
  expired: {
    color: "border-white/20 bg-white/5 text-white/50",
    label: "Expired",
    icon: <XCircle className="h-3 w-3" />,
  },
  cancelled: {
    color: "border-white/20 bg-white/5 text-white/50",
    label: "Cancelled",
    icon: <XCircle className="h-3 w-3" />,
  },
  enterprise: {
    color: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    label: "Enterprise",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  sent: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  overdue: "border-red-500/30 bg-red-500/10 text-red-400",
  draft: "border-white/20 bg-white/5 text-white/40",
  void: "border-white/20 bg-white/5 text-white/40",
  cancelled: "border-white/20 bg-white/5 text-white/40",
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function UsageMeter({
  label,
  used,
  max,
  unit = "",
}: {
  label: string;
  used: number;
  max: number;
  unit?: string;
}) {
  const unlimited = max >= 9999;
  const pct = unlimited ? 8 : max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const color =
    pct >= 90
      ? "bg-red-500"
      : pct >= 70
      ? "bg-amber-500"
      : "bg-[var(--color-blue)]";
  const displayMax = unlimited ? "&#8734;" : `${max}${unit}`;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-[var(--color-ink-dim)]">{label}</span>
        <span className="font-semibold text-[var(--color-ink)]">
          {used}{unit} /{" "}
          <span dangerouslySetInnerHTML={{ __html: displayMax }} />
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.trial;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

function SectionLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-[var(--color-ink-faint)]">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
        {label}
      </span>
    </div>
  );
}

function fmtINR(cents: number): string {
  const rupees = cents / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

function fmtUSD(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatAmt(amountCents: number, currency: string): string {
  const upper = (currency ?? "USD").toUpperCase();
  if (upper === "INR") return fmtINR(amountCents);
  return fmtUSD(amountCents);
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "&#8212;";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BillingPage() {
  const session = await requireUser();

  if (!session.org) {
    return (
      <div className="text-[var(--color-ink-dim)]">No organization found.</div>
    );
  }

  const orgId = session.org.id;

  // Ensure plans + starter sub exist (idempotent seeds)
  await seedDefaultPlans();
  await ensureStarterSubscription(orgId);

  // Load data in parallel
  const [statusResult, overview, invoiceRows, bankDetails] = await Promise.all([
    getSubscriptionStatus(orgId),
    getBillingOverview(orgId),
    listInvoicesByOrg(orgId).then((rows) => rows.slice(0, 10)).catch(() => []),
    getPrimaryBankDetails().catch(() => null),
  ]);

  // Credits (optional — zero if repo function not wired yet)
  let creditBalanceCents = 0;
  try {
    const credits = await getOrgCredits(orgId);
    creditBalanceCents = (credits as Record<string, unknown>)?.balanceCents as number ?? 0;
  } catch {
    creditBalanceCents = 0;
  }

  const { subscription, daysUntilExpiry, isActive } = statusResult;
  const plan = overview.subscription?.plan;
  const usage = overview.usage;

  const status = (subscription?.status ?? "trial") as string;
  const isTrial = status === "trial";
  const isGracePeriod = status === "grace_period";
  const isSuspended = status === "suspended" || status === "expired" || status === "cancelled";

  const isOwnerOrAdmin =
    session.org.role === "owner" || session.org.role === "admin";

  const periodEnd = subscription?.currentPeriodEnd ?? null;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Heading */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Billing
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)]">
          Manage your subscription, usage, invoices, and payment details.
        </p>
      </div>

      {/* ── Trial expiry banner ── */}
      {isTrial && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-amber-300">
              {daysUntilExpiry !== null && daysUntilExpiry > 0
                ? `Your trial ends in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`
                : "Your trial has expired"}
            </p>
            <p className="text-xs text-amber-400/80">
              {periodEnd
                ? `Trial period ends ${fmtDate(periodEnd)}.`
                : "Contact us to extend your trial."}{" "}
              Upgrade now to keep full access to all 32 governance modules.
            </p>
          </div>
          <Link
            href="/settings/billing/upgrade"
            className="shrink-0 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            Upgrade to continue
          </Link>
        </div>
      )}

      {/* ── Grace period banner ── */}
      {isGracePeriod && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-red-300">
              Payment overdue &#8212; grace period active
            </p>
            <p className="text-xs text-red-400/80">
              Your account access ends{" "}
              {periodEnd ? fmtDate(periodEnd) : "soon"}.
              Pay your outstanding invoice immediately to avoid suspension.
            </p>
          </div>
          <a
            href="mailto:finance@audt.tech"
            className="shrink-0 rounded-xl bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-400 transition-colors"
          >
            Pay Now
          </a>
        </div>
      )}

      {/* ── Suspended / expired banner ── */}
      {isSuspended && (
        <div className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/[0.03] p-4">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              Subscription {status}
            </p>
            <p className="text-xs text-[var(--color-ink-dim)]">
              Your subscription is no longer active. Contact{" "}
              <a href="mailto:finance@audt.tech" className="text-indigo-400 hover:underline">
                finance@audt.tech
              </a>{" "}
              to reactivate.
            </p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* Section 1: Current Plan                                                */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <SectionLabel
          icon={<CreditCard className="h-4 w-4" />}
          label="Current Plan"
        />
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex flex-wrap items-center gap-3">
                <span>{plan?.name ?? "Growth"}</span>
                <StatusBadge status={status} />

                {/* Trial pill */}
                {isTrial && daysUntilExpiry !== null && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                    {daysUntilExpiry <= 0
                      ? "Trial expired"
                      : `${daysUntilExpiry} days remaining`}
                  </span>
                )}

                {/* Active renewal pill */}
                {status === "active" && periodEnd && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    Renews {fmtDate(periodEnd)}
                  </span>
                )}

                {/* Grace period pill */}
                {isGracePeriod && periodEnd && (
                  <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                    Access ends {fmtDate(periodEnd)}
                  </span>
                )}
              </CardTitle>

              {/* Pricing */}
              {plan?.priceYearly === 0 ? (
                <span className="text-sm text-[var(--color-ink-dim)]">
                  Custom pricing
                </span>
              ) : plan?.priceYearly ? (
                <div className="text-right">
                  <div className="text-sm font-semibold text-[var(--color-ink)]">
                    ${plan.priceYearly.toLocaleString()}/yr
                  </div>
                  <div className="text-xs text-[var(--color-ink-faint)]">
                    ${plan.priceMonthly}/mo billed annually
                  </div>
                </div>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {plan?.description && (
              <p className="text-sm text-[var(--color-ink-dim)]">
                {plan.description}
              </p>
            )}

            {/* Features */}
            <div className="flex flex-wrap gap-2">
              {(
                PLAN_HIGHLIGHTS[plan?.name ?? "Growth"] ??
                PLAN_HIGHLIGHTS.Growth
              ).map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-[var(--color-line)] bg-white/[0.03] px-2.5 py-0.5 text-xs text-[var(--color-ink-dim)]"
                  dangerouslySetInnerHTML={{ __html: f }}
                />
              ))}
            </div>

            {/* Pending upgrade notice */}
            {subscription?.requestedPlan && (
              <p className="text-xs text-amber-400">
                Upgrade to {subscription.requestedPlan} pending payment
                confirmation.
              </p>
            )}

            {/* Cancel at period end notice */}
            {subscription?.cancelAtPeriodEnd && periodEnd && (
              <p className="text-xs text-red-400">
                Cancellation scheduled &#8212; access until {fmtDate(periodEnd)}.
              </p>
            )}

            {/* Upgrade button */}
            {isOwnerOrAdmin && (
              <div className="pt-1">
                <Link
                  href="/settings/billing/upgrade"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-blue)]/40 bg-[var(--color-blue)]/10 px-4 py-2 text-sm font-medium text-[var(--color-blue)] hover:bg-[var(--color-blue)]/20 transition-colors"
                >
                  Upgrade Plan
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* Section 2: Usage Meters                                                */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <SectionLabel icon={<Zap className="h-4 w-4" />} label="Usage" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Team members */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
                Team Members
              </p>
              <UsageMeter
                label=""
                used={usage.users}
                max={plan?.maxUsers ?? 10}
              />
              <p className="mt-2 text-center text-xs text-[var(--color-ink-faint)]">
                {usage.users} of {plan?.maxUsers ?? 10} seats used
              </p>
            </CardContent>
          </Card>

          {/* Vendors */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
                Vendors
              </p>
              <UsageMeter
                label=""
                used={usage.vendors}
                max={plan?.maxVendors ?? 100}
              />
              <p className="mt-2 text-center text-xs text-[var(--color-ink-faint)]">
                {usage.vendors} of {plan?.maxVendors ?? 100} vendors
              </p>
            </CardContent>
          </Card>

          {/* Storage */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
                Storage
              </p>
              <UsageMeter
                label=""
                used={0}
                max={plan?.maxStorageGb ?? 10}
                unit=" GB"
              />
              <p className="mt-2 text-center text-xs text-[var(--color-ink-faint)]">
                0 of {plan?.maxStorageGb ?? 10} GB used
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* Section 3: Credit Balance (only when > 0)                              */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {creditBalanceCents > 0 && (
        <div className="space-y-1.5">
          <SectionLabel
            icon={<Wallet className="h-4 w-4" />}
            label="Credit Balance"
          />
          <Card className="border-emerald-500/20 bg-emerald-500/[0.04]">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                <Wallet className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-300">
                  {fmtINR(creditBalanceCents)}
                </p>
                <p className="text-xs text-emerald-400/70">
                  in account credits &#8212; applied automatically to your next
                  invoice
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* Section 4: Invoices & Payments                                          */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <SectionLabel
          icon={<FileText className="h-4 w-4" />}
          label="Invoices &amp; Payments"
        />
        <Card>
          {invoiceRows.length === 0 ? (
            <CardContent className="py-10 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-[var(--color-ink-faint)]" />
              <p className="text-sm text-[var(--color-ink-dim)]">
                No invoices yet.
              </p>
              <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
                Upgrade your plan above to generate your first invoice.
              </p>
            </CardContent>
          ) : (
            <CardContent className="pb-2 pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-line)]">
                      <th className="py-2 text-left text-xs font-medium text-[var(--color-ink-faint)]">
                        Invoice
                      </th>
                      <th className="py-2 text-left text-xs font-medium text-[var(--color-ink-faint)]">
                        Date
                      </th>
                      <th className="py-2 text-left text-xs font-medium text-[var(--color-ink-faint)]">
                        Amount
                      </th>
                      <th className="py-2 text-left text-xs font-medium text-[var(--color-ink-faint)]">
                        Status
                      </th>
                      <th className="py-2 text-left text-xs font-medium text-[var(--color-ink-faint)]">
                        &nbsp;
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceRows.map((inv) => {
                      const invAny = inv as Record<string, unknown>;
                      const invStatus = String(invAny.status ?? "sent");
                      const invNumber = String(invAny.invoiceNumber ?? invAny.invoice_number ?? "");
                      const invDate = invAny.createdAt ?? invAny.created_at;
                      const invCents = Number(invAny.amountCents ?? invAny.amount_cents ?? 0);
                      const invCurrency = String(invAny.currency ?? "INR");
                      const invId = String(invAny.id ?? "");
                      const invPdfUrl = invAny.pdfUrl ?? invAny.pdf_url;
                      return (
                        <tr
                          key={invId}
                          className="border-b border-[var(--color-line)] last:border-0"
                        >
                          <td className="py-3">
                            <span className="font-mono text-xs font-medium text-[var(--color-ink)]">
                              {invNumber || "&#8212;"}
                            </span>
                          </td>
                          <td className="py-3 text-xs text-[var(--color-ink-dim)]">
                            {invDate ? fmtDate(invDate as string) : "&#8212;"}
                          </td>
                          <td className="py-3 font-semibold text-[var(--color-ink)]">
                            {formatAmt(invCents, invCurrency)}
                          </td>
                          <td className="py-3">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${
                                INVOICE_STATUS_COLORS[invStatus] ??
                                INVOICE_STATUS_COLORS.draft
                              }`}
                            >
                              {invStatus}
                            </span>
                          </td>
                          <td className="py-3">
                            {invPdfUrl ? (
                              <a
                                href={invPdfUrl as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
                              >
                                <Download className="h-3 w-3" /> PDF
                              </a>
                            ) : invId ? (
                              <Link
                                href={`/api/v1/invoices/${invId}/pdf`}
                                target="_blank"
                                className="flex items-center gap-1 text-xs text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
                              >
                                <Download className="h-3 w-3" /> PDF
                              </Link>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* View all link */}
              <div className="mt-2 border-t border-[var(--color-line)] pt-2 text-right">
                <Link
                  href="/settings/billing/invoices"
                  className="text-xs text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
                >
                  View all invoices &#8594;
                </Link>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* Section 5: Payment Instructions (Bank Transfer)                         */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <SectionLabel
          icon={<Building2 className="h-4 w-4" />}
          label="Payment Instructions"
        />
        <Card>
          <CardContent className="space-y-5 pt-5">
            {/* Bank details */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
                AUDT Bank Account
              </p>
              <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-4 text-sm">
                {bankDetails ? (
                  <div className="space-y-2">
                    {(bankDetails as Record<string, unknown>).accountName && (
                      <BankRow
                        label="Account Name"
                        value={String((bankDetails as Record<string, unknown>).accountName)}
                      />
                    )}
                    {(bankDetails as Record<string, unknown>).accountNumber && (
                      <BankRow
                        label="Account Number"
                        value={String((bankDetails as Record<string, unknown>).accountNumber)}
                        mono
                      />
                    )}
                    {(bankDetails as Record<string, unknown>).ifscCode && (
                      <BankRow
                        label="IFSC Code"
                        value={String((bankDetails as Record<string, unknown>).ifscCode)}
                        mono
                      />
                    )}
                    {(bankDetails as Record<string, unknown>).bankName && (
                      <BankRow
                        label="Bank"
                        value={String((bankDetails as Record<string, unknown>).bankName)}
                      />
                    )}
                    {(bankDetails as Record<string, unknown>).branch && (
                      <BankRow
                        label="Branch"
                        value={String((bankDetails as Record<string, unknown>).branch)}
                      />
                    )}
                    {(bankDetails as Record<string, unknown>).upiId && (
                      <BankRow
                        label="UPI ID"
                        value={String((bankDetails as Record<string, unknown>).upiId)}
                        mono
                      />
                    )}
                  </div>
                ) : (
                  /* Fallback static details */
                  <div className="space-y-2">
                    <BankRow label="Account Name" value="AUDT Technologies Pvt. Ltd." />
                    <BankRow label="Account Number" value="XXXX XXXX XXXX" mono />
                    <BankRow label="IFSC Code" value="HDFC0000001" mono />
                    <BankRow label="Bank" value="HDFC Bank" />
                    <BankRow label="Account Type" value="Current" />
                  </div>
                )}
              </div>
            </div>

            {/* How to pay accordion (details element — no JS needed) */}
            <details className="group rounded-xl border border-[var(--color-line)] bg-white/[0.02]">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-[var(--color-ink)]">
                How to pay
                <ChevronDown className="h-4 w-4 text-[var(--color-ink-faint)] transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-[var(--color-line)] px-4 pb-4 pt-3">
                <ol className="space-y-3">
                  {HOW_TO_PAY_STEPS.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-blue)]/20 text-xs font-bold text-[var(--color-blue)]">
                        {i + 1}
                      </span>
                      <span
                        className="text-sm text-[var(--color-ink-dim)]"
                        dangerouslySetInnerHTML={{ __html: step }}
                      />
                    </li>
                  ))}
                </ol>
              </div>
            </details>

            <p className="text-xs text-[var(--color-ink-faint)]">
              Subscription activates within 1&#8211;2 business days of payment
              confirmation. For urgent queries contact{" "}
              <a
                href="mailto:finance@audt.tech"
                className="text-indigo-400 hover:underline"
              >
                finance@audt.tech
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function BankRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-36 shrink-0 text-xs text-[var(--color-ink-faint)]">
        {label}
      </span>
      <span
        className={`text-sm text-[var(--color-ink)] ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

const HOW_TO_PAY_STEPS: string[] = [
  `Click <strong>Upgrade Plan</strong> above to select a plan and generate your invoice.`,
  `Transfer the <strong>exact invoice amount</strong> to the AUDT bank account above via NEFT / RTGS / IMPS or UPI.`,
  `Use your <strong>invoice number</strong> (e.g. <span class="font-mono text-xs">AUDT-2026-0001</span>) as the payment reference / narration.`,
  `Email your <strong>UTR / transaction ID</strong> to <a href="mailto:finance@audt.tech" class="text-indigo-400 hover:underline">finance@audt.tech</a> along with your invoice number.`,
  `Our finance team <strong>verifies payment within 1&#8211;2 business days</strong> and activates your subscription.`,
];
