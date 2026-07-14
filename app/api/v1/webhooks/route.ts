export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { findAllWebhooks, recordWebhookDelivery } from "@/backend/src/modules/trust-api/trust-api-repo";

const ALLOWED_EVENTS = [
  "trust.score.updated", "vendor.verified", "badge.issued", "risk.created",
  "risk.closed", "audit.completed", "assessment.completed", "ai.trust.updated", "benchmark.updated",
];

export async function GET(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  try {
    const webhooks = await findAllWebhooks(ctx.orgId);
    return ok({ data: webhooks.map(w => ({ id: w.id, name: w.name, url: w.url, events: w.events, status: w.status, lastTriggeredAt: w.lastTriggeredAt })), meta: { count: webhooks.length } });
  } catch {
    return err("Failed to list webhooks", 500);
  }
}

export async function POST(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);
  if (!ctx.permissions.includes("read_write") && ctx.permissions !== "admin") {
    return err("This endpoint requires a read_write API key.", 403);
  }

  try {
    const body = await request.json();
    if (!body.event) return err("event field is required", 400);
    if (!ALLOWED_EVENTS.includes(body.event)) return err(`Unknown event type. Allowed: ${ALLOWED_EVENTS.join(", ")}`, 400);

    const webhooks = await findAllWebhooks(ctx.orgId);
    const active = webhooks.filter(w => w.status === "active" && (w.events as string[]).includes(body.event));

    let triggered = 0;
    for (const webhook of active) {
      try {
        const res = await fetch(webhook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-AUDT-Event": body.event, "X-AUDT-Webhook-Id": webhook.id },
          body: JSON.stringify({ event: body.event, data: body.data ?? {}, timestamp: new Date().toISOString() }),
          signal: AbortSignal.timeout(8000),
        });
        await recordWebhookDelivery(ctx.orgId, webhook.id, {
          eventType: body.event,
          payload: body.data ?? {},
          statusCode: res.status,
          deliveredAt: res.ok ? new Date() : undefined,
          failedAt: !res.ok ? new Date() : undefined,
        });
        if (res.ok) triggered++;
      } catch {
        await recordWebhookDelivery(ctx.orgId, webhook.id, { eventType: body.event, payload: body.data ?? {}, failedAt: new Date() });
      }
    }

    return ok({ data: { event: body.event, webhooksTriggered: triggered, webhooksFound: active.length } });
  } catch {
    return err("Failed to trigger webhook", 500);
  }
}
