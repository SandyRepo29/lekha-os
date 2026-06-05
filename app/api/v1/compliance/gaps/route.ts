/**
 * GET /api/v1/compliance/gaps
 *
 * List open compliance gaps across all frameworks for the authenticated org.
 *
 * Auth: Bearer API key (read_only minimum)
 * Query params:
 *   frameworkId  filter to a specific framework
 *   severity     filter by severity (critical|high|medium|low)
 *   resolved     "true" to include resolved gaps (default: false)
 */

export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders } from "@/lib/api/response";
import { findByOrg } from "@/lib/repositories/gap-repo";

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

  const { searchParams } = request.nextUrl;
  const includeResolved = searchParams.get("resolved") === "true";
  const severity        = searchParams.get("severity") ?? undefined;

  let gaps = await findByOrg(ctx.orgId, !includeResolved);

  if (severity) {
    gaps = gaps.filter((g) => g.severity === severity);
  }

  return withRateLimitHeaders(ok(gaps), rl);
}
