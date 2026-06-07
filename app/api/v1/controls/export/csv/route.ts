import { requireUser } from "@/lib/auth/session";
import { findAllControls } from "@/lib/repositories/control-center-repo";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const controls = await findAllControls(session.org.id);

  const header = ["Control ID", "Name", "Category", "Type", "Status", "Priority", "Automation", "Health Score", "Evidence Count", "Owner", "Next Review", "Next Test Date"];
  const rows = controls.map((c) => [
    c.controlRef,
    c.name,
    c.category ?? "",
    c.controlType ?? "",
    c.status,
    c.priority,
    c.automationLevel ?? "",
    c.healthScore ?? "",
    c.evidenceCount,
    c.owner ?? c.ownerName ?? "",
    c.nextReviewDate ?? "",
    c.nextTestDate ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="controls-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
