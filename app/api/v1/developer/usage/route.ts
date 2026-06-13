export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getUsageSummary } from "@/lib/repositories/trust-api-repo";

export async function GET(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  try {
    const days = parseInt(request.nextUrl.searchParams.get("days") ?? "30");
    const data = await getUsageSummary(ctx.orgId, Math.min(days, 365));
    return ok({ data, meta: { period_days: days, generated_at: new Date().toISOString() } });
  } catch {
    return err("Failed to retrieve usage data", 500);
  }
}
