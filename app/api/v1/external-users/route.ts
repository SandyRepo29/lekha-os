export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { findAllExternalUsers, createExternalUser } from "@/backend/src/modules/auditor-collaboration/auditor-collaboration-repo";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") ?? undefined;
    const users = await findAllExternalUsers(ctx.orgId, { status });
    return ok({ data: users, meta: { count: users.length } });
  } catch {
    return err("Failed to fetch external users", 500);
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
    if (!body.email) return err("email is required", 400);
    if (!body.fullName) return err("fullName is required", 400);
    const user = await createExternalUser(
      ctx.orgId,
      { ...body, inviteToken: randomUUID(), inviteSentAt: new Date(), status: "invited" },
      null
    );
    return ok({ data: user }, 201);
  } catch {
    return err("Failed to create external user", 500);
  }
}
