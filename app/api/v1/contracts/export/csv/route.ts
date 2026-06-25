import { requireUser } from "@/lib/auth/session";
import { findContractsByOrg } from "@/lib/repositories/contract-repo";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contracts = await findContractsByOrg(session.org.id);

  const header = ["ID", "Title", "Contract Type", "Status", "Vendor", "Effective Date", "Expiry Date", "Value", "Currency", "Trust Score"];
  const rows = contracts.map((c) => [
    c.id,
    c.title,
    c.contractType ?? "",
    c.status,
    c.vendorName ?? "",
    c.effectiveDate ?? "",
    c.expiryDate ?? "",
    c.value ?? "",
    c.currency ?? "",
    c.trustScore ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="contracts-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
