import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { listPolicies, createPolicy } from "@/lib/services/policy-governance/policy-governance-service";
import { DomainError } from "@/lib/services/errors";

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  const sp = req.nextUrl.searchParams;
  const policies = await listPolicies(ctx.orgId, {
    status: sp.get("status") ?? undefined,
    policyType: sp.get("policyType") ?? undefined,
    search: sp.get("search") ?? undefined,
  });

  return ok({ policies, total: policies.length });
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
  if (!body?.name) return err("name is required", 400);

  try {
    const policy = await createPolicy(ctx.orgId, null, body);
    return ok({ policy }, 201);
  } catch (e: unknown) {
    if (e instanceof DomainError) return err(e.message, 400);
    throw e;
  }
}
