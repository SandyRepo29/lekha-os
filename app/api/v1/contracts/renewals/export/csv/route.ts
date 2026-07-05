import { requireUser } from "@/lib/auth/session";
import { findContractsByOrg } from "@/lib/repositories/contract-repo";
import { NextResponse } from "next/server";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export async function GET() {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contracts = (await findContractsByOrg(session.org.id))
    .filter((c) => !!c.expiryDate)
    .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());

  const header = [
    "ID",
    "Title",
    "Vendor",
    "Status",
    "Expiry Date",
    "Days Until Expiry",
    "Notice Period (days)",
    "Action Deadline",
    "Auto Renewal",
  ];
  const rows = contracts.map((c) => {
    const expiry = new Date(c.expiryDate!);
    const daysUntilExpiry = Math.floor((expiry.getTime() - Date.now()) / MS_PER_DAY);
    const notice = c.noticePeriodDays ?? 0;
    const actionDeadline = new Date(expiry.getTime() - notice * MS_PER_DAY).toISOString().slice(0, 10);
    return [
      c.id,
      c.title,
      c.vendorName ?? "",
      c.status,
      c.expiryDate ?? "",
      daysUntilExpiry,
      notice,
      actionDeadline,
      c.autoRenewal ? "Yes" : "No",
    ];
  });

  const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="contract-renewals-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
