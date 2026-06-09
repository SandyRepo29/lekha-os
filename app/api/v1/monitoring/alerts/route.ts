import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { findAlerts, countAlerts } from "@/lib/repositories/governance-alerts-repo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await validateApiKey(req).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const severity = url.searchParams.get("severity") ?? undefined;

  try {
    const [alerts, counts] = await Promise.all([
      findAlerts(ctx.orgId, { status, severity }),
      countAlerts(ctx.orgId),
    ]);
    return ok({ alerts, counts });
  } catch (e: any) {
    return err(e.message ?? "Failed to load alerts", 500);
  }
}
