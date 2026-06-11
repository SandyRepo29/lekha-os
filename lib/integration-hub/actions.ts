"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import * as svc from "@/lib/services/integration-hub/integration-service";
import * as aiSvc from "@/lib/services/integration-hub/ai-integration-service";

// ── Connections ───────────────────────────────────────────────────────────────

export async function connectAction(registryId: string, credentials: Record<string, string>, syncFrequency: string) {
  const session = await requireUser();
  if (!session.org) return { error: "No organization" };
  try {
    const instance = await svc.connectIntegration(session.org.id, session.id, registryId, credentials, syncFrequency);
    revalidatePath("/integration-hub");
    return { data: instance };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function disconnectAction(instanceId: string) {
  const session = await requireUser();
  if (!session.org) return { error: "No organization" };
  try {
    await svc.disconnectIntegration(session.org.id, session.id, instanceId);
    revalidatePath("/integration-hub");
    return { data: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function reconnectAction(instanceId: string, credentials: Record<string, string>) {
  const session = await requireUser();
  if (!session.org) return { error: "No organization" };
  try {
    await svc.reconnectIntegration(session.org.id, session.id, instanceId, credentials);
    revalidatePath("/integration-hub");
    return { data: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ── Sync ──────────────────────────────────────────────────────────────────────

export async function triggerSyncAction(instanceId: string, syncType: "full" | "incremental" = "incremental") {
  const session = await requireUser();
  if (!session.org) return { error: "No organization" };
  try {
    const sync = await svc.triggerSync(session.org.id, session.id, instanceId, syncType);
    revalidatePath("/integration-hub");
    return { data: sync };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ── Events ────────────────────────────────────────────────────────────────────

export async function resolveEventAction(eventId: string) {
  const session = await requireUser();
  if (!session.org) return { error: "No organization" };
  try {
    await svc.resolveEvent(session.org.id, session.id, eventId);
    revalidatePath("/integration-hub");
    return { data: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export async function createWebhookAction(data: { name: string; direction: "inbound" | "outbound"; url?: string; eventTypes: string[] }) {
  const session = await requireUser();
  if (!session.org) return { error: "No organization" };
  try {
    const wh = await svc.createWebhook(session.org.id, session.id, data);
    revalidatePath("/integration-hub/webhooks");
    return { data: wh };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteWebhookAction(webhookId: string) {
  const session = await requireUser();
  if (!session.org) return { error: "No organization" };
  try {
    await svc.deleteWebhook(session.org.id, session.id, webhookId);
    revalidatePath("/integration-hub/webhooks");
    return { data: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function toggleWebhookAction(webhookId: string, isActive: boolean) {
  const session = await requireUser();
  if (!session.org) return { error: "No organization" };
  try {
    await svc.toggleWebhook(session.org.id, session.id, webhookId, isActive);
    revalidatePath("/integration-hub/webhooks");
    return { data: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ── AI ────────────────────────────────────────────────────────────────────────

export async function generateSummaryAction(forceRefresh = false) {
  const session = await requireUser();
  if (!session.org) return { error: "No organization" };
  try {
    const text = await aiSvc.generateIntegrationSummary(session.org.id, forceRefresh);
    return { data: text };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getRecommendationsAction() {
  const session = await requireUser();
  if (!session.org) return { error: "No organization" };
  try {
    const text = await aiSvc.getConnectorRecommendations(session.org.id);
    return { data: text };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function analyzeCoverageGapsAction() {
  const session = await requireUser();
  if (!session.org) return { error: "No organization" };
  try {
    const text = await aiSvc.analyzeCoverageGaps(session.org.id);
    return { data: text };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function chatAction(message: string, history: { role: "user" | "model"; text: string }[]) {
  const session = await requireUser();
  if (!session.org) return { error: "No organization" };
  try {
    const reply = await aiSvc.chat(session.org.id, message, history);
    return { data: reply };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
