import { db } from "@/lib/db";
import {
  integrationRegistry,
  integrationInstances,
  integrationCredentials,
  integrationSyncs,
  integrationLogs,
  integrationEvents,
  integrationMappings,
  integrationWebhooks,
  auditLogs,
} from "@/lib/db/schema";
import { eq, and, desc, count, sql, inArray, isNull } from "drizzle-orm";

// ── Registry ──────────────────────────────────────────────────────────────────

export async function getAllConnectors() {
  return db.select().from(integrationRegistry).orderBy(integrationRegistry.category, integrationRegistry.name);
}

export async function getConnectorBySlug(slug: string) {
  const [row] = await db.select().from(integrationRegistry).where(eq(integrationRegistry.slug, slug));
  return row ?? null;
}

export async function getConnectorById(id: string) {
  const [row] = await db.select().from(integrationRegistry).where(eq(integrationRegistry.id, id));
  return row ?? null;
}

// ── Instances ─────────────────────────────────────────────────────────────────

export async function getInstancesByOrg(orgId: string) {
  return db
    .select({
      instance: integrationInstances,
      connector: integrationRegistry,
    })
    .from(integrationInstances)
    .innerJoin(integrationRegistry, eq(integrationInstances.registryId, integrationRegistry.id))
    .where(eq(integrationInstances.organizationId, orgId))
    .orderBy(desc(integrationInstances.updatedAt));
}

export async function getInstanceById(orgId: string, instanceId: string) {
  const [row] = await db
    .select({
      instance: integrationInstances,
      connector: integrationRegistry,
    })
    .from(integrationInstances)
    .innerJoin(integrationRegistry, eq(integrationInstances.registryId, integrationRegistry.id))
    .where(and(eq(integrationInstances.organizationId, orgId), eq(integrationInstances.id, instanceId)));
  return row ?? null;
}

export async function getInstanceByRegistryId(orgId: string, registryId: string) {
  const [row] = await db
    .select()
    .from(integrationInstances)
    .where(and(eq(integrationInstances.organizationId, orgId), eq(integrationInstances.registryId, registryId)));
  return row ?? null;
}

export async function createInstance(data: typeof integrationInstances.$inferInsert) {
  const [row] = await db.insert(integrationInstances).values(data).returning();
  return row;
}

export async function updateInstance(orgId: string, instanceId: string, data: Partial<typeof integrationInstances.$inferInsert>) {
  const [row] = await db
    .update(integrationInstances)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(integrationInstances.organizationId, orgId), eq(integrationInstances.id, instanceId)))
    .returning();
  return row;
}

export async function deleteInstance(orgId: string, instanceId: string) {
  await db
    .delete(integrationInstances)
    .where(and(eq(integrationInstances.organizationId, orgId), eq(integrationInstances.id, instanceId)));
}

// ── Credentials ───────────────────────────────────────────────────────────────

export async function saveCredentials(data: typeof integrationCredentials.$inferInsert) {
  const [row] = await db
    .insert(integrationCredentials)
    .values(data)
    .onConflictDoUpdate({
      target: integrationCredentials.instanceId,
      set: { encryptedData: data.encryptedData, expiresAt: data.expiresAt, updatedAt: new Date() },
    })
    .returning();
  return row;
}

export async function getCredentials(instanceId: string) {
  const [row] = await db.select().from(integrationCredentials).where(eq(integrationCredentials.instanceId, instanceId));
  return row ?? null;
}

export async function deleteCredentials(instanceId: string) {
  await db.delete(integrationCredentials).where(eq(integrationCredentials.instanceId, instanceId));
}

// ── Syncs ─────────────────────────────────────────────────────────────────────

export async function createSync(data: typeof integrationSyncs.$inferInsert) {
  const [row] = await db.insert(integrationSyncs).values(data).returning();
  return row;
}

export async function updateSync(syncId: string, data: Partial<typeof integrationSyncs.$inferInsert>) {
  const [row] = await db
    .update(integrationSyncs)
    .set(data)
    .where(eq(integrationSyncs.id, syncId))
    .returning();
  return row;
}

export async function getSyncsByOrg(orgId: string, limit = 50) {
  return db
    .select({
      sync: integrationSyncs,
      connectorName: integrationRegistry.name,
    })
    .from(integrationSyncs)
    .innerJoin(integrationInstances, eq(integrationSyncs.instanceId, integrationInstances.id))
    .innerJoin(integrationRegistry, eq(integrationInstances.registryId, integrationRegistry.id))
    .where(eq(integrationSyncs.organizationId, orgId))
    .orderBy(desc(integrationSyncs.startedAt))
    .limit(limit);
}

export async function getSyncsByInstance(instanceId: string, limit = 20) {
  return db
    .select()
    .from(integrationSyncs)
    .where(eq(integrationSyncs.instanceId, instanceId))
    .orderBy(desc(integrationSyncs.startedAt))
    .limit(limit);
}

// ── Logs ──────────────────────────────────────────────────────────────────────

export async function insertLog(data: typeof integrationLogs.$inferInsert) {
  const [row] = await db.insert(integrationLogs).values(data).returning();
  return row;
}

export async function getLogsByInstance(instanceId: string, limit = 100) {
  return db
    .select()
    .from(integrationLogs)
    .where(eq(integrationLogs.instanceId, instanceId))
    .orderBy(desc(integrationLogs.createdAt))
    .limit(limit);
}

// ── Events ────────────────────────────────────────────────────────────────────

export async function insertEvent(data: typeof integrationEvents.$inferInsert) {
  const [row] = await db.insert(integrationEvents).values(data).returning();
  return row;
}

export async function getEventsByOrg(orgId: string, resolvedFilter?: boolean, limit = 50) {
  const q = db
    .select({
      event: integrationEvents,
      connectorName: integrationRegistry.name,
    })
    .from(integrationEvents)
    .innerJoin(integrationInstances, eq(integrationEvents.instanceId, integrationInstances.id))
    .innerJoin(integrationRegistry, eq(integrationInstances.registryId, integrationRegistry.id))
    .where(
      resolvedFilter === undefined
        ? eq(integrationEvents.organizationId, orgId)
        : and(eq(integrationEvents.organizationId, orgId), eq(integrationEvents.resolved, resolvedFilter))
    )
    .orderBy(desc(integrationEvents.createdAt))
    .limit(limit);
  return q;
}

export async function resolveEvent(orgId: string, eventId: string) {
  await db
    .update(integrationEvents)
    .set({ resolved: true, resolvedAt: new Date() })
    .where(and(eq(integrationEvents.organizationId, orgId), eq(integrationEvents.id, eventId)));
}

// ── Mappings ──────────────────────────────────────────────────────────────────

export async function getMappingsByInstance(instanceId: string) {
  return db.select().from(integrationMappings).where(eq(integrationMappings.instanceId, instanceId));
}

export async function upsertMapping(data: typeof integrationMappings.$inferInsert) {
  const [row] = await db.insert(integrationMappings).values(data).returning();
  return row;
}

export async function deleteMapping(orgId: string, mappingId: string) {
  await db.delete(integrationMappings).where(and(eq(integrationMappings.organizationId, orgId), eq(integrationMappings.id, mappingId)));
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export async function getWebhooksByOrg(orgId: string) {
  return db
    .select()
    .from(integrationWebhooks)
    .where(eq(integrationWebhooks.organizationId, orgId))
    .orderBy(desc(integrationWebhooks.createdAt));
}

export async function createWebhook(data: typeof integrationWebhooks.$inferInsert) {
  const [row] = await db.insert(integrationWebhooks).values(data).returning();
  return row;
}

export async function updateWebhook(orgId: string, webhookId: string, data: Partial<typeof integrationWebhooks.$inferInsert>) {
  const [row] = await db
    .update(integrationWebhooks)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(integrationWebhooks.organizationId, orgId), eq(integrationWebhooks.id, webhookId)))
    .returning();
  return row;
}

export async function deleteWebhook(orgId: string, webhookId: string) {
  await db.delete(integrationWebhooks).where(and(eq(integrationWebhooks.organizationId, orgId), eq(integrationWebhooks.id, webhookId)));
}

// ── Dashboard metrics ─────────────────────────────────────────────────────────

export async function getDashboardMetrics(orgId: string) {
  const instances = await db
    .select()
    .from(integrationInstances)
    .where(eq(integrationInstances.organizationId, orgId));

  const connected = instances.filter((i) => i.status === "connected").length;
  const error = instances.filter((i) => i.status === "error").length;

  const [eventCounts] = await db
    .select({
      open: sql<number>`count(*) filter (where resolved = false)`,
      critical: sql<number>`count(*) filter (where resolved = false and severity = 'critical')`,
    })
    .from(integrationEvents)
    .where(eq(integrationEvents.organizationId, orgId));

  const [syncCounts] = await db
    .select({
      total: count(),
      failed: sql<number>`count(*) filter (where status = 'failed')`,
    })
    .from(integrationSyncs)
    .where(eq(integrationSyncs.organizationId, orgId));

  const totalEvidence = instances.reduce((s, i) => s + i.totalEvidence, 0);
  const totalRisks = instances.reduce((s, i) => s + i.totalRisks, 0);

  return {
    total: instances.length,
    connected,
    error,
    openEvents: Number(eventCounts?.open ?? 0),
    criticalEvents: Number(eventCounts?.critical ?? 0),
    totalSyncs: Number(syncCounts?.total ?? 0),
    failedSyncs: Number(syncCounts?.failed ?? 0),
    totalEvidence,
    totalRisks,
  };
}
