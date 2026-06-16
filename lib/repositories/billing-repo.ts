import { db } from "@/lib/db";
import { billingPlans, subscriptions, invoices } from "@/lib/db/schema";
import type { BillingPlan, Subscription, Invoice } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function listActivePlans(): Promise<BillingPlan[]> {
  return db
    .select()
    .from(billingPlans)
    .where(eq(billingPlans.isActive, true));
}

export async function findPlanByName(name: string): Promise<BillingPlan | null> {
  const [row] = await db
    .select()
    .from(billingPlans)
    .where(eq(billingPlans.name, name))
    .limit(1);
  return row ?? null;
}

export async function insertPlan(values: {
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  maxUsers: number;
  maxVendors: number;
  maxStorageGb: number;
}): Promise<{ id: string }> {
  const [row] = await db
    .insert(billingPlans)
    .values(values)
    .returning({ id: billingPlans.id });
  return row;
}

export async function getSubscription(
  orgId: string
): Promise<(Subscription & { plan: BillingPlan }) | null> {
  const [row] = await db
    .select({
      subscription: subscriptions,
      plan: billingPlans,
    })
    .from(subscriptions)
    .innerJoin(billingPlans, eq(subscriptions.planId, billingPlans.id))
    .where(eq(subscriptions.organizationId, orgId))
    .limit(1);
  if (!row) return null;
  return { ...row.subscription, plan: row.plan };
}

export async function upsertSubscription(
  orgId: string,
  planId: string,
  values: {
    status?: string;
    billingCycle?: string;
    currentPeriodEnd?: Date | null;
    requestedPlan?: string | null;
    cancelAtPeriodEnd?: boolean;
    cancelledAt?: Date | null;
    cancelReason?: string | null;
  } = {}
): Promise<void> {
  await db
    .insert(subscriptions)
    .values({
      organizationId: orgId,
      planId,
      status: values.status ?? "trial",
      billingCycle: values.billingCycle ?? "trial",
      currentPeriodStart: new Date(),
      currentPeriodEnd: values.currentPeriodEnd ?? null,
      requestedPlan: values.requestedPlan ?? null,
      cancelAtPeriodEnd: values.cancelAtPeriodEnd ?? false,
      cancelledAt: values.cancelledAt ?? null,
      cancelReason: values.cancelReason ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.organizationId,
      set: {
        planId,
        status: values.status ?? "trial",
        billingCycle: values.billingCycle ?? "trial",
        ...(values.currentPeriodEnd !== undefined && { currentPeriodEnd: values.currentPeriodEnd }),
        ...(values.requestedPlan !== undefined && { requestedPlan: values.requestedPlan }),
        ...(values.cancelAtPeriodEnd !== undefined && { cancelAtPeriodEnd: values.cancelAtPeriodEnd }),
        ...(values.cancelledAt !== undefined && { cancelledAt: values.cancelledAt }),
        ...(values.cancelReason !== undefined && { cancelReason: values.cancelReason }),
        updatedAt: new Date(),
      },
    });
}

// ─── Invoice CRUD ─────────────────────────────────────────────────────────────

export async function getNextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoices)
    .where(sql`extract(year from created_at) = ${year}`);
  const seq = (Number(row?.count ?? 0) + 1).toString().padStart(4, "0");
  return `AUDT-${year}-${seq}`;
}

export async function insertInvoice(values: {
  organizationId: string;
  planId?: string | null;
  amountCents: number;
  currency?: string;
  paymentMethod?: string;
  billingName?: string | null;
  billingEmail?: string | null;
  billingGstin?: string | null;
  notes?: string | null;
  dueAt?: Date | null;
}): Promise<Invoice> {
  const invoiceNumber = await getNextInvoiceNumber();
  const [row] = await db
    .insert(invoices)
    .values({
      ...values,
      invoiceNumber,
      status: "sent",
      currency: values.currency ?? "USD",
      paymentMethod: values.paymentMethod ?? "bank_transfer",
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

export type InvoiceWithPlan = Invoice & { planName: string | null };

export async function findInvoicesByOrg(orgId: string): Promise<InvoiceWithPlan[]> {
  const rows = await db
    .select({ invoice: invoices, planName: billingPlans.name })
    .from(invoices)
    .leftJoin(billingPlans, eq(invoices.planId, billingPlans.id))
    .where(eq(invoices.organizationId, orgId))
    .orderBy(desc(invoices.createdAt));
  return rows.map((r) => ({ ...r.invoice, planName: r.planName ?? null }));
}

export async function findInvoiceById(id: string): Promise<InvoiceWithPlan | null> {
  const [row] = await db
    .select({ invoice: invoices, planName: billingPlans.name })
    .from(invoices)
    .leftJoin(billingPlans, eq(invoices.planId, billingPlans.id))
    .where(eq(invoices.id, id))
    .limit(1);
  if (!row) return null;
  return { ...row.invoice, planName: row.planName ?? null };
}

export async function updateInvoice(
  id: string,
  values: Partial<{
    status: string;
    paymentReference: string | null;
    pdfUrl: string | null;
    paidAt: Date | null;
    billingName: string | null;
    billingEmail: string | null;
    billingGstin: string | null;
  }>
): Promise<void> {
  await db
    .update(invoices)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(invoices.id, id));
}

export async function findTrialsExpiringSoon(
  withinDays: number
): Promise<Array<{ orgId: string; currentPeriodEnd: Date }>> {
  const cutoff = new Date(Date.now() + withinDays * 86_400_000);
  const rows = await db
    .select({ orgId: subscriptions.organizationId, currentPeriodEnd: subscriptions.currentPeriodEnd })
    .from(subscriptions)
    .where(
      sql`status = 'trial'
        AND current_period_end IS NOT NULL
        AND current_period_end > NOW()
        AND current_period_end <= ${cutoff}`
    );
  return rows.map((r) => ({ orgId: r.orgId, currentPeriodEnd: r.currentPeriodEnd! }));
}

export async function findExpiredTrials(): Promise<Array<{ orgId: string }>> {
  const rows = await db
    .select({ orgId: subscriptions.organizationId })
    .from(subscriptions)
    .where(sql`status = 'trial' AND current_period_end IS NOT NULL AND current_period_end < NOW()`);
  return rows;
}

export async function findCancelAtPeriodEnd(): Promise<Array<{ orgId: string }>> {
  const rows = await db
    .select({ orgId: subscriptions.organizationId })
    .from(subscriptions)
    .where(
      sql`cancel_at_period_end = TRUE
        AND status NOT IN ('cancelled')
        AND current_period_end IS NOT NULL
        AND current_period_end < NOW()`
    );
  return rows;
}
