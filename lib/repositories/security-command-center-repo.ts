import { db } from "@/lib/db";
import { sql, eq, and, desc, count } from "drizzle-orm";
import { pgTable, uuid, text, boolean, integer, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";

// â”€â”€â”€ Inline table defs (migration 0033) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const mfaEnforcementEnum = pgEnum("mfa_enforcement_enum", ["optional", "required_admins", "required_all"]);
export const sessionStatusEnum   = pgEnum("session_status_enum",   ["active", "expired", "revoked"]);
export const aiPromptSensEnum    = pgEnum("ai_prompt_sensitivity_enum", ["clean", "low", "medium", "high", "blocked"]);
export const vendorMonSevEnum    = pgEnum("vendor_monitor_severity_enum", ["info", "low", "medium", "high", "critical"]);

export const securityMfaSettings = pgTable("security_mfa_settings", {
  id:                      uuid("id").primaryKey().defaultRandom(),
  organizationId:          uuid("organization_id").notNull(),
  enforcementMode:         text("enforcement_mode").notNull().default("optional"),
  allowRememberDevice:     boolean("allow_remember_device").notNull().default(true),
  rememberDays:            integer("remember_days").notNull().default(30),
  requireOnNewDevice:      boolean("require_on_new_device").notNull().default(true),
  // Session governance (migration 0035)
  idleTimeoutMinutes:      integer("idle_timeout_minutes").notNull().default(60),
  absoluteTimeoutHours:    integer("absolute_timeout_hours").notNull().default(8),
  maxConcurrentSessions:   integer("max_concurrent_sessions").notNull().default(5),
  updatedBy:               uuid("updated_by"),
  createdAt:               timestamp("created_at").notNull().defaultNow(),
  updatedAt:               timestamp("updated_at").notNull().defaultNow(),
});

export const userMfaStatus = pgTable("user_mfa_status", {
  id:                          uuid("id").primaryKey().defaultRandom(),
  userId:                      uuid("user_id").notNull(),
  organizationId:              uuid("organization_id").notNull(),
  enabled:                     boolean("enabled").notNull().default(false),
  method:                      text("method"),
  enabledAt:                   timestamp("enabled_at"),
  lastVerifiedAt:              timestamp("last_verified_at"),
  // TOTP fields (migration 0035)
  totpSecret:                  text("totp_secret"),   // AES-encrypted
  recoveryCodes:               text("recovery_codes").array(),
  recoveryCodesGeneratedAt:    timestamp("recovery_codes_generated_at"),
  createdAt:                   timestamp("created_at").notNull().defaultNow(),
});

export const ssoProviders = pgTable("sso_providers", {
  id:               uuid("id").primaryKey().defaultRandom(),
  organizationId:   uuid("organization_id").notNull(),
  name:             text("name").notNull(),
  providerType:     text("provider_type").notNull(),
  enabled:          boolean("enabled").notNull().default(false),
  samlMetadataUrl:  text("saml_metadata_url"),
  samlEntityId:     text("saml_entity_id"),
  samlAcsUrl:       text("saml_acs_url"),
  oidcClientId:     text("oidc_client_id"),
  oidcIssuerUrl:    text("oidc_issuer_url"),
  oidcScopes:       text("oidc_scopes"),
  jitEnabled:       boolean("jit_enabled").notNull().default(true),
  defaultRole:      text("default_role").notNull().default("member"),
  forceRedirect:    boolean("force_redirect").notNull().default(false),
  createdBy:        uuid("created_by"),
  createdAt:        timestamp("created_at").notNull().defaultNow(),
  updatedAt:        timestamp("updated_at").notNull().defaultNow(),
});

export const ssoDomains = pgTable("sso_domains", {
  id:              uuid("id").primaryKey().defaultRandom(),
  organizationId:  uuid("organization_id").notNull(),
  ssoProviderId:   uuid("sso_provider_id").notNull(),
  domain:          text("domain").notNull(),
  verified:        boolean("verified").notNull().default(false),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id:              uuid("id").primaryKey().defaultRandom(),
  userId:          uuid("user_id").notNull(),
  organizationId:  uuid("organization_id").notNull(),
  ipAddress:       text("ip_address"),
  userAgent:       text("user_agent"),
  browser:         text("browser"),
  device:          text("device"),
  os:              text("os"),
  country:         text("country"),
  city:            text("city"),
  status:          text("status").notNull().default("active"),
  mfaVerified:     boolean("mfa_verified").notNull().default(false),
  lastActive:      timestamp("last_active").notNull().defaultNow(),
  expiresAt:       timestamp("expires_at"),
  revokedAt:       timestamp("revoked_at"),
  revokedBy:       uuid("revoked_by"),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
});

export const ipAllowlists = pgTable("ip_allowlists", {
  id:              uuid("id").primaryKey().defaultRandom(),
  organizationId:  uuid("organization_id").notNull(),
  cidrRange:       text("cidr_range").notNull(),
  description:     text("description").notNull(),
  appliesTo:       text("applies_to").notNull().default("all"),
  enabled:         boolean("enabled").notNull().default(true),
  createdBy:       uuid("created_by"),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
  updatedAt:       timestamp("updated_at").notNull().defaultNow(),
});

export const securityPermissions = pgTable("security_permissions", {
  id:          uuid("id").primaryKey().defaultRandom(),
  key:         text("key").notNull(),
  module:      text("module").notNull(),
  action:      text("action").notNull(),
  description: text("description"),
  isBuiltin:   boolean("is_builtin").notNull().default(true),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
});

export const securityRolePermissions = pgTable("security_role_permissions", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  role:           text("role").notNull(),
  permissionKey:  text("permission_key").notNull(),
  granted:        boolean("granted").notNull().default(true),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

export const securityUserPermissions = pgTable("security_user_permissions", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  userId:         uuid("user_id").notNull(),
  permissionKey:  text("permission_key").notNull(),
  granted:        boolean("granted").notNull().default(true),
  grantedBy:      uuid("granted_by"),
  expiresAt:      timestamp("expires_at"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

export const evidenceShares = pgTable("evidence_shares", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  evidenceId:     uuid("evidence_id"),
  createdBy:      uuid("created_by").notNull(),
  shareToken:     text("share_token").notNull(),
  recipientEmail: text("recipient_email"),
  recipientName:  text("recipient_name"),
  accessLevel:    text("access_level").notNull().default("view_only"),
  watermark:      boolean("watermark").notNull().default(true),
  expiresAt:      timestamp("expires_at").notNull(),
  revoked:        boolean("revoked").notNull().default(false),
  revokedAt:      timestamp("revoked_at"),
  viewCount:      integer("view_count").notNull().default(0),
  lastAccessed:   timestamp("last_accessed"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

export const evidenceAccessLogs = pgTable("evidence_access_logs", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  evidenceId:     uuid("evidence_id"),
  shareId:        uuid("share_id"),
  accessedBy:     uuid("accessed_by"),
  ipAddress:      text("ip_address"),
  userAgent:      text("user_agent"),
  action:         text("action").notNull(),
  metadata:       jsonb("metadata"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

export const aiPromptLogs = pgTable("ai_prompt_logs", {
  id:              uuid("id").primaryKey().defaultRandom(),
  organizationId:  uuid("organization_id").notNull(),
  userId:          uuid("user_id"),
  module:          text("module"),
  agentType:       text("agent_type"),
  promptPreview:   text("prompt_preview"),
  responsePreview: text("response_preview"),
  model:           text("model"),
  inputTokens:     integer("input_tokens").notNull().default(0),
  outputTokens:    integer("output_tokens").notNull().default(0),
  latencyMs:       integer("latency_ms"),
  sensitivity:     text("sensitivity").notNull().default("clean"),
  detectedPiiTypes: text("detected_pii_types").array(),
  blocked:         boolean("blocked").notNull().default(false),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
});

export const encryptionProviders = pgTable("encryption_providers", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  name:           text("name").notNull(),
  providerType:   text("provider_type").notNull().default("platform"),
  enabled:        boolean("enabled").notNull().default(false),
  isActive:       boolean("is_active").notNull().default(false),
  awsRegion:      text("aws_region"),
  awsKeyId:       text("aws_key_id"),
  azureVaultUrl:  text("azure_vault_url"),
  azureTenantId:  text("azure_tenant_id"),
  gcpProject:     text("gcp_project"),
  gcpLocation:    text("gcp_location"),
  gcpKeyRing:     text("gcp_key_ring"),
  gcpCryptoKey:   text("gcp_crypto_key"),
  lastTested:     timestamp("last_tested"),
  testStatus:     text("test_status"),
  createdBy:      uuid("created_by"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
  updatedAt:      timestamp("updated_at").notNull().defaultNow(),
});

export const customerKeys = pgTable("customer_keys", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  providerId:     uuid("provider_id").notNull(),
  keyAlias:       text("key_alias").notNull(),
  keyArn:         text("key_arn"),
  keyVersion:     text("key_version"),
  purpose:        text("purpose").notNull().default("data_encryption"),
  status:         text("status").notNull().default("active"),
  rotatedAt:      timestamp("rotated_at"),
  nextRotation:   timestamp("next_rotation"),
  createdBy:      uuid("created_by"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

export const encryptionAuditLogs = pgTable("encryption_audit_logs", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  providerId:     uuid("provider_id"),
  keyId:          uuid("key_id"),
  userId:         uuid("user_id"),
  action:         text("action").notNull(),
  resourceType:   text("resource_type"),
  resourceId:     uuid("resource_id"),
  metadata:       jsonb("metadata"),
  ipAddress:      text("ip_address"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

export const trustCenterConfig = pgTable("trust_center_config", {
  id:                  uuid("id").primaryKey().defaultRandom(),
  organizationId:      uuid("organization_id").notNull(),
  enabled:             boolean("enabled").notNull().default(false),
  slug:                text("slug"),
  title:               text("title"),
  tagline:             text("tagline"),
  description:         text("description"),
  logoUrl:             text("logo_url"),
  primaryColor:        text("primary_color"),
  securityEmail:       text("security_email"),
  statusPageUrl:       text("status_page_url"),
  showTrustScore:      boolean("show_trust_score").notNull().default(true),
  showCertifications:  boolean("show_certifications").notNull().default(true),
  showDocuments:       boolean("show_documents").notNull().default(true),
  showStatus:          boolean("show_status").notNull().default(true),
  customDomain:        text("custom_domain"),
  publishedAt:         timestamp("published_at"),
  createdAt:           timestamp("created_at").notNull().defaultNow(),
  updatedAt:           timestamp("updated_at").notNull().defaultNow(),
});

export const trustCenterDocuments = pgTable("trust_center_documents", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  configId:       uuid("config_id").notNull(),
  title:          text("title").notNull(),
  description:    text("description"),
  category:       text("category").notNull().default("security"),
  fileUrl:        text("file_url"),
  isPublic:       boolean("is_public").notNull().default(true),
  displayOrder:   integer("display_order").notNull().default(0),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

export const vendorMonitoringAssets = pgTable("vendor_monitoring_assets", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  vendorId:       uuid("vendor_id"),
  assetType:      text("asset_type").notNull().default("domain"),
  assetValue:     text("asset_value").notNull(),
  enabled:        boolean("enabled").notNull().default(true),
  lastChecked:    timestamp("last_checked"),
  nextCheck:      timestamp("next_check"),
  checkInterval:  text("check_interval").notNull().default("daily"),
  createdBy:      uuid("created_by"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

export const vendorMonitoringEvents = pgTable("vendor_monitoring_events", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  assetId:        uuid("asset_id").notNull(),
  vendorId:       uuid("vendor_id"),
  checkType:      text("check_type").notNull(),
  status:         text("status").notNull(),
  details:        jsonb("details"),
  checkedAt:      timestamp("checked_at").notNull().defaultNow(),
});

export const vendorMonitoringAlerts = pgTable("vendor_monitoring_alerts", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  vendorId:       uuid("vendor_id"),
  assetId:        uuid("asset_id"),
  eventId:        uuid("event_id"),
  title:          text("title").notNull(),
  description:    text("description"),
  severity:       text("severity").notNull().default("medium"),
  status:         text("status").notNull().default("open"),
  acknowledgedBy: uuid("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt:     timestamp("resolved_at"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

// â”€â”€â”€ Dashboard metrics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getDashboardMetrics(orgId: string) {
  const [mfaRow, ssoRow, sessionRow, ipRow, promptRow, shareRow, monRow] = await Promise.all([
    db.execute(sql`
      SELECT
        COUNT(u.id) FILTER (WHERE u.enabled = TRUE)::int AS mfa_enabled,
        COUNT(u.id)::int AS total_users,
        COALESCE(s.enforcement_mode, 'optional') AS enforcement_mode
      FROM memberships m
      LEFT JOIN user_mfa_status u ON u.user_id = m.user_id AND u.organization_id = ${orgId}::uuid
      LEFT JOIN security_mfa_settings s ON s.organization_id = ${orgId}::uuid
      WHERE m.organization_id = ${orgId}::uuid AND m.is_active = TRUE
    `),
    db.execute(sql`SELECT COUNT(*)::int AS cnt FROM sso_providers WHERE organization_id = ${orgId}::uuid AND enabled = TRUE`),
    db.execute(sql`SELECT COUNT(*)::int AS cnt FROM user_sessions WHERE organization_id = ${orgId}::uuid AND status = 'active'`),
    db.execute(sql`SELECT COUNT(*)::int AS cnt FROM ip_allowlists WHERE organization_id = ${orgId}::uuid AND enabled = TRUE`),
    db.execute(sql`
      SELECT
        COUNT(*)::int AS total_prompts,
        COUNT(*) FILTER (WHERE sensitivity != 'clean')::int AS sensitive_prompts,
        COUNT(*) FILTER (WHERE blocked = TRUE)::int AS blocked_prompts,
        COALESCE(SUM(input_tokens + output_tokens), 0)::int AS total_tokens
      FROM ai_prompt_logs
      WHERE organization_id = ${orgId}::uuid AND created_at >= NOW() - INTERVAL '30 days'
    `),
    db.execute(sql`SELECT COUNT(*)::int AS cnt FROM evidence_shares WHERE organization_id = ${orgId}::uuid AND revoked = FALSE AND expires_at > NOW()`),
    db.execute(sql`
      SELECT
        COUNT(*)::int AS total_alerts,
        COUNT(*) FILTER (WHERE status = 'open')::int AS open_alerts,
        COUNT(*) FILTER (WHERE severity IN ('high','critical') AND status = 'open')::int AS critical_alerts
      FROM vendor_monitoring_alerts WHERE organization_id = ${orgId}::uuid
    `),
  ]);

  const mfa    = (mfaRow[0] ?? {}) as Record<string, unknown>;
  const mon    = (monRow[0] ?? {}) as Record<string, unknown>;
  const prompt = (promptRow[0] ?? {}) as Record<string, unknown>;

  return {
    mfaEnabled:        Number(mfa.mfa_enabled ?? 0),
    mfaTotal:          Number(mfa.total_users ?? 0),
    mfaEnforcement:    String(mfa.enforcement_mode ?? "optional"),
    mfaPercent:        mfa.total_users ? Math.round((Number(mfa.mfa_enabled) / Number(mfa.total_users)) * 100) : 0,
    ssoActive:         Number((ssoRow[0] as Record<string, unknown>)?.cnt ?? 0),
    activeSessions:    Number((sessionRow[0] as Record<string, unknown>)?.cnt ?? 0),
    ipRules:           Number((ipRow[0] as Record<string, unknown>)?.cnt ?? 0),
    activeShares:      Number((shareRow[0] as Record<string, unknown>)?.cnt ?? 0),
    totalPrompts:      Number(prompt.total_prompts ?? 0),
    sensitivePrompts:  Number(prompt.sensitive_prompts ?? 0),
    blockedPrompts:    Number(prompt.blocked_prompts ?? 0),
    totalTokens:       Number(prompt.total_tokens ?? 0),
    monitoringAlerts:  Number(mon.total_alerts ?? 0),
    openMonAlerts:     Number(mon.open_alerts ?? 0),
    criticalMonAlerts: Number(mon.critical_alerts ?? 0),
  };
}

// â”€â”€â”€ MFA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getMfaSettings(orgId: string) {
  const rows = await db.select().from(securityMfaSettings)
    .where(eq(securityMfaSettings.organizationId, orgId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertMfaSettings(orgId: string, data: {
  enforcementMode?: string; allowRememberDevice?: boolean;
  rememberDays?: number; requireOnNewDevice?: boolean; updatedBy?: string;
}) {
  await db.execute(sql`
    INSERT INTO security_mfa_settings (organization_id, enforcement_mode, allow_remember_device, remember_days, require_on_new_device, updated_by)
    VALUES (${orgId}::uuid, ${data.enforcementMode ?? "optional"}, ${data.allowRememberDevice ?? true}, ${data.rememberDays ?? 30}, ${data.requireOnNewDevice ?? true}, ${data.updatedBy ?? null}::uuid)
    ON CONFLICT (organization_id) DO UPDATE SET
      enforcement_mode = EXCLUDED.enforcement_mode,
      allow_remember_device = EXCLUDED.allow_remember_device,
      remember_days = EXCLUDED.remember_days,
      require_on_new_device = EXCLUDED.require_on_new_device,
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW()
  `);
}

export async function getMfaUserStatus(orgId: string) {
  return db.execute(sql`
    SELECT p.id, p.full_name, p.email,
      COALESCE(u.enabled, FALSE) AS mfa_enabled,
      u.enabled_at, u.last_verified_at
    FROM memberships m
    JOIN profiles p ON p.id = m.user_id
    LEFT JOIN user_mfa_status u ON u.user_id = m.user_id AND u.organization_id = ${orgId}::uuid
    WHERE m.organization_id = ${orgId}::uuid AND m.is_active = TRUE
    ORDER BY p.full_name
  `);
}

// â”€â”€â”€ SSO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getSsoProviders(orgId: string) {
  return db.select().from(ssoProviders)
    .where(eq(ssoProviders.organizationId, orgId))
    .orderBy(desc(ssoProviders.createdAt));
}

export async function getSsoDomains(orgId: string) {
  return db.select().from(ssoDomains)
    .where(eq(ssoDomains.organizationId, orgId));
}

export async function insertSsoProvider(data: {
  organizationId: string; name: string; providerType: string;
  samlMetadataUrl?: string; samlEntityId?: string; samlAcsUrl?: string;
  oidcClientId?: string; oidcIssuerUrl?: string; oidcScopes?: string;
  jitEnabled?: boolean; defaultRole?: string; createdBy?: string;
}) {
  const rows = await db.insert(ssoProviders).values({
    organizationId: data.organizationId, name: data.name,
    providerType: data.providerType,
    samlMetadataUrl: data.samlMetadataUrl, samlEntityId: data.samlEntityId,
    samlAcsUrl: data.samlAcsUrl, oidcClientId: data.oidcClientId,
    oidcIssuerUrl: data.oidcIssuerUrl, oidcScopes: data.oidcScopes,
    jitEnabled: data.jitEnabled ?? true, defaultRole: data.defaultRole ?? "member",
    createdBy: data.createdBy,
  }).returning();
  return rows[0];
}

export async function toggleSsoProvider(orgId: string, id: string, enabled: boolean) {
  await db.update(ssoProviders).set({ enabled, updatedAt: new Date() })
    .where(and(eq(ssoProviders.id, id), eq(ssoProviders.organizationId, orgId)));
}

export async function deleteSsoProvider(orgId: string, id: string) {
  await db.delete(ssoProviders)
    .where(and(eq(ssoProviders.id, id), eq(ssoProviders.organizationId, orgId)));
}

// â”€â”€â”€ Sessions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getActiveSessions(orgId: string, userId?: string) {
  return db.execute(sql`
    SELECT s.*, p.full_name, p.email
    FROM user_sessions s
    JOIN profiles p ON p.id = s.user_id
    WHERE s.organization_id = ${orgId}::uuid AND s.status = 'active'
    ${userId ? sql`AND s.user_id = ${userId}::uuid` : sql``}
    ORDER BY s.last_active DESC
    LIMIT 100
  `);
}

export async function revokeSession(orgId: string, sessionId: string, revokedBy: string) {
  await db.update(userSessions).set({ status: "revoked", revokedAt: new Date(), revokedBy })
    .where(and(eq(userSessions.id, sessionId), eq(userSessions.organizationId, orgId)));
}

export async function revokeAllSessions(orgId: string, userId: string, revokedBy: string) {
  await db.update(userSessions).set({ status: "revoked", revokedAt: new Date(), revokedBy })
    .where(and(
      eq(userSessions.organizationId, orgId),
      eq(userSessions.userId, userId),
      eq(userSessions.status, "active"),
    ));
}

// â”€â”€â”€ IP Allow Lists â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getIpAllowlists(orgId: string) {
  return db.select().from(ipAllowlists)
    .where(eq(ipAllowlists.organizationId, orgId))
    .orderBy(desc(ipAllowlists.createdAt));
}

export async function insertIpAllowlist(data: {
  organizationId: string; cidrRange: string; description: string;
  appliesTo?: string; createdBy?: string;
}) {
  const rows = await db.insert(ipAllowlists).values({
    organizationId: data.organizationId, cidrRange: data.cidrRange,
    description: data.description, appliesTo: data.appliesTo ?? "all",
    createdBy: data.createdBy,
  }).returning();
  return rows[0];
}

export async function deleteIpAllowlist(orgId: string, id: string) {
  await db.delete(ipAllowlists)
    .where(and(eq(ipAllowlists.id, id), eq(ipAllowlists.organizationId, orgId)));
}

export async function toggleIpAllowlist(orgId: string, id: string, enabled: boolean) {
  await db.update(ipAllowlists).set({ enabled, updatedAt: new Date() })
    .where(and(eq(ipAllowlists.id, id), eq(ipAllowlists.organizationId, orgId)));
}

// â”€â”€â”€ Permissions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getAllPermissions() {
  return db.select().from(securityPermissions)
    .orderBy(securityPermissions.module, securityPermissions.action);
}

export async function getRolePermissions(orgId: string) {
  return db.select().from(securityRolePermissions)
    .where(eq(securityRolePermissions.organizationId, orgId));
}

export async function upsertRolePermission(orgId: string, role: string, permissionKey: string, granted: boolean) {
  await db.execute(sql`
    INSERT INTO security_role_permissions (organization_id, role, permission_key, granted)
    VALUES (${orgId}::uuid, ${role}, ${permissionKey}, ${granted})
    ON CONFLICT (organization_id, role, permission_key) DO UPDATE SET granted = EXCLUDED.granted
  `);
}

// â”€â”€â”€ Evidence Shares â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getEvidenceShares(orgId: string) {
  return db.execute(sql`
    SELECT es.*, p.full_name AS created_by_name
    FROM evidence_shares es
    JOIN profiles p ON p.id = es.created_by
    WHERE es.organization_id = ${orgId}::uuid
    ORDER BY es.created_at DESC
    LIMIT 50
  `);
}

export async function insertEvidenceShare(data: {
  organizationId: string; evidenceId?: string; createdBy: string;
  shareToken: string; recipientEmail?: string; recipientName?: string;
  accessLevel?: string; watermark?: boolean; expiresAt: Date;
}) {
  const rows = await db.insert(evidenceShares).values({
    organizationId: data.organizationId, evidenceId: data.evidenceId,
    createdBy: data.createdBy, shareToken: data.shareToken,
    recipientEmail: data.recipientEmail, recipientName: data.recipientName,
    accessLevel: data.accessLevel ?? "view_only",
    watermark: data.watermark ?? true, expiresAt: data.expiresAt,
  }).returning();
  return rows[0];
}

export async function revokeEvidenceShare(orgId: string, id: string) {
  await db.update(evidenceShares).set({ revoked: true, revokedAt: new Date() })
    .where(and(eq(evidenceShares.id, id), eq(evidenceShares.organizationId, orgId)));
}

export async function getEvidenceAccessLogs(orgId: string, limit = 50) {
  return db.execute(sql`
    SELECT eal.*, p.full_name, p.email
    FROM evidence_access_logs eal
    LEFT JOIN profiles p ON p.id = eal.accessed_by
    WHERE eal.organization_id = ${orgId}::uuid
    ORDER BY eal.created_at DESC
    LIMIT ${limit}
  `);
}

// â”€â”€â”€ AI Prompt Logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getPromptLogs(orgId: string, filters?: { sensitive?: boolean; limit?: number }) {
  const q = filters?.sensitive ? sql`AND sensitivity != 'clean'` : sql``;
  return db.execute(sql`
    SELECT apl.*, p.full_name, p.email
    FROM ai_prompt_logs apl
    LEFT JOIN profiles p ON p.id = apl.user_id
    WHERE apl.organization_id = ${orgId}::uuid ${q}
    ORDER BY apl.created_at DESC
    LIMIT ${filters?.limit ?? 50}
  `);
}

export async function getPromptStats(orgId: string) {
  return db.execute(sql`
    SELECT
      COUNT(*)::int AS total_30d,
      COUNT(*) FILTER (WHERE sensitivity != 'clean')::int AS sensitive_30d,
      COUNT(*) FILTER (WHERE blocked = TRUE)::int AS blocked_30d,
      COALESCE(SUM(input_tokens + output_tokens), 0)::bigint AS total_tokens_30d,
      COUNT(DISTINCT user_id)::int AS unique_users,
      COUNT(DISTINCT module)::int AS modules_used
    FROM ai_prompt_logs
    WHERE organization_id = ${orgId}::uuid AND created_at >= NOW() - INTERVAL '30 days'
  `);
}

export async function insertPromptLog(data: {
  organizationId: string; userId?: string; module?: string; agentType?: string;
  promptPreview?: string; responsePreview?: string; model?: string;
  inputTokens?: number; outputTokens?: number; latencyMs?: number;
  sensitivity?: string; detectedPiiTypes?: string[]; blocked?: boolean;
}) {
  await db.insert(aiPromptLogs).values({
    organizationId: data.organizationId, userId: data.userId,
    module: data.module, agentType: data.agentType,
    promptPreview: data.promptPreview, responsePreview: data.responsePreview,
    model: data.model, inputTokens: data.inputTokens ?? 0,
    outputTokens: data.outputTokens ?? 0, latencyMs: data.latencyMs,
    sensitivity: data.sensitivity ?? "clean",
    detectedPiiTypes: data.detectedPiiTypes ?? [],
    blocked: data.blocked ?? false,
  });
}

// â”€â”€â”€ Encryption â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getEncryptionProviders(orgId: string) {
  return db.select().from(encryptionProviders)
    .where(eq(encryptionProviders.organizationId, orgId))
    .orderBy(desc(encryptionProviders.createdAt));
}

export async function insertEncryptionProvider(data: {
  organizationId: string; name: string; providerType: string;
  awsRegion?: string; awsKeyId?: string; azureVaultUrl?: string;
  azureTenantId?: string; gcpProject?: string; gcpLocation?: string;
  gcpKeyRing?: string; gcpCryptoKey?: string; createdBy?: string;
}) {
  const rows = await db.insert(encryptionProviders).values({
    organizationId: data.organizationId, name: data.name,
    providerType: data.providerType,
    awsRegion: data.awsRegion, awsKeyId: data.awsKeyId,
    azureVaultUrl: data.azureVaultUrl, azureTenantId: data.azureTenantId,
    gcpProject: data.gcpProject, gcpLocation: data.gcpLocation,
    gcpKeyRing: data.gcpKeyRing, gcpCryptoKey: data.gcpCryptoKey,
    createdBy: data.createdBy,
  }).returning();
  return rows[0];
}

export async function deleteEncryptionProvider(orgId: string, id: string) {
  await db.delete(encryptionProviders)
    .where(and(eq(encryptionProviders.id, id), eq(encryptionProviders.organizationId, orgId)));
}

export async function getEncryptionAuditLog(orgId: string, limit = 30) {
  return db.execute(sql`
    SELECT eal.*, p.full_name FROM encryption_audit_logs eal
    LEFT JOIN profiles p ON p.id = eal.user_id
    WHERE eal.organization_id = ${orgId}::uuid
    ORDER BY eal.created_at DESC LIMIT ${limit}
  `);
}

// â”€â”€â”€ Trust Center â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getTrustCenterConfig(orgId: string) {
  const rows = await db.select().from(trustCenterConfig)
    .where(eq(trustCenterConfig.organizationId, orgId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertTrustCenterConfig(orgId: string, data: Record<string, unknown>) {
  await db.execute(sql`
    INSERT INTO trust_center_config (organization_id, title, tagline, description, security_email,
      show_trust_score, show_certifications, show_documents, enabled)
    VALUES (${orgId}::uuid, ${data.title ?? null}, ${data.tagline ?? null},
      ${data.description ?? null}, ${data.securityEmail ?? null},
      ${data.showTrustScore ?? true}, ${data.showCertifications ?? true},
      ${data.showDocuments ?? true}, ${data.enabled ?? false})
    ON CONFLICT (organization_id) DO UPDATE SET
      title = EXCLUDED.title, tagline = EXCLUDED.tagline,
      description = EXCLUDED.description, security_email = EXCLUDED.security_email,
      show_trust_score = EXCLUDED.show_trust_score,
      show_certifications = EXCLUDED.show_certifications,
      show_documents = EXCLUDED.show_documents,
      enabled = EXCLUDED.enabled, updated_at = NOW(),
      published_at = CASE WHEN EXCLUDED.enabled = TRUE AND trust_center_config.published_at IS NULL THEN NOW() ELSE trust_center_config.published_at END
  `);
}

export async function getTrustCenterDocuments(orgId: string) {
  return db.select().from(trustCenterDocuments)
    .where(eq(trustCenterDocuments.organizationId, orgId))
    .orderBy(trustCenterDocuments.displayOrder);
}

// â”€â”€â”€ Vendor Monitoring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getMonitoringAssets(orgId: string) {
  return db.execute(sql`
    SELECT vma.*, v.name AS vendor_name FROM vendor_monitoring_assets vma
    LEFT JOIN vendors v ON v.id = vma.vendor_id
    WHERE vma.organization_id = ${orgId}::uuid
    ORDER BY vma.created_at DESC
  `);
}

export async function insertMonitoringAsset(data: {
  organizationId: string; vendorId?: string; assetType: string;
  assetValue: string; checkInterval?: string; createdBy?: string;
}) {
  const rows = await db.insert(vendorMonitoringAssets).values({
    organizationId: data.organizationId, vendorId: data.vendorId,
    assetType: data.assetType, assetValue: data.assetValue,
    checkInterval: data.checkInterval ?? "daily", createdBy: data.createdBy,
  }).returning();
  return rows[0];
}

export async function getMonitoringAlerts(orgId: string, status?: string) {
  return db.execute(sql`
    SELECT vma.*, v.name AS vendor_name FROM vendor_monitoring_alerts vma
    LEFT JOIN vendors v ON v.id = vma.vendor_id
    WHERE vma.organization_id = ${orgId}::uuid
    ${status ? sql`AND vma.status = ${status}` : sql``}
    ORDER BY vma.created_at DESC LIMIT 50
  `);
}

export async function acknowledgeMonitoringAlert(orgId: string, id: string, userId: string) {
  await db.update(vendorMonitoringAlerts).set({
    status: "acknowledged", acknowledgedBy: userId, acknowledgedAt: new Date(),
  }).where(and(eq(vendorMonitoringAlerts.id, id), eq(vendorMonitoringAlerts.organizationId, orgId)));
}

export async function resolveMonitoringAlert(orgId: string, id: string) {
  await db.update(vendorMonitoringAlerts).set({ status: "resolved", resolvedAt: new Date() })
    .where(and(eq(vendorMonitoringAlerts.id, id), eq(vendorMonitoringAlerts.organizationId, orgId)));
}

export async function insertMonitoringEvent(data: {
  organizationId: string; assetId: string; vendorId?: string;
  checkType: string; status: string; details?: Record<string, unknown>;
}) {
  const rows = await db.insert(vendorMonitoringEvents).values({
    organizationId: data.organizationId, assetId: data.assetId,
    vendorId: data.vendorId, checkType: data.checkType,
    status: data.status, details: data.details ?? {},
  }).returning();
  return rows[0];
}

// ─── Sprint B2.1 — Enterprise Auth tables ────────────────────────────────────

export const passwordPolicies = pgTable("password_policies", {
  id:                     uuid("id").primaryKey().defaultRandom(),
  organizationId:         uuid("organization_id").notNull(),
  minLength:              integer("min_length").notNull().default(8),
  requireUppercase:       boolean("require_uppercase").notNull().default(true),
  requireLowercase:       boolean("require_lowercase").notNull().default(true),
  requireNumber:          boolean("require_number").notNull().default(true),
  requireSpecial:         boolean("require_special").notNull().default(false),
  historyCount:           integer("history_count").notNull().default(5),
  maxAgeDays:             integer("max_age_days"),
  lockoutAttempts:        integer("lockout_attempts").notNull().default(10),
  lockoutDurationMinutes: integer("lockout_duration_minutes").notNull().default(30),
  createdAt:              timestamp("created_at", {withTimezone:true}).notNull().defaultNow(),
  updatedAt:              timestamp("updated_at", {withTimezone:true}).notNull().defaultNow(),
});

export const loginLockouts = pgTable("login_lockouts", {
  id:              uuid("id").primaryKey().defaultRandom(),
  email:           text("email").notNull(),
  organizationId:  uuid("organization_id"),
  attemptCount:    integer("attempt_count").notNull().default(1),
  firstAttemptAt:  timestamp("first_attempt_at", {withTimezone:true}).notNull().defaultNow(),
  lockedUntil:     timestamp("locked_until", {withTimezone:true}),
  ipAddress:       text("ip_address"),
  updatedAt:       timestamp("updated_at", {withTimezone:true}).notNull().defaultNow(),
});

export const trustedDevices = pgTable("trusted_devices", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  userId:             uuid("user_id").notNull(),
  organizationId:     uuid("organization_id").notNull(),
  deviceFingerprint:  text("device_fingerprint").notNull(),
  browser:            text("browser"),
  os:                 text("os"),
  deviceName:         text("device_name"),
  ipAddress:          text("ip_address"),
  trusted:            boolean("trusted").notNull().default(true),
  lastSeen:           timestamp("last_seen", {withTimezone:true}).notNull().defaultNow(),
  expiresAt:          timestamp("expires_at", {withTimezone:true}),
  createdAt:          timestamp("created_at", {withTimezone:true}).notNull().defaultNow(),
});

export const passwordHistory = pgTable("password_history", {
  id:              uuid("id").primaryKey().defaultRandom(),
  userId:          uuid("user_id").notNull(),
  organizationId:  uuid("organization_id").notNull(),
  passwordHash:    text("password_hash").notNull(),
  createdAt:       timestamp("created_at", {withTimezone:true}).notNull().defaultNow(),
});

export type PasswordPolicy  = typeof passwordPolicies.$inferSelect;
export type LoginLockout    = typeof loginLockouts.$inferSelect;
export type TrustedDevice   = typeof trustedDevices.$inferSelect;

// ─── Sprint B2.1 — Password policy repo ──────────────────────────────────────

export async function getPasswordPolicy(orgId: string): Promise<PasswordPolicy | null> {
  const rows = await db.select().from(passwordPolicies)
    .where(eq(passwordPolicies.organizationId, orgId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertPasswordPolicy(orgId: string, data: Partial<Omit<PasswordPolicy, "id"|"organizationId"|"createdAt"|"updatedAt">>): Promise<void> {
  await db.execute(sql`
    INSERT INTO password_policies (organization_id, min_length, require_uppercase, require_lowercase,
      require_number, require_special, history_count, max_age_days, lockout_attempts, lockout_duration_minutes)
    VALUES (${orgId}, ${data.minLength??8}, ${data.requireUppercase??true}, ${data.requireLowercase??true},
      ${data.requireNumber??true}, ${data.requireSpecial??false}, ${data.historyCount??5},
      ${data.maxAgeDays??null}, ${data.lockoutAttempts??10}, ${data.lockoutDurationMinutes??30})
    ON CONFLICT (organization_id) DO UPDATE SET
      min_length = EXCLUDED.min_length,
      require_uppercase = EXCLUDED.require_uppercase,
      require_lowercase = EXCLUDED.require_lowercase,
      require_number = EXCLUDED.require_number,
      require_special = EXCLUDED.require_special,
      history_count = EXCLUDED.history_count,
      max_age_days = EXCLUDED.max_age_days,
      lockout_attempts = EXCLUDED.lockout_attempts,
      lockout_duration_minutes = EXCLUDED.lockout_duration_minutes,
      updated_at = NOW()
  `);
}

export async function addPasswordHistory(userId: string, orgId: string, hash: string): Promise<void> {
  await db.insert(passwordHistory).values({ userId, organizationId: orgId, passwordHash: hash });
  // Keep only the last 10 entries per user
  await db.execute(sql`
    DELETE FROM password_history
    WHERE user_id = ${userId}
    AND id NOT IN (
      SELECT id FROM password_history WHERE user_id = ${userId}
      ORDER BY created_at DESC LIMIT 10
    )
  `);
}

export async function getPasswordHistory(userId: string, count: number): Promise<string[]> {
  const rows = await db.select({ hash: passwordHistory.passwordHash })
    .from(passwordHistory)
    .where(eq(passwordHistory.userId, userId))
    .orderBy(desc(passwordHistory.createdAt))
    .limit(count);
  return rows.map(r => r.hash);
}

// ─── Sprint B2.1 — Login lockout repo ────────────────────────────────────────

export async function getLockout(email: string): Promise<LoginLockout | null> {
  const rows = await db.select().from(loginLockouts)
    .where(eq(loginLockouts.email, email.toLowerCase())).limit(1);
  return rows[0] ?? null;
}

export async function recordFailedAttempt(email: string, ipAddress?: string): Promise<LoginLockout> {
  const existing = await getLockout(email);
  if (!existing) {
    const rows = await db.insert(loginLockouts).values({
      email: email.toLowerCase(), attemptCount: 1, ipAddress,
    }).returning();
    return rows[0];
  }
  const rows = await db.execute(sql`
    UPDATE login_lockouts SET
      attempt_count = attempt_count + 1,
      ip_address = ${ipAddress ?? existing.ipAddress},
      updated_at = NOW()
    WHERE email = ${email.toLowerCase()}
    RETURNING *
  `);
  return (rows as unknown as LoginLockout[])[0];
}

export async function lockAccount(email: string, durationMinutes: number): Promise<void> {
  await db.execute(sql`
    UPDATE login_lockouts SET
      locked_until = NOW() + (${durationMinutes} * interval '1 minute'),
      updated_at = NOW()
    WHERE email = ${email.toLowerCase()}
  `);
}

export async function clearLockout(email: string): Promise<void> {
  await db.execute(sql`
    DELETE FROM login_lockouts WHERE email = ${email.toLowerCase()}
  `);
}

// ─── Sprint B2.1 — Trusted devices repo ──────────────────────────────────────

export async function getTrustedDevice(userId: string, fingerprint: string): Promise<TrustedDevice | null> {
  const rows = await db.select().from(trustedDevices)
    .where(and(eq(trustedDevices.userId, userId), eq(trustedDevices.deviceFingerprint, fingerprint)))
    .limit(1);
  const d = rows[0];
  if (!d) return null;
  if (d.expiresAt && d.expiresAt < new Date()) return null;
  return d;
}

export async function listTrustedDevices(userId: string, orgId: string): Promise<TrustedDevice[]> {
  return db.select().from(trustedDevices)
    .where(and(eq(trustedDevices.userId, userId), eq(trustedDevices.organizationId, orgId)))
    .orderBy(desc(trustedDevices.lastSeen));
}

export async function upsertTrustedDevice(data: {
  userId: string; organizationId: string; deviceFingerprint: string;
  browser?: string; os?: string; deviceName?: string; ipAddress?: string; expiresAt?: Date;
}): Promise<void> {
  await db.execute(sql`
    INSERT INTO trusted_devices (user_id, organization_id, device_fingerprint, browser, os, device_name, ip_address, expires_at, last_seen)
    VALUES (${data.userId}, ${data.organizationId}, ${data.deviceFingerprint},
      ${data.browser??null}, ${data.os??null}, ${data.deviceName??null},
      ${data.ipAddress??null}, ${data.expiresAt??null}, NOW())
    ON CONFLICT (user_id, device_fingerprint) DO UPDATE SET
      last_seen = NOW(), trusted = TRUE,
      browser = EXCLUDED.browser, os = EXCLUDED.os,
      device_name = EXCLUDED.device_name, ip_address = EXCLUDED.ip_address,
      expires_at = EXCLUDED.expires_at
  `);
}

export async function revokeTrustedDevice(userId: string, deviceId: string): Promise<void> {
  await db.delete(trustedDevices)
    .where(and(eq(trustedDevices.userId, userId), eq(trustedDevices.id, deviceId)));
}

// ─── Sprint B2.1 — Session creation ──────────────────────────────────────────

export async function createUserSession(data: {
  id?: string; userId: string; organizationId: string;
  ipAddress?: string; userAgent?: string; browser?: string;
  device?: string; os?: string; country?: string;
  mfaVerified?: boolean; expiresAt?: Date;
}): Promise<typeof userSessions.$inferSelect> {
  const rows = await db.insert(userSessions).values({
    id: data.id,
    userId: data.userId, organizationId: data.organizationId,
    ipAddress: data.ipAddress, userAgent: data.userAgent,
    browser: data.browser, device: data.device, os: data.os,
    country: data.country,
    mfaVerified: data.mfaVerified ?? false,
    expiresAt: data.expiresAt,
    status: "active",
  }).returning();
  return rows[0];
}

export async function updateSessionLastActive(sessionId: string): Promise<void> {
  await db.execute(sql`
    UPDATE user_sessions SET last_active = NOW() WHERE id = ${sessionId} AND status = 'active'
  `);
}

export async function updateSessionMfaVerified(sessionId: string, verified: boolean): Promise<void> {
  await db.execute(sql`
    UPDATE user_sessions SET mfa_verified = ${verified} WHERE id = ${sessionId}
  `);
}

export async function getSessionById(sessionId: string): Promise<typeof userSessions.$inferSelect | null> {
  const rows = await db.select().from(userSessions)
    .where(and(eq(userSessions.id, sessionId), eq(userSessions.status, "active")))
    .limit(1);
  return rows[0] ?? null;
}

export async function countActiveSessions(userId: string, orgId: string): Promise<number> {
  const rows = await db.select({ c: count() }).from(userSessions)
    .where(and(eq(userSessions.userId, userId), eq(userSessions.organizationId, orgId), eq(userSessions.status, "active")));
  return Number(rows[0]?.c ?? 0);
}

export async function revokeOldestSessions(userId: string, orgId: string, keepCount: number): Promise<void> {
  await db.execute(sql`
    UPDATE user_sessions SET status = 'revoked', revoked_at = NOW()
    WHERE id IN (
      SELECT id FROM user_sessions
      WHERE user_id = ${userId} AND organization_id = ${orgId} AND status = 'active'
      ORDER BY created_at ASC
      LIMIT GREATEST(0, (SELECT COUNT(*) FROM user_sessions WHERE user_id = ${userId} AND organization_id = ${orgId} AND status = 'active') - ${keepCount})
    )
  `);
}

// ─── Sprint B2.1 — Org IP rules (for middleware) ──────────────────────────────

export async function getActiveIpRules(orgId: string): Promise<Array<{cidrRange: string; appliesTo: string}>> {
  const rows = await db.select({ cidrRange: ipAllowlists.cidrRange, appliesTo: ipAllowlists.appliesTo })
    .from(ipAllowlists)
    .where(and(eq(ipAllowlists.organizationId, orgId), eq(ipAllowlists.enabled, true)));
  return rows;
}

// ─── Sprint B2.1 — TOTP on userMfaStatus ─────────────────────────────────────

export async function getMfaStatusForUser(userId: string, orgId: string): Promise<typeof userMfaStatus.$inferSelect | null> {
  const rows = await db.select().from(userMfaStatus)
    .where(and(eq(userMfaStatus.userId, userId), eq(userMfaStatus.organizationId, orgId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertUserMfaStatus(data: {
  userId: string; organizationId: string;
  enabled?: boolean; method?: string;
  totpSecret?: string | null; recoveryCodes?: string[] | null;
  enabledAt?: Date | null; lastVerifiedAt?: Date | null;
  recoveryCodesGeneratedAt?: Date | null;
}): Promise<void> {
  await db.execute(sql`
    INSERT INTO user_mfa_status (user_id, organization_id, enabled, method, totp_secret, recovery_codes,
      enabled_at, last_verified_at, recovery_codes_generated_at)
    VALUES (${data.userId}, ${data.organizationId}, ${data.enabled??false}, ${data.method??'totp'},
      ${data.totpSecret??null}, ${data.recoveryCodes ? sql`ARRAY[${sql.join(data.recoveryCodes.map(c=>sql`${c}`), sql`, `)}]::text[]` : sql`NULL`},
      ${data.enabledAt??null}, ${data.lastVerifiedAt??null}, ${data.recoveryCodesGeneratedAt??null})
    ON CONFLICT (user_id, organization_id) DO UPDATE SET
      enabled = EXCLUDED.enabled, method = EXCLUDED.method,
      totp_secret = COALESCE(EXCLUDED.totp_secret, user_mfa_status.totp_secret),
      recovery_codes = COALESCE(EXCLUDED.recovery_codes, user_mfa_status.recovery_codes),
      enabled_at = COALESCE(EXCLUDED.enabled_at, user_mfa_status.enabled_at),
      last_verified_at = COALESCE(EXCLUDED.last_verified_at, user_mfa_status.last_verified_at),
      recovery_codes_generated_at = COALESCE(EXCLUDED.recovery_codes_generated_at, user_mfa_status.recovery_codes_generated_at)
  `);
}

