import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import * as svc from "@/backend/src/modules/trust-exchange/trust-exchange-service";

export async function GET(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); } catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }

  const [profile, metrics] = await Promise.all([
    svc.getOrCreateProfile(ctx.orgId),
    svc.getDashboardMetrics(ctx.orgId),
  ]);
  return ok({ profile, metrics });
}
