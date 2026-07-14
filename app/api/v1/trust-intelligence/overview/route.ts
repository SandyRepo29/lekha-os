import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getTrustIntelligenceOverview } from "@/backend/src/modules/trust-intelligence/trust-intelligence-service";

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  try {
    const overview = await getTrustIntelligenceOverview(ctx.orgId);
    return ok(overview);
  } catch (e: any) {
    return err(e.message ?? "Failed to load overview.", 500);
  }
}
