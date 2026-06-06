export const dynamic = "force-dynamic";

import React from "react";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getAudit } from "@/lib/services/audit/audit-service";
import { listFindings } from "@/lib/services/audit/finding-service";
import { findProfile } from "@/lib/services/settings-service";
import { AuditFindingsReport } from "@/lib/reports/audit-findings-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireUser();
    if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [audit, findings, profile] = await Promise.all([
      getAudit(session.org.id, id),
      listFindings(session.org.id, { auditId: id }),
      findProfile(session.id),
    ]);

    if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

    const generatedBy = profile?.fullName || session.email;
    const doc = React.createElement(AuditFindingsReport, {
      orgName: session.orgName,
      generatedBy,
      audit,
      findings,
    });

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const buffer = await renderToBuffer(doc as any);
    const date = new Date().toISOString().slice(0, 10);
    const slug = audit.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lekha-findings-${slug}-${date}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[audit findings PDF]", err);
    return NextResponse.json(
      { error: "PDF generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
