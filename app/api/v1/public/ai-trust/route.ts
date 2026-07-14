export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { db } from "@/lib/db";
import { aiSystems, aiTrustScores } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { recordUsage } from "@/backend/src/modules/trust-api/trust-api-repo";

export async function GET(request: NextRequest) {
  const start = Date.now();
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  try {
    const [systems, scores] = await Promise.all([
      db.select({
        id: aiSystems.id, name: aiSystems.name, systemType: aiSystems.systemType,
        riskClassification: aiSystems.riskClassification, approvalStatus: aiSystems.approvalStatus,
        aiTrustScore: aiSystems.aiTrustScore,
      }).from(aiSystems).where(eq(aiSystems.organizationId, ctx.orgId)).limit(20).catch(() => []),
      db.select().from(aiTrustScores).where(eq(aiTrustScores.organizationId, ctx.orgId)).orderBy(desc(aiTrustScores.createdAt)).limit(20).catch(() => []),
    ]);

    const avgTrustScore = scores.length
      ? Math.round(scores.reduce((s, r) => s + Number(r.overallScore ?? 0), 0) / scores.length)
      : null;

    await recordUsage(ctx.orgId, {
      endpoint: "/api/v1/public/ai-trust",
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - start,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return ok({
      data: { totalSystems: systems.length, avgAiTrustScore: avgTrustScore, systems, scores },
      meta: { generated_at: new Date().toISOString() },
    });
  } catch {
    return err("Failed to retrieve AI trust data", 500);
  }
}
