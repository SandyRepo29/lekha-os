export const dynamic = "force-dynamic";

import React from "react";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { findInvoiceById } from "@/backend/src/modules/billing/billing-repo";
import { InvoicePdf } from "@/lib/reports/invoice-pdf";
import type { InvoicePdfData } from "@/lib/reports/invoice-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireUser();
    if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invoice = await findInvoiceById(id);
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (invoice.organizationId !== session.org.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const data: InvoicePdfData = {
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      createdAt: invoice.createdAt,
      dueAt: invoice.dueAt ?? null,
      paidAt: (invoice as Record<string, unknown>).paidAt as Date | null ?? null,
      orgName: session.org.name,
      planName: invoice.planName ?? "AUDT Plan",
      billingName: invoice.billingName ?? null,
      billingEmail: invoice.billingEmail ?? null,
      billingGstin: invoice.billingGstin ?? null,
      amountCents: invoice.amountCents,
      currency: invoice.currency ?? "USD",
      notes: invoice.notes ?? null,
    };

    const doc = React.createElement(InvoicePdf, { data });
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="audt-invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[invoice PDF]", err);
    return NextResponse.json(
      { error: "PDF generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
