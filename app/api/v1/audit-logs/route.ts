/**
 * GET /api/v1/audit-logs
 *
 * Stream audit events for the authenticated organisation.
 * Useful for SIEM integration, compliance dashboards, and log shipping.
 *
 * Auth: Bearer API key (read_only minimum)
 * Query params:
 *   page      (default 1)
 *   pageSize  (default 50, max 200)
 *   module    filter by action prefix (e.g. "vendor", "team", "compliance")
 *   from      ISO 8601 datetime — inclusive start
 *   to        ISO 8601 datetime — inclusive end
 *   userId    filter by actor user ID
 */

export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders, buildMeta } from "@/lib/api/response";
import { listByOrg, countByOrg } from "@/lib/repositories/audit-repo";

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
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50", 10)));
  const module   = searchParams.get("module") ?? undefined;
  const userId   = searchParams.get("userId") ?? undefined;
  const from     = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
  const to       = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;

  const filters = { module, userId, from, to };

  const [logs, total] = await Promise.all([
    listByOrg(ctx.orgId, { ...filters, page, pageSize }),
    countByOrg(ctx.orgId, filters),
  ]);

  return withRateLimitHeaders(
    ok(logs, 200, buildMeta(total, page, pageSize)),
    rl
  );
}
