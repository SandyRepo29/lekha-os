import { requireUser } from "@/lib/auth/session";
import { findObligationsByOrg } from "@/backend/src/modules/regulatory-intelligence/regulatory-intelligence-repo";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const obls = await findObligationsByOrg(session.org.id);

  const header = ["ID", "Title", "Category", "Priority", "Status", "Due Date", "Business Unit", "Notes"];
  const rows = obls.map((o) => [
    o.id,
    o.title,
    o.category ?? "",
    o.priority ?? "",
    o.status ?? "",
    o.dueDate ?? "",
    o.businessUnit ?? "",
    o.notes ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="regulatory-obligations-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
