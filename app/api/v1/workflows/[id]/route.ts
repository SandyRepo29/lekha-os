import { NextRequest } from "next/server";
import { ok, err } from "@/lib/api/response";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { getWorkflowDetail, updateWorkflow, deleteWorkflow } from "@/backend/src/modules/workflow-studio/workflow-service";
import { DomainError } from "@/lib/services/errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  const { id } = await params;
  const wf = await getWorkflowDetail(ctx.orgId, id).catch(() => null);
  if (!wf) return err("Not found", 404);
  return ok({ workflow: wf });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  if (ctx.permissions === "read_only") {
    return err("read_write or admin permission required", 403);
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const wf = await updateWorkflow(ctx.orgId, null, id, body);
    return ok({ workflow: wf });
  } catch (e) {
    if (e instanceof DomainError) return err(e.message, 422);
    return err("Unexpected error", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  if (ctx.permissions === "read_only") {
    return err("read_write or admin permission required", 403);
  }

  const { id } = await params;
  try {
    await deleteWorkflow(ctx.orgId, null, id);
    return ok({ deleted: true });
  } catch (e) {
    if (e instanceof DomainError) return err(e.message, 422);
    return err("Unexpected error", 500);
  }
}
