export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getAudit } from "@/backend/src/modules/audit-management/audit-service";
import { listFindings } from "@/backend/src/modules/audit-management/finding-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireUser();
    if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [audit, findings] = await Promise.all([
      getAudit(session.org.id, id),
      listFindings(session.org.id, { auditId: id }),
    ]);

    if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

    const header = ["Title", "Severity", "Status", "Description", "Recommendation", "Created At"];
    const rows = findings.map((f) => [
      `"${f.title.replace(/"/g, '""')}"`,
      f.severity,
      f.status,
      `"${(f.description ?? "").replace(/"/g, '""')}"`,
      `"${(f.recommendation ?? "").replace(/"/g, '""')}"`,
      f.createdAt ? new Date(f.createdAt).toISOString() : "",
    ]);

    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const date = new Date().toISOString().slice(0, 10);
    const slug = audit.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="lekha-findings-${slug}-${date}.csv"`,
      },
    });
  } catch (err) {
    console.error("[audit findings CSV]", err);
    return NextResponse.json(
      { error: "CSV generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
