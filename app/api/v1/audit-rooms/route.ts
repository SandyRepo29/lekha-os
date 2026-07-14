export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { findAllRooms, createRoom, addRoomActivity } from "@/backend/src/modules/auditor-collaboration/auditor-collaboration-repo";

export async function GET(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") ?? undefined;
    const rooms = await findAllRooms(ctx.orgId, { status });
    return ok({ data: rooms, meta: { count: rooms.length } });
  } catch {
    return err("Failed to fetch audit rooms", 500);
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
    if (!body.name) return err("name is required", 400);
    const room = await createRoom(ctx.orgId, body, null);
    await addRoomActivity(ctx.orgId, room.id, {
      activityType: "audit_room.created",
      description: `Room "${room.name}" created via API.`,
    });
    return ok({ data: room }, 201);
  } catch {
    return err("Failed to create audit room", 500);
  }
}
