import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getSyncs } from "@/lib/services/integration-hub/integration-service";

export async function GET(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); } catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }

  try {
    const syncs = await getSyncs(ctx.orgId);
    return ok({ syncs });
  } catch {
    return err("Internal error", 500);
  }
}
