"use server";

import * as repo from "@/lib/repositories/trust-api-repo";
import { createHash, randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardData(orgId: string) {
  const [metrics, products, webhooks] = await Promise.all([
    repo.getDashboardMetrics(orgId),
    repo.findAllProducts(),
    repo.findAllWebhooks(orgId),
  ]);
  return { metrics, products, webhooks };
}

// ── API Catalog ───────────────────────────────────────────────────────────────

export async function getApiCatalog() {
  return repo.findAllProducts();
}

// ── API Clients ───────────────────────────────────────────────────────────────

export async function getClients(orgId: string) {
  return repo.findAllClients(orgId);
}

export async function createClient(
  orgId: string,
  userId: string,
  data: { name: string; description?: string; clientType?: string; plan?: string; contactEmail?: string; website?: string }
) {
  const client = await repo.createClient(orgId, data as any, userId);
  await repo.recordAuditEvent(orgId, {
    actorId: userId,
    eventType: "api.client.created",
    resourceType: "client",
    resourceId: client.id,
    details: { name: client.name, plan: client.plan },
  });
  return client;
}

export async function updateClientStatus(orgId: string, userId: string, id: string, status: string) {
  const client = await repo.updateClient(orgId, id, { status } as any);
  await repo.recordAuditEvent(orgId, { actorId: userId, eventType: "api.client.updated", resourceType: "client", resourceId: id, details: { status } });
  return client;
}

export async function deleteClientById(orgId: string, userId: string, id: string) {
  await repo.deleteClient(orgId, id);
  await repo.recordAuditEvent(orgId, { actorId: userId, eventType: "api.client.deleted", resourceType: "client", resourceId: id, details: {} });
}

// ── API Keys ──────────────────────────────────────────────────────────────────

export async function getApiKeys(orgId: string) {
  return repo.findAllApiKeys(orgId);
}

export async function issueApiKey(
  orgId: string,
  userId: string,
  data: { name: string; clientId?: string; plan?: string; permissions?: string[]; expiresAt?: string }
): Promise<{ key: string; keyPrefix: string; id: string }> {
  const rawKey = `tap_${randomBytes(24).toString("hex")}`;
  const keyPrefix = rawKey.slice(0, 12);
  const keyHash = await bcrypt.hash(rawKey, 10);

  const saved = await repo.createApiKey(orgId, {
    name: data.name,
    clientId: data.clientId,
    plan: data.plan ?? "free",
    permissions: data.permissions ?? ["read"],
    keyPrefix,
    keyHash,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
  } as any, userId);

  await repo.recordAuditEvent(orgId, {
    actorId: userId,
    eventType: "api.key.created",
    resourceType: "api_key",
    resourceId: saved.id,
    details: { name: data.name, plan: data.plan ?? "free" },
  });

  return { key: rawKey, keyPrefix, id: saved.id };
}

export async function revokeApiKeyById(orgId: string, userId: string, id: string) {
  await repo.revokeApiKey(orgId, id);
  await repo.recordAuditEvent(orgId, { actorId: userId, eventType: "api.key.revoked", resourceType: "api_key", resourceId: id, details: {} });
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export async function getWebhooks(orgId: string) {
  return repo.findAllWebhooks(orgId);
}

export async function createWebhook(
  orgId: string,
  userId: string,
  data: { name: string; url: string; events: string[]; clientId?: string }
) {
  const secret = randomBytes(32).toString("hex");
  const webhook = await repo.createWebhook(orgId, { ...data, secret } as any, userId);
  await repo.recordAuditEvent(orgId, { actorId: userId, eventType: "webhook.created", resourceType: "webhook", resourceId: webhook.id, details: { name: webhook.name, url: webhook.url } });
  return webhook;
}

export async function toggleWebhook(orgId: string, userId: string, id: string, status: "active" | "paused") {
  const webhook = await repo.updateWebhook(orgId, id, { status } as any);
  await repo.recordAuditEvent(orgId, { actorId: userId, eventType: "webhook.updated", resourceType: "webhook", resourceId: id, details: { status } });
  return webhook;
}

export async function deleteWebhookById(orgId: string, userId: string, id: string) {
  await repo.deleteWebhook(orgId, id);
  await repo.recordAuditEvent(orgId, { actorId: userId, eventType: "webhook.deleted", resourceType: "webhook", resourceId: id, details: {} });
}

export async function triggerWebhookEvent(orgId: string, eventType: string, payload: Record<string, unknown>) {
  const webhooks = await repo.findAllWebhooks(orgId);
  const active = webhooks.filter(w => w.status === "active" && (w.events as string[]).includes(eventType));

  for (const webhook of active) {
    try {
      const start = Date.now();
      const res = await fetch(webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-AUDT-Event": eventType, "X-AUDT-Webhook-Id": webhook.id },
        body: JSON.stringify({ event: eventType, data: payload, timestamp: new Date().toISOString() }),
        signal: AbortSignal.timeout(10000),
      });
      await repo.recordWebhookDelivery(orgId, webhook.id, {
        eventType,
        payload: payload as any,
        statusCode: res.status,
        responseBody: await res.text().catch(() => ""),
        deliveredAt: res.ok ? new Date() : undefined,
        failedAt: !res.ok ? new Date() : undefined,
      });
    } catch {
      await repo.recordWebhookDelivery(orgId, webhook.id, {
        eventType, payload: payload as any, failedAt: new Date(),
      });
    }
  }
}

// ── Usage Analytics ───────────────────────────────────────────────────────────

export async function getUsageAnalytics(orgId: string, days: number = 30) {
  return repo.getUsageSummary(orgId, days);
}

// ── Audit Events ──────────────────────────────────────────────────────────────

export async function getAuditEvents(orgId: string) {
  return repo.findAuditEvents(orgId);
}

// ── Public Trust Data (for external API consumers) ────────────────────────────

export async function getTrustScoreData(orgId: string) {
  const { db } = await import("@/lib/db");
  const { governanceSnapshots, vendors } = await import("@/lib/db/schema");
  const { eq, desc } = await import("drizzle-orm");

  const [snapshot, vendorRows] = await Promise.all([
    db.select().from(governanceSnapshots).where(eq(governanceSnapshots.organizationId, orgId)).orderBy(desc(governanceSnapshots.snapshotDate)).limit(1),
    db.select({ trustScore: vendors.trustScore }).from(vendors).where(eq(vendors.organizationId, orgId)),
  ]);

  const latest = snapshot[0];
  const avgVendorTrust = vendorRows.length ? Math.round(vendorRows.reduce((s, v) => s + (v.trustScore ?? 0), 0) / vendorRows.length) : null;

  return {
    orgTrustScore: latest?.orgTrustScore ?? null,
    level: null as string | null,
    components: {
      vendorTrust: latest?.vendorTrustScore ?? null,
      riskPosture: latest?.riskPostureScore ?? null,
      controlHealth: latest?.controlHealthScore ?? null,
      auditReadiness: latest?.auditReadinessScore ?? null,
      compliance: latest?.avgFrameworkReadiness ?? null,
    },
    avgVendorTrust,
    vendorCount: vendorRows.length,
    snapshotDate: latest?.snapshotDate ?? null,
  };
}

export async function getVerificationData(orgId: string) {
  const { db } = await import("@/lib/db");
  const { trustProfiles, trustBadges, trustDocuments } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  const [profile, badges, docs] = await Promise.all([
    db.select().from(trustProfiles).where(eq(trustProfiles.organizationId, orgId)).limit(1).catch(() => []),
    db.select({ badgeType: trustBadges.badgeType, isActive: trustBadges.isActive }).from(trustBadges).where(eq(trustBadges.organizationId, orgId)).catch(() => []),
    db.select({ docType: trustDocuments.docType, isVerified: trustDocuments.isVerified, visibility: trustDocuments.visibility }).from(trustDocuments).where(eq(trustDocuments.organizationId, orgId)).catch(() => []),
  ]);

  return {
    hasPublicProfile: (profile[0]?.visibility ?? "private") === "public",
    verificationStatus: profile[0]?.isPublished ? "published" : "unpublished",
    badgeCount: badges.filter(b => b.isActive).length,
    documentCount: docs.length,
    profileCompleteness: profile[0]?.profileCompleteness ?? 0,
  };
}
