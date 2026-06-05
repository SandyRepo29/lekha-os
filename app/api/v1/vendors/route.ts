/**
 * GET /api/v1/vendors
 *
 * List vendors for the authenticated organisation.
 *
 * Auth: Bearer API key (read_only minimum)
 * Query params:
 *   page     (default 1)
 *   pageSize (default 20, max 100)
 *   status   filter by vendor status
 *   risk     filter by risk level
 *   q        text search in vendor name
 */

export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders, buildMeta } from "@/lib/api/response";
import { listVendorsPaged } from "@/lib/services/vendor-service";

export async function GET(request: NextRequest) {
  // Auth
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  // Rate limit
  const rl = checkRateLimit(ctx.keyId, ctx.permissions);
  if (!rl.allowed) {
    return withRateLimitHeaders(
      err(`Rate limit exceeded. Retry after ${new Date(rl.resetAt).toISOString()}.`, 429),
      rl
    );
  }

  const { searchParams } = request.nextUrl;
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));

  const result = await listVendorsPaged(ctx.orgId, page, pageSize);

  return withRateLimitHeaders(
    ok(result.vendors, 200, buildMeta(result.total, page, pageSize)),
    rl
  );
}
