import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import * as repo from "@/lib/repositories/integration-hub-repo";

export async function GET(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); } catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }

  try {
    const metrics = await repo.getDashboardMetrics(ctx.orgId);
    const successRate = metrics.totalSyncs > 0
      ? Math.round(((metrics.totalSyncs - metrics.failedSyncs) / metrics.totalSyncs) * 100)
      : 100;

    return ok({
      health: {
        connected: metrics.connected,
        total: metrics.total,
        errorCount: metrics.error,
        openEvents: metrics.openEvents,
        criticalEvents: metrics.criticalEvents,
        syncSuccessRate: successRate,
        totalEvidence: metrics.totalEvidence,
        totalRisks: metrics.totalRisks,
      },
    });
  } catch {
    return err("Internal error", 500);
  }
}
