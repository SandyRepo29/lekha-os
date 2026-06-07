export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import * as treatmentRepo from "@/lib/repositories/risk-treatment-repo";
import * as riskRepo from "@/lib/repositories/risk-repo";

export async function GET() {
  const session = await requireUser();
  if (!session.org) return new NextResponse("Unauthorized", { status: 401 });

  const [treatments, risks] = await Promise.all([
    treatmentRepo.findByOrg(session.org.id),
    riskRepo.findByOrg(session.org.id),
  ]);

  const riskMap = Object.fromEntries(risks.map((r) => [r.id, r]));

  const header = "Risk Title,Action,Status,Progress %,Target Date,Completed At\n";
  const rows = treatments.map((t) => {
    const risk = riskMap[t.riskId];
    return [
      `"${(risk?.title ?? "").replace(/"/g, '""')}"`,
      `"${t.action.replace(/"/g, '""')}"`,
      t.status,
      t.progressPercent,
      t.targetDate ?? "",
      t.completedAt ? new Date(t.completedAt).toISOString().slice(0, 10) : "",
    ].join(",");
  });

  const csv = header + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="risk-treatments-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
