import * as repo from "@/backend/src/modules/security-command-center/security-command-center-repo";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardData(orgId: string) {
  const [metrics, monAlerts, sessions, prompts] = await Promise.all([
    repo.getDashboardMetrics(orgId),
    repo.getMonitoringAlerts(orgId, "open"),
    repo.getActiveSessions(orgId),
    repo.getPromptStats(orgId),
  ]);
  return { metrics, monAlerts, sessions, prompts: (prompts as unknown[])[0] };
}

// ─── MFA ─────────────────────────────────────────────────────────────────────

export async function getMfaOverview(orgId: string) {
  const [settings, users] = await Promise.all([
    repo.getMfaSettings(orgId),
    repo.getMfaUserStatus(orgId),
  ]);
  return { settings, users };
}

export async function updateMfaSettings(orgId: string, userId: string, data: {
  enforcementMode?: string; allowRememberDevice?: boolean;
  rememberDays?: number; requireOnNewDevice?: boolean;
}) {
  await repo.upsertMfaSettings(orgId, { ...data, updatedBy: userId });
}

// ─── SSO ─────────────────────────────────────────────────────────────────────

export async function getSsoOverview(orgId: string) {
  const [providers, domains] = await Promise.all([
    repo.getSsoProviders(orgId),
    repo.getSsoDomains(orgId),
  ]);
  return { providers, domains };
}

export async function createSsoProvider(orgId: string, userId: string, data: {
  name: string; providerType: string;
  samlMetadataUrl?: string; samlEntityId?: string; samlAcsUrl?: string;
  oidcClientId?: string; oidcIssuerUrl?: string; oidcScopes?: string;
  jitEnabled?: boolean; defaultRole?: string;
}) {
  return repo.insertSsoProvider({ organizationId: orgId, createdBy: userId, ...data });
}

export async function toggleSso(orgId: string, id: string, enabled: boolean) {
  await repo.toggleSsoProvider(orgId, id, enabled);
}

export async function deleteSso(orgId: string, id: string) {
  await repo.deleteSsoProvider(orgId, id);
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function getSessionOverview(orgId: string) {
  return repo.getActiveSessions(orgId);
}

export async function revokeSession(orgId: string, sessionId: string, userId: string) {
  await repo.revokeSession(orgId, sessionId, userId);
}

export async function revokeAllUserSessions(orgId: string, targetUserId: string, revokedBy: string) {
  await repo.revokeAllSessions(orgId, targetUserId, revokedBy);
}

// ─── IP Allow Lists ───────────────────────────────────────────────────────────

export async function getAccessControl(orgId: string) {
  const [allowlists, perms, rolePerms] = await Promise.all([
    repo.getIpAllowlists(orgId),
    repo.getAllPermissions(),
    repo.getRolePermissions(orgId),
  ]);
  return { allowlists, permissions: perms, rolePermissions: rolePerms };
}

export async function addIpRule(orgId: string, userId: string, data: {
  cidrRange: string; description: string; appliesTo?: string;
}) {
  return repo.insertIpAllowlist({ organizationId: orgId, createdBy: userId, ...data });
}

export async function deleteIpRule(orgId: string, id: string) {
  await repo.deleteIpAllowlist(orgId, id);
}

export async function toggleIpRule(orgId: string, id: string, enabled: boolean) {
  await repo.toggleIpAllowlist(orgId, id, enabled);
}

// ─── Evidence Security ────────────────────────────────────────────────────────

export async function getEvidenceSecurityOverview(orgId: string) {
  const [shares, accessLogs] = await Promise.all([
    repo.getEvidenceShares(orgId),
    repo.getEvidenceAccessLogs(orgId),
  ]);
  return { shares, accessLogs };
}

export async function createEvidenceShare(orgId: string, userId: string, data: {
  evidenceId?: string; recipientEmail?: string; recipientName?: string;
  accessLevel?: string; watermark?: boolean; expiryDays?: number;
}) {
  const crypto = await import("crypto");
  const shareToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + (data.expiryDays ?? 7) * 86_400_000);
  return repo.insertEvidenceShare({
    organizationId: orgId, createdBy: userId, shareToken,
    evidenceId: data.evidenceId, recipientEmail: data.recipientEmail,
    recipientName: data.recipientName, accessLevel: data.accessLevel,
    watermark: data.watermark, expiresAt,
  });
}

export async function revokeShare(orgId: string, id: string) {
  await repo.revokeEvidenceShare(orgId, id);
}

// ─── AI Security ─────────────────────────────────────────────────────────────

export async function getAiSecurityOverview(orgId: string) {
  const [stats, logs] = await Promise.all([
    repo.getPromptStats(orgId),
    repo.getPromptLogs(orgId),
  ]);
  return { stats: (stats as unknown[])[0], logs };
}

export async function getAiSensitiveLogs(orgId: string) {
  return repo.getPromptLogs(orgId, { sensitive: true, limit: 50 });
}

// ─── Encryption ───────────────────────────────────────────────────────────────

export async function getEncryptionOverview(orgId: string) {
  const [providers, auditLog] = await Promise.all([
    repo.getEncryptionProviders(orgId),
    repo.getEncryptionAuditLog(orgId),
  ]);
  const activeCmk = providers.find(p => p.isActive && p.providerType !== "platform");
  return { providers, auditLog, activeCmk: activeCmk ?? null };
}

export async function addEncryptionProvider(orgId: string, userId: string, data: {
  name: string; providerType: string;
  awsRegion?: string; awsKeyId?: string;
  azureVaultUrl?: string; azureTenantId?: string;
  gcpProject?: string; gcpLocation?: string; gcpKeyRing?: string; gcpCryptoKey?: string;
}) {
  return repo.insertEncryptionProvider({ organizationId: orgId, createdBy: userId, ...data });
}

export async function removeEncryptionProvider(orgId: string, id: string) {
  await repo.deleteEncryptionProvider(orgId, id);
}

// ─── Trust Center ─────────────────────────────────────────────────────────────

export async function getTrustCenterOverview(orgId: string) {
  const [config, docs] = await Promise.all([
    repo.getTrustCenterConfig(orgId),
    repo.getTrustCenterDocuments(orgId),
  ]);
  return { config, documents: docs };
}

export async function updateTrustCenterConfig(orgId: string, data: Record<string, unknown>) {
  await repo.upsertTrustCenterConfig(orgId, data);
}

// ─── Vendor Monitoring ────────────────────────────────────────────────────────

export async function getMonitoringOverview(orgId: string) {
  const [assets, alerts] = await Promise.all([
    repo.getMonitoringAssets(orgId),
    repo.getMonitoringAlerts(orgId),
  ]);
  return { assets, alerts };
}

export async function addMonitoringAsset(orgId: string, userId: string, data: {
  vendorId?: string; assetType: string; assetValue: string; checkInterval?: string;
}) {
  return repo.insertMonitoringAsset({ organizationId: orgId, createdBy: userId, ...data });
}

export async function acknowledgeAlert(orgId: string, id: string, userId: string) {
  await repo.acknowledgeMonitoringAlert(orgId, id, userId);
}

export async function resolveAlert(orgId: string, id: string) {
  await repo.resolveMonitoringAlert(orgId, id);
}

// ─── Security Readiness Score ─────────────────────────────────────────────────

export function computeSecurityReadiness(metrics: {
  mfaPercent: number; ssoActive: number; ipRules: number;
  openMonAlerts: number; criticalMonAlerts: number; blockedPrompts: number;
}): { score: number; level: string; breakdown: Record<string, number> } {
  const mfaScore   = Math.min(100, metrics.mfaPercent);
  const ssoScore   = metrics.ssoActive > 0 ? 100 : 0;
  const ipScore    = metrics.ipRules > 0 ? 80 : 40;
  const monScore   = metrics.criticalMonAlerts > 0 ? 20 : metrics.openMonAlerts > 3 ? 60 : 100;
  const aiScore    = metrics.blockedPrompts > 10 ? 60 : 100;

  const score = Math.round(
    mfaScore * 0.30 + ssoScore * 0.20 + ipScore * 0.15 + monScore * 0.20 + aiScore * 0.15
  );

  const level =
    score >= 90 ? "Enterprise Ready" :
    score >= 75 ? "Strong" :
    score >= 60 ? "Moderate" :
    score >= 40 ? "Needs Attention" : "Critical";

  return { score, level, breakdown: { mfaScore, ssoScore, ipScore, monScore, aiScore } };
}
