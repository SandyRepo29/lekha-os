-"use server";

import { requireUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import * as billingService from "@/backend/src/modules/billing/billing-service";
import * as billingRepo from "@/backend/src/modules/billing/billing-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";
import { DomainError } from "@/lib/services/errors";

// --------- Types ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

export type CreateInvoiceResult = {
  invoiceId?: string;
  invoiceNumber?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    swiftCode: string;
    reference: string;
  };
  error?: string;
};

export type RecordPaymentResult = {
  success?: boolean;
  transactionId?: string;
  error?: string;
};

export type VerifyPaymentResult = {
  success?: boolean;
  subscriptionActivated?: boolean;
  error?: string;
};

export type RejectPaymentResult = {
  success?: boolean;
  error?: string;
};

export type RefundResult = {
  success?: boolean;
  error?: string;
};

export type CouponResult = {
  discount?: {
    code: string;
    type: "percent" | "fixed";
    value: number;
    description: string;
  };
  finalAmount?: number;
  error?: string;
};

export type UploadProofResult = {
  success?: boolean;
  error?: string;
};

export type FinanceDashboardResult = {
  pendingTransactions: Array<{
    id: string;
    invoiceId: string;
    invoiceNumber: string;
    orgId: string;
    amountCents: number;
    currency: string;
    providerReference: string | null;
    paymentMethod: string | null;
    proofUrl: string | null;
    notes: string | null;
    recordedAt: Date;
    billingName: string | null;
    billingEmail: string | null;
  }>;
  recentActions: Array<{
    id: string;
    action: string;
    entityId: string;
    actorId: string;
    createdAt: Date;
    metadata: Record<string, unknown> | null;
  }>;
  revenueStats: {
    totalPaidCents: number;
    totalPendingCents: number;
    totalRefundedCents: number;
    paidCount: number;
    pendingCount: number;
  };
  error?: string;
};

// --------- AUDT bank details (India --- bank transfer) ------------------------------------------------------------------------------------------------

const AUDT_BANK_DETAILS = {
  bankName: "HDFC Bank",
  accountName: "AUDT Technologies Private Limited",
  accountNumber: "50200012345678",
  ifscCode: "HDFC0001234",
  swiftCode: "HDFCINBB",
};

// --------- 1. createInvoiceAction ---------------------------------------------------------------------------------------------------------------------------------------------------------

export async function createInvoiceAction(
  formData: FormData
): Promise<CreateInvoiceResult> {
  try {
    const session = await requireUser();

    const planSlug = formData.get("planSlug") as string;
    const billingName = formData.get("billingName") as string;
    const billingEmail = formData.get("billingEmail") as string;
    const billingGstin = (formData.get("billingGstin") as string | null) || null;
    const paymentProviderSlug =
      (formData.get("paymentProviderSlug") as string) || "bank_transfer";
    const paymentTerms = (formData.get("paymentTerms") as string) || "net_7";
    const purchaseOrderNumber =
      (formData.get("purchaseOrderNumber") as string | null) || null;
    const couponCode = (formData.get("couponCode") as string | null) || null;
    const notes = (formData.get("notes") as string | null) || null;

    if (!planSlug) return { error: "Plan is required." };
    if (!billingName) return { error: "Billing name is required." };
    if (!billingEmail) return { error: "Billing email is required." };

    const plan = await billingRepo.findPlanByName(planSlug);
    if (!plan) return { error: `Plan "${planSlug}" not found.` };

    let amountCents = plan.priceYearly * 100;

    if (couponCode) {
      const couponResult = await applyCouponAction(couponCode, planSlug, amountCents);
      if (!couponResult.error && couponResult.finalAmount !== undefined) {
        amountCents = couponResult.finalAmount;
      }
    }

    const termDays =
      paymentTerms === "net_15"
        ? 15
        : paymentTerms === "net_30"
        ? 30
        : paymentTerms === "immediate"
        ? 0
        : 7;
    const dueAt = new Date(Date.now() + termDays * 86_400_000);

    const combinedNotes = [
      purchaseOrderNumber ? `PO: ${purchaseOrderNumber}` : null,
      notes,
    ]
      .filter(Boolean)
      .join(" | ");

    const invoice = await billingRepo.insertInvoice({
      organizationId: session.org!.id,
      planId: plan.id,
      amountCents,
      currency: "INR",
      paymentMethod: paymentProviderSlug,
      billingName,
      billingEmail,
      billingGstin,
      notes: combinedNotes || null,
      dueAt,
    });

    await recordAudit({
      organizationId: session.org!.id,
      actorId: session.id,
      action: "billing.invoice_created",
      entityType: "invoice",
      entityId: invoice.id,
      metadata: {
        planSlug,
        amountCents,
        invoiceNumber: invoice.invoiceNumber,
        paymentMethod: paymentProviderSlug,
      },
    });

    revalidatePath("/settings/billing");

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      bankDetails: {
        ...AUDT_BANK_DETAILS,
        reference: invoice.invoiceNumber,
      },
    };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("[createInvoiceAction]", err);
    return { error: "Failed to create invoice. Please try again." };
  }
}

// --------- 2. recordPaymentAction ---------------------------------------------------------------------------------------------------------------------------------------------------------

export async function recordPaymentAction(
  formData: FormData
): Promise<RecordPaymentResult> {
  try {
    const session = await requireUser();

    const invoiceId = formData.get("invoiceId") as string;
    const providerReference = (formData.get("providerReference") as string) || null;
    const paymentMethod = (formData.get("paymentMethod") as string) || "bank_transfer";
    const notes = (formData.get("notes") as string | null) || null;

    if (!invoiceId) return { error: "Invoice ID is required." };
    if (!providerReference) return { error: "Payment reference (UTR/ref) is required." };

    const invoice = await billingRepo.findInvoiceById(invoiceId);
    if (!invoice) return { error: "Invoice not found." };
    if (invoice.organizationId !== session.org!.id) return { error: "Access denied." };
    if (invoice.status === "paid") return { error: "Invoice is already paid." };
    if (invoice.status === "cancelled") return { error: "Invoice has been cancelled." };

    await billingRepo.updateInvoice(invoiceId, {
      status: "pending_verification",
      paymentReference: providerReference,
    });

    await recordAudit({
      organizationId: session.org!.id,
      actorId: session.id,
      action: "billing.payment_recorded",
      entityType: "invoice",
      entityId: invoiceId,
      metadata: {
        providerReference,
        paymentMethod,
        notes,
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    revalidatePath("/settings/billing");

    return { success: true, transactionId: invoiceId };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("[recordPaymentAction]", err);
    return { error: "Failed to record payment. Please try again." };
  }
}

// --------- 3. verifyPaymentAction ---------------------------------------------------------------------------------------------------------------------------------------------------------

export async function verifyPaymentAction(
  transactionId: string,
  notes?: string
): Promise<VerifyPaymentResult> {
  try {
    const session = await requireUser();

    if (!["admin", "owner"].includes(session.org!.role)) {
      return { error: "Only admins and owners can verify payments." };
    }

    const invoice = await billingRepo.findInvoiceById(transactionId);
    if (!invoice) return { error: "Transaction not found." };
    if (invoice.organizationId !== session.org!.id) return { error: "Access denied." };
    if (invoice.status === "paid") return { error: "Payment already verified." };

    await billingService.markInvoicePaid({
      invoiceId: transactionId,
      orgId: session.org!.id,
      actorId: session.id,
      paymentReference: invoice.paymentReference ?? "verified",
    });

    if (notes) {
      await recordAudit({
        organizationId: session.org!.id,
        actorId: session.id,
        action: "billing.payment_verified",
        entityType: "invoice",
        entityId: transactionId,
        metadata: { notes, invoiceNumber: invoice.invoiceNumber },
      });
    }

    revalidatePath("/settings/billing");

    return { success: true, subscriptionActivated: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("[verifyPaymentAction]", err);
    return { error: "Failed to verify payment. Please try again." };
  }
}

// --------- 4. rejectPaymentAction ---------------------------------------------------------------------------------------------------------------------------------------------------------

export async function rejectPaymentAction(
  transactionId: string,
  reason: string
): Promise<RejectPaymentResult> {
  try {
    const session = await requireUser();

    if (!["admin", "owner"].includes(session.org!.role)) {
      return { error: "Only admins and owners can reject payments." };
    }

    if (!reason?.trim()) return { error: "A rejection reason is required." };

    const invoice = await billingRepo.findInvoiceById(transactionId);
    if (!invoice) return { error: "Transaction not found." };
    if (invoice.organizationId !== session.org!.id) return { error: "Access denied." };
    if (invoice.status === "paid") {
      return { error: "Cannot reject an already-verified payment." };
    }

    await billingRepo.updateInvoice(transactionId, {
      status: "sent",
      paymentReference: null,
    });

    await recordAudit({
      organizationId: session.org!.id,
      actorId: session.id,
      action: "billing.payment_rejected",
      entityType: "invoice",
      entityId: transactionId,
      metadata: { reason, invoiceNumber: invoice.invoiceNumber },
    });

    revalidatePath("/settings/billing");

    return { success: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("[rejectPaymentAction]", err);
    return { error: "Failed to reject payment. Please try again." };
  }
}

// --------- 5. issueRefundAction ---------------------------------------------------------------------------------------------------------------------------------------------------------------

export async function issueRefundAction(
  transactionId: string,
  amountCents: number,
  reason: string
): Promise<RefundResult> {
  try {
    const session = await requireUser();

    if (session.org!.role !== "owner") {
      return { error: "Only the organization owner can issue refunds." };
    }

    if (!reason?.trim()) return { error: "A refund reason is required." };
    if (!amountCents || amountCents <= 0) {
      return { error: "Refund amount must be greater than zero." };
    }

    const invoice = await billingRepo.findInvoiceById(transactionId);
    if (!invoice) return { error: "Transaction not found." };
    if (invoice.organizationId !== session.org!.id) return { error: "Access denied." };
    if (invoice.status !== "paid") {
      return { error: "Refunds can only be issued for paid invoices." };
    }
    if (amountCents > invoice.amountCents) {
      return { error: "Refund amount cannot exceed the original invoice amount." };
    }

    const isFullRefund = amountCents === invoice.amountCents;

    await billingRepo.updateInvoice(transactionId, {
      status: isFullRefund ? "refunded" : "partially_refunded",
    });

    await recordAudit({
      organizationId: session.org!.id,
      actorId: session.id,
      action: "billing.refund_issued",
      entityType: "invoice",
      entityId: transactionId,
      metadata: {
        amountCents,
        reason,
        isFullRefund,
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    revalidatePath("/settings/billing");

    return { success: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("[issueRefundAction]", err);
    return { error: "Failed to issue refund. Please try again." };
  }
}

// --------- 6. applyCouponAction ---------------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * Validate and apply a coupon code.
 * Coupon definitions are static inline --- replace with a billing_coupons DB
 * table lookup when that table is added in a future migration.
 */
export async function applyCouponAction(
  code: string,
  planSlug: string,
  amountCents: number
): Promise<CouponResult> {
  try {
    await requireUser();

    if (!code?.trim()) return { error: "Coupon code is required." };

    type CouponDef = {
      type: "percent" | "fixed";
      value: number;
      description: string;
      plans?: string[];
    };

    const COUPONS: Record<string, CouponDef> = {
      LAUNCH25: {
        type: "percent",
        value: 25,
        description: "25% off launch discount",
      },
      AUDT50K: {
        type: "fixed",
        value: 5_000_000, // paise (INR 50,000)
        description: "INR 50,000 fixed discount",
        plans: ["Enterprise"],
      },
      INDIA10: {
        type: "percent",
        value: 10,
        description: "10% India startup discount",
      },
    };

    const normalized = code.trim().toUpperCase();
    const coupon = COUPONS[normalized];
    if (!coupon) return { error: "Coupon code is invalid or expired." };

    if (coupon.plans && !coupon.plans.includes(planSlug)) {
      return { error: `This coupon is not valid for the ${planSlug} plan.` };
    }

    const discountCents =
      coupon.type === "percent"
        ? Math.round(amountCents * (coupon.value / 100))
        : Math.min(coupon.value, amountCents);

    const finalAmount = Math.max(0, amountCents - discountCents);

    return {
      discount: {
        code: normalized,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
      },
      finalAmount,
    };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("[applyCouponAction]", err);
    return { error: "Failed to apply coupon. Please try again." };
  }
}

// --------- 7. uploadPaymentProofAction ------------------------------------------------------------------------------------------------------------------------------------------

export async function uploadPaymentProofAction(
  transactionId: string,
  proofUrl: string
): Promise<UploadProofResult> {
  try {
    const session = await requireUser();

    if (!proofUrl?.trim()) return { error: "Proof URL is required." };

    const invoice = await billingRepo.findInvoiceById(transactionId);
    if (!invoice) return { error: "Transaction not found." };
    if (invoice.organizationId !== session.org!.id) return { error: "Access denied." };

    if (["paid", "cancelled", "refunded"].includes(invoice.status ?? "")) {
      return { error: "Cannot upload proof for a finalised invoice." };
    }

    // Store in pdfUrl until a dedicated proof_url column is added via migration
    await billingRepo.updateInvoice(transactionId, { pdfUrl: proofUrl });

    await recordAudit({
      organizationId: session.org!.id,
      actorId: session.id,
      action: "billing.payment_proof_uploaded",
      entityType: "invoice",
      entityId: transactionId,
      metadata: { proofUrl, invoiceNumber: invoice.invoiceNumber },
    });

    revalidatePath("/settings/billing");

    return { success: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("[uploadPaymentProofAction]", err);
    return { error: "Failed to upload payment proof. Please try again." };
  }
}

// --------- 8. cancelInvoiceAction ---------------------------------------------------------------------------------------------------------------------------------------------------------

export async function cancelInvoiceAction(
  invoiceId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await requireUser();

    if (!["admin", "owner"].includes(session.org!.role)) {
      return { error: "Only admins and owners can cancel invoices." };
    }

    const invoice = await billingRepo.findInvoiceById(invoiceId);
    if (!invoice) return { error: "Invoice not found." };
    if (invoice.organizationId !== session.org!.id) return { error: "Access denied." };

    if (invoice.status === "paid") {
      return { error: "Cannot cancel a paid invoice. Issue a refund instead." };
    }
    if (invoice.status === "cancelled") {
      return { error: "Invoice is already cancelled." };
    }

    await billingRepo.updateInvoice(invoiceId, { status: "cancelled" });

    await recordAudit({
      organizationId: session.org!.id,
      actorId: session.id,
      action: "billing.invoice_cancelled",
      entityType: "invoice",
      entityId: invoiceId,
      metadata: { invoiceNumber: invoice.invoiceNumber },
    });

    revalidatePath("/settings/billing");

    return { success: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("[cancelInvoiceAction]", err);
    return { error: "Failed to cancel invoice. Please try again." };
  }
}

// --------- 9. getFinanceDashboardAction ---------------------------------------------------------------------------------------------------------------------------------------

export async function getFinanceDashboardAction(): Promise<FinanceDashboardResult> {
  const empty: FinanceDashboardResult = {
    pendingTransactions: [],
    recentActions: [],
    revenueStats: {
      totalPaidCents: 0,
      totalPendingCents: 0,
      totalRefundedCents: 0,
      paidCount: 0,
      pendingCount: 0,
    },
  };

  try {
    const session = await requireUser();

    if (!["admin", "owner"].includes(session.org!.role)) {
      return {
        ...empty,
        error: "Only admins and owners can view the finance dashboard.",
      };
    }

    const allInvoices = await billingRepo.findInvoicesByOrg(session.org!.id);

    const pendingTransactions = allInvoices
      .filter((inv) => inv.status === "pending_verification")
      .map((inv) => ({
        id: inv.id,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        orgId: inv.organizationId,
        amountCents: inv.amountCents,
        currency: inv.currency ?? "INR",
        providerReference: inv.paymentReference ?? null,
        paymentMethod: inv.paymentMethod ?? null,
        proofUrl: inv.pdfUrl ?? null,
        notes: inv.notes ?? null,
        recordedAt: inv.updatedAt ?? inv.createdAt ?? new Date(),
        billingName: inv.billingName ?? null,
        billingEmail: inv.billingEmail ?? null,
      }));

    const paidInvoices = allInvoices.filter((inv) => inv.status === "paid");
    const sentInvoices = allInvoices.filter((inv) =>
      ["sent", "pending_verification"].includes(inv.status ?? "")
    );
    const refundedInvoices = allInvoices.filter((inv) =>
      ["refunded", "partially_refunded"].includes(inv.status ?? "")
    );

    const revenueStats = {
      totalPaidCents: paidInvoices.reduce((s, inv) => s + inv.amountCents, 0),
      totalPendingCents: sentInvoices.reduce((s, inv) => s + inv.amountCents, 0),
      totalRefundedCents: refundedInvoices.reduce((s, inv) => s + inv.amountCents, 0),
      paidCount: paidInvoices.length,
      pendingCount: sentInvoices.length,
    };

    const recentActions = allInvoices.slice(0, 10).map((inv) => ({
      id: inv.id,
      action: `billing.invoice_${inv.status ?? "created"}`,
      entityId: inv.id,
      actorId: session.id,
      createdAt: inv.updatedAt ?? inv.createdAt ?? new Date(),
      metadata: {
        invoiceNumber: inv.invoiceNumber,
        amountCents: inv.amountCents,
        planName: inv.planName,
      } as Record<string, unknown>,
    }));

    return { pendingTransactions, recentActions, revenueStats };
  } catch (err) {
    console.error("[getFinanceDashboardAction]", err);
    return { ...empty, error: "Failed to load finance dashboard." };
  }
}

// --------- Legacy actions (kept for backwards compatibility) ------------------------------------------------------------------------

export async function requestUpgradeAction(formData: FormData) {
  const session = await requireUser();

  const planName = formData.get("planName") as string;
  const billingName = formData.get("billingName") as string;
  const billingEmail = formData.get("billingEmail") as string;
  const billingGstin = (formData.get("billingGstin") as string) || null;
  const message = (formData.get("message") as string) || null;

  if (!planName || !billingName || !billingEmail) {
    return { error: "Plan, name, and email are required." };
  }

  try {
    const invoice = await billingService.requestUpgrade({
      orgId: session.org!.id,
      actorId: session.id,
      planName,
      billingName,
      billingEmail,
      billingGstin,
      message,
      orgName: session.orgName ?? "",
    });
    revalidatePath("/settings/billing");
    return { ok: true, invoiceNumber: invoice.invoiceNumber };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }
}

export async function cancelSubscriptionAction(formData: FormData) {
  const session = await requireUser();

  if (!["owner", "admin"].includes(session.org!.role)) {
    return { error: "Only owners and admins can cancel the subscription." };
  }

  const reason = (formData.get("reason") as string) || null;

  try {
    await billingService.cancelSubscription({
      orgId: session.org!.id,
      actorId: session.id,
      reason,
    });
    revalidatePath("/settings/billing");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not cancel subscription." };
  }
}

export async function markInvoicePaidAction(formData: FormData) {
  const session = await requireUser();

  if (!["owner", "admin"].includes(session.org!.role)) {
    return { error: "Only owners and admins can mark invoices as paid." };
  }

  const invoiceId = formData.get("invoiceId") as string;
  const paymentReference = formData.get("paymentReference") as string;

  if (!invoiceId || !paymentReference) {
    return { error: "Invoice ID and payment reference are required." };
  }

  try {
    await billingService.markInvoicePaid({
      invoiceId,
      orgId: session.org!.id,
      actorId: session.id,
      paymentReference,
    });
    revalidatePath("/settings/billing");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not mark invoice as paid." };
  }
}

export async function downloadInvoiceAction(
  invoiceId: string
): Promise<{ url?: string; error?: string }> {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation found." };
  // Verify the invoice belongs to this org before returning URL
  const { findInvoiceById } = await import("@/backend/src/modules/billing/billing-repo");
  const invoice = await findInvoiceById(invoiceId);
  if (!invoice) return { error: "Invoice not found." };
  if (invoice.organizationId !== session.org.id) return { error: "Access denied." };
  return { url: `/api/invoices/${invoiceId}/pdf` };
}



