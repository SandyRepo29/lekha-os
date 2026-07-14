export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { ok, err } from "@/lib/api/response";
import * as svc from "@/backend/src/modules/governance-agents/agent-service";
import { DomainError } from "@/lib/services/errors";

// Security-critical: approve agent actions requires an authenticated
// human session — API key auth is intentionally NOT accepted here.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser().catch(() => null);
  if (!session?.org) return err("Unauthorized — a valid user session is required to approve agent actions.", 401);

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const notes: string | undefined = typeof body.notes === "string" ? body.notes : undefined;

    const result = await svc.approveAction(session.org.id, id, session.id, notes);

    return ok(result, 200);
  } catch (e) {
    if (e instanceof DomainError) return err(e.message, 422);
    console.error("[POST /api/v1/agent-actions/:id/approve]", e);
    return err("Internal server error.", 500);
  }
}
