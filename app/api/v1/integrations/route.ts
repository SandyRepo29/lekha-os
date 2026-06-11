import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getConnections, getDashboardData, getMarketplace } from "@/lib/services/integration-hub/integration-service";

export async function GET(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); } catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view");

  try {
    if (view === "marketplace") {
      const connectors = await getMarketplace();
      return ok({ connectors });
    }
    if (view === "dashboard") {
      const data = await getDashboardData(ctx.orgId);
      return ok(data);
    }
    const connections = await getConnections(ctx.orgId);
    return ok({
      connections: connections.map(({ instance, connector }) => ({
        id: instance.id,
        connector: connector.name,
        category: connector.category,
        status: instance.status,
        lastSyncAt: instance.lastSyncAt,
        totalSynced: instance.totalSynced,
        totalEvidence: instance.totalEvidence,
        totalRisks: instance.totalRisks,
      })),
    });
  } catch {
    return err("Internal error", 500);
  }
}
