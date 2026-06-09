import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getTrends } from "@/lib/services/governance-trends/trends-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await validateApiKey(req).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") ?? "90");
  const validDays = ([30, 90, 180, 365].includes(days) ? days : 90) as 30 | 90 | 180 | 365;

  try {
    const data = await getTrends(ctx.orgId, validDays);
    return ok(data);
  } catch (e: any) {
    return err(e.message ?? "Failed to load trends", 500);
  }
}
