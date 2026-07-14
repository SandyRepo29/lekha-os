export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders } from "@/lib/api/response";
import * as treatmentRepo from "@/backend/src/modules/risk-lens/risk-treatment-repo";
import { DomainError } from "@/lib/services/errors";

export async function GET(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized.", 401);

  const rl = checkRateLimit(ctx.keyId, ctx.permissions);
  if (!rl.allowed) return withRateLimitHeaders(err("Rate limit exceeded.", 429), rl);

  const { searchParams } = request.nextUrl;
  const treatments = await treatmentRepo.findByOrg(ctx.orgId, {
    riskId: searchParams.get("riskId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });
  return withRateLimitHeaders(ok(treatments), rl);
}

export async function POST(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized.", 401);
  if (!ctx.permissions.includes("read_write")) return err("Write permission required.", 403);

  const rl = checkRateLimit(ctx.keyId, ctx.permissions);
  if (!rl.allowed) return withRateLimitHeaders(err("Rate limit exceeded.", 429), rl);

  try {
    const body = await request.json();
    if (!body.riskId || !body.action) {
      return withRateLimitHeaders(err("riskId and action are required.", 400), rl);
    }
    const result = await treatmentRepo.insertTreatment({
      organizationId: ctx.orgId,
      riskId: body.riskId,
      action: body.action,
      description: body.description ?? null,
      targetDate: body.targetDate ?? null,
    });
    return withRateLimitHeaders(ok(result, 201), rl);
  } catch (e) {
    if (e instanceof DomainError) return withRateLimitHeaders(err(e.message, 422), rl);
    return withRateLimitHeaders(err("Internal server error.", 500), rl);
  }
}
