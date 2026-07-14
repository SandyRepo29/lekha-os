import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { listIssues } from "@/backend/src/modules/issue-hub/issue-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await requireUser().catch(() => null);
  if (!session || session.demo || !session.org) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const issues = await listIssues(session.org.id, {
    status: sp.get("status") ?? undefined,
    severity: sp.get("severity") ?? undefined,
  });

  const headers = [
    "id","title","issueType","severity","priority","status",
    "ownerName","assigneeName","dueDate","resolvedDate","slaBreached","taskCount","createdAt",
  ];

  const rows = issues.map((i) =>
    [
      i.id, i.title, i.issueType, i.severity, i.priority, i.status,
      i.ownerName ?? "", i.assigneeName ?? "",
      i.dueDate ?? "", i.resolvedDate ?? "",
      i.slaBreached ? "Yes" : "No",
      i.taskCount, i.createdAt instanceof Date ? i.createdAt.toISOString() : String(i.createdAt),
    ]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="issues-${Date.now()}.csv"`,
    },
  });
}
