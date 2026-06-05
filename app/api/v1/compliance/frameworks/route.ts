/**
 * GET /api/v1/compliance/frameworks
 *
 * List all compliance frameworks for the authenticated organisation,
 * including readiness scores.
 *
 * Auth: Bearer API key (read_only minimum)
 */

export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders } from "@/lib/api/response";
import { listFrameworks } from "@/lib/services/compliance/framework-service";

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

  const frameworks = await listFrameworks(ctx.orgId);
  return withRateLimitHeaders(ok(frameworks), rl);
}
