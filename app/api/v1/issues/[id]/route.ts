import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getIssueDetail, updateIssue, deleteIssue } from "@/backend/src/modules/issue-hub/issue-service";
import { DomainError } from "@/lib/services/errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  const issue = await getIssueDetail(ctx.orgId, id);
  if (!issue) return err("Issue not found", 404);
  return ok({ issue });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }
  if (ctx.permissions === "read_only") return err("read_write permission required", 403);

  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid request body", 400);

  try {
    const updated = await updateIssue(ctx.orgId, null, id, body);
    return ok({ issue: updated });
  } catch (e: unknown) {
    if (e instanceof DomainError) return err(e.message, 400);
    throw e;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }
  if (ctx.permissions === "read_only") return err("read_write permission required", 403);

  try {
    await deleteIssue(ctx.orgId, null, id);
    return ok({ deleted: true });
  } catch (e: unknown) {
    if (e instanceof DomainError) return err(e.message, 400);
    throw e;
  }
}
