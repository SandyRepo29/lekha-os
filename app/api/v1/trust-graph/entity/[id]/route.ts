import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getNodeWithNeighbours } from "@/backend/src/modules/trust-graph/trust-graph-repo";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let ctx;
  try { ctx = await validateApiKey(req); } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }
  try {
    const { id } = await params;
    const data = await getNodeWithNeighbours(ctx.orgId, id);
    if (!data) return err("Node not found.", 404);
    return ok(data);
  } catch (e: any) {
    return err(e.message ?? "Failed.", 500);
  }
}
