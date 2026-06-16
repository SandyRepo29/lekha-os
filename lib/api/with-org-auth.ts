/**
 * withOrgAuth — standard wrapper for all /api/v1/* route handlers.
 *
 * Enforces the platform tenancy rule:
 *   orgId MUST come from the validated Bearer token (ctx.orgId).
 *   It must NEVER be read from request query params or body.
 *
 * Usage:
 *   export const GET = withOrgAuth(async (request, ctx) => {
 *     const data = await myService(ctx.orgId, ...);
 *     return ok(data);
 *   });
 *
 *   // Require write permission:
 *   export const POST = withOrgAuth(async (request, ctx) => { ... }, { requireWrite: true });
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, type ApiKeyContext } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { err, withRateLimitHeaders } from "@/lib/api/response";

type OrgAuthHandler = (
  request: NextRequest,
  ctx: ApiKeyContext
) => Promise<NextResponse>;

interface OrgAuthOptions {
  /** If true, rejects keys that only have read_only permission. */
  requireWrite?: boolean;
}

export function withOrgAuth(
  handler: OrgAuthHandler,
  options: OrgAuthOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    // 1. Authenticate — orgId comes exclusively from the validated token.
    const ctx = await validateApiKey(request).catch(() => null);
    if (!ctx) {
      return err("Unauthorized — provide a valid Bearer API key.", 401);
    }

    // 2. Permission check.
    if (options.requireWrite && !ctx.permissions.includes("read_write")) {
      return err("Forbidden — this endpoint requires a read_write API key.", 403);
    }

    // 3. Rate limit.
    const rl = checkRateLimit(ctx.keyId, ctx.permissions);
    if (!rl.allowed) {
      return withRateLimitHeaders(
        err(`Rate limit exceeded. Retry after ${new Date(rl.resetAt).toISOString()}.`, 429),
        rl
      );
    }

    // 4. Delegate to handler — ctx.orgId is the only authoritative org reference.
    const response = await handler(request, ctx);
    return withRateLimitHeaders(response, rl);
  };
}
