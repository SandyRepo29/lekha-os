import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getObligations } from "@/backend/src/modules/contract-governance/contract-repo";

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  const sp = req.nextUrl.searchParams;
  const contractId = sp.get("contractId") ?? undefined;
  const obligations = await getObligations(ctx.orgId, contractId);
  return ok({ obligations, total: obligations.length });
}
