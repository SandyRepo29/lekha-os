import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations, memberships } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ensureDailySnapshot } from "@/backend/src/modules/trust-intelligence/trends-service";
import { runMonitoringRules } from "@/backend/src/modules/trust-intelligence/monitoring-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all distinct org IDs that have at least one member
    const rows = await db
      .selectDistinct({ orgId: memberships.organizationId })
      .from(memberships)
      .where(eq(memberships.isActive, true));

    let snapshots = 0;
    let alerts = 0;

    for (const { orgId } of rows) {
      try {
        await ensureDailySnapshot(orgId);
        snapshots++;
        const result = await runMonitoringRules(orgId);
        alerts += result.created;
      } catch (e) {
        console.error(`[governance-snapshot] org ${orgId} failed:`, e);
      }
    }

    return NextResponse.json({ ok: true, orgsProcessed: rows.length, snapshots, alertsCreated: alerts });
  } catch (e: any) {
    console.error("[governance-snapshot] cron failed:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
