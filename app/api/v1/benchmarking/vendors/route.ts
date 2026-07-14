import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getDashboardData, computeAndSaveBenchmark } from "@/backend/src/modules/benchmarking/benchmarking-service";

export async function GET(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); } catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }
  const { snapshot, scores } = await getDashboardData(ctx.orgId);
  const vendorScores = scores.filter((s) => ["vendor_trust", "risk_posture", "control_health", "compliance_coverage"].includes(s.category));
  return ok({ snapshot, scores: vendorScores });
}

export async function POST(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); } catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }
  if (ctx.permissions === "read_only") return err("read_write permission required", 403);
  try {
    const result = await computeAndSaveBenchmark(ctx.orgId, null);
    return ok(result, 201);
  } catch (e: any) {
    return err(e.message, 400);
  }
}
