import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getGraphData } from "@/lib/services/trust-graph/graph-service";

export async function GET(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }
  try {
    const data = await getGraphData(ctx.orgId);
    return ok(data);
  } catch (e: any) {
    return err(e.message ?? "Failed to load trust graph.", 500);
  }
}
