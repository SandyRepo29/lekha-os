export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders } from "@/lib/api/response";
import { getAudit, updateAudit, deleteAudit } from "@/lib/services/audit/audit-service";
import { listFindings } from "@/lib/services/audit/finding-service";
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
  const [audit, findings] = await Promise.all([
    getAudit(ctx.orgId, id),
    listFindings(ctx.orgId, { auditId: id }),
  ]);
  if (!audit) return withRateLimitHeaders(err("Audit not found.", 404), rl);

  return withRateLimitHeaders(ok({ ...audit, findings }), rl);
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
    await updateAudit({ orgId: ctx.orgId, actorId: null, auditId: id, input: body });
    const updated = await getAudit(ctx.orgId, id);
    return withRateLimitHeaders(ok(updated), rl);
  } catch (e) {
    if (e instanceof DomainError) return withRateLimitHeaders(err(e.message, 422), rl);
    console.error("[PUT /api/v1/audits/:id]", e);
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
    await deleteAudit({ orgId: ctx.orgId, actorId: null, auditId: id });
    return withRateLimitHeaders(ok({ deleted: true }), rl);
  } catch (e) {
    if (e instanceof DomainError) return withRateLimitHeaders(err(e.message, 422), rl);
    console.error("[DELETE /api/v1/audits/:id]", e);
    return withRateLimitHeaders(err("Internal server error.", 500), rl);
  }
}
