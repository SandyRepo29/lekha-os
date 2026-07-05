import { requireUser } from "@/lib/auth/session";
import { findPoliciesByOrg } from "@/lib/repositories/policy-governance-repo";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const policies = await findPoliciesByOrg(session.org.id);

  const header = ["ID", "Name", "Type", "Status", "Version", "Owner", "Health", "Review Date", "Controls", "Frameworks"];
  const rows = policies.map((p) => [
    p.id,
    p.name,
    p.policyType ?? "",
    p.status,
    p.version ?? "",
    p.ownerName ?? "",
    p.healthScore ?? "",
    p.reviewDate ?? "",
    p.controlCount,
    p.frameworkCount,
  ]);

  const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="policies-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
