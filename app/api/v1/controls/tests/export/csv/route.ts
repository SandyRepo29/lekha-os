import { requireUser } from "@/lib/auth/session";
import { findAllTests } from "@/lib/repositories/control-center-repo";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tests = await findAllTests(session.org.id);

  const header = ["Date", "Control ID", "Control Name", "Result", "Tester", "Method", "Comments"];
  const rows = tests.map((t) => [
    t.testDate,
    t.controlRef,
    t.controlName,
    t.result,
    t.testerFullName ?? t.testerName ?? "",
    t.method ?? "",
    t.comments ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="control-tests-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
