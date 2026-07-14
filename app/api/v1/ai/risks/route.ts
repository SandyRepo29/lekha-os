export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import {
  findAllRisks,
  createRisk,
} from "@/backend/src/modules/ai-governance/ai-governance-repo";
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

  const all = await findAllRisks(ctx.orgId, {
    status: sp.get("status") ?? undefined,
    category: sp.get("category") ?? undefined,
    systemId: sp.get("systemId") ?? undefined,
  });

  const paged = all.slice(offset, offset + limit);

  return ok({ risks: paged, total: all.length, limit, offset });
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
  if (!body?.title) return err("title is required.", 400);

  try {
    const risk = await createRisk(
      ctx.orgId,
      {
        title: body.title,
        description: body.description ?? null,
        systemId: body.systemId ?? null,
        category: body.category ?? "operational",
        status: body.status ?? "open",
        severity: body.severity ?? "medium",
        likelihood: body.likelihood ?? "possible",
        impact: body.impact ?? "moderate",
        mitigationPlan: body.mitigationPlan ?? null,
        ownerId: body.ownerId ?? null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        metadata: null,
      } as any,
      ctx.keyId
    );

    return ok({ risk }, 201);
  } catch (e) {
    if (e instanceof DomainError) return err(e.message, 422);
    console.error("[POST /api/v1/ai/risks]", e);
    return err("Internal server error.", 500);
  }
}
