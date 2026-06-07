import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getTrustIntelligenceOverview, snapshotGovernance } from "@/lib/services/trust-intelligence/trust-intelligence-service";

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  try {
    const overview = await getTrustIntelligenceOverview(ctx.orgId);
    return ok({
      score: overview.orgTrustScore.overall,
      level: overview.orgTrustScore.level,
      components: {
        vendorTrust: overview.orgTrustScore.vendorTrust,
        riskPosture: overview.orgTrustScore.riskPosture,
        controlHealth: overview.orgTrustScore.controlHealth,
        auditReadiness: overview.orgTrustScore.auditReadiness,
        complianceCoverage: overview.orgTrustScore.complianceCoverage,
      },
      drivers: overview.orgTrustScore.drivers,
      detractors: overview.orgTrustScore.detractors,
    });
  } catch (e: any) {
    return err(e.message ?? "Failed to compute score.", 500);
  }
}

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  if (ctx.permissions !== "read_write" && ctx.permissions !== "admin") {
    return err("read_write key required.", 403);
  }

  try {
    await snapshotGovernance(ctx.orgId);
    return ok({ snapshotted: true });
  } catch (e: any) {
    return err(e.message ?? "Snapshot failed.", 500);
  }
}
