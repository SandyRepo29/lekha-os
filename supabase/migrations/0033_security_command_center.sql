-- Migration 0033: Security Command Center™
-- 20 tables covering MFA, SSO, Sessions, IP Allow Lists, Fine-grained Permissions,
-- Evidence Protection, AI Security Governance, Customer Managed Encryption,
-- Trust Center, Continuous Vendor Monitoring

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE mfa_enforcement_enum AS ENUM ('optional', 'required_admins', 'required_all');
CREATE TYPE sso_provider_type_enum AS ENUM ('entra_id', 'okta', 'google_workspace', 'ping_identity', 'saml2', 'oidc');
CREATE TYPE session_status_enum AS ENUM ('active', 'expired', 'revoked');
CREATE TYPE ip_allowlist_resource_enum AS ENUM ('all', 'login', 'api', 'auditor_rooms', 'trust_exchange');
CREATE TYPE evidence_share_access_enum AS ENUM ('view_only', 'download');
CREATE TYPE ai_prompt_sensitivity_enum AS ENUM ('clean', 'low', 'medium', 'high', 'blocked');
CREATE TYPE encryption_provider_type_enum AS ENUM ('platform', 'aws_kms', 'azure_key_vault', 'google_kms');
CREATE TYPE vendor_monitor_check_enum AS ENUM ('domain_expiry', 'ssl_expiry', 'ssl_weak', 'breach', 'dns_change', 'cert_expiry', 'reputation');
CREATE TYPE vendor_monitor_severity_enum AS ENUM ('info', 'low', 'medium', 'high', 'critical');

-- ─── security_mfa_settings ────────────────────────────────────────────────────

CREATE TABLE security_mfa_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  enforcement_mode  mfa_enforcement_enum NOT NULL DEFAULT 'optional',
  allow_remember_device BOOLEAN NOT NULL DEFAULT TRUE,
  remember_days     INT NOT NULL DEFAULT 30,
  require_on_new_device BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mfa_settings_org ON security_mfa_settings(organization_id);

-- ─── user_mfa_status ─────────────────────────────────────────────────────────

CREATE TABLE user_mfa_status (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  enabled          BOOLEAN NOT NULL DEFAULT FALSE,
  method           TEXT,                    -- totp, recovery_code
  totp_secret      TEXT,                    -- encrypted TOTP secret
  recovery_codes   TEXT[],                  -- array of hashed recovery codes
  enabled_at       TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_user_mfa_org  ON user_mfa_status(organization_id);
CREATE INDEX idx_user_mfa_user ON user_mfa_status(user_id);

-- ─── sso_providers ───────────────────────────────────────────────────────────

CREATE TABLE sso_providers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  provider_type    sso_provider_type_enum NOT NULL,
  enabled          BOOLEAN NOT NULL DEFAULT FALSE,
  -- SAML
  saml_metadata_url   TEXT,
  saml_entity_id      TEXT,
  saml_acs_url        TEXT,
  saml_certificate    TEXT,
  -- OIDC
  oidc_client_id      TEXT,
  oidc_client_secret  TEXT,  -- encrypted
  oidc_issuer_url     TEXT,
  oidc_scopes         TEXT,
  -- JIT Provisioning
  jit_enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  default_role        TEXT NOT NULL DEFAULT 'member',
  -- Domain mapping
  force_redirect      BOOLEAN NOT NULL DEFAULT FALSE,
  created_by       UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sso_providers_org ON sso_providers(organization_id);

-- ─── sso_domains ─────────────────────────────────────────────────────────────

CREATE TABLE sso_domains (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sso_provider_id  UUID NOT NULL REFERENCES sso_providers(id) ON DELETE CASCADE,
  domain           TEXT NOT NULL,
  verified         BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, domain)
);

CREATE INDEX idx_sso_domains_org ON sso_domains(organization_id);

-- ─── user_sessions ────────────────────────────────────────────────────────────

CREATE TABLE user_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_token    TEXT,                    -- hashed session ref
  ip_address       INET,
  user_agent       TEXT,
  browser          TEXT,
  device           TEXT,
  os               TEXT,
  country          TEXT,
  city             TEXT,
  status           session_status_enum NOT NULL DEFAULT 'active',
  mfa_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  last_active      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ,
  revoked_at       TIMESTAMPTZ,
  revoked_by       UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_org  ON user_sessions(organization_id);
CREATE INDEX idx_user_sessions_status ON user_sessions(status);

-- ─── ip_allowlists ────────────────────────────────────────────────────────────

CREATE TABLE ip_allowlists (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cidr_range       TEXT NOT NULL,
  description      TEXT NOT NULL,
  applies_to       ip_allowlist_resource_enum NOT NULL DEFAULT 'all',
  enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  created_by       UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ip_allowlists_org ON ip_allowlists(organization_id);

-- ─── security_permissions ────────────────────────────────────────────────────

CREATE TABLE security_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL UNIQUE,    -- e.g. vendors.view
  module      TEXT NOT NULL,           -- e.g. vendors
  action      TEXT NOT NULL,           -- e.g. view
  description TEXT,
  is_builtin  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_perms_key ON security_permissions(key);

-- ─── security_role_permissions ───────────────────────────────────────────────

CREATE TABLE security_role_permissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role             TEXT NOT NULL,              -- maps to membership role enum
  permission_key   TEXT NOT NULL REFERENCES security_permissions(key) ON DELETE CASCADE,
  granted          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, role, permission_key)
);

CREATE INDEX idx_role_perms_org ON security_role_permissions(organization_id);

-- ─── security_user_permissions ───────────────────────────────────────────────

CREATE TABLE security_user_permissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_key   TEXT NOT NULL REFERENCES security_permissions(key) ON DELETE CASCADE,
  granted          BOOLEAN NOT NULL DEFAULT TRUE,
  granted_by       UUID REFERENCES profiles(id),
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id, permission_key)
);

CREATE INDEX idx_user_perms_org ON security_user_permissions(organization_id);

-- ─── evidence_shares ─────────────────────────────────────────────────────────

CREATE TABLE evidence_shares (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  evidence_id      UUID REFERENCES evidence(id) ON DELETE CASCADE,
  created_by       UUID NOT NULL REFERENCES profiles(id),
  share_token      TEXT NOT NULL UNIQUE,
  recipient_email  TEXT,
  recipient_name   TEXT,
  access_level     evidence_share_access_enum NOT NULL DEFAULT 'view_only',
  watermark        BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at       TIMESTAMPTZ NOT NULL,
  revoked          BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at       TIMESTAMPTZ,
  view_count       INT NOT NULL DEFAULT 0,
  last_accessed    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidence_shares_org   ON evidence_shares(organization_id);
CREATE INDEX idx_evidence_shares_token ON evidence_shares(share_token);

-- ─── evidence_access_logs ────────────────────────────────────────────────────

CREATE TABLE evidence_access_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  evidence_id      UUID REFERENCES evidence(id) ON DELETE SET NULL,
  share_id         UUID REFERENCES evidence_shares(id) ON DELETE SET NULL,
  accessed_by      UUID REFERENCES profiles(id),
  ip_address       INET,
  user_agent       TEXT,
  action           TEXT NOT NULL,   -- view, download, share, revoke
  metadata         JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidence_access_org  ON evidence_access_logs(organization_id);
CREATE INDEX idx_evidence_access_evid ON evidence_access_logs(evidence_id);

-- ─── evidence_watermarks ─────────────────────────────────────────────────────

CREATE TABLE evidence_watermarks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  include_user     BOOLEAN NOT NULL DEFAULT TRUE,
  include_org      BOOLEAN NOT NULL DEFAULT TRUE,
  include_date     BOOLEAN NOT NULL DEFAULT TRUE,
  include_classification BOOLEAN NOT NULL DEFAULT FALSE,
  opacity          FLOAT NOT NULL DEFAULT 0.15,
  position         TEXT NOT NULL DEFAULT 'diagonal',
  custom_text      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ai_prompt_logs ──────────────────────────────────────────────────────────

CREATE TABLE ai_prompt_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  module           TEXT,                    -- which module originated the prompt
  agent_type       TEXT,                    -- governance_copilot, ai_risk_officer, etc.
  prompt_preview   TEXT,                    -- first 200 chars, sensitive data masked
  full_prompt      TEXT,                    -- full prompt (encrypted at rest)
  response_preview TEXT,                    -- first 200 chars
  model            TEXT,
  input_tokens     INT NOT NULL DEFAULT 0,
  output_tokens    INT NOT NULL DEFAULT 0,
  latency_ms       INT,
  sensitivity      ai_prompt_sensitivity_enum NOT NULL DEFAULT 'clean',
  detected_pii_types TEXT[],               -- api_key, password, pan, aadhaar, etc.
  blocked          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_prompt_logs_org  ON ai_prompt_logs(organization_id);
CREATE INDEX idx_ai_prompt_logs_user ON ai_prompt_logs(user_id);
CREATE INDEX idx_ai_prompt_logs_date ON ai_prompt_logs(created_at);

-- ─── encryption_providers ────────────────────────────────────────────────────

CREATE TABLE encryption_providers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  provider_type    encryption_provider_type_enum NOT NULL DEFAULT 'platform',
  enabled          BOOLEAN NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN NOT NULL DEFAULT FALSE,
  -- AWS KMS
  aws_region       TEXT,
  aws_key_id       TEXT,
  aws_access_key   TEXT,  -- encrypted
  aws_secret_key   TEXT,  -- encrypted
  -- Azure Key Vault
  azure_vault_url  TEXT,
  azure_tenant_id  TEXT,
  azure_client_id  TEXT,
  azure_client_secret TEXT,  -- encrypted
  -- Google KMS
  gcp_project      TEXT,
  gcp_location     TEXT,
  gcp_key_ring     TEXT,
  gcp_crypto_key   TEXT,
  gcp_credentials  TEXT,  -- encrypted service account JSON
  -- Status
  last_tested      TIMESTAMPTZ,
  test_status      TEXT,  -- ok, failed
  created_by       UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_encryption_providers_org ON encryption_providers(organization_id);

-- ─── customer_keys ───────────────────────────────────────────────────────────

CREATE TABLE customer_keys (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_id      UUID NOT NULL REFERENCES encryption_providers(id) ON DELETE CASCADE,
  key_alias        TEXT NOT NULL,
  key_arn          TEXT,      -- AWS ARN or equivalent
  key_version      TEXT,
  purpose          TEXT NOT NULL DEFAULT 'data_encryption',
  status           TEXT NOT NULL DEFAULT 'active',  -- active, rotated, disabled
  rotated_at       TIMESTAMPTZ,
  next_rotation    TIMESTAMPTZ,
  created_by       UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_keys_org ON customer_keys(organization_id);

-- ─── encryption_audit_logs ───────────────────────────────────────────────────

CREATE TABLE encryption_audit_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_id      UUID REFERENCES encryption_providers(id) ON DELETE SET NULL,
  key_id           UUID REFERENCES customer_keys(id) ON DELETE SET NULL,
  user_id          UUID REFERENCES profiles(id),
  action           TEXT NOT NULL,  -- key_created, key_rotated, key_used, key_disabled, provider_configured
  resource_type    TEXT,
  resource_id      UUID,
  metadata         JSONB,
  ip_address       INET,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_enc_audit_org  ON encryption_audit_logs(organization_id);
CREATE INDEX idx_enc_audit_date ON encryption_audit_logs(created_at);

-- ─── trust_center_config ─────────────────────────────────────────────────────

CREATE TABLE trust_center_config (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  enabled             BOOLEAN NOT NULL DEFAULT FALSE,
  slug                TEXT UNIQUE,   -- subdomain or path: trust.customer.audt.tech
  title               TEXT,
  tagline             TEXT,
  description         TEXT,
  logo_url            TEXT,
  primary_color       TEXT,
  security_email      TEXT,
  status_page_url     TEXT,
  show_trust_score    BOOLEAN NOT NULL DEFAULT TRUE,
  show_certifications BOOLEAN NOT NULL DEFAULT TRUE,
  show_documents      BOOLEAN NOT NULL DEFAULT TRUE,
  show_status         BOOLEAN NOT NULL DEFAULT TRUE,
  custom_domain       TEXT,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── trust_center_documents ──────────────────────────────────────────────────

CREATE TABLE trust_center_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  config_id        UUID NOT NULL REFERENCES trust_center_config(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT NOT NULL DEFAULT 'security',  -- security, privacy, compliance, ai
  file_url         TEXT,
  is_public        BOOLEAN NOT NULL DEFAULT TRUE,
  display_order    INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trust_center_docs_org ON trust_center_documents(organization_id);

-- ─── vendor_monitoring_assets ────────────────────────────────────────────────

CREATE TABLE vendor_monitoring_assets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id        UUID REFERENCES vendors(id) ON DELETE CASCADE,
  asset_type       TEXT NOT NULL DEFAULT 'domain',  -- domain, ssl, reputation
  asset_value      TEXT NOT NULL,   -- e.g. example.com
  enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  last_checked     TIMESTAMPTZ,
  next_check       TIMESTAMPTZ,
  check_interval   TEXT NOT NULL DEFAULT 'daily',  -- hourly, daily, weekly
  created_by       UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendor_monitoring_assets_org    ON vendor_monitoring_assets(organization_id);
CREATE INDEX idx_vendor_monitoring_assets_vendor ON vendor_monitoring_assets(vendor_id);

-- ─── vendor_monitoring_events ────────────────────────────────────────────────

CREATE TABLE vendor_monitoring_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id         UUID NOT NULL REFERENCES vendor_monitoring_assets(id) ON DELETE CASCADE,
  vendor_id        UUID REFERENCES vendors(id) ON DELETE SET NULL,
  check_type       vendor_monitor_check_enum NOT NULL,
  status           TEXT NOT NULL,    -- ok, warning, critical, error
  details          JSONB,
  raw_data         JSONB,
  checked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendor_monitoring_events_org   ON vendor_monitoring_events(organization_id);
CREATE INDEX idx_vendor_monitoring_events_asset ON vendor_monitoring_events(asset_id);

-- ─── vendor_monitoring_alerts ────────────────────────────────────────────────

CREATE TABLE vendor_monitoring_alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id        UUID REFERENCES vendors(id) ON DELETE CASCADE,
  asset_id         UUID REFERENCES vendor_monitoring_assets(id) ON DELETE SET NULL,
  event_id         UUID REFERENCES vendor_monitoring_events(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  severity         vendor_monitor_severity_enum NOT NULL DEFAULT 'medium',
  status           TEXT NOT NULL DEFAULT 'open',  -- open, acknowledged, resolved
  acknowledged_by  UUID REFERENCES profiles(id),
  acknowledged_at  TIMESTAMPTZ,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendor_monitoring_alerts_org    ON vendor_monitoring_alerts(organization_id);
CREATE INDEX idx_vendor_monitoring_alerts_vendor ON vendor_monitoring_alerts(vendor_id);

-- ─── Seed built-in permissions ────────────────────────────────────────────────

INSERT INTO security_permissions (key, module, action, description) VALUES
  ('vendors.view',           'vendors',    'view',     'View vendor registry and details'),
  ('vendors.edit',           'vendors',    'edit',     'Create and edit vendors'),
  ('vendors.delete',         'vendors',    'delete',   'Delete vendors'),
  ('vendors.export',         'vendors',    'export',   'Export vendor data'),
  ('evidence.view',          'compliance', 'view',     'View compliance evidence'),
  ('evidence.download',      'compliance', 'download', 'Download evidence files'),
  ('evidence.edit',          'compliance', 'edit',     'Upload and manage evidence'),
  ('risks.view',             'risks',      'view',     'View risk register'),
  ('risks.edit',             'risks',      'edit',     'Create and edit risks'),
  ('audits.view',            'audits',     'view',     'View audits and findings'),
  ('audits.edit',            'audits',     'edit',     'Manage audits and findings'),
  ('controls.view',          'controls',   'view',     'View control library'),
  ('controls.edit',          'controls',   'edit',     'Manage controls'),
  ('trust.exchange.share',   'trust',      'share',    'Share on Trust Exchange™'),
  ('trust.exchange.publish', 'trust',      'publish',  'Publish Trust Profile™'),
  ('api.keys.manage',        'api',        'manage',   'Create and manage API keys'),
  ('api.keys.view',          'api',        'view',     'View API key list'),
  ('settings.billing',       'settings',   'billing',  'View and manage billing'),
  ('settings.team',          'settings',   'team',     'Manage team members'),
  ('settings.security',      'settings',   'security', 'Manage security settings');

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE security_mfa_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mfa_status            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_providers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_domains                ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_allowlists              ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_permissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_role_permissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_user_permissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_shares            ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_access_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_watermarks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_providers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_keys              ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_audit_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_center_config        ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_center_documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_monitoring_assets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_monitoring_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_monitoring_alerts   ENABLE ROW LEVEL SECURITY;

-- Org member policies

CREATE POLICY "mfa_settings_org_member"        ON security_mfa_settings      FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "user_mfa_status_org_member"     ON user_mfa_status            FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "sso_providers_org_member"       ON sso_providers              FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "sso_domains_org_member"         ON sso_domains                FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "user_sessions_org_member"       ON user_sessions              FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "ip_allowlists_org_member"       ON ip_allowlists              FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "security_role_perms_org_member" ON security_role_permissions  FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "security_user_perms_org_member" ON security_user_permissions  FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "evidence_shares_org_member"     ON evidence_shares            FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "evidence_access_logs_org_member"ON evidence_access_logs       FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "evidence_watermarks_org_member" ON evidence_watermarks        FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "ai_prompt_logs_org_member"      ON ai_prompt_logs             FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "encryption_providers_org_member"ON encryption_providers       FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "customer_keys_org_member"       ON customer_keys              FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "enc_audit_logs_org_member"      ON encryption_audit_logs      FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "trust_center_config_org_member" ON trust_center_config        FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "trust_center_docs_org_member"   ON trust_center_documents     FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "vendor_mon_assets_org_member"   ON vendor_monitoring_assets   FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "vendor_mon_events_org_member"   ON vendor_monitoring_events   FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "vendor_mon_alerts_org_member"   ON vendor_monitoring_alerts   FOR ALL USING (is_org_member(organization_id));

-- security_permissions is global (no org_id)
CREATE POLICY "security_permissions_select" ON security_permissions FOR SELECT USING (TRUE);
