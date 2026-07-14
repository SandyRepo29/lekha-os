export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { db } from "@/lib/db";
import { vendors } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { recordUsage } from "@/backend/src/modules/trust-api/trust-api-repo";

export async function GET(request: NextRequest) {
  const start = Date.now();
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  try {
    const { searchParams } = request.nextUrl;
    const minScore = parseInt(searchParams.get("minScore") ?? "0");

    const rows = await db.select({
      id: vendors.id,
      name: vendors.name,
      category: vendors.category,
      riskLevel: vendors.riskLevel,
      trustScore: vendors.trustScore,
      complianceScore: vendors.complianceScore,
      status: vendors.status,
    }).from(vendors).where(eq(vendors.organizationId, ctx.orgId)).orderBy(desc(vendors.trustScore));

    const filtered = minScore > 0 ? rows.filter(v => (v.trustScore ?? 0) >= minScore) : rows;

    await recordUsage(ctx.orgId, {
      endpoint: "/api/v1/public/vendor-trust",
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - start,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return ok({ data: filtered, meta: { count: filtered.length, generated_at: new Date().toISOString() } });
  } catch {
    return err("Failed to retrieve vendor trust data", 500);
  }
}
