export const dynamic = "force-dynamic";

import React from "react";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { listFrameworks } from "@/lib/services/compliance/framework-service";
import { listGaps } from "@/lib/services/compliance/gap-service";
import { listPolicies } from "@/lib/services/compliance/policy-service";
import { getCachedInsight } from "@/lib/services/compliance/ai-compliance-service";
import { findProfile } from "@/lib/services/settings-service";
import { ComplianceExecutiveReport } from "@/lib/reports/compliance-executive-pdf";

export async function GET() {
  try {
    const session = await requireUser();
    if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = session.org.id;
    const [frameworks, allGaps, policies, execInsight, profile] = await Promise.all([
      listFrameworks(orgId),
      listGaps(orgId, undefined, false),
      listPolicies(orgId),
      getCachedInsight(orgId, "executive_summary", orgId),
      findProfile(session.id),
    ]);

    const generatedBy = profile?.fullName || session.email;
    const doc = React.createElement(ComplianceExecutiveReport, {
      orgName: session.orgName,
      generatedBy,
      frameworks,
      allGaps,
      policies,
      executiveSummary: execInsight?.content ?? null,
    });

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const buffer = await renderToBuffer(doc as any);
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lekha-compliance-executive-${date}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[compliance/executive PDF]", err);
    return NextResponse.json(
      { error: "PDF generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
