import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getVerificationById } from "@/lib/services/trust-verification/trust-verification-service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await validateApiKey(req).catch(() => null);
  if (!ctx) return err("Unauthorized", 401);
  const data = await getVerificationById(ctx.orgId, params.id);
  if (!data) return err("Not found", 404);
  return ok(data);
}
