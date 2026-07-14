import { requireUser } from "@/lib/auth/session";
import { getClausesByOrg } from "@/backend/src/modules/contract-governance/contract-repo";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clauses = await getClausesByOrg(session.org.id);

  const header = ["ID", "Contract", "Clause", "Category", "Risk Level", "Missing", "AI Analysis"];
  const rows = clauses.map((cl) => [
    cl.id,
    cl.contractTitle ?? "",
    cl.title,
    cl.category ?? "",
    cl.riskLevel ?? "",
    cl.isMissing ? "Yes" : "No",
    cl.aiAnalysis ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="contract-clauses-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
