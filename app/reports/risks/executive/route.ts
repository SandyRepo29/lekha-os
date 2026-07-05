export const dynamic = "force-dynamic";

import React from "react";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/lib/services/risk/risk-service";
import { getCachedExecutiveSummary } from "@/lib/services/risk/ai-risk-service";
import { findProfile } from "@/lib/services/settings-service";
import { RiskExecutiveReport } from "@/lib/reports/risk-executive-pdf";

export async function GET() {
  try {
    const session = await requireUser();
    if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [metrics, exec, profile] = await Promise.all([
      getDashboardMetrics(session.org.id),
      getCachedExecutiveSummary(session.org.id),
      findProfile(session.id),
    ]);

    const doc = React.createElement(RiskExecutiveReport, {
      orgName: session.org.name,
      generatedBy: profile?.fullName || session.email,
      metrics: metrics as never,
      executiveSummary: exec?.content ?? null,
    });

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const buffer = await renderToBuffer(doc as never);
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="audt-risk-executive-${date}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[risks/executive PDF]", err);
    return NextResponse.json(
      { error: "PDF generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
