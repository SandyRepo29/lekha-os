export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { findAllExternalFindings, createExternalFinding } from "@/lib/repositories/auditor-collaboration-repo";

export async function GET(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") ?? undefined;
    const severity = searchParams.get("severity") ?? undefined;
    const roomId = searchParams.get("roomId") ?? undefined;
    const findings = await findAllExternalFindings(ctx.orgId, { status, severity, roomId });
    return ok({ data: findings, meta: { count: findings.length } });
  } catch {
    return err("Failed to fetch external findings", 500);
  }
}

export async function POST(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);
  if (!ctx.permissions.includes("read_write") && ctx.permissions !== "admin") {
    return err("This endpoint requires a read_write or admin API key.", 403);
  }

  try {
    const body = await request.json();
    if (!body.title) return err("title is required", 400);
    if (!body.roomId) return err("roomId is required", 400);
    const finding = await createExternalFinding(ctx.orgId, body.roomId, body, ctx.keyId);
    return ok({ data: finding }, 201);
  } catch {
    return err("Failed to create finding", 500);
  }
}
