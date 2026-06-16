"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import * as billingService from "@/lib/services/billing-service";
import { DomainError } from "@/lib/services/errors";

export async function requestUpgradeAction(formData: FormData) {
  const session = await requireUser();
  if (!session.org) return { error: "No active organization." };

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
      orgId: session.org.id,
      actorId: session.id,
      planName,
      billingName,
      billingEmail,
      billingGstin,
      message,
      orgName: session.orgName,
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
  if (!session.org) return { error: "No active organization." };
  if (session.org.role !== "owner" && session.org.role !== "admin") {
    return { error: "Only owners and admins can cancel the subscription." };
  }

  const reason = (formData.get("reason") as string) || null;

  try {
    await billingService.cancelSubscription({
      orgId: session.org.id,
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
  if (!session.org) return { error: "No active organization." };
  if (session.org.role !== "owner" && session.org.role !== "admin") {
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
      orgId: session.org.id,
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

export async function downloadInvoiceAction(invoiceId: string): Promise<{ url?: string; error?: string }> {
  const session = await requireUser();
  if (!session.org) return { error: "No active organization." };

  return { url: `/api/v1/invoices/${invoiceId}/pdf` };
}
