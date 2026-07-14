import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import * as svc from "@/backend/src/modules/trust-exchange/trust-exchange-service";

export async function GET(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); } catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }
  const { searchParams } = new URL(req.url);
  const profiles = await svc.getDirectory({
    industry: searchParams.get("industry") ?? undefined,
    country: searchParams.get("country") ?? undefined,
    minTrustScore: searchParams.get("minScore") ? parseInt(searchParams.get("minScore")!) : undefined,
    riskLevel: searchParams.get("riskLevel") ?? undefined,
  });
  return ok({ profiles, total: profiles.length });
}
