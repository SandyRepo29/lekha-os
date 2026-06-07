import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { generateRecommendations } from "@/lib/services/trust-intelligence/trust-intelligence-service";

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  try {
    const recs = await generateRecommendations(ctx.orgId);
    return ok(recs);
  } catch (e: any) {
    return err(e.message ?? "Failed to generate recommendations.", 500);
  }
}
