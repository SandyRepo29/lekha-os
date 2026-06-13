import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getVerifications, applyForVerification } from "@/lib/services/trust-verification/trust-verification-service";

export async function GET(req: NextRequest) {
  const ctx = await validateApiKey(req).catch(() => null);
  if (!ctx) return err("Unauthorized", 401);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const data = await getVerifications(ctx.orgId, status);
  return ok({ verifications: data, count: data.length });
}

export async function POST(req: NextRequest) {
  const ctx = await validateApiKey(req).catch(() => null);
  if (!ctx) return err("Unauthorized", 401);
  if (ctx.permissions === "read_only") return err("read_write key required", 403);
  const body = await req.json().catch(() => ({}));
  if (!body.programId) return err("programId required", 400);
  // Server actions require a userId — use a placeholder fallback for API
  const verification = await applyForVerification(ctx.orgId, ctx.keyId, { programId: body.programId, trustScore: body.trustScore });
  return ok({ verification }, 201);
}
