export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders } from "@/lib/api/response";
import * as svc from "@/lib/services/regulatory-intelligence/regulatory-service";

export async function GET(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  const rl = checkRateLimit(ctx.keyId, ctx.permissions);
  if (!rl.allowed) return withRateLimitHeaders(err("Rate limit exceeded.", 429), rl);

  const [readiness, metrics] = await Promise.all([
    svc.getReadiness(ctx.orgId),
    svc.getDashboardData(ctx.orgId),
  ]);

  return withRateLimitHeaders(ok({
    readiness,
    metrics: metrics.metrics,
  }), rl);
}
