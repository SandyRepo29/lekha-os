import { db } from "@/lib/db";
import {
  tapProducts, tapClients, tapApiKeys, tapSubscriptions,
  tapUsage, tapWebhooks, tapWebhookDeliveries, tapAuditEvents,
  type TapProduct, type TapClient, type TapApiKey, type TapSubscription,
  type TapUsage, type TapWebhook, type TapWebhookDelivery, type TapAuditEvent,
} from "@/lib/db/schema";
import { eq, and, desc, sql, gte, count } from "drizzle-orm";

// ── Dashboard metrics ─────────────────────────────────────────────────────────

export async function getDashboardMetrics(orgId: string) {
  const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [
    totalClients, activeClients, totalKeys, activeKeys,
    totalWebhooks, activeWebhooks, totalCalls30d, errorCalls30d,
    recentClients, recentUsage,
  ] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(tapClients).where(eq(tapClients.organizationId, orgId)),
    db.select({ c: sql<number>`count(*)::int` }).from(tapClients).where(and(eq(tapClients.organizationId, orgId), eq(tapClients.status, "active"))),
    db.select({ c: sql<number>`count(*)::int` }).from(tapApiKeys).where(eq(tapApiKeys.organizationId, orgId)),
    db.select({ c: sql<number>`count(*)::int` }).from(tapApiKeys).where(and(eq(tapApiKeys.organizationId, orgId), eq(tapApiKeys.status, "active"))),
    db.select({ c: sql<number>`count(*)::int` }).from(tapWebhooks).where(eq(tapWebhooks.organizationId, orgId)),
    db.select({ c: sql<number>`count(*)::int` }).from(tapWebhooks).where(and(eq(tapWebhooks.organizationId, orgId), eq(tapWebhooks.status, "active"))),
    db.select({ c: sql<number>`count(*)::int` }).from(tapUsage).where(and(eq(tapUsage.organizationId, orgId), gte(tapUsage.calledAt, since30d))),
    db.select({ c: sql<number>`count(*)::int` }).from(tapUsage).where(and(eq(tapUsage.organizationId, orgId), gte(tapUsage.calledAt, since30d), sql`status_code >= 400`)),
    db.select().from(tapClients).where(eq(tapClients.organizationId, orgId)).orderBy(desc(tapClients.createdAt)).limit(5),
    db.select().from(tapUsage).where(and(eq(tapUsage.organizationId, orgId), gte(tapUsage.calledAt, since30d))).orderBy(desc(tapUsage.calledAt)).limit(10),
  ]);

  return {
    totalClients: totalClients[0]?.c ?? 0,
    activeClients: activeClients[0]?.c ?? 0,
    totalKeys: totalKeys[0]?.c ?? 0,
    activeKeys: activeKeys[0]?.c ?? 0,
    totalWebhooks: totalWebhooks[0]?.c ?? 0,
    activeWebhooks: activeWebhooks[0]?.c ?? 0,
    totalCalls30d: totalCalls30d[0]?.c ?? 0,
    errorCalls30d: errorCalls30d[0]?.c ?? 0,
    recentClients,
    recentUsage,
  };
}

// ── API Products ──────────────────────────────────────────────────────────────

export async function findAllProducts(): Promise<TapProduct[]> {
  return db.select().from(tapProducts).orderBy(tapProducts.name);
}

export async function findProductBySlug(slug: string): Promise<TapProduct | null> {
  const rows = await db.select().from(tapProducts).where(eq(tapProducts.slug, slug)).limit(1);
  return rows[0] ?? null;
}

// ── API Clients ───────────────────────────────────────────────────────────────

export async function findAllClients(orgId: string): Promise<TapClient[]> {
  return db.select().from(tapClients).where(eq(tapClients.organizationId, orgId)).orderBy(desc(tapClients.createdAt));
}

export async function findClientById(orgId: string, id: string): Promise<TapClient | null> {
  const rows = await db.select().from(tapClients).where(and(eq(tapClients.organizationId, orgId), eq(tapClients.id, id))).limit(1);
  return rows[0] ?? null;
}

export async function createClient(orgId: string, data: Partial<TapClient>, createdBy: string): Promise<TapClient> {
  const rows = await db.insert(tapClients).values({ ...data, organizationId: orgId, createdBy } as any).returning();
  return rows[0];
}

export async function updateClient(orgId: string, id: string, data: Partial<TapClient>): Promise<TapClient> {
  const rows = await db.update(tapClients).set({ ...data, updatedAt: new Date() }).where(and(eq(tapClients.organizationId, orgId), eq(tapClients.id, id))).returning();
  return rows[0];
}

export async function deleteClient(orgId: string, id: string): Promise<void> {
  await db.delete(tapClients).where(and(eq(tapClients.organizationId, orgId), eq(tapClients.id, id)));
}

// ── API Keys ──────────────────────────────────────────────────────────────────

export async function findAllApiKeys(orgId: string): Promise<Omit<TapApiKey, "keyHash">[]> {
  const rows = await db.select({
    id: tapApiKeys.id, organizationId: tapApiKeys.organizationId, clientId: tapApiKeys.clientId,
    name: tapApiKeys.name, keyPrefix: tapApiKeys.keyPrefix, plan: tapApiKeys.plan,
    status: tapApiKeys.status, permissions: tapApiKeys.permissions, expiresAt: tapApiKeys.expiresAt,
    lastUsedAt: tapApiKeys.lastUsedAt, usageCount: tapApiKeys.usageCount,
    rateLimitOverride: tapApiKeys.rateLimitOverride, createdBy: tapApiKeys.createdBy,
    createdAt: tapApiKeys.createdAt, updatedAt: tapApiKeys.updatedAt,
  }).from(tapApiKeys).where(eq(tapApiKeys.organizationId, orgId)).orderBy(desc(tapApiKeys.createdAt));
  return rows;
}

export async function findApiKeyByPrefix(prefix: string): Promise<TapApiKey | null> {
  const rows = await db.select().from(tapApiKeys).where(eq(tapApiKeys.keyPrefix, prefix)).limit(1);
  return rows[0] ?? null;
}

export async function createApiKey(orgId: string, data: Partial<TapApiKey>, createdBy: string): Promise<TapApiKey> {
  const rows = await db.insert(tapApiKeys).values({ ...data, organizationId: orgId, createdBy } as any).returning();
  return rows[0];
}

export async function revokeApiKey(orgId: string, id: string): Promise<void> {
  await db.update(tapApiKeys).set({ status: "revoked", updatedAt: new Date() }).where(and(eq(tapApiKeys.organizationId, orgId), eq(tapApiKeys.id, id)));
}

export async function updateKeyLastUsed(id: string): Promise<void> {
  await db.update(tapApiKeys).set({ lastUsedAt: new Date(), usageCount: sql`usage_count + 1`, updatedAt: new Date() }).where(eq(tapApiKeys.id, id)).catch(() => {});
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

export async function findSubscriptionsByOrg(orgId: string): Promise<TapSubscription[]> {
  return db.select().from(tapSubscriptions).where(eq(tapSubscriptions.organizationId, orgId)).orderBy(desc(tapSubscriptions.subscribedAt));
}

export async function createSubscription(orgId: string, clientId: string, productId: string, createdBy: string): Promise<TapSubscription> {
  const rows = await db.insert(tapSubscriptions).values({ organizationId: orgId, clientId, productId, createdBy } as any).returning();
  return rows[0];
}

// ── Usage ─────────────────────────────────────────────────────────────────────

export async function recordUsage(orgId: string, data: Partial<TapUsage>): Promise<void> {
  await db.insert(tapUsage).values({ ...data, organizationId: orgId } as any).catch(() => {});
}

export async function getUsageSummary(orgId: string, days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  const [total, errors, topEndpoints, dailyCounts] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(tapUsage).where(and(eq(tapUsage.organizationId, orgId), gte(tapUsage.calledAt, since))),
    db.select({ c: sql<number>`count(*)::int` }).from(tapUsage).where(and(eq(tapUsage.organizationId, orgId), gte(tapUsage.calledAt, since), sql`status_code >= 400`)),
    db.select({ endpoint: tapUsage.endpoint, cnt: sql<number>`count(*)::int` }).from(tapUsage).where(and(eq(tapUsage.organizationId, orgId), gte(tapUsage.calledAt, since))).groupBy(tapUsage.endpoint).orderBy(sql`count(*) desc`).limit(10),
    db.select({ day: sql<string>`date_trunc('day', called_at)::date::text`, cnt: sql<number>`count(*)::int` }).from(tapUsage).where(and(eq(tapUsage.organizationId, orgId), gte(tapUsage.calledAt, since))).groupBy(sql`date_trunc('day', called_at)`).orderBy(sql`date_trunc('day', called_at) asc`),
  ]);
  return { total: total[0]?.c ?? 0, errors: errors[0]?.c ?? 0, topEndpoints, dailyCounts };
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export async function findAllWebhooks(orgId: string): Promise<TapWebhook[]> {
  return db.select().from(tapWebhooks).where(eq(tapWebhooks.organizationId, orgId)).orderBy(desc(tapWebhooks.createdAt));
}

export async function findWebhookById(orgId: string, id: string): Promise<TapWebhook | null> {
  const rows = await db.select().from(tapWebhooks).where(and(eq(tapWebhooks.organizationId, orgId), eq(tapWebhooks.id, id))).limit(1);
  return rows[0] ?? null;
}

export async function createWebhook(orgId: string, data: Partial<TapWebhook>, createdBy: string): Promise<TapWebhook> {
  const rows = await db.insert(tapWebhooks).values({ ...data, organizationId: orgId, createdBy } as any).returning();
  return rows[0];
}

export async function updateWebhook(orgId: string, id: string, data: Partial<TapWebhook>): Promise<TapWebhook> {
  const rows = await db.update(tapWebhooks).set({ ...data, updatedAt: new Date() }).where(and(eq(tapWebhooks.organizationId, orgId), eq(tapWebhooks.id, id))).returning();
  return rows[0];
}

export async function deleteWebhook(orgId: string, id: string): Promise<void> {
  await db.delete(tapWebhooks).where(and(eq(tapWebhooks.organizationId, orgId), eq(tapWebhooks.id, id)));
}

export async function recordWebhookDelivery(orgId: string, webhookId: string, data: Partial<TapWebhookDelivery>): Promise<void> {
  await db.insert(tapWebhookDeliveries).values({ ...data, organizationId: orgId, webhookId } as any).catch(() => {});
  if (data.statusCode && data.statusCode >= 400) {
    await db.update(tapWebhooks).set({ failureCount: sql`failure_count + 1`, lastTriggeredAt: new Date(), lastStatusCode: data.statusCode, updatedAt: new Date() }).where(eq(tapWebhooks.id, webhookId)).catch(() => {});
  } else {
    await db.update(tapWebhooks).set({ lastTriggeredAt: new Date(), lastStatusCode: data.statusCode ?? null, updatedAt: new Date() }).where(eq(tapWebhooks.id, webhookId)).catch(() => {});
  }
}

export async function findWebhookDeliveries(orgId: string, webhookId: string): Promise<TapWebhookDelivery[]> {
  return db.select().from(tapWebhookDeliveries).where(and(eq(tapWebhookDeliveries.organizationId, orgId), eq(tapWebhookDeliveries.webhookId, webhookId))).orderBy(desc(tapWebhookDeliveries.createdAt)).limit(50);
}

// ── Audit Events ──────────────────────────────────────────────────────────────

export async function recordAuditEvent(orgId: string, data: Partial<TapAuditEvent>): Promise<void> {
  await db.insert(tapAuditEvents).values({ ...data, organizationId: orgId } as any).catch(() => {});
}

export async function findAuditEvents(orgId: string): Promise<TapAuditEvent[]> {
  return db.select().from(tapAuditEvents).where(eq(tapAuditEvents.organizationId, orgId)).orderBy(desc(tapAuditEvents.createdAt)).limit(100);
}
