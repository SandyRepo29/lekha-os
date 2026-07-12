export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders, buildMeta } from "@/lib/api/response";
import { listConsents, createConsent } from "@/lib/services/privacy/privacy-service";
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
  const consents = await listConsents(ctx.orgId, {
    status: searchParams.get("status") ?? undefined,
    assetId: searchParams.get("assetId") ?? undefined,
  });

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
  const total = consents.length;
  const paged = consents.slice((page - 1) * pageSize, page * pageSize);

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
    if (!body.subjectId) return withRateLimitHeaders(err("subjectId is required.", 400), rl);
    if (!body.purpose) return withRateLimitHeaders(err("purpose is required.", 400), rl);

    const consent = await createConsent(ctx.orgId, null, {
      subjectId: body.subjectId,
      subjectName: body.subjectName,
      subjectEmail: body.subjectEmail,
      purpose: body.purpose,
      consentStatus: body.consentStatus,
      dataAssetId: body.dataAssetId,
      obtainedAt: body.obtainedAt ? new Date(body.obtainedAt) : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      source: body.source,
      notes: body.notes,
    });

    return withRateLimitHeaders(ok(consent, 201), rl);
  } catch (e) {
    if (e instanceof DomainError) return withRateLimitHeaders(err(e.message, 422), rl);
    throw e;
  }
}
