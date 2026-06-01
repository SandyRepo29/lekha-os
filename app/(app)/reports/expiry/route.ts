export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderToBuffer } = require("@react-pdf/renderer");
import React from "react";
import { eq, and, lte } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { vendorDocuments, vendors } from "@/lib/db/schema";
import { findProfile } from "@/lib/services/settings-service";
import { ExpiryReport, type ExpiryDocRow } from "@/lib/reports/expiry-pdf";

export async function GET() {
  try {
    const session = await requireUser();
    if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const in60 = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);

    const rows = await db
      .select({
        vendorName: vendors.name,
        documentType: vendorDocuments.documentType,
        expiresOn: vendorDocuments.expiresOn,
        status: vendorDocuments.status,
      })
      .from(vendorDocuments)
      .innerJoin(vendors, eq(vendorDocuments.vendorId, vendors.id))
      .where(and(eq(vendorDocuments.organizationId, session.org.id), lte(vendorDocuments.expiresOn, in60)))
      .orderBy(vendorDocuments.expiresOn);

    const today = new Date();
    const expiryRows: ExpiryDocRow[] = rows.map((r) => {
      const daysLeft = r.expiresOn
        ? Math.round((new Date(r.expiresOn).getTime() - today.getTime()) / 86_400_000)
        : null;
      return { vendorName: r.vendorName, documentType: r.documentType, expiresOn: r.expiresOn, status: r.status, daysLeft };
    });

    const profile = await findProfile(session.id);
    const generatedBy = profile?.fullName || session.email;
    const doc = React.createElement(ExpiryReport, { orgName: session.orgName, generatedBy, rows: expiryRows });
    const buffer: Buffer = await renderToBuffer(doc);
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lekha-expiry-${date}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[/reports/expiry] PDF generation failed:", err);
    return NextResponse.json(
      { error: "PDF generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
