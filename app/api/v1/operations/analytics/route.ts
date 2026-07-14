export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders } from "@/lib/api/response";
import { getWorkflowAnalytics } from "@/backend/src/modules/toe/toe-service";

export async function GET(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  const rl = checkRateLimit(ctx.keyId, ctx.permissions);
  if (!rl.allowed) {
    return withRateLimitHeaders(
      err(`Rate limit exceeded. Retry after ${new Date(rl.resetAt).toISOString()}.`, 429),
      rl
    );
  }

  try {
    const data = await getWorkflowAnalytics(ctx.orgId);
    return withRateLimitHeaders(ok(data, 200), rl);
  } catch (e) {
    console.error("[GET /api/v1/operations/analytics]", e);
    return withRateLimitHeaders(err("Internal server error.", 500), rl);
  }
}
