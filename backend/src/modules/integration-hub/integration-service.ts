import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import * as repo from "@/backend/src/modules/integration-hub/integration-hub-repo";
import { encryptConfig, decryptConfig } from "@/lib/providers/crypto/config-cipher";

// ── Audit logging ─────────────────────────────────────────────────────────────

async function logAudit(orgId: string, userId: string, action: string, entityId?: string) {
  await db
    .insert(auditLogs)
    .values({
      organizationId: orgId,
      actorId: userId,
      action,
      entityType: "integration",
      entityId: entityId ?? null,
      metadata: {},
    })
    .catch(() => {});
}

// ── Connector catalog ─────────────────────────────────────────────────────────

export async function getMarketplace() {
  return repo.getAllConnectors();
}

export async function getConnector(slug: string) {
  return repo.getConnectorBySlug(slug);
}

// ── Connections ───────────────────────────────────────────────────────────────

export async function getConnections(orgId: string) {
  return repo.getInstancesByOrg(orgId);
}

export async function getConnection(orgId: string, instanceId: string) {
  return repo.getInstanceById(orgId, instanceId);
}

export async function connectIntegration(
  orgId: string,
  userId: string,
  registryId: string,
  credentials: Record<string, string>,
  syncFrequency: string = "daily"
) {
  const connector = await repo.getConnectorById(registryId);
  if (!connector) throw new Error("Connector not found");

  const existing = await repo.getInstanceByRegistryId(orgId, registryId);
  if (existing) throw new Error(`${connector.name} is already connected`);

  const instance = await repo.createInstance({
    organizationId: orgId,
    registryId,
    name: connector.name,
    status: "connected",
    syncFrequency: syncFrequency as never,
    connectedAt: new Date(),
    connectedBy: userId,
  });

  // Store encrypted credentials
  const encrypted = encryptConfig(credentials);
  await repo.saveCredentials({
    instanceId: instance.id,
    organizationId: orgId,
    encryptedData: JSON.stringify(encrypted),
  });

  await repo.insertLog({
    instanceId: instance.id,
    organizationId: orgId,
    level: "info",
    message: `Connected to ${connector.name}`,
  });

  await logAudit(orgId, userId, "integration.connected", instance.id);

  return instance;
}

export async function disconnectIntegration(orgId: string, userId: string, instanceId: string) {
  const row = await repo.getInstanceById(orgId, instanceId);
  if (!row) throw new Error("Integration not found");

  await repo.deleteCredentials(instanceId);
  await repo.updateInstance(orgId, instanceId, { status: "disconnected", connectedAt: null });

  await repo.insertLog({
    instanceId,
    organizationId: orgId,
    level: "info",
    message: `Disconnected from ${row.connector.name}`,
  });

  await logAudit(orgId, userId, "integration.disconnected", instanceId);
}

export async function reconnectIntegration(
  orgId: string,
  userId: string,
  instanceId: string,
  credentials: Record<string, string>
) {
  const row = await repo.getInstanceById(orgId, instanceId);
  if (!row) throw new Error("Integration not found");

  const encrypted = encryptConfig(credentials);
  await repo.saveCredentials({
    instanceId,
    organizationId: orgId,
    encryptedData: JSON.stringify(encrypted),
  });

  await repo.updateInstance(orgId, instanceId, {
    status: "connected",
    connectedAt: new Date(),
    connectedBy: userId,
    errorMessage: null,
  });

  await repo.insertLog({
    instanceId,
    organizationId: orgId,
    level: "info",
    message: `Reconnected to ${row.connector.name}`,
  });

  await logAudit(orgId, userId, "integration.reconnected", instanceId);
}

export async function updateSyncFrequency(
  orgId: string,
  userId: string,
  instanceId: string,
  frequency: string
) {
  const updated = await repo.updateInstance(orgId, instanceId, {
    syncFrequency: frequency as never,
  });
  await logAudit(orgId, userId, "integration.sync_frequency_updated", instanceId);
  return updated;
}

// ── Simulate sync (Phase 1 — real connectors would call external APIs) ────────

export async function triggerSync(orgId: string, userId: string, instanceId: string, syncType: "full" | "incremental" = "incremental") {
  const row = await repo.getInstanceById(orgId, instanceId);
  if (!row) throw new Error("Integration not found");
  if (row.instance.status !== "connected") throw new Error("Integration is not connected");

  const sync = await repo.createSync({
    instanceId,
    organizationId: orgId,
    status: "running",
    syncType,
  });

  await logAudit(orgId, userId, "integration.sync_started", instanceId);

  // Simulate sync result — in production this calls the connector's API
  const simulated = simulateSyncResult(row.connector.slug);

  const completed = await repo.updateSync(sync.id, {
    status: "completed",
    completedAt: new Date(),
    recordsFetched: simulated.fetched,
    recordsCreated: simulated.created,
    recordsUpdated: simulated.updated,
    recordsFailed: simulated.failed,
    summary: simulated.summary,
  });

  await repo.updateInstance(orgId, instanceId, {
    lastSyncAt: new Date(),
    totalSynced: (row.instance.totalSynced ?? 0) + simulated.fetched,
    totalEvidence: (row.instance.totalEvidence ?? 0) + simulated.evidenceCount,
    totalRisks: (row.instance.totalRisks ?? 0) + simulated.riskCount,
    totalEvents: (row.instance.totalEvents ?? 0) + simulated.eventCount,
  });

  await repo.insertLog({
    instanceId,
    organizationId: orgId,
    syncId: sync.id,
    level: "info",
    message: `Sync completed — ${simulated.fetched} records processed`,
  });

  // Create sample governance events from sync
  if (simulated.events.length > 0) {
    for (const ev of simulated.events) {
      await repo.insertEvent({
        instanceId,
        organizationId: orgId,
        eventType: ev.type as never,
        title: ev.title,
        description: ev.description,
        severity: ev.severity,
        sourceRef: ev.sourceRef,
      });
    }
  }

  await logAudit(orgId, userId, "integration.sync_completed", instanceId);

  return completed;
}

function simulateSyncResult(slug: string) {
  const seeds: Record<string, { fetched: number; created: number; updated: number; failed: number; evidenceCount: number; riskCount: number; eventCount: number; summary: Record<string, unknown>; events: { type: string; title: string; description: string; severity: string; sourceRef: string }[] }> = {
    "microsoft-entra-id": {
      fetched: 142, created: 12, updated: 130, failed: 0, evidenceCount: 3, riskCount: 1, eventCount: 2,
      summary: { users_synced: 142, mfa_enabled: 128, inactive_users: 14 },
      events: [
        { type: "risk_created", title: "14 inactive users detected in Entra ID", description: "14 user accounts have not signed in for >90 days and should be reviewed.", severity: "medium", sourceRef: "entra/inactive-users" },
        { type: "control_failed", title: "MFA not enforced for 14 users", description: "14 users (9.9%) do not have MFA enabled. Control CC-MFA-01 requires 100% MFA coverage.", severity: "high", sourceRef: "entra/mfa-gap" },
      ],
    },
    "okta": {
      fetched: 98, created: 5, updated: 93, failed: 0, evidenceCount: 4, riskCount: 1, eventCount: 1,
      summary: { users_synced: 98, mfa_coverage: "97%", access_reviews: 3 },
      events: [
        { type: "risk_created", title: "3 pending access reviews overdue in Okta", description: "3 access certification campaigns are past their review deadline.", severity: "medium", sourceRef: "okta/access-reviews" },
      ],
    },
    "aws": {
      fetched: 87, created: 0, updated: 87, failed: 0, evidenceCount: 6, riskCount: 2, eventCount: 3,
      summary: { services_scanned: 87, encryption_compliant: 82, mfa_root: true, cloudtrail_enabled: true },
      events: [
        { type: "misconfiguration_detected", title: "5 S3 buckets missing encryption", description: "5 S3 buckets do not have server-side encryption enabled.", severity: "high", sourceRef: "aws/s3/encryption" },
        { type: "risk_created", title: "Root account MFA status requires verification", description: "AWS root account MFA state could not be verified via API — manual check required.", severity: "medium", sourceRef: "aws/root-mfa" },
        { type: "evidence_updated", title: "CloudTrail logging confirmed enabled", description: "AWS CloudTrail is active in all regions. Evidence collected for audit.", severity: "low", sourceRef: "aws/cloudtrail" },
      ],
    },
    "github": {
      fetched: 63, created: 3, updated: 60, failed: 0, evidenceCount: 5, riskCount: 1, eventCount: 2,
      summary: { repos_scanned: 63, branch_protection: 58, secret_scanning: true, "2fa_enforced": true },
      events: [
        { type: "risk_created", title: "5 repositories missing branch protection", description: "5 GitHub repositories do not have branch protection rules enabled on main/master.", severity: "medium", sourceRef: "github/branch-protection" },
        { type: "evidence_updated", title: "2FA enforced at GitHub organization level", description: "Two-factor authentication is enforced for all organization members.", severity: "low", sourceRef: "github/2fa" },
      ],
    },
    "crowdstrike": {
      fetched: 204, created: 18, updated: 186, failed: 0, evidenceCount: 2, riskCount: 3, eventCount: 4,
      summary: { endpoints: 204, critical_detections: 2, high_detections: 16, policy_compliant: 198 },
      events: [
        { type: "risk_created", title: "2 critical endpoint detections active", description: "CrowdStrike Falcon has 2 active critical severity detections requiring immediate response.", severity: "critical", sourceRef: "crowdstrike/detections" },
        { type: "risk_created", title: "16 high severity endpoint threats", description: "16 high severity detections active across managed endpoints.", severity: "high", sourceRef: "crowdstrike/detections/high" },
        { type: "control_failed", title: "6 endpoints not policy-compliant", description: "6 endpoints do not meet CrowdStrike prevention policy requirements.", severity: "medium", sourceRef: "crowdstrike/policy" },
        { type: "evidence_updated", title: "EDR coverage confirmed: 204 endpoints", description: "CrowdStrike Falcon deployed and active on all 204 managed endpoints.", severity: "low", sourceRef: "crowdstrike/coverage" },
      ],
    },
    "jira": {
      fetched: 312, created: 24, updated: 288, failed: 0, evidenceCount: 1, riskCount: 1, eventCount: 1,
      summary: { issues_synced: 312, security_tickets: 24, overdue: 18 },
      events: [
        { type: "risk_created", title: "18 overdue security tickets in Jira", description: "18 Jira issues tagged as security are past their due date.", severity: "medium", sourceRef: "jira/overdue" },
      ],
    },
    "slack": {
      fetched: 45, created: 0, updated: 45, failed: 0, evidenceCount: 0, riskCount: 0, eventCount: 1,
      summary: { workspaces: 1, channels_mapped: 3, notifications_sent: 45 },
      events: [
        { type: "sync_completed", title: "Slack notification channels verified", description: "Governance alert channels confirmed active: #security-alerts, #compliance, #governance.", severity: "low", sourceRef: "slack/channels" },
      ],
    },
    "microsoft-defender": {
      fetched: 156, created: 8, updated: 148, failed: 0, evidenceCount: 3, riskCount: 2, eventCount: 3,
      summary: { alerts_synced: 156, secure_score: 78, critical_alerts: 8 },
      events: [
        { type: "risk_created", title: "8 critical Microsoft Defender alerts", description: "8 critical severity security alerts active in Microsoft Defender.", severity: "critical", sourceRef: "defender/alerts" },
        { type: "misconfiguration_detected", title: "Secure Score below threshold: 78/100", description: "Microsoft Secure Score is 78 — below the recommended threshold of 85.", severity: "high", sourceRef: "defender/secure-score" },
        { type: "evidence_updated", title: "Defender coverage report collected", description: "Microsoft Defender coverage and configuration evidence updated.", severity: "low", sourceRef: "defender/coverage" },
      ],
    },
  };

  return seeds[slug] ?? {
    fetched: 42, created: 4, updated: 38, failed: 0, evidenceCount: 1, riskCount: 0, eventCount: 1,
    summary: { records_synced: 42 },
    events: [{ type: "sync_completed", title: `Sync completed for ${slug}`, description: "Integration sync completed successfully.", severity: "low", sourceRef: slug }],
  };
}

// ── Events ────────────────────────────────────────────────────────────────────

export async function getEvents(orgId: string, resolved?: boolean) {
  return repo.getEventsByOrg(orgId, resolved);
}

export async function resolveEvent(orgId: string, userId: string, eventId: string) {
  await repo.resolveEvent(orgId, eventId);
  await logAudit(orgId, userId, "integration.event_resolved", eventId);
}

// ── Syncs ─────────────────────────────────────────────────────────────────────

export async function getSyncs(orgId: string) {
  return repo.getSyncsByOrg(orgId);
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export async function getWebhooks(orgId: string) {
  return repo.getWebhooksByOrg(orgId);
}

export async function createWebhook(orgId: string, userId: string, data: { name: string; direction: "inbound" | "outbound"; url?: string; eventTypes: string[] }) {
  const wh = await repo.createWebhook({
    organizationId: orgId,
    name: data.name,
    direction: data.direction,
    url: data.url,
    eventTypes: data.eventTypes,
    createdBy: userId,
  });
  await logAudit(orgId, userId, "integration.webhook_created", wh.id);
  return wh;
}

export async function deleteWebhook(orgId: string, userId: string, webhookId: string) {
  await repo.deleteWebhook(orgId, webhookId);
  await logAudit(orgId, userId, "integration.webhook_deleted", webhookId);
}

export async function toggleWebhook(orgId: string, userId: string, webhookId: string, isActive: boolean) {
  const wh = await repo.updateWebhook(orgId, webhookId, { isActive });
  await logAudit(orgId, userId, "integration.webhook_toggled", webhookId);
  return wh;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardData(orgId: string) {
  const [metrics, connections, recentSyncs, openEvents] = await Promise.all([
    repo.getDashboardMetrics(orgId),
    repo.getInstancesByOrg(orgId),
    repo.getSyncsByOrg(orgId, 10),
    repo.getEventsByOrg(orgId, false, 5),
  ]);
  return { metrics, connections, recentSyncs, openEvents };
}
