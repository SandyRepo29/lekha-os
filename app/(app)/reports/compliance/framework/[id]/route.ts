export const dynamic = "force-dynamic";

import React from "react";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getFramework } from "@/backend/src/modules/compliance/framework-service";
import { listControls } from "@/backend/src/modules/compliance/control-service";
import { listGaps } from "@/backend/src/modules/compliance/gap-service";
import { getCachedInsight } from "@/backend/src/modules/compliance/ai-compliance-service";
import { findProfile } from "@/backend/src/modules/settings/settings-service";
import { ComplianceFrameworkReport } from "@/lib/reports/compliance-framework-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireUser();
    if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [fw, controls, gaps, summaryInsight, profile] = await Promise.all([
      getFramework(session.org.id, id),
      listControls(session.org.id, id),
      listGaps(session.org.id, id, false),
      getCachedInsight(session.org.id, "framework_summary", id),
      findProfile(session.id),
    ]);

    if (!fw) return NextResponse.json({ error: "Framework not found" }, { status: 404 });

    const generatedBy = profile?.fullName || session.email;
    const doc = React.createElement(ComplianceFrameworkReport, {
      orgName: session.orgName,
      generatedBy,
      framework: fw,
      readiness: fw.readiness,
      controls,
      gaps,
      summary: summaryInsight?.content ?? null,
    });

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const buffer = await renderToBuffer(doc as any);
    const date = new Date().toISOString().slice(0, 10);
    const slug = fw.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lekha-${slug}-${date}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[compliance/framework PDF]", err);
    return NextResponse.json(
      { error: "PDF generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
