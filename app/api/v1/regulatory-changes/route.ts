export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders, buildMeta } from "@/lib/api/response";
import * as svc from "@/lib/services/regulatory-intelligence/regulatory-service";

export async function GET(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  const rl = checkRateLimit(ctx.keyId, ctx.permissions);
  if (!rl.allowed) return withRateLimitHeaders(err("Rate limit exceeded.", 429), rl);

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const severity = searchParams.get("severity") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") ?? "20", 10));

  const all = await svc.getChanges(ctx.orgId, { status, severity });
  const total = all.length;
  const paged = all.slice((page - 1) * pageSize, page * pageSize);
  return withRateLimitHeaders(ok(paged, 200, buildMeta(total, page, pageSize)), rl);
}
