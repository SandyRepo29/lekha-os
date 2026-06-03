export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { listGaps } from "@/lib/services/compliance/gap-service";
import { listFrameworks } from "@/lib/services/compliance/framework-service";

function esc(v: string | null | undefined) {
  return `"${(v ?? "").replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.org.id;
  const [gaps, frameworks] = await Promise.all([
    listGaps(orgId, undefined, false),
    listFrameworks(orgId),
  ]);

  const fwMap = new Map(frameworks.map((f) => [f.id, f.name]));

  const header = ["Framework", "Type", "Severity", "Description", "AI Detected", "Created At"];
  const rows = gaps.map((g) => [
    esc(fwMap.get(g.frameworkId) ?? "Unknown"),
    g.gapType.replace(/_/g, " "),
    g.severity,
    esc(g.description),
    g.isAiDetected ? "Yes" : "No",
    g.createdAt.toISOString().slice(0, 10),
  ].join(","));

  const csv = [header.join(","), ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lekha-gaps-${date}.csv"`,
    },
  });
}
