import { NextRequest } from "next/server";
import { ok, err } from "@/lib/api/response";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { listWorkflows, createWorkflow } from "@/backend/src/modules/workflow-studio/workflow-service";
import { DomainError } from "@/lib/services/errors";

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  const sp = req.nextUrl.searchParams;
  const workflows = await listWorkflows(ctx.orgId, {
    status: sp.get("status") ?? undefined,
    module: sp.get("module") ?? undefined,
    search: sp.get("search") ?? undefined,
  });
  return ok({ workflows });
}

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  if (ctx.permissions === "read_only") {
    return err("read_write or admin permission required", 403);
  }

  try {
    const body = await req.json();
    const wf = await createWorkflow(ctx.orgId, null, {
      name: body.name,
      description: body.description,
      module: body.module,
      triggerType: body.triggerType,
    });
    return ok({ workflow: wf }, 201);
  } catch (e) {
    if (e instanceof DomainError) return err(e.message, 422);
    return err("Unexpected error", 500);
  }
}
