import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { computeKpis, getAnalyticsOverview, getReports } from "@/backend/src/modules/executive-reporting/executive-reporting-service";

export async function GET(request: Request) {
  let ctx;
  try {
    ctx = await validateApiKey(request);
  } catch (e) {
    if (e instanceof ApiAuthError) return err(e.message, 401);
    return err("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") ?? "overview";
  const orgId = ctx.orgId;

  try {
    if (view === "kpis") {
      const kpis = await computeKpis(orgId);
      return ok({ kpis });
    }
    if (view === "reports") {
      const reports = await getReports(orgId);
      return ok({ reports });
    }
    const [kpis, overview] = await Promise.all([
      computeKpis(orgId),
      getAnalyticsOverview(orgId),
    ]);
    return ok({ kpis, recentReports: overview.reports, snapshotCount: overview.snapshotHistory.length });
  } catch {
    return err("Failed to fetch analytics data", 500);
  }
}
