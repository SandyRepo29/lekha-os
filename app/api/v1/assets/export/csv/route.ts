import { requireUser } from "@/lib/auth/session";
import { findAllAssets } from "@/lib/repositories/asset-intelligence-repo";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assets = await findAllAssets(session.org.id);

  const header = ["ID", "Name", "Asset Type", "Criticality", "Status", "Environment", "Data Class", "Contains PII", "Business Unit", "Cloud Provider"];
  const rows = assets.map((a) => [
    a.id,
    a.name,
    a.assetType ?? "",
    a.criticality ?? "",
    a.status ?? "",
    a.environment ?? "",
    a.dataClass ?? "",
    a.containsPii ? "Yes" : "No",
    a.businessUnit ?? "",
    a.cloudProvider ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="assets-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
