export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import React from "react";
import { requireUser } from "@/lib/auth/session";
import { getVendor } from "@/lib/services/vendor-service";
import { listForVendor } from "@/lib/services/document-service";
import { listReviews } from "@/lib/services/review-service";
import { listAssessments } from "@/lib/services/assessment-service";
import { getChecklistForVendor } from "@/lib/services/template-service";
import { findProfile } from "@/lib/services/settings-service";
import { computeRiskScore } from "@/lib/services/risk-engine";
import { AuditPackagePdf } from "@/lib/reports/audit-package-pdf";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireUser();
    if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [vendor, docs, reviews, assessments, checklist, profile] = await Promise.all([
      getVendor(session.org.id, id),
      listForVendor(session.org.id, id),
      listReviews(session.org.id, id),
      listAssessments(session.org.id, id),
      getChecklistForVendor(session.org.id, id),
      findProfile(session.id),
    ]);

    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const docCounts = {
      total: docs.length,
      valid: docs.filter((d) => d.status === "valid").length,
      expiring: docs.filter((d) => d.status === "expiring").length,
      expired: docs.filter((d) => d.status === "expired").length,
    };
    const riskScore = computeRiskScore(vendor, docCounts, null);
    const generatedBy = profile?.fullName || session.email;

    const doc = React.createElement(AuditPackagePdf, {
      orgName: session.orgName, generatedBy, vendor, docs, reviews, assessments, checklist,
      riskScore: { level: riskScore.level, score: riskScore.score },
    });

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const buffer = await renderToBuffer(doc as any);
    const safeName = vendor.name.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40);
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="audit-package-${safeName}-${date}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[/audit-package]", err);
    return NextResponse.json(
      { error: "PDF generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
