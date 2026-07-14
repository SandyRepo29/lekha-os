export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders } from "@/lib/api/response";
import { getLatestPrivacyScore, getScoreHistory } from "@/backend/src/modules/privacy/privacy-repo";
import { computeAndSavePrivacyScore } from "@/backend/src/modules/privacy/privacy-service";

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
  const days = Math.min(365, Math.max(7, parseInt(searchParams.get("days") ?? "30", 10)));

  const [latest, history] = await Promise.all([
    getLatestPrivacyScore(ctx.orgId),
    getScoreHistory(ctx.orgId, days),
  ]);

  return withRateLimitHeaders(
    ok({
      latest,
      history,
      historyDays: days,
    }),
    rl
  );
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

  const breakdown = await computeAndSavePrivacyScore(ctx.orgId);
  return withRateLimitHeaders(ok(breakdown, 201), rl);
}
