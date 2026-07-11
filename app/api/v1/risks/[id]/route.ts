export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders } from "@/lib/api/response";
import { getRisk, updateRisk, deleteRisk } from "@/lib/services/risk/risk-service";
import { DomainError } from "@/lib/services/errors";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized.", 401);

  const rl = checkRateLimit(ctx.keyId, ctx.permissions);
  if (!rl.allowed) return withRateLimitHeaders(err("Rate limit exceeded.", 429), rl);

  const { id } = await params;
  const risk = await getRisk(ctx.orgId, id);
  if (!risk) return withRateLimitHeaders(err("Risk not found.", 404), rl);

  return withRateLimitHeaders(ok(risk), rl);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized.", 401);
  if (!ctx.permissions.includes("read_write")) return err("Write permission required.", 403);

  const rl = checkRateLimit(ctx.keyId, ctx.permissions);
  if (!rl.allowed) return withRateLimitHeaders(err("Rate limit exceeded.", 429), rl);

  const { id } = await params;
  try {
    const body = await request.json();
    await updateRisk({ orgId: ctx.orgId, actorId: null, riskId: id, input: body });
    const updated = await getRisk(ctx.orgId, id);
    return withRateLimitHeaders(ok(updated), rl);
  } catch (e) {
    if (e instanceof DomainError) return withRateLimitHeaders(err(e.message, 422), rl);
    return withRateLimitHeaders(err("Internal server error.", 500), rl);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized.", 401);
  if (!ctx.permissions.includes("read_write")) return err("Write permission required.", 403);

  const rl = checkRateLimit(ctx.keyId, ctx.permissions);
  if (!rl.allowed) return withRateLimitHeaders(err("Rate limit exceeded.", 429), rl);

  const { id } = await params;
  try {
    await deleteRisk({ orgId: ctx.orgId, actorId: null, riskId: id });
    return withRateLimitHeaders(ok({ deleted: true }), rl);
  } catch (e) {
    if (e instanceof DomainError) return withRateLimitHeaders(err(e.message, 422), rl);
    return withRateLimitHeaders(err("Internal server error.", 500), rl);
  }
}
