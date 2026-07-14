export const dynamic = "force-dynamic";

import React from "react";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getAudit } from "@/backend/src/modules/audit-management/audit-service";
import { listFindings } from "@/backend/src/modules/audit-management/finding-service";
import { listCapas } from "@/backend/src/modules/audit-management/capa-service";
import { getCachedExecutiveReport } from "@/backend/src/modules/audit-management/ai-audit-service";
import { findProfile } from "@/backend/src/modules/settings/settings-service";
import { AuditReport } from "@/lib/reports/audit-report-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireUser();
    if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [audit, findings, execReport, profile] = await Promise.all([
      getAudit(session.org.id, id),
      listFindings(session.org.id, { auditId: id }),
      getCachedExecutiveReport(session.org.id, id),
      findProfile(session.id),
    ]);

    if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

    const allCapas = await listCapas(session.org.id, {});
    const findingIds = new Set(findings.map((f) => f.id));
    const capas = allCapas.filter((c) => findingIds.has(c.findingId));

    const generatedBy = profile?.fullName || session.email;
    const doc = React.createElement(AuditReport, {
      orgName: session.orgName,
      generatedBy,
      audit,
      findings,
      capas,
      executiveReport: execReport?.content ?? null,
    });

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const buffer = await renderToBuffer(doc as any);
    const date = new Date().toISOString().slice(0, 10);
    const slug = audit.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lekha-audit-${slug}-${date}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[audit PDF]", err);
    return NextResponse.json(
      { error: "PDF generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
