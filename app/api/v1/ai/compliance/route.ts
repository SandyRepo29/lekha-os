export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { findAllCompliance } from "@/lib/repositories/ai-governance-repo";

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  const records = await findAllCompliance(ctx.orgId);

  return ok({ frameworks: records, total: records.length });
}
