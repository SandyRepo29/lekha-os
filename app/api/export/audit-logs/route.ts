import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { listByOrg } from "@/lib/repositories/audit-repo";

export async function GET(req: NextRequest) {
  const session = await requireUser().catch(() => null);
  if (!session || !session.org) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId") ?? undefined;
  const module = searchParams.get("module") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;

  const logs = await listByOrg(session.org.id, {
    userId,
    module,
    search,
    from,
    to,
    page: 1,
    pageSize: 5000,
  });

  const header = "Timestamp,Actor,Email,Action,Module,Entity Type,Entity ID\n";
  const rows = logs.map((l) => [
    new Date(l.createdAt).toISOString(),
    `"${(l.actorName ?? "").replace(/"/g, '""')}"`,
    `"${(l.actorEmail ?? "").replace(/"/g, '""')}"`,
    `"${l.action}"`,
    `"${l.action.split(".")[0]}"`,
    `"${l.entityType ?? ""}"`,
    `"${l.entityId ?? ""}"`,
  ].join(",")).join("\n");

  const csv = header + rows;
  const filename = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
