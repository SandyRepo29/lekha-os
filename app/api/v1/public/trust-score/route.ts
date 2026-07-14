export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getTrustScoreData } from "@/backend/src/modules/trust-api/trust-api-service";
import { recordUsage } from "@/backend/src/modules/trust-api/trust-api-repo";

export async function GET(request: NextRequest) {
  const start = Date.now();
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  try {
    const data = await getTrustScoreData(ctx.orgId);
    await recordUsage(ctx.orgId, {
      endpoint: "/api/v1/public/trust-score",
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - start,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });
    return ok({ data, meta: { generated_at: new Date().toISOString(), source: "audt-trust-api-v1" } });
  } catch {
    return err("Failed to retrieve trust score", 500);
  }
}
