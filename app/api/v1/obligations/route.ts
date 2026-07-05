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
  const regulationId = searchParams.get("regulationId") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") ?? "50", 10));

  const all = await svc.getObligations(ctx.orgId, { status, regulationId, priority });
  const total = all.length;
  const paged = all.slice((page - 1) * pageSize, page * pageSize);
  return withRateLimitHeaders(ok(paged, 200, buildMeta(total, page, pageSize)), rl);
}

export async function POST(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);
  if (!ctx.permissions.includes("read_write")) return err("Write permission required.", 403);

  const rl = checkRateLimit(ctx.keyId, ctx.permissions);
  if (!rl.allowed) return withRateLimitHeaders(err("Rate limit exceeded.", 429), rl);

  try {
    const body = await request.json() as Record<string, unknown>;
    if (!body.title) return withRateLimitHeaders(err("title is required.", 400), rl);

    const result = await svc.createObligation(ctx.orgId, null, {
      title: String(body.title),
      description: body.description ? String(body.description) : undefined,
      priority: body.priority ? String(body.priority) : undefined,
      regulationId: body.regulationId ? String(body.regulationId) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
    });
    return withRateLimitHeaders(ok(result, 201), rl);
  } catch (e) {
    return withRateLimitHeaders(err("Internal server error.", 500), rl);
  }
}
