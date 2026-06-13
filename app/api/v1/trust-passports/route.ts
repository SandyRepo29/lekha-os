import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getTrustPassport } from "@/lib/services/trust-verification/trust-verification-service";

export async function GET(req: NextRequest) {
  const ctx = await validateApiKey(req).catch(() => null);
  if (!ctx) return err("Unauthorized", 401);
  const passport = await getTrustPassport(ctx.orgId);
  return ok(passport);
}
