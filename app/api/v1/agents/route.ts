export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders, buildMeta } from "@/lib/api/response";
import * as svc from "@/lib/services/agents/agent-service";

export async function GET(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  const rl = checkRateLimit(ctx.keyId, ctx.permissions);
  if (!rl.allowed)
    return withRateLimitHeaders(err(`Rate limit exceeded.`, 429), rl);

  const { searchParams } = request.nextUrl;
  const statusFilter = searchParams.get("status") ?? undefined;
  const typeFilter   = searchParams.get("agentType") ?? undefined;
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") ?? "20", 10));

  let agents = await svc.getAgents(ctx.orgId);
  if (statusFilter) agents = agents.filter((a) => a.status === statusFilter);
  if (typeFilter)   agents = agents.filter((a) => a.agentType === typeFilter);

  const total = agents.length;
  const paged = agents.slice((page - 1) * pageSize, page * pageSize);
  return withRateLimitHeaders(ok(paged, 200, buildMeta(total, page, pageSize)), rl);
}

export async function POST(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);
  if (!ctx.permissions.includes("read_write")) return err("Write permission required.", 403);

  const rl = checkRateLimit(ctx.keyId, ctx.permissions);
  if (!rl.allowed)
    return withRateLimitHeaders(err(`Rate limit exceeded.`, 429), rl);

  try {
    const body = await request.json() as Record<string, unknown>;
    if (!body.name)      return withRateLimitHeaders(err("name is required.", 400), rl);
    if (!body.agentType) return withRateLimitHeaders(err("agentType is required.", 400), rl);

    const result = await svc.createAgent(ctx.orgId, null, {
      name:          String(body.name),
      agentType:     String(body.agentType),
      description:   body.description ? String(body.description) : undefined,
      executionMode: body.executionMode ? String(body.executionMode) : undefined,
      triggerType:   body.triggerType  ? String(body.triggerType)  : undefined,
      prompt:        body.prompt       ? String(body.prompt)       : undefined,
      approvalMode:  body.approvalMode ? String(body.approvalMode) : undefined,
    });
    return withRateLimitHeaders(ok(result, 201), rl);
  } catch (e) {
    console.error("[POST /api/v1/agents]", e);
    return withRateLimitHeaders(err("Internal server error.", 500), rl);
  }
}
