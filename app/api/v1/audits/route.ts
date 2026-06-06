export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders, buildMeta } from "@/lib/api/response";
import { listAudits, createAudit } from "@/lib/services/audit/audit-service";
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

  const { searchParams } = request.nextUrl;
  const statusFilter = searchParams.get("status") ?? undefined;
  const typeFilter   = searchParams.get("type") ?? undefined;

  let audits = await listAudits(ctx.orgId);

  if (statusFilter) audits = audits.filter((a) => a.status === statusFilter);
  if (typeFilter)   audits = audits.filter((a) => a.auditType === typeFilter);

  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
  const total    = audits.length;
  const paged    = audits.slice((page - 1) * pageSize, page * pageSize);

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

    const result = await createAudit({
      orgId: ctx.orgId,
      actorId: ctx.orgId,
      input: {
        name:        body.name,
        auditType:   body.auditType,
        frameworkId: body.frameworkId ?? null,
        scope:       body.scope ?? null,
        objective:   body.objective ?? null,
        auditorName: body.auditorName ?? null,
        startDate:   body.startDate ?? null,
        endDate:     body.endDate ?? null,
      },
    });

    return withRateLimitHeaders(ok(result, 201), rl);
  } catch (e) {
    if (e instanceof DomainError) return withRateLimitHeaders(err(e.message, 422), rl);
    console.error("[POST /api/v1/audits]", e);
    return withRateLimitHeaders(err("Internal server error.", 500), rl);
  }
}
