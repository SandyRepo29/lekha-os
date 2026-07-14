"use server";

import { requireUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import * as svc from "@/backend/src/modules/trust-api/trust-api-service";
import * as ai from "@/backend/src/modules/trust-api/ai-trust-api-service";

function orgId(session: Awaited<ReturnType<typeof requireUser>>) { return session.org?.id ?? ""; }

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardDataAction() {
  try {
    const session = await requireUser();
    const data = await svc.getDashboardData(orgId(session));
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load dashboard" };
  }
}

// ── API Catalog ───────────────────────────────────────────────────────────────

export async function getApiCatalogAction() {
  try {
    const data = await svc.getApiCatalog();
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load catalog" };
  }
}

// ── Clients ───────────────────────────────────────────────────────────────────

export async function getClientsAction() {
  try {
    const session = await requireUser();
    const data = await svc.getClients(orgId(session));
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load clients" };
  }
}

export async function createClientAction(formData: FormData) {
  try {
    const session = await requireUser();
    const data = await svc.createClient(orgId(session), session.id, {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      clientType: String(formData.get("clientType") ?? "application"),
      plan: String(formData.get("plan") ?? "free"),
      contactEmail: String(formData.get("contactEmail") ?? "") || undefined,
      website: String(formData.get("website") ?? "") || undefined,
    });
    revalidatePath("/trust-api");
    revalidatePath("/trust-api/keys");
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create client" };
  }
}

export async function deleteClientAction(id: string) {
  try {
    const session = await requireUser();
    await svc.deleteClientById(orgId(session), session.id, id);
    revalidatePath("/trust-api");
    revalidatePath("/trust-api/keys");
    return { data: { ok: true } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete client" };
  }
}

// ── API Keys ──────────────────────────────────────────────────────────────────

export async function getApiKeysAction() {
  try {
    const session = await requireUser();
    const data = await svc.getApiKeys(orgId(session));
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load keys" };
  }
}

export async function issueApiKeyAction(formData: FormData) {
  try {
    const session = await requireUser();
    const data = await svc.issueApiKey(orgId(session), session.id, {
      name: String(formData.get("name") ?? ""),
      clientId: String(formData.get("clientId") ?? "") || undefined,
      plan: String(formData.get("plan") ?? "free"),
      permissions: [String(formData.get("permissions") ?? "read")],
    });
    revalidatePath("/trust-api/keys");
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to issue API key" };
  }
}

export async function revokeApiKeyAction(id: string) {
  try {
    const session = await requireUser();
    await svc.revokeApiKeyById(orgId(session), session.id, id);
    revalidatePath("/trust-api/keys");
    return { data: { ok: true } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to revoke key" };
  }
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export async function getWebhooksAction() {
  try {
    const session = await requireUser();
    const data = await svc.getWebhooks(orgId(session));
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load webhooks" };
  }
}

export async function createWebhookAction(formData: FormData) {
  try {
    const session = await requireUser();
    const events = String(formData.get("events") ?? "").split(",").map(s => s.trim()).filter(Boolean);
    const data = await svc.createWebhook(orgId(session), session.id, {
      name: String(formData.get("name") ?? ""),
      url: String(formData.get("url") ?? ""),
      events,
    });
    revalidatePath("/trust-api/webhooks");
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create webhook" };
  }
}

export async function toggleWebhookAction(id: string, status: "active" | "paused") {
  try {
    const session = await requireUser();
    const data = await svc.toggleWebhook(orgId(session), session.id, id, status);
    revalidatePath("/trust-api/webhooks");
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update webhook" };
  }
}

export async function deleteWebhookAction(id: string) {
  try {
    const session = await requireUser();
    await svc.deleteWebhookById(orgId(session), session.id, id);
    revalidatePath("/trust-api/webhooks");
    return { data: { ok: true } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete webhook" };
  }
}

// ── AI ────────────────────────────────────────────────────────────────────────

export async function generatePlatformSummaryAction() {
  try {
    const session = await requireUser();
    const data = await ai.generateApiPlatformSummary(orgId(session));
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to generate summary" };
  }
}

export async function generateApiDocsAction(productSlug: string) {
  try {
    const data = await ai.generateApiDocs(productSlug);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to generate docs" };
  }
}

export async function chatAction(messages: { role: "user" | "assistant"; content: string }[]) {
  try {
    const session = await requireUser();
    const content = await ai.chat(orgId(session), messages);
    return { data: { content } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Chat failed" };
  }
}
