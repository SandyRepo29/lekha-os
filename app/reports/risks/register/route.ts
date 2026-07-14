export const dynamic = "force-dynamic";

import React from "react";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import * as riskRepo from "@/backend/src/modules/risk-lens/risk-repo";
import { findProfile } from "@/backend/src/modules/settings/settings-service";
import { RiskRegisterReport } from "@/lib/reports/risk-register-pdf";

export async function GET() {
  try {
    const session = await requireUser();
    if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [risks, profile] = await Promise.all([
      riskRepo.findByOrg(session.org.id),
      findProfile(session.id),
    ]);

    const doc = React.createElement(RiskRegisterReport, {
      orgName: session.org.name,
      generatedBy: profile?.fullName || session.email,
      risks: risks as never,
    });

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const buffer = await renderToBuffer(doc as never);
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="audt-risk-register-${date}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[risks/register PDF]", err);
    return NextResponse.json(
      { error: "PDF generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
