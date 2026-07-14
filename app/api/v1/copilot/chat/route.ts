export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { ok, err } from "@/lib/api/response";
import * as repo from "@/backend/src/modules/governance-agents/agents-repo";
import { generateCopilotResponse } from "@/backend/src/modules/governance-agents/ai-agent-service";
import { DomainError } from "@/lib/services/errors";

export async function GET(request: NextRequest) {
  const session = await requireUser().catch(() => null);
  if (!session?.org) return err("Unauthorized.", 401);

  const { searchParams } = request.nextUrl;
  const agentId = searchParams.get("agentId") ?? undefined;
  const limit   = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const history = await repo.getConversationHistory(session.org.id, session.id, agentId, limit);
  return ok(history);
}

export async function POST(request: NextRequest) {
  const session = await requireUser().catch(() => null);
  if (!session?.org) return err("Unauthorized.", 401);

  try {
    const body = await request.json();

    if (!body.message || typeof body.message !== "string" || body.message.trim() === "") {
      return err("message is required.", 400);
    }

    const history: Array<{ role: string; content: string }> = Array.isArray(body.history)
      ? body.history
      : [];
    const agentId: string | undefined = typeof body.agentId === "string" ? body.agentId : undefined;

    const response = await generateCopilotResponse(
      session.org.id,
      session.id,
      body.message.trim(),
      history,
    );

    return ok(response, 200);
  } catch (e) {
    if (e instanceof DomainError) return err(e.message, 422);
    console.error("[POST /api/v1/copilot/chat]", e);
    return err("Internal server error.", 500);
  }
}
