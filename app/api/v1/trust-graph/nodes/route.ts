import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getGraphForOrg } from "@/backend/src/modules/trust-graph/trust-graph-repo";

export async function GET(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }
  try {
    const { nodes } = await getGraphForOrg(ctx.orgId);
    return ok({ nodes, count: nodes.length });
  } catch (e: any) {
    return err(e.message ?? "Failed.", 500);
  }
}
