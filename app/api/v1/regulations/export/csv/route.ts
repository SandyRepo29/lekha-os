import { requireUser } from "@/lib/auth/session";
import { findAllRegulations } from "@/lib/repositories/regulatory-intelligence-repo";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const regulations = await findAllRegulations(session.org.id);

  const header = ["ID", "Name", "Country", "Region", "Category", "Status", "Effective Date", "Review Date", "Is Builtin"];
  const rows = regulations.map((r) => [
    r.id,
    r.name,
    r.country ?? "",
    r.region ?? "",
    r.category ?? "",
    r.status ?? "",
    r.effectiveDate ?? "",
    r.reviewDate ?? "",
    r.isBuiltin ? "Yes" : "No",
  ]);

  const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="regulations-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
