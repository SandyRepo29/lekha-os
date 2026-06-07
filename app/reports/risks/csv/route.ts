export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import * as riskRepo from "@/lib/repositories/risk-repo";
import { RISK_CATEGORY_LABELS, RISK_STATUS_LABELS, TREATMENT_STRATEGY_LABELS, scoreToLevel } from "@/lib/services/risk-scoring";

export async function GET() {
  const session = await requireUser();
  if (!session.org) return new NextResponse("Unauthorized", { status: 401 });

  const risks = await riskRepo.findByOrg(session.org.id);

  const header = "Title,Category,Status,Owner,Impact,Likelihood,Score,Level,Treatment,Target Date,Identified Date\n";
  const rows = risks.map((r) => {
    const level = scoreToLevel(r.inherentScore);
    return [
      `"${r.title.replace(/"/g, '""')}"`,
      RISK_CATEGORY_LABELS[r.category] ?? r.category,
      RISK_STATUS_LABELS[r.status] ?? r.status,
      r.ownerName ?? "",
      r.impact,
      r.likelihood,
      r.inherentScore,
      level,
      TREATMENT_STRATEGY_LABELS[r.treatmentStrategy ?? ""] ?? "",
      r.targetDate ?? "",
      r.identifiedDate ?? "",
    ].join(",");
  });

  const csv = header + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="risks-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
