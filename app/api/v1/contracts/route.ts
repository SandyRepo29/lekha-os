import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { listContracts, createContract } from "@/lib/services/contract-governance/contract-service";
import { DomainError } from "@/lib/services/errors";

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  const sp = req.nextUrl.searchParams;
  const contracts = await listContracts(ctx.orgId, {
    status: sp.get("status") ?? undefined,
    contractType: sp.get("contractType") ?? undefined,
    vendorId: sp.get("vendorId") ?? undefined,
    search: sp.get("search") ?? undefined,
  });

  return ok({ contracts, total: contracts.length });
}

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }
  if (ctx.permissions === "read_only") return err("read_write permission required", 403);

  const body = await req.json().catch(() => null);
  if (!body?.title) return err("title is required", 400);

  try {
    const contract = await createContract(ctx.orgId, null, body);
    return ok({ contract }, 201);
  } catch (e: unknown) {
    if (e instanceof DomainError) return err(e.message, 400);
    throw e;
  }
}
