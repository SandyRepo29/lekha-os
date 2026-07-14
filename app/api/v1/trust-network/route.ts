import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getNetworkDashboard, getNetworkDirectory, getTrustRelationships } from "@/backend/src/modules/trust-network/trust-network-service";

export async function GET(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); } catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }

  const view = req.nextUrl.searchParams.get("view");

  try {
    if (view === "directory") {
      const profiles = await getNetworkDirectory();
      return ok({ profiles, total: profiles.length });
    }

    if (view === "relationships") {
      const relationships = await getTrustRelationships(ctx.orgId);
      return ok({ relationships, total: relationships.length });
    }

    // Default: dashboard
    const dashboard = await getNetworkDashboard(ctx.orgId);
    return ok(dashboard);
  } catch (e) {
    return err("Failed to fetch Trust Network data", 500);
  }
}
