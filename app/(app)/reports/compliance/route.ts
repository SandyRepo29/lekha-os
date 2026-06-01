export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderToBuffer } = require("@react-pdf/renderer");
import React from "react";
import { requireUser } from "@/lib/auth/session";
import { listVendors, getMetrics } from "@/lib/services/vendor-service";
import { VendorComplianceReport } from "@/lib/reports/vendor-compliance-pdf";
import { findProfile } from "@/lib/services/settings-service";

export async function GET() {
  try {
    const session = await requireUser();
    if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [vendors, metrics, profile] = await Promise.all([
      listVendors(session.org.id),
      getMetrics(session.org.id),
      findProfile(session.id),
    ]);

    const generatedBy = profile?.fullName || session.email;
    const doc = React.createElement(VendorComplianceReport, { orgName: session.orgName, generatedBy, vendors, metrics });
    const buffer: Buffer = await renderToBuffer(doc);
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lekha-compliance-${date}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[/reports/compliance] PDF generation failed:", err);
    return NextResponse.json(
      { error: "PDF generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
