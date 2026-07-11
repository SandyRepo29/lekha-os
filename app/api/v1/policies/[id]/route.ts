import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { DomainError } from "@/lib/services/errors";
import {
  getPolicyDetail,
  updatePolicy,
  deletePolicy,
} from "@/lib/services/policy-governance/policy-governance-service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let ctx;
  try { ctx = await validateApiKey(req); }
  catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }

  const { id } = await params;
  const policy = await getPolicyDetail(ctx.orgId, id);
  if (!policy) return err("Policy not found", 404);
  return ok({ policy });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let ctx;
  try { ctx = await validateApiKey(req); }
  catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }
  if (ctx.permissions === "read_only") return err("read_write permission required", 403);

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid body", 400);

  try {
    const updated = await updatePolicy(ctx.orgId, null, id, body);
    return ok({ policy: updated });
  } catch (e: unknown) {
    if (e instanceof DomainError) return err(e.message, 400);
    throw e;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let ctx;
  try { ctx = await validateApiKey(req); }
  catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }
  if (ctx.permissions === "read_only") return err("read_write permission required", 403);

  const { id } = await params;
  try {
    await deletePolicy(ctx.orgId, null, id);
    return ok({ deleted: true });
  } catch (e: unknown) {
    if (e instanceof DomainError) return err(e.message, 400);
    throw e;
  }
}
