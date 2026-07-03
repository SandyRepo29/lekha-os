-- Migration 0042: Platform Owner Console
-- Internal AUDT super-admin system — completely separate from tenant application

-- ── Enums ─────────────────────────────────────────────────────────────────────

CREATE TYPE platform_user_role AS ENUM ('platform_owner', 'platform_admin', 'platform_support');
CREATE TYPE platform_session_status AS ENUM ('active', 'expired', 'revoked');
CREATE TYPE feature_flag_scope AS ENUM ('global', 'org', 'user');
CREATE TYPE pa_audit_action AS ENUM (
  'login', 'logout', 'impersonate_start', 'impersonate_end',
  'org_view', 'org_edit', 'org_suspend', 'org_activate',
  'flag_create', 'flag_update', 'flag_delete',
  'user_create', 'user_update', 'user_deactivate',
  'template_create', 'template_update',
  'system_config_update', 'data_export'
);

-- ── Platform users (internal AUDT staff only) ─────────────────────────────────

CREATE TABLE platform_users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  role                platform_user_role NOT NULL DEFAULT 'platform_support',
  password_hash       TEXT NOT NULL,
  totp_secret         TEXT,              -- AES-encrypted JSON
  totp_enabled        BOOLEAN NOT NULL DEFAULT false,
  recovery_codes      TEXT[],            -- bcrypt hashes
  is_active           BOOLEAN NOT NULL DEFAULT true,
  last_login_at       TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Platform sessions ─────────────────────────────────────────────────────────

CREATE TABLE platform_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_user_id      UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  status                platform_session_status NOT NULL DEFAULT 'active',
  ip_address            TEXT,
  user_agent            TEXT,
  mfa_verified          BOOLEAN NOT NULL DEFAULT false,
  impersonating_org_id  UUID,            -- NULL = normal mode
  impersonation_reason  TEXT,
  last_active           TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at            TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '8 hours'),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_sessions_user ON platform_sessions(platform_user_id);
CREATE INDEX idx_platform_sessions_status ON platform_sessions(status);

-- ── Feature flags ─────────────────────────────────────────────────────────────

CREATE TABLE feature_flags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key          TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  description  TEXT,
  enabled      BOOLEAN NOT NULL DEFAULT false,
  scope        feature_flag_scope NOT NULL DEFAULT 'global',
  rollout_pct  INT NOT NULL DEFAULT 100 CHECK (rollout_pct BETWEEN 0 AND 100),
  metadata     JSONB,
  created_by   UUID REFERENCES platform_users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-org feature flag overrides
CREATE TABLE tenant_feature_overrides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  flag_key        TEXT NOT NULL REFERENCES feature_flags(key) ON DELETE CASCADE,
  enabled         BOOLEAN NOT NULL,
  reason          TEXT,
  set_by          UUID REFERENCES platform_users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, flag_key)
);

-- ── Platform audit log ────────────────────────────────────────────────────────

CREATE TABLE platform_audit_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_user_id     UUID REFERENCES platform_users(id),
  platform_user_email  TEXT,
  action               pa_audit_action NOT NULL,
  target_type          TEXT,   -- 'organization' | 'platform_user' | 'feature_flag' | etc.
  target_id            TEXT,
  target_label         TEXT,
  details              JSONB,
  ip_address           TEXT,
  session_id           UUID,
  impersonating_org_id UUID,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pa_audit_user ON platform_audit_logs(platform_user_id);
CREATE INDEX idx_pa_audit_action ON platform_audit_logs(action);
CREATE INDEX idx_pa_audit_created ON platform_audit_logs(created_at DESC);

-- ── System health snapshots ────────────────────────────────────────────────────

CREATE TABLE system_health_snapshots (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_orgs           INT NOT NULL DEFAULT 0,
  active_orgs          INT NOT NULL DEFAULT 0,
  total_users          INT NOT NULL DEFAULT 0,
  active_users_30d     INT NOT NULL DEFAULT 0,
  total_vendors        INT NOT NULL DEFAULT 0,
  db_size_mb           NUMERIC(10,2),
  storage_size_mb      NUMERIC(10,2),
  api_calls_24h        INT NOT NULL DEFAULT 0,
  error_rate_pct       NUMERIC(5,2),
  avg_response_ms      INT,
  metadata             JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Platform notifications ─────────────────────────────────────────────────────

CREATE TABLE platform_notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  body             TEXT NOT NULL,
  severity         TEXT NOT NULL DEFAULT 'info',  -- info | warn | critical
  target_org_ids   UUID[],   -- NULL = broadcast to all orgs
  sent_by          UUID REFERENCES platform_users(id),
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_by_org_ids  UUID[] NOT NULL DEFAULT '{}'
);

-- ── Org-level notes (internal, not visible to tenants) ───────────────────────

CREATE TABLE platform_org_notes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL,
  note             TEXT NOT NULL,
  created_by       UUID REFERENCES platform_users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pa_org_notes_org ON platform_org_notes(organization_id);

-- ── Support tickets (internal tracking only) ──────────────────────────────────

CREATE TABLE platform_support_tickets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID,
  title            TEXT NOT NULL,
  description      TEXT,
  status           TEXT NOT NULL DEFAULT 'open',  -- open | in_progress | resolved | closed
  priority         TEXT NOT NULL DEFAULT 'medium',
  assigned_to      UUID REFERENCES platform_users(id),
  created_by       UUID REFERENCES platform_users(id),
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Seed: default feature flags ───────────────────────────────────────────────

INSERT INTO feature_flags (key, name, description, enabled, scope) VALUES
  ('ai_governance',         'AI Governance Module',          'AI Governance™ module access',           true,  'global'),
  ('regulatory_intelligence','Regulatory Intelligence',      'Regulatory Intelligence™ module',        true,  'global'),
  ('trust_api_platform',    'Trust API Platform',            'Trust API Platform™ module',             true,  'global'),
  ('governance_agents',     'Governance Agent Framework',    'Governance Agent Framework™ module',     true,  'global'),
  ('continuous_compliance', 'Continuous Compliance',         'Continuous Compliance™ module',          true,  'global'),
  ('auditor_collaboration', 'Auditor Collaboration',         'Auditor Collaboration™ module',          true,  'global'),
  ('executive_reporting',   'Executive Reporting',           'Executive Reporting & Analytics™',       true,  'global'),
  ('benchmarking',          'Benchmarking',                  'Governance Benchmarking™',               true,  'global'),
  ('trust_verification',    'Trust Verification Authority',  'Trust Verification Authority™',          true,  'global'),
  ('asset_intelligence',    'Asset Intelligence',            'Asset Intelligence™ module',             true,  'global'),
  ('security_command_center','Security Command Center',      'Security Command Center™',               true,  'global'),
  ('toe',                   'Trust Operations Engine',       'Trust Operations Engine™',               true,  'global'),
  ('platform_services',     'Platform Services',             'Platform-wide services (activity, tasks, search)', true, 'global'),
  ('beta_renewal_workspace','Beta: Vendor Renewal Workspace','Epic 1 vendor lifecycle renewal UI',     false, 'global'),
  ('beta_lifecycle_engine', 'Beta: Lifecycle State Machine', 'Epic 1 vendor lifecycle state machine',  false, 'global');
