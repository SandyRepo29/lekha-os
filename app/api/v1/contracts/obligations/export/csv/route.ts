import { requireUser } from "@/lib/auth/session";
import { getObligations } from "@/backend/src/modules/contract-governance/contract-repo";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const obligations = await getObligations(session.org.id);

  const header = ["ID", "Title", "Contract", "Status", "Risk Level", "Due Date", "Notes"];
  const rows = obligations.map((o) => [
    o.id,
    o.title,
    o.contractTitle ?? "",
    o.status ?? "",
    o.riskLevel ?? "",
    o.dueDate ?? "",
    o.notes ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="contract-obligations-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
