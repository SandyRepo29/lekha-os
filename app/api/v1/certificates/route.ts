import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getCertificates } from "@/backend/src/modules/trust-verification/trust-verification-service";

export async function GET(req: NextRequest) {
  const ctx = await validateApiKey(req).catch(() => null);
  if (!ctx) return err("Unauthorized", 401);
  const certs = await getCertificates(ctx.orgId);
  return ok({ certificates: certs, count: certs.length });
}
