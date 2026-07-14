import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getVerificationById } from "@/backend/src/modules/trust-verification/trust-verification-service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await validateApiKey(req).catch(() => null);
  if (!ctx) return err("Unauthorized", 401);
  const { id } = await params;
  const data = await getVerificationById(ctx.orgId, id);
  if (!data) return err("Not found", 404);
  return ok(data);
}
