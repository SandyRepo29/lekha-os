import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import {
  getContractDetail,
  updateContract,
  deleteContract,
} from "@/lib/services/contract-governance/contract-service";
import { DomainError } from "@/lib/services/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  const { id } = await params;
  const contract = await getContractDetail(ctx.orgId, id);
  if (!contract) return err("Contract not found", 404);
  return ok({ contract });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }
  if (ctx.permissions === "read_only") return err("read_write permission required", 403);

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return err("Request body required", 400);

  try {
    const contract = await updateContract(ctx.orgId, ctx.keyId, id, body);
    return ok({ contract });
  } catch (e: unknown) {
    if (e instanceof DomainError) return err(e.message, 400);
    throw e;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }
  if (ctx.permissions === "read_only") return err("read_write permission required", 403);

  const { id } = await params;
  try {
    await deleteContract(ctx.orgId, ctx.keyId, id);
    return ok({ deleted: true });
  } catch (e: unknown) {
    if (e instanceof DomainError) return err(e.message, 400);
    throw e;
  }
}
