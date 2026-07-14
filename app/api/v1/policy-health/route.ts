import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getDashboardMetrics } from "@/backend/src/modules/policy-governance/policy-governance-service";

export async function GET(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); }
  catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }

  const metrics = await getDashboardMetrics(ctx.orgId);
  return ok({ metrics });
}
