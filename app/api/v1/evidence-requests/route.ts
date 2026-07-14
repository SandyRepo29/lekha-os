export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { findAllEvidenceRequests, createEvidenceRequest } from "@/backend/src/modules/auditor-collaboration/auditor-collaboration-repo";

export async function GET(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") ?? undefined;
    const roomId = searchParams.get("roomId") ?? undefined;
    const requests = await findAllEvidenceRequests(ctx.orgId, { status, roomId });
    return ok({ data: requests, meta: { count: requests.length } });
  } catch {
    return err("Failed to fetch evidence requests", 500);
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
    const req = await createEvidenceRequest(ctx.orgId, body.roomId, body, null);
    return ok({ data: req }, 201);
  } catch {
    return err("Failed to create evidence request", 500);
  }
}
