/**
 * GET /api/v1/vendors/:id
 *
 * Fetch a single vendor by ID.
 *
 * Auth: Bearer API key (read_only minimum)
 */

export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders } from "@/lib/api/response";
import { getVendor } from "@/lib/services/vendor-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  const rl = checkRateLimit(ctx.keyId, ctx.permissions);
  if (!rl.allowed) {
    return withRateLimitHeaders(
      err(`Rate limit exceeded. Retry after ${new Date(rl.resetAt).toISOString()}.`, 429),
      rl
    );
  }

  const { id } = await params;
  const vendor = await getVendor(ctx.orgId, id);
  if (!vendor) return withRateLimitHeaders(err("Vendor not found.", 404), rl);

  return withRateLimitHeaders(ok(vendor), rl);
}
