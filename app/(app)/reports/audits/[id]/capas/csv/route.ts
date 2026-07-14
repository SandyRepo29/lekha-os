export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getAudit } from "@/backend/src/modules/audit-management/audit-service";
import { listCapas } from "@/backend/src/modules/audit-management/capa-service";
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
    const allCapas = await listCapas(session.org.id, {});
    const findingIds = new Set(findings.map((f) => f.id));
    const capas = allCapas.filter((c) => findingIds.has(c.findingId));

    const header = ["Title", "Status", "Due Date", "Completed At", "Description", "Completion Notes"];
    const rows = capas.map((c) => [
      `"${c.title.replace(/"/g, '""')}"`,
      c.status,
      c.dueDate ? new Date(c.dueDate).toISOString().slice(0, 10) : "",
      c.completedAt ? new Date(c.completedAt).toISOString() : "",
      `"${(c.description ?? "").replace(/"/g, '""')}"`,
      `"${(c.completionNotes ?? "").replace(/"/g, '""')}"`,
    ]);

    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const date = new Date().toISOString().slice(0, 10);
    const slug = audit.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="lekha-capas-${slug}-${date}.csv"`,
      },
    });
  } catch (err) {
    console.error("[audit CAPAs CSV]", err);
    return NextResponse.json(
      { error: "CSV generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
