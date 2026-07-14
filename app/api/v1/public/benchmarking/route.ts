export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { db } from "@/lib/db";
import { benchmarkSnapshots, benchmarkScores } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { recordUsage } from "@/backend/src/modules/trust-api/trust-api-repo";

export async function GET(request: NextRequest) {
  const start = Date.now();
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  try {
    const [snapshot, scores] = await Promise.all([
      db.select().from(benchmarkSnapshots).where(eq(benchmarkSnapshots.organizationId, ctx.orgId)).orderBy(desc(benchmarkSnapshots.snapshotDate)).limit(1).catch(() => []),
      db.select().from(benchmarkScores).where(eq(benchmarkScores.organizationId, ctx.orgId)).catch(() => []),
    ]);

    await recordUsage(ctx.orgId, {
      endpoint: "/api/v1/public/benchmarking",
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - start,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return ok({
      data: {
        overallScore: (snapshot[0] as any)?.overallScore ?? null,
        percentile: (snapshot[0] as any)?.percentile ?? null,
        maturityLevel: (snapshot[0] as any)?.maturityLevel ?? null,
        industry: (snapshot[0] as any)?.industry ?? null,
        snapshotDate: (snapshot[0] as any)?.snapshotDate ?? null,
        categoryScores: scores,
      },
      meta: { generated_at: new Date().toISOString() },
    });
  } catch {
    return err("Failed to retrieve benchmarking data", 500);
  }
}
