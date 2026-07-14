import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { listIssues, createIssue } from "@/backend/src/modules/issue-hub/issue-service";
import { DomainError } from "@/lib/services/errors";

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await validateApiKey(req);
  } catch (e) {
    return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401);
  }

  const sp = req.nextUrl.searchParams;
  const issues = await listIssues(ctx.orgId, {
    status: sp.get("status") ?? undefined,
    severity: sp.get("severity") ?? undefined,
    priority: sp.get("priority") ?? undefined,
    issueType: sp.get("issueType") ?? undefined,
    search: sp.get("search") ?? undefined,
  });

  return ok({ issues, total: issues.length });
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
    const issue = await createIssue(ctx.orgId, null, body);
    return ok({ issue }, 201);
  } catch (e: unknown) {
    if (e instanceof DomainError) return err(e.message, 400);
    throw e;
  }
}
