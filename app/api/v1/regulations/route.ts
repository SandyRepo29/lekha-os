export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders, buildMeta } from "@/lib/api/response";
import * as svc from "@/backend/src/modules/regulatory-intelligence/regulatory-service";

export async function GET(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  const rl = checkRateLimit(ctx.keyId, ctx.permissions);
  if (!rl.allowed) return withRateLimitHeaders(err("Rate limit exceeded.", 429), rl);

  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") ?? "50", 10));

  let regs = await svc.getRegulations(ctx.orgId);
  if (category) regs = regs.filter(r => r.category === category);

  const total = regs.length;
  const paged = regs.slice((page - 1) * pageSize, page * pageSize);
  return withRateLimitHeaders(ok(paged, 200, buildMeta(total, page, pageSize)), rl);
}
