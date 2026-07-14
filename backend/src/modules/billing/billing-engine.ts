/**
 * billing-engine.ts
 * Core billing business logic - no Next.js imports, pure TypeScript service.
 * All DB access is lazy (imported inside functions via lib/repositories/billing-engine-repo).
 */

import { DomainError } from "@/lib/services/errors";

// Local domain types (repo returns unknown rows; we cast as needed)
type CouponRow = {
  id: string; isActive: boolean; expiresAt?: string | null;
  maxUses?: number | null; timesUsed: number; discountType: string;
  value: number; applicablePlans?: string[];
}
type TransactionRow = {
  id: string; orgId: string; invoiceId: string; amountCents: number;
}
type InvoiceRow = {
  id: string; orgId: string; planSlug?: string;
}

// ---------------------------------------------------------------------------
// Tax configuration (hardcoded rates - no DB lookup needed at this stage)
// ---------------------------------------------------------------------------

const TAX_RATES = {
  gst_18: 0.18,
  international: 0,
} as const;

// ---------------------------------------------------------------------------
// 1. applyCoupon
// ---------------------------------------------------------------------------

export async function applyCoupon(
  orgId: string,
  code: string,
  amountCents: number,
  planSlug: string
): Promise<{
  discountCents: number;
  finalAmountCents: number;
  couponId: string;
}> {
  const { getCouponByCode } = await import(
    "@/backend/src/modules/billing/billing-engine-repo"
  );

  const coupon = (await getCouponByCode(code)) as CouponRow | null;

  if (!coupon || !coupon.isActive) {
    throw new DomainError("Coupon code is invalid or inactive.");
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    throw new DomainError("This coupon has expired.");
  }

  if (
    coupon.maxUses !== null &&
    coupon.maxUses !== undefined &&
    coupon.timesUsed >= coupon.maxUses
  ) {
    throw new DomainError("This coupon has reached its maximum usage limit.");
  }

  if (
    coupon.applicablePlans &&
    coupon.applicablePlans.length > 0 &&
    !coupon.applicablePlans.includes(planSlug)
  ) {
    throw new DomainError(
      `This coupon is not applicable for the selected plan.`
    );
  }

  let discountCents: number;
  if (coupon.discountType === "percentage") {
    // value is stored as integer basis points (e.g. 2000 = 20%)
    discountCents = Math.floor((amountCents * coupon.value) / 10000);
  } else {
    // fixed discount in cents
    discountCents = coupon.value;
  }

  // Discount cannot exceed the original amount
  discountCents = Math.min(discountCents, amountCents);
  const finalAmountCents = amountCents - discountCents;

  return { discountCents, finalAmountCents, couponId: coupon.id };
}

// ---------------------------------------------------------------------------
// 2. computeTax
// ---------------------------------------------------------------------------

export async function computeTax(
  amountCents: number,
  country: string,
  hasGstin: boolean
): Promise<{ taxAmountCents: number; taxName: string; taxRate: number }> {
  const normalised = (country ?? "").trim().toLowerCase();
  const isIndia =
    normalised === "india" || normalised === "in" || normalised === "ind";

  if (isIndia) {
    // B2B with valid GSTIN: GST still applies at 18% for SaaS in India;
    // mark taxName as "GST (GSTIN Registered)" to indicate eligibility for ITC.
    const taxRate = TAX_RATES.gst_18;
    const taxAmountCents = Math.floor(amountCents * taxRate);
    const taxName = hasGstin ? "GST 18% (GSTIN Registered)" : "GST 18%";
    return { taxAmountCents, taxName, taxRate };
  }

  // International: no tax collected at source
  return { taxAmountCents: 0, taxName: "No Tax", taxRate: TAX_RATES.international };
}

// ---------------------------------------------------------------------------
// 3. getOrgCreditBalance
// ---------------------------------------------------------------------------

export async function getOrgCreditBalance(orgId: string): Promise<number> {
  const { getOrgCreditBalance } = await import(
    "@/backend/src/modules/billing/billing-engine-repo"
  );

  return getOrgCreditBalance(orgId);
}

// ---------------------------------------------------------------------------
// 4. applyCredit
// ---------------------------------------------------------------------------

export async function applyCredit(
  orgId: string,
  invoiceId: string,
  amountCents: number,
  actorId: string
): Promise<void> {
  const balance = await getOrgCreditBalance(orgId);
  if (amountCents > balance) {
    throw new DomainError(
      `Insufficient credit balance. Available: ${balance} cents, requested: ${amountCents} cents.`
    );
  }

  const { createCredit, recordFinanceAction } = await import(
    "@/backend/src/modules/billing/billing-engine-repo"
  );

  await createCredit({
    orgId,
    type: "debit",
    amountCents,
    currency: "INR",
    description: `Credit applied to invoice ${invoiceId}`,
    appliedToInvoiceId: invoiceId,
    createdBy: actorId,
  });

  await recordFinanceAction({
    orgId,
    invoiceId,
    action: "credit_applied",
    actorId,
    metadata: { amountCents },
  });
}

// ---------------------------------------------------------------------------
// 5. reconcilePayment
// ---------------------------------------------------------------------------

export async function reconcilePayment(
  transactionId: string,
  actorId: string,
  options: {
    providerReference?: string;
    notes?: string;
    proofUrl?: string;
  }
): Promise<{ status: "pending_verification" }> {
  const {
    getTransaction,
    updateTransaction,
    updateInvoiceFull,
    recordFinanceAction,
  } = await import("@/backend/src/modules/billing/billing-engine-repo");

  const transaction = (await getTransaction(transactionId)) as TransactionRow | null;
  if (!transaction) {
    throw new DomainError("Transaction not found.");
  }

  await updateTransaction(transactionId, {
    status: "pending_verification",
    providerReference: options.providerReference ?? undefined,
    paymentProofUrl: options.proofUrl ?? undefined,
    notes: options.notes ?? undefined,
  });

  await updateInvoiceFull(transaction.invoiceId, {
    status: "pending_verification",
  });

  await recordFinanceAction({
    orgId: transaction.orgId,
    invoiceId: transaction.invoiceId,
    transactionId,
    action: "payment_received",
    actorId,
    metadata: {
      providerReference: options.providerReference,
      notes: options.notes,
    },
  });

  return { status: "pending_verification" };
}

// ---------------------------------------------------------------------------
// 6. verifyPayment
// ---------------------------------------------------------------------------

export async function verifyPayment(
  transactionId: string,
  actorId: string,
  notes?: string
): Promise<{ subscriptionActivated: boolean }> {
  const {
    getTransaction,
    getInvoiceById,
    updateTransaction,
    updateInvoiceFull,
    activateSubscriptionByOrgId,
    recordFinanceAction,
  } = await import("@/backend/src/modules/billing/billing-engine-repo");

  const transaction = (await getTransaction(transactionId)) as TransactionRow | null;
  if (!transaction) {
    throw new DomainError("Transaction not found.");
  }

  const invoice = (await getInvoiceById(transaction.invoiceId)) as InvoiceRow | null;
  if (!invoice) {
    throw new DomainError("Invoice not found.");
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  await updateTransaction(transactionId, {
    status: "verified",
    verifiedBy: actorId,
    verifiedAt: now,
    notes: notes ?? undefined,
  });

  await updateInvoiceFull(transaction.invoiceId, {
    status: "paid",
    paidAt: now,
  });

  await activateSubscriptionByOrgId(transaction.orgId, {
    status: "active",
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    planSlug: invoice.planSlug,
  });

  await recordFinanceAction({
    orgId: transaction.orgId,
    invoiceId: transaction.invoiceId,
    transactionId,
    action: "payment_verified",
    actorId,
    metadata: { notes },
  });

  await recordFinanceAction({
    orgId: transaction.orgId,
    invoiceId: transaction.invoiceId,
    transactionId,
    action: "subscription_activated",
    actorId,
    metadata: {
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
    },
  });

  return { subscriptionActivated: true };
}

// ---------------------------------------------------------------------------
// 7. rejectPayment
// ---------------------------------------------------------------------------

export async function rejectPayment(
  transactionId: string,
  actorId: string,
  reason: string
): Promise<void> {
  const {
    getTransaction,
    updateTransaction,
    updateInvoiceFull,
    recordFinanceAction,
  } = await import("@/backend/src/modules/billing/billing-engine-repo");

  const transaction = (await getTransaction(transactionId)) as TransactionRow | null;
  if (!transaction) {
    throw new DomainError("Transaction not found.");
  }

  const now = new Date();

  await updateTransaction(transactionId, {
    status: "failed",
    rejectedBy: actorId,
    rejectedAt: now,
    rejectionReason: reason,
  });

  await updateInvoiceFull(transaction.invoiceId, {
    status: "awaiting_payment",
  });

  await recordFinanceAction({
    orgId: transaction.orgId,
    invoiceId: transaction.invoiceId,
    transactionId,
    action: "payment_rejected",
    actorId,
    metadata: { reason },
  });
}

// ---------------------------------------------------------------------------
// 8. issueRefund
// ---------------------------------------------------------------------------

export async function issueRefund(
  transactionId: string,
  actorId: string,
  amountCents: number,
  reason: string
): Promise<void> {
  const {
    getTransaction,
    updateTransaction,
    updateInvoiceFull,
    createCredit,
    recordFinanceAction,
  } = await import("@/backend/src/modules/billing/billing-engine-repo");

  const transaction = (await getTransaction(transactionId)) as TransactionRow | null;
  if (!transaction) {
    throw new DomainError("Transaction not found.");
  }

  if (amountCents > transaction.amountCents) {
    throw new DomainError(
      `Refund amount (${amountCents} cents) exceeds the original transaction amount (${transaction.amountCents} cents).`
    );
  }

  if (amountCents <= 0) {
    throw new DomainError("Refund amount must be greater than zero.");
  }

  const isFullRefund = amountCents === transaction.amountCents;

  await updateTransaction(transactionId, {
    status: "refunded",
  });

  await updateInvoiceFull(transaction.invoiceId, {
    status: isFullRefund ? "refunded" : "partially_paid",
  });

  // Issue a billing credit so the org can apply it to a future invoice
  await createCredit({
    orgId: transaction.orgId,
    type: "credit",
    amountCents,
    currency: "INR",
    description: `Refund: ${reason}`,
    appliedToInvoiceId: null,
    createdBy: actorId,
  });

  await recordFinanceAction({
    orgId: transaction.orgId,
    invoiceId: transaction.invoiceId,
    transactionId,
    action: "refund_issued",
    actorId,
    metadata: {
      amountCents,
      isFullRefund,
      reason,
    },
  });
}
