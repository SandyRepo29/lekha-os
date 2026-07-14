import { NextRequest } from "next/server";
import { ok, err } from "@/lib/api/response";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { listRuns } from "@/backend/src/modules/workflow-studio/workflow-service";

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  const sp = req.nextUrl.searchParams;
  const runs = await listRuns(ctx.orgId, {
    status: sp.get("status") ?? undefined,
    workflowId: sp.get("workflowId") ?? undefined,
  });
  return ok({ runs });
}
