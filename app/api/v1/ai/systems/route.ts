export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import {
  findAllSystems,
  createSystem,
} from "@/lib/repositories/ai-governance-repo";
import { DomainError } from "@/lib/services/errors";

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  const sp = req.nextUrl.searchParams;
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const offset = Math.max(0, parseInt(sp.get("offset") ?? "0", 10));

  const all = await findAllSystems(ctx.orgId, {
    status: sp.get("status") ?? undefined,
    riskLevel: sp.get("riskLevel") ?? undefined,
  });

  const paged = all.slice(offset, offset + limit);

  return ok({ systems: paged, total: all.length, limit, offset });
}

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  if (!ctx.permissions.includes("read_write")) {
    return err("API key does not have write permissions.", 403);
  }

  const body = await req.json().catch(() => null);
  if (!body?.name) return err("name is required.", 400);

  try {
    const system = await createSystem(
      ctx.orgId,
      {
        name: body.name,
        description: body.description ?? null,
        systemType: body.systemType ?? "internal",
        vendor: body.vendorName ?? null,
        modelName: body.modelName ?? null,
        purpose: body.purpose ?? null,
        riskClassification: body.riskClassification ?? "limited",
        dataClassification: body.dataClassification ?? "internal",
        status: "pending_review",
        riskLevel: "medium",
        deploymentEnv: null,
        ownerDept: null,
        ownerId: null,
        approvalStatus: "pending",
        approvedAt: null,
        lastAuditedAt: null,
        trustScore: null,
        metadata: null,
      } as any,
      ctx.keyId
    );

    return ok({ system }, 201);
  } catch (e) {
    if (e instanceof DomainError) return err(e.message, 422);
    console.error("[POST /api/v1/ai/systems]", e);
    return err("Internal server error.", 500);
  }
}
