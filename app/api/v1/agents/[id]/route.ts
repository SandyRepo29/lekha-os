export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders } from "@/lib/api/response";
import * as svc from "@/backend/src/modules/governance-agents/agent-service";
import * as repo from "@/backend/src/modules/governance-agents/agents-repo";
import { DomainError } from "@/lib/services/errors";

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
  const [agent, runs] = await Promise.all([
    repo.findAgentById(ctx.orgId, id),
    repo.findRunsByOrg(ctx.orgId, { limit: 10 }),
  ]);
  if (!agent) return withRateLimitHeaders(err("Agent not found.", 404), rl);

  const recentRuns = runs.filter((r) => r.agentId === id);
  return withRateLimitHeaders(ok({ ...agent, recentRuns }), rl);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const body = await request.json();
    await svc.updateAgent(ctx.orgId, id, body);
    const updated = await repo.findAgentById(ctx.orgId, id);
    return withRateLimitHeaders(ok(updated), rl);
  } catch (e) {
    if (e instanceof DomainError) return withRateLimitHeaders(err(e.message, 422), rl);
    console.error("[PUT /api/v1/agents/:id]", e);
    return withRateLimitHeaders(err("Internal server error.", 500), rl);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    await svc.deleteAgent(ctx.orgId, id);
    return withRateLimitHeaders(ok({ deleted: true }), rl);
  } catch (e) {
    if (e instanceof DomainError) return withRateLimitHeaders(err(e.message, 422), rl);
    console.error("[DELETE /api/v1/agents/:id]", e);
    return withRateLimitHeaders(err("Internal server error.", 500), rl);
  }
}
