export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import React from "react";
import { requireUser } from "@/lib/auth/session";
import { getVendor } from "@/lib/services/vendor-service";
import { findProfile } from "@/lib/services/settings-service";
import { generateExecutiveSummaryReport } from "@/lib/services/ai-insights-service";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { ExecutiveSummaryPdf } from "@/lib/reports/executive-summary-pdf";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireUser();
    if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isGeminiConfigured()) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 500 });
    }

    const [vendor, profile] = await Promise.all([
      getVendor(session.org.id, id),
      findProfile(session.id),
    ]);
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const report = await generateExecutiveSummaryReport(session.org.id, id);
    const generatedBy = profile?.fullName || session.email;

    const doc = React.createElement(ExecutiveSummaryPdf, {
      vendor, report, orgName: session.orgName, generatedBy,
    });

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const buffer = await renderToBuffer(doc as any);
    const safeName = vendor.name.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40);
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="executive-summary-${safeName}-${date}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[/executive-report]", err);
    return NextResponse.json(
      { error: "Report generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
