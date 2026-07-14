export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders, buildMeta } from "@/lib/api/response";
import { getAutomationRules, createAutomationRule } from "@/backend/src/modules/toe/toe-service";
import { DomainError } from "@/lib/services/errors";

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

  const rules = await getAutomationRules(ctx.orgId);

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
  const total = rules.length;
  const paged = rules.slice((page - 1) * pageSize, page * pageSize);

  return withRateLimitHeaders(ok(paged, 200, buildMeta(total, page, pageSize)), rl);
}

export async function POST(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  if (!ctx.permissions.includes("read_write")) {
    return err("API key does not have write permissions.", 403);
  }

  const rl = checkRateLimit(ctx.keyId, ctx.permissions);
  if (!rl.allowed) {
    return withRateLimitHeaders(
      err(`Rate limit exceeded. Retry after ${new Date(rl.resetAt).toISOString()}.`, 429),
      rl
    );
  }

  try {
    const body = await request.json();
    if (!body.name) return withRateLimitHeaders(err("name is required.", 400), rl);
    if (!body.trigger_event) return withRateLimitHeaders(err("trigger_event is required.", 400), rl);
    if (!body.action_type) return withRateLimitHeaders(err("action_type is required.", 400), rl);

    const rule = await createAutomationRule(ctx.orgId, null, {
      name: body.name,
      description: body.description,
      triggerEvent: body.trigger_event,
      conditions: body.conditions,
      actionType: body.action_type,
      actionConfig: body.action_config,
    });

    return withRateLimitHeaders(ok(rule, 201), rl);
  } catch (e) {
    if (e instanceof DomainError) return withRateLimitHeaders(err(e.message, 422), rl);
    console.error("[POST /api/v1/operations/automation-rules]", e);
    return withRateLimitHeaders(err("Internal server error.", 500), rl);
  }
}
