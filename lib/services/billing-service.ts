import * as billingRepo from "@/lib/repositories/billing-repo";
import * as vendorRepo from "@/lib/repositories/vendor-repo";
import * as teamRepo from "@/lib/repositories/team-repo";
import * as orgRepo from "@/lib/repositories/org-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";
import { DomainError } from "./errors";
import type { BillingPlan, Subscription, Invoice } from "@/lib/db/schema";
import type { InvoiceWithPlan } from "@/lib/repositories/billing-repo";

export type BillingOverview = {
  subscription: (Subscription & { plan: BillingPlan }) | null;
  usage: {
    users: number;
    vendors: number;
  };
  invoices: InvoiceWithPlan[];
};

export async function getBillingOverview(orgId: string): Promise<BillingOverview> {
  const [subscription, members, vendorCount, invoiceList] = await Promise.all([
    billingRepo.getSubscription(orgId),
    teamRepo.listMembers(orgId),
    vendorRepo.countByOrg(orgId),
    billingRepo.findInvoicesByOrg(orgId),
  ]);

  return {
    subscription,
    usage: {
      users: members.length,
      vendors: vendorCount,
    },
    invoices: invoiceList,
  };
}

/** Ensure a Growth (trial) subscription exists for the org. Called on org creation. */
export async function ensureStarterSubscription(orgId: string): Promise<void> {
  const existing = await billingRepo.getSubscription(orgId);
  if (existing) return;

  let growth = await billingRepo.findPlanByName("Growth");
  if (!growth) {
    await seedDefaultPlans();
    growth = await billingRepo.findPlanByName("Growth");
  }
  if (!growth) return;

  await billingRepo.upsertSubscription(orgId, growth.id, {
    status: "trial",
    billingCycle: "trial",
    // 14-day trial window
    currentPeriodEnd: new Date(Date.now() + 14 * 86_400_000),
  });
}

/** Throw DomainError when org has hit their plan limit for the given resource. */
export async function checkPlanLimit(
  orgId: string,
  resource: "users" | "vendors" | "assets" | "storage_gb"
): Promise<void> {
  const sub = await billingRepo.getSubscription(orgId);
  if (!sub) return; // no subscription yet — no gating
  const plan = sub.plan;

  if (resource === "users") {
    const members = await teamRepo.listMembers(orgId);
    const limit = plan.maxUsers;
    if (limit < 9999 && members.length >= limit) {
      throw new DomainError(
        `Your ${plan.name} plan allows up to ${limit} team members. Upgrade to add more.`
      );
    }
  }

  if (resource === "vendors") {
    const count = await vendorRepo.countByOrg(orgId);
    const limit = plan.maxVendors;
    if (limit < 9999 && count >= limit) {
      throw new DomainError(
        `Your ${plan.name} plan allows up to ${limit} vendors. Upgrade to add more.`
      );
    }
  }

  // assets and storage_gb — checked against maxStorageGb (proxy for overall data limits).
  // Fine-grained asset tables come in Sprint B2; for now enforce on plan tier only.
  if (resource === "assets" || resource === "storage_gb") {
    const limit = plan.maxStorageGb;
    if (limit < 9999 && limit <= 10) {
      // Growth plan (10 GB) — assets module available on Business+
      const { canUseFeature } = await import("@/lib/services/billing/entitlements");
      const ok = await canUseFeature(orgId, "asset_intelligence");
      if (!ok) {
        throw new DomainError(
          `Asset Intelligence™ is not available on the ${plan.name} plan. Upgrade to Business to unlock.`
        );
      }
    }
  }
}

/** Create a "sent" invoice for an upgrade request and send emails. */
export async function requestUpgrade(params: {
  orgId: string;
  actorId: string;
  planName: string;
  billingName: string;
  billingEmail: string;
  billingGstin?: string | null;
  message?: string | null;
  orgName: string;
}): Promise<Invoice> {
  const plan = await billingRepo.findPlanByName(params.planName);
  if (!plan) throw new DomainError(`Plan "${params.planName}" not found.`);

  const amountCents = plan.priceYearly * 100;
  const dueAt = new Date(Date.now() + 7 * 86_400_000); // 7 days to pay

  const invoice = await billingRepo.insertInvoice({
    organizationId: params.orgId,
    planId: plan.id,
    amountCents,
    currency: "USD",
    paymentMethod: "bank_transfer",
    billingName: params.billingName,
    billingEmail: params.billingEmail,
    billingGstin: params.billingGstin ?? null,
    notes: params.message ?? null,
    dueAt,
  });

  // Store pending plan on subscription
  const sub = await billingRepo.getSubscription(params.orgId);
  if (sub) {
    await billingRepo.upsertSubscription(params.orgId, sub.planId, {
      requestedPlan: params.planName,
    });
  }

  await recordAudit({
    organizationId: params.orgId,
    actorId: params.actorId,
    action: "billing.upgrade_requested",
    entityType: "invoice",
    entityId: invoice.id,
    metadata: { planName: params.planName, invoiceNumber: invoice.invoiceNumber },
  });

  // Send emails (fire-and-forget — Resend may not be configured)
  sendUpgradeEmails({
    invoice,
    planName: params.planName,
    orgName: params.orgName,
    billingName: params.billingName,
    billingEmail: params.billingEmail,
    amountCents,
    invoiceNumber: invoice.invoiceNumber,
    dueAt,
  }).catch(() => {});

  return invoice;
}

/** Mark an invoice as paid and activate the subscription. Owner/admin only. */
export async function markInvoicePaid(params: {
  invoiceId: string;
  orgId: string;
  actorId: string;
  paymentReference: string;
}): Promise<void> {
  const invoice = await billingRepo.findInvoiceById(params.invoiceId);
  if (!invoice) throw new DomainError("Invoice not found.");
  if (invoice.organizationId !== params.orgId) throw new DomainError("Access denied.");
  if (invoice.status === "paid") throw new DomainError("Invoice already marked as paid.");

  await billingRepo.updateInvoice(params.invoiceId, {
    status: "paid",
    paymentReference: params.paymentReference,
    paidAt: new Date(),
  });

  // Activate subscription on the invoiced plan
  const plan = invoice.planId ? await billingRepo.findPlanByName(invoice.planName ?? "") : null;
  const currentSub = await billingRepo.getSubscription(params.orgId);

  if (currentSub) {
    const targetPlanId = plan?.id ?? currentSub.planId;
    await billingRepo.upsertSubscription(params.orgId, targetPlanId, {
      status: "active",
      billingCycle: "yearly",
      currentPeriodEnd: new Date(Date.now() + 365 * 86_400_000),
      requestedPlan: null,
      cancelAtPeriodEnd: false,
    });
  }

  await recordAudit({
    organizationId: params.orgId,
    actorId: params.actorId,
    action: "billing.invoice_paid",
    entityType: "invoice",
    entityId: params.invoiceId,
    metadata: { paymentReference: params.paymentReference, invoiceNumber: invoice.invoiceNumber },
  });

  // Send confirmation email
  sendPaymentConfirmationEmail({
    billingEmail: invoice.billingEmail ?? "",
    billingName: invoice.billingName ?? "Team",
    invoiceNumber: invoice.invoiceNumber,
    planName: invoice.planName ?? "Business",
  }).catch(() => {});
}

/** Cancel subscription at period end. */
export async function cancelSubscription(params: {
  orgId: string;
  actorId: string;
  reason?: string | null;
}): Promise<void> {
  const sub = await billingRepo.getSubscription(params.orgId);
  if (!sub) throw new DomainError("No active subscription found.");

  await billingRepo.upsertSubscription(params.orgId, sub.planId, {
    cancelAtPeriodEnd: true,
    cancelReason: params.reason ?? null,
  });

  await recordAudit({
    organizationId: params.orgId,
    actorId: params.actorId,
    action: "billing.subscription_cancelled",
    entityType: "subscription",
    entityId: sub.id,
    metadata: { reason: params.reason },
  });

  // Send cancellation email
  sendCancellationEmail({
    orgId: params.orgId,
    periodEnd: sub.currentPeriodEnd,
  }).catch(() => {});
}

/** Run daily: expire trials, process cancel-at-period-end. Returns counts. */
export async function runBillingCron(): Promise<{
  trialsExpired: number;
  trialWarnings: number;
  subscriptionsCancelled: number;
}> {
  let trialsExpired = 0;
  let trialWarnings = 0;
  let subscriptionsCancelled = 0;

  const { getResend, FROM, isResendConfigured } = await import("@/lib/email/resend");
  const { trialEndingSoonHtml, subscriptionCancelledHtml } = await import("@/lib/email/templates");

  // 1. Warn trials expiring within 3 days
  const soonExpiring = await billingRepo.findTrialsExpiringSoon(3);
  for (const { orgId, currentPeriodEnd } of soonExpiring) {
    try {
      const members = await teamRepo.listMembers(orgId);
      const ownerRow = members.find((m) => m.role === "owner");
      if (!ownerRow?.email || !isResendConfigured()) continue;

      const orgRow = await orgRepo.findActiveOrgByUser(ownerRow.userId ?? "");
      const orgName = orgRow?.name ?? "your organization";

      const daysLeft = Math.ceil((currentPeriodEnd.getTime() - Date.now()) / 86_400_000);
      const resend = getResend();
      await resend.emails.send({
        from: FROM,
        to: ownerRow.email,
        subject: `Your AUDT trial expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
        html: trialEndingSoonHtml({ orgName, daysLeft }),
      });
      trialWarnings++;
    } catch { /* non-fatal */ }
  }

  // 2. Expire overdue trials
  const expired = await billingRepo.findExpiredTrials();
  for (const { orgId } of expired) {
    try {
      const sub = await billingRepo.getSubscription(orgId);
      if (!sub) continue;
      await billingRepo.upsertSubscription(orgId, sub.planId, { status: "cancelled", cancelledAt: new Date() });
      trialsExpired++;
    } catch { /* non-fatal */ }
  }

  // 3. Process cancel-at-period-end subscriptions
  const toCancel = await billingRepo.findCancelAtPeriodEnd();
  for (const { orgId } of toCancel) {
    try {
      const sub = await billingRepo.getSubscription(orgId);
      if (!sub) continue;
      await billingRepo.upsertSubscription(orgId, sub.planId, {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelAtPeriodEnd: false,
      });
      subscriptionsCancelled++;
    } catch { /* non-fatal */ }
  }

  return { trialsExpired, trialWarnings, subscriptionsCancelled };
}

// ─── Private email helpers ───────────────────────────────────────────────────

async function sendUpgradeEmails(params: {
  invoice: Invoice;
  planName: string;
  orgName: string;
  billingName: string;
  billingEmail: string;
  amountCents: number;
  invoiceNumber: string;
  dueAt: Date;
}) {
  const { getResend, FROM, isResendConfigured } = await import("@/lib/email/resend");
  const { upgradeRequestedHtml, upgradeConfirmationHtml } = await import("@/lib/email/templates");
  if (!isResendConfigured()) return;

  const resend = getResend();
  const amount = `$${(params.amountCents / 100).toLocaleString("en-US")}`;

  // Internal notification to sales
  await resend.emails.send({
    from: FROM,
    to: "sales@audt.tech",
    subject: `New upgrade request: ${params.orgName} → ${params.planName}`,
    html: upgradeRequestedHtml({
      orgName: params.orgName,
      planName: params.planName,
      billingName: params.billingName,
      billingEmail: params.billingEmail,
      amount,
      invoiceNumber: params.invoiceNumber,
      dueAt: params.dueAt.toLocaleDateString("en-IN"),
    }),
  });

  // Customer confirmation
  await resend.emails.send({
    from: FROM,
    to: params.billingEmail,
    subject: `AUDT Upgrade Invoice ${params.invoiceNumber}`,
    html: upgradeConfirmationHtml({
      billingName: params.billingName,
      planName: params.planName,
      amount,
      invoiceNumber: params.invoiceNumber,
      dueAt: params.dueAt.toLocaleDateString("en-IN"),
    }),
  });
}

async function sendPaymentConfirmationEmail(params: {
  billingEmail: string;
  billingName: string;
  invoiceNumber: string;
  planName: string;
}) {
  if (!params.billingEmail) return;
  const { getResend, FROM, isResendConfigured } = await import("@/lib/email/resend");
  const { invoicePaidHtml } = await import("@/lib/email/templates");
  if (!isResendConfigured()) return;

  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: params.billingEmail,
    subject: `Payment confirmed — Welcome to AUDT ${params.planName}!`,
    html: invoicePaidHtml({
      billingName: params.billingName,
      planName: params.planName,
      invoiceNumber: params.invoiceNumber,
    }),
  });
}

async function sendCancellationEmail(params: {
  orgId: string;
  periodEnd: Date | null | undefined;
}) {
  const { getResend, FROM, isResendConfigured } = await import("@/lib/email/resend");
  const { subscriptionCancelledHtml } = await import("@/lib/email/templates");
  if (!isResendConfigured()) return;

  const members = await teamRepo.listMembers(params.orgId);
  const owner = members.find((m) => m.role === "owner");
  if (!owner?.email) return;

  const resend = getResend();
  const accessUntil = params.periodEnd
    ? params.periodEnd.toLocaleDateString("en-IN")
    : "end of current period";

  await resend.emails.send({
    from: FROM,
    to: owner.email,
    subject: "Your AUDT subscription has been cancelled",
    html: subscriptionCancelledHtml({ accessUntil }),
  });
}

export async function seedDefaultPlans(): Promise<void> {
  const plans = [
    {
      name: "Growth",
      description: "The complete governance foundation for fast-growing companies getting compliance-ready",
      priceMonthly: 250,
      priceYearly: 2999,
      features: [
        "Up to 10 users",
        "All Core GRC modules",
        "DPDP Privacy™ & Contract Governance™",
        "Trust Intelligence™ & Trust Score™",
        "5 compliance frameworks",
        "Governance Copilot™ AI",
        "Email support",
      ],
      maxUsers: 10,
      maxVendors: 100,
      maxStorageGb: 10,
    },
    {
      name: "Business",
      description: "The full Governance OS for organizations scaling their trust program",
      priceMonthly: 583,
      priceYearly: 6999,
      features: [
        "Up to 50 users",
        "All 32 modules",
        "Governance Agent Framework™",
        "Continuous Compliance™ (21 checks)",
        "Security Command Center™",
        "Integration Hub™ (35+ connectors)",
        "Trust Verification Authority™",
        "Auditor Collaboration™",
        "Priority support & onboarding",
      ],
      maxUsers: 50,
      maxVendors: 9999,
      maxStorageGb: 100,
    },
    {
      name: "Enterprise",
      description: "Tailored deployment for large, regulated organizations with complex governance requirements",
      priceMonthly: 0,
      priceYearly: 0,
      features: [
        "Unlimited users & organizations",
        "Customer Managed Encryption (AWS KMS, Azure, GCP)",
        "Custom SAML/OIDC SSO",
        "Dedicated Governance Agent™ configurations",
        "Custom compliance frameworks & controls",
        "SLA guarantees & dedicated success manager",
        "On-premise or private cloud deployment",
        "Custom API rate limits & webhooks",
      ],
      maxUsers: 9999,
      maxVendors: 9999,
      maxStorageGb: 9999,
    },
  ];

  for (const plan of plans) {
    const existing = await billingRepo.findPlanByName(plan.name);
    if (!existing) {
      await billingRepo.insertPlan(plan);
    }
  }
}
