import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getImpactAnalysis } from "@/lib/services/trust-graph/graph-service";

export async function GET(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }
  const nodeId = req.nextUrl.searchParams.get("nodeId");
  if (!nodeId) return err("nodeId required.", 400);
  try {
    const data = await getImpactAnalysis(ctx.orgId, nodeId);
    if (!data) return err("Node not found.", 404);
    return ok(data);
  } catch (e: any) {
    return err(e.message ?? "Failed.", 500);
  }
}
