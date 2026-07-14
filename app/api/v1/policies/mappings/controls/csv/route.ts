import { requireUser } from "@/lib/auth/session";
import { getPolicyControlMappingsByOrg } from "@/backend/src/modules/policy-governance/policy-governance-repo";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await getPolicyControlMappingsByOrg(session.org.id);

  const header = ["Policy", "Control Ref", "Control", "Control Status"];
  const csvRows = rows.map((r) => [
    r.policyName ?? "",
    r.controlRef ?? "",
    r.controlName ?? "",
    r.controlStatus ?? "",
  ]);

  const csv = [header, ...csvRows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="policy-control-mappings-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
