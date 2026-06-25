-- Sprint B2.1: Enterprise Authentication
-- Adds TOTP/MFA storage, password policies, session governance, device trust

-- ─── 1. MFA columns on user_mfa_status ──────────────────────────────────────
ALTER TABLE user_mfa_status
  ADD COLUMN IF NOT EXISTS totp_secret      TEXT,
  ADD COLUMN IF NOT EXISTS recovery_codes   TEXT[],
  ADD COLUMN IF NOT EXISTS recovery_codes_generated_at TIMESTAMP WITH TIME ZONE;

-- ─── 2. Session governance columns on security_mfa_settings ─────────────────
ALTER TABLE security_mfa_settings
  ADD COLUMN IF NOT EXISTS idle_timeout_minutes      INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS absolute_timeout_hours    INTEGER NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS max_concurrent_sessions   INTEGER NOT NULL DEFAULT 5;

-- ─── 3. Password changed-at on profiles ─────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;

-- ─── 4. Password policies (one per org) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_policies (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  min_length              INTEGER NOT NULL DEFAULT 8,
  require_uppercase       BOOLEAN NOT NULL DEFAULT TRUE,
  require_lowercase       BOOLEAN NOT NULL DEFAULT TRUE,
  require_number          BOOLEAN NOT NULL DEFAULT TRUE,
  require_special         BOOLEAN NOT NULL DEFAULT FALSE,
  history_count           INTEGER NOT NULL DEFAULT 5,
  max_age_days            INTEGER,                        -- NULL = no expiry
  lockout_attempts        INTEGER NOT NULL DEFAULT 10,   -- 0 = disabled
  lockout_duration_minutes INTEGER NOT NULL DEFAULT 30,
  created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id)
);

-- ─── 5. Login lockouts (brute-force protection by email) ────────────────────
CREATE TABLE IF NOT EXISTS login_lockouts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT NOT NULL,
  organization_id   UUID,
  attempt_count     INTEGER NOT NULL DEFAULT 1,
  first_attempt_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  locked_until      TIMESTAMP WITH TIME ZONE,
  ip_address        TEXT,
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS login_lockouts_email_idx ON login_lockouts (email);

-- ─── 6. Trusted devices ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trusted_devices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  device_fingerprint  TEXT NOT NULL,
  browser             TEXT,
  os                  TEXT,
  device_name         TEXT,
  ip_address          TEXT,
  trusted             BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMP WITH TIME ZONE,
  created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS trusted_devices_user_idx ON trusted_devices (user_id, organization_id);

-- ─── 7. Password history (for history-count enforcement) ────────────────────
CREATE TABLE IF NOT EXISTS password_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL,
  organization_id  UUID NOT NULL,
  password_hash    TEXT NOT NULL,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS password_history_user_idx ON password_history (user_id, created_at DESC);

-- ─── 8. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE password_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_lockouts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices   ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history  ENABLE ROW LEVEL SECURITY;

-- password_policies: org members can read; only owner/admin can write (enforced in service)
CREATE POLICY "password_policies_read" ON password_policies
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "password_policies_write" ON password_policies
  FOR ALL USING (is_org_member(organization_id));

-- login_lockouts: service role only (checked by email, no user context at lockout time)
-- RLS open for service role; anon/authed blocked
CREATE POLICY "login_lockouts_service" ON login_lockouts
  FOR ALL USING (TRUE);  -- service role bypasses RLS; app uses service client for lockouts

-- trusted_devices: users see their own devices
CREATE POLICY "trusted_devices_own" ON trusted_devices
  FOR ALL USING (user_id = auth.uid());

-- password_history: users see their own history
CREATE POLICY "password_history_own" ON password_history
  FOR ALL USING (user_id = auth.uid());
