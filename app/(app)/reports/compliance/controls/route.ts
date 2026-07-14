export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { listFrameworks } from "@/backend/src/modules/compliance/framework-service";
import * as controlRepo from "@/backend/src/modules/compliance/control-repo";

function esc(v: string | null | undefined) {
  return `"${(v ?? "").replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.org.id;
  const frameworks = await listFrameworks(orgId);

  const allControls: {
    framework: string;
    ref: string;
    name: string;
    category: string | null;
    owner: string | null;
    status: string;
    priority: string;
    reviewDate: string | null;
  }[] = [];

  for (const fw of frameworks) {
    const controls = await controlRepo.findByFramework(orgId, fw.id);
    for (const c of controls) {
      allControls.push({
        framework: fw.name,
        ref: c.controlRef,
        name: c.name,
        category: c.category,
        owner: c.owner,
        status: c.status,
        priority: c.priority,
        reviewDate: c.reviewDate,
      });
    }
  }

  const header = ["Framework", "Ref", "Control Name", "Category", "Owner", "Status", "Priority", "Review Date"];
  const rows = allControls.map((c) => [
    esc(c.framework),
    esc(c.ref),
    esc(c.name),
    esc(c.category),
    esc(c.owner),
    c.status,
    c.priority,
    c.reviewDate ?? "",
  ].join(","));

  const csv = [header.join(","), ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lekha-controls-${date}.csv"`,
    },
  });
}
