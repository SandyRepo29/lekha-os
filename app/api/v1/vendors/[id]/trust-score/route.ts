/**
 * GET /api/v1/vendors/:id/trust-score
 *
 * Returns the current Trust Score™, component breakdown, recent history, and AI narrative.
 *
 * Auth: Bearer API key (read_only minimum)
 */

export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders } from "@/lib/api/response";
import { getVendor } from "@/lib/services/vendor-service";
import { computeAndSaveTrustScore, getTrustHistory } from "@/lib/services/trust-score-service";
import { getTrustLevel, TRUST_LEVEL_LABELS } from "@/lib/services/trust-score";

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
  const vendor = await getVendor(ctx.orgId, id).catch(() => null);
  if (!vendor) return withRateLimitHeaders(err("Vendor not found.", 404), rl);

  const [breakdown, history] = await Promise.all([
    computeAndSaveTrustScore(ctx.orgId, id, "api"),
    getTrustHistory(ctx.orgId, id, 30),
  ]);

  const level = getTrustLevel(breakdown.overall);

  return withRateLimitHeaders(
    ok({
      vendorId: id,
      score: breakdown.overall,
      level,
      levelLabel: TRUST_LEVEL_LABELS[level],
      components: {
        evidence: breakdown.evidence,
        compliance: breakdown.compliance,
        risk: breakdown.risk,
        assessment: breakdown.assessment,
        operational: breakdown.operational,
        freshness: breakdown.freshness,
      },
      strengths: breakdown.strengths,
      concerns: breakdown.concerns,
      recommendations: breakdown.recommendations,
      narrative: vendor.aiTrustNarrative ?? null,
      history: history.map((h) => ({
        score: h.overallScore,
        snapshotAt: h.snapshotAt,
        triggerEvent: h.triggerEvent,
      })),
    }),
    rl
  );
}
