/**
 * Invoice Engine — pure TypeScript, no Next.js imports.
 * Handles invoice generation and lifecycle for AUDT billing.
 *
 * Imports from:
 *   - lib/services/billing/billing-engine  (applyCoupon, computeTax, getCreditBalance, deductCredits)
 *   - lib/services/billing/payment-adapter (getProvider)
 */

import { db } from "@/lib/db";
import { invoices, billingPlans, organizations } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import * as billingRepo from "@/lib/repositories/billing-repo";

// ─── Billing Engine imports ───────────────────────────────────────────────────
// These functions will be provided by lib/services/billing/billing-engine.ts
import {
  applyCoupon,
  computeTax,
  getCreditBalance,
  deductCredits,
} from "@/lib/services/billing/billing-engine";

// ─── Payment Adapter imports ──────────────────────────────────────────────────
// These functions will be provided by lib/services/billing/payment-adapter.ts
import { getProvider } from "@/lib/services/billing/payment-adapter";

// ─── Finance action recorder (local helper) ───────────────────────────────────
async function recordFinanceAction(params: {
  organizationId: string;
  invoiceId: string;
  action: string;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  // Writes to audit_logs for financial lifecycle events.
  // Uses the existing audit-repo pattern so finance events appear in the audit log.
  const { recordAudit } = await import("@/lib/repositories/audit-repo");
  await recordAudit({
    organizationId: params.organizationId,
    actorId: params.actorId ?? params.organizationId,
    action: `billing.${params.action}`,
    entityType: "invoice",
    entityId: params.invoiceId,
    metadata: params.metadata ?? {},
  });
}

// ─── Type helpers ─────────────────────────────────────────────────────────────

export type ParsedPaymentTerms = {
  label: string;
  netDays: number;
};

function parsePaymentTerms(terms?: string | null): ParsedPaymentTerms {
  if (!terms) return { label: "Due on Receipt", netDays: 7 };
  const lower = terms.toLowerCase();
  const match = lower.match(/net\s*(\d+)/);
  if (match) {
    const days = parseInt(match[1], 10);
    return { label: terms, netDays: days };
  }
  if (lower.includes("due on receipt")) return { label: terms, netDays: 7 };
  if (lower.includes("immediate")) return { label: terms, netDays: 1 };
  return { label: terms, netDays: 7 };
}

// ─── 1. generateInvoiceNumber ─────────────────────────────────────────────────

/**
 * Generate a globally unique, year-scoped invoice number.
 * Format: INV-YYYY-XXXXXX (6-digit zero-padded sequence within the year)
 * Example: INV-2026-000042
 *
 * Uses a DB count of existing invoices within the current year to derive
 * the sequence number. Thread-safe enough for current scale; add a DB
 * sequence object (CREATE SEQUENCE) if high-concurrency is needed.
 */
export async function generateInvoiceNumber(orgId: string): Promise<string> {
  const year = new Date().getFullYear();

  // Count ALL invoices in this calendar year (cross-org) for global uniqueness
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoices)
    .where(sql`extract(year from created_at) = ${year}`);

  const seq = (Number(row?.count ?? 0) + 1).toString().padStart(6, "0");
  return `INV-${year}-${seq}`;
}

// ─── 2. createInvoice ─────────────────────────────────────────────────────────

export type CreateInvoiceParams = {
  orgId: string;
  planSlug: string;
  billingName: string;
  billingEmail: string;
  billingGstin?: string;
  billingAddress?: string;
  paymentProviderSlug: string;
  paymentMethod?: string;
  paymentTerms?: string; // 'Net 30', 'Due on Receipt', etc.
  purchaseOrderNumber?: string;
  couponCode?: string;
  applyCredits?: boolean;
  notes?: string;
  actorId?: string;
};

export type CreateInvoiceResult = {
  invoiceId: string;
  invoiceNumber: string;
  totalCents: number;
  bankDetails?: Record<string, unknown>;
};

/**
 * Create a new invoice for a plan purchase.
 *
 * Steps:
 *  1. Look up plan by slug/name, use priceYearly as base amount
 *  2. Apply coupon if provided (billing engine)
 *  3. Compute tax (billing engine — IN jurisdiction, GSTIN flag)
 *  4. Check and deduct credit balance if applyCredits=true
 *  5. Compute totals: subtotal = planPrice - discount; tax = subtotal * rate; total = subtotal + tax - credits
 *  6. Generate invoice number
 *  7. Persist invoice record with all amounts and metadata
 *  8. Set status = 'issued', dueAt = NOW() + netDays
 *  9. Create payment transaction via payment adapter
 * 10. Record finance_action: 'invoice_created'
 * 11. Return invoiceId, invoiceNumber, totalCents, bankDetails
 */
export async function createInvoice(
  params: CreateInvoiceParams
): Promise<CreateInvoiceResult> {
  // 1. Look up plan
  const plan = await billingRepo.findPlanByName(params.planSlug);
  if (!plan) {
    throw new Error(`Plan "${params.planSlug}" not found.`);
  }

  const basePriceCents = plan.priceYearly * 100; // stored in dollars, convert to cents

  // 2. Apply coupon discount
  let discountCents = 0;
  let couponMeta: Record<string, unknown> | undefined;
  if (params.couponCode) {
    const couponResult = await applyCoupon({
      code: params.couponCode,
      amountCents: basePriceCents,
      orgId: params.orgId,
    });
    discountCents = couponResult.discountCents;
    couponMeta = couponResult.meta;
  }

  const subtotalCents = Math.max(0, basePriceCents - discountCents);

  // 3. Compute tax
  const hasGstin = Boolean(params.billingGstin && params.billingGstin.trim());
  const taxResult = await computeTax({
    amountCents: subtotalCents,
    jurisdiction: "IN",
    hasGstin,
  });
  const taxCents = taxResult.taxCents;
  const taxRate = taxResult.rate;
  const taxLabel = taxResult.label; // e.g. "GST 18%"

  // 4. Credit balance
  let creditsAppliedCents = 0;
  if (params.applyCredits) {
    const creditBalance = await getCreditBalance(params.orgId);
    const creditAvailable = creditBalance.balanceCents;
    // Credits reduce the post-tax total; cap at total owed
    const totalBeforeCredits = subtotalCents + taxCents;
    creditsAppliedCents = Math.min(creditAvailable, totalBeforeCredits);
  }

  // 5. Final total
  const totalCents = Math.max(0, subtotalCents + taxCents - creditsAppliedCents);

  // 6. Invoice number
  const invoiceNumber = await generateInvoiceNumber(params.orgId);

  // 7. Payment terms / due date
  const { netDays } = parsePaymentTerms(params.paymentTerms);
  const dueAt = new Date(Date.now() + netDays * 86_400_000);

  // 8. Persist invoice record
  const [invoiceRow] = await db
    .insert(invoices)
    .values({
      organizationId: params.orgId,
      planId: plan.id,
      invoiceNumber,
      status: "issued",
      amountCents: basePriceCents,
      discountCents,
      taxCents,
      taxRate: String(taxRate),
      taxLabel: taxLabel ?? null,
      creditsAppliedCents,
      totalCents,
      currency: "INR",
      paymentMethod: params.paymentMethod ?? "bank_transfer",
      billingName: params.billingName,
      billingEmail: params.billingEmail,
      billingGstin: params.billingGstin ?? null,
      billingAddress: params.billingAddress ?? null,
      purchaseOrderNumber: params.purchaseOrderNumber ?? null,
      couponCode: params.couponCode ?? null,
      couponMeta: couponMeta ? JSON.stringify(couponMeta) : null,
      paymentTerms: params.paymentTerms ?? "Due on Receipt",
      notes: params.notes ?? null,
      dueAt,
      updatedAt: new Date(),
    } as Parameters<typeof db.insert>[0] extends infer T ? any : any)
    .returning();

  // 9. Deduct credits from balance if applied
  if (creditsAppliedCents > 0) {
    await deductCredits({
      orgId: params.orgId,
      amountCents: creditsAppliedCents,
      referenceId: invoiceRow.id,
      reason: `Applied to invoice ${invoiceNumber}`,
    });
  }

  // 10. Create payment transaction via provider
  const provider = await getProvider(params.paymentProviderSlug);
  const paymentResult = await provider.createPayment({
    orgId: params.orgId,
    invoiceId: invoiceRow.id,
    invoiceNumber,
    amountCents: totalCents,
    currency: "INR",
    billingName: params.billingName,
    billingEmail: params.billingEmail,
    description: `AUDT ${plan.name} plan — ${invoiceNumber}`,
    metadata: {
      planId: plan.id,
      planName: plan.name,
      couponCode: params.couponCode,
      purchaseOrderNumber: params.purchaseOrderNumber,
    },
  });

  // Store payment transaction reference back on the invoice if provider returned one
  if (paymentResult.transactionId) {
    await db
      .update(invoices)
      .set({ paymentReference: paymentResult.transactionId, updatedAt: new Date() } as any)
      .where(eq(invoices.id, invoiceRow.id));
  }

  // 11. Record finance action
  await recordFinanceAction({
    organizationId: params.orgId,
    invoiceId: invoiceRow.id,
    action: "invoice_created",
    actorId: params.actorId ?? null,
    metadata: {
      invoiceNumber,
      planName: plan.name,
      totalCents,
      discountCents,
      taxCents,
      creditsAppliedCents,
      paymentProviderSlug: params.paymentProviderSlug,
      transactionId: paymentResult.transactionId ?? null,
    },
  });

  return {
    invoiceId: invoiceRow.id,
    invoiceNumber,
    totalCents,
    bankDetails: paymentResult.bankDetails,
  };
}

// ─── 3. sendInvoice ───────────────────────────────────────────────────────────

/**
 * Mark invoice as issued (ready to be sent to the customer).
 * Email delivery is handled separately by the notification layer.
 */
export async function sendInvoice(invoiceId: string): Promise<void> {
  const invoice = await billingRepo.findInvoiceById(invoiceId);
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found.`);

  if (invoice.status === "cancelled") {
    throw new Error("Cannot send a cancelled invoice.");
  }
  if (invoice.status === "paid") {
    throw new Error("Invoice is already paid — sending is not applicable.");
  }

  await db
    .update(invoices)
    .set({ status: "issued", updatedAt: new Date() } as any)
    .where(eq(invoices.id, invoiceId));
}

// ─── 4. cancelInvoice ─────────────────────────────────────────────────────────

/**
 * Cancel an unpaid invoice. Records a finance_action for audit.
 */
export async function cancelInvoice(
  invoiceId: string,
  actorId: string
): Promise<void> {
  const invoice = await billingRepo.findInvoiceById(invoiceId);
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found.`);

  if (invoice.status === "paid") {
    throw new Error(
      "Cannot cancel a paid invoice. Use a refund or credit note workflow instead."
    );
  }
  if (invoice.status === "cancelled") {
    throw new Error("Invoice is already cancelled.");
  }

  await db
    .update(invoices)
    .set({ status: "cancelled", updatedAt: new Date() } as any)
    .where(eq(invoices.id, invoiceId));

  await recordFinanceAction({
    organizationId: invoice.organizationId,
    invoiceId,
    action: "invoice_cancelled",
    actorId,
    metadata: {
      invoiceNumber: invoice.invoiceNumber,
      previousStatus: invoice.status,
      cancelledAt: new Date().toISOString(),
    },
  });
}

// ─── 5. getInvoiceWithDetails ─────────────────────────────────────────────────

/**
 * Fetch a fully-hydrated invoice including org name, plan name,
 * payment transactions, and finance action log entries.
 *
 * Returns a plain object — callers can type-assert as needed.
 */
export async function getInvoiceWithDetails(invoiceId: string): Promise<any> {
  // Core invoice + plan join
  const invoice = await billingRepo.findInvoiceById(invoiceId);
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found.`);

  // Org details
  const [orgRow] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      legalName: (organizations as any).legalName,
      country: (organizations as any).country,
    })
    .from(organizations)
    .where(eq(organizations.id, invoice.organizationId))
    .limit(1);

  // Plan details (already on invoice via planName from billing-repo join)
  let plan: any = null;
  if (invoice.planId) {
    const [planRow] = await db
      .select()
      .from(billingPlans)
      .where(eq(billingPlans.id, invoice.planId))
      .limit(1);
    plan = planRow ?? null;
  }

  // Payment transactions — read from audit_logs where entity_type = 'invoice'
  // and action like 'billing.%' for this invoice. This avoids needing a
  // separate payment_transactions table (which lives in the payment-adapter layer).
  const { recordAudit } = await import("@/lib/repositories/audit-repo");

  // Finance actions from audit_logs
  let financeActions: any[] = [];
  try {
    financeActions = await db.execute(
      sql`
        SELECT id, action, actor_id, metadata, created_at
        FROM audit_logs
        WHERE organization_id = ${invoice.organizationId}
          AND entity_type = 'invoice'
          AND entity_id = ${invoiceId}
        ORDER BY created_at ASC
      `
    ) as any;
    // Normalize result rows (postgres driver returns { rows: [...] } or the array directly)
    if (financeActions && typeof financeActions === "object" && "rows" in financeActions) {
      financeActions = (financeActions as any).rows;
    }
  } catch {
    financeActions = [];
  }

  return {
    ...invoice,
    org: orgRow ?? null,
    plan,
    financeActions,
  };
}

// ─── 6. listPendingVerification ───────────────────────────────────────────────

/**
 * Return all invoices with status = 'pending_verification'.
 * Used by the finance admin queue to review bank transfer receipts.
 * Joins with organizations and includes payment reference data.
 */
export async function listPendingVerification(limit = 50): Promise<any[]> {
  const rows = await db
    .select({
      invoice: invoices,
      planName: billingPlans.name,
      orgName: organizations.name,
      orgId: organizations.id,
    })
    .from(invoices)
    .leftJoin(billingPlans, eq(invoices.planId, billingPlans.id))
    .innerJoin(organizations, eq(invoices.organizationId, organizations.id))
    .where(eq(invoices.status as any, "pending_verification"))
    .orderBy(desc(invoices.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r.invoice,
    planName: r.planName ?? null,
    org: {
      id: r.orgId,
      name: r.orgName,
    },
  }));
}
