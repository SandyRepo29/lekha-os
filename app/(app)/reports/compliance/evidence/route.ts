export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { listEvidence } from "@/backend/src/modules/compliance/evidence-service";
import * as evidenceRepo from "@/backend/src/modules/compliance/evidence-repo";

function esc(v: string | null | undefined) {
  return `"${(v ?? "").replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.org.id;
  const items = await listEvidence(orgId);

  const enriched = await Promise.all(
    items.map(async (ev) => {
      const mappings = await evidenceRepo.findMappingsByEvidence(ev.id);
      return { ...ev, mappedCount: mappings.length };
    })
  );

  const header = ["Title", "Source", "Status", "Owner", "Expires On", "Mapped Controls", "Created At"];
  const rows = enriched.map((ev) => [
    esc(ev.title),
    ev.source,
    ev.status,
    esc(ev.owner),
    ev.expiresOn ?? "",
    ev.mappedCount,
    ev.createdAt.toISOString().slice(0, 10),
  ].join(","));

  const csv = [header.join(","), ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lekha-evidence-${date}.csv"`,
    },
  });
}
