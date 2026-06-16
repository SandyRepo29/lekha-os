export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import * as billingRepo from "@/lib/repositories/billing-repo";
import type { InvoicePdfData } from "@/lib/reports/invoice-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { id } = await params;
  const invoice = await billingRepo.findInvoiceById(id);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.organizationId !== session.org.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { renderToBuffer } = await import("@react-pdf/renderer");
  const React = (await import("react")).default;
  const { InvoicePdf } = await import("@/lib/reports/invoice-pdf");

  const data: InvoicePdfData = {
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    createdAt: new Date(invoice.createdAt),
    dueAt: invoice.dueAt ? new Date(invoice.dueAt) : null,
    paidAt: invoice.paidAt ? new Date(invoice.paidAt) : null,
    orgName: session.orgName,
    planName: invoice.planName ?? "AUDT",
    billingName: invoice.billingName,
    billingEmail: invoice.billingEmail,
    billingGstin: invoice.billingGstin,
    amountCents: invoice.amountCents,
    currency: invoice.currency ?? "USD",
    notes: invoice.notes,
  };

  const doc = React.createElement(InvoicePdf, { data });
  const buffer = await renderToBuffer(doc as any);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}
