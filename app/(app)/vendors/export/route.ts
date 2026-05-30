export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { listVendors } from "@/lib/services/vendor-service";

export async function GET() {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendors = await listVendors(session.org.id);

  const header = ["Name", "Category", "Status", "Risk Level", "Compliance Score", "Documents", "Expiring Soon"];
  const rows = vendors.map((v) => [
    `"${v.name.replace(/"/g, '""')}"`,
    `"${(v.category ?? "").replace(/"/g, '""')}"`,
    v.status,
    v.risk,
    v.score,
    v.docs,
    v.expiring,
  ].join(","));

  const csv = [header.join(","), ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lekha-vendors-${date}.csv"`,
    },
  });
}
