// Applies the remaining parts of migration 0042 that weren't created by the seed script.
// Safe to re-run — uses CREATE TABLE IF NOT EXISTS and IF NOT EXISTS everywhere.

import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

async function run() {
  console.log('Applying platform admin migration (remaining tables)...\n');

  // Enums (CREATE TYPE ... IF NOT EXISTS not available in older PG, use DO block)
  await sql.unsafe(`
    DO $$ BEGIN
      CREATE TYPE platform_user_role AS ENUM ('platform_owner', 'platform_admin', 'platform_support');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await sql.unsafe(`
    DO $$ BEGIN
      CREATE TYPE platform_session_status AS ENUM ('active', 'expired', 'revoked');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await sql.unsafe(`
    DO $$ BEGIN
      CREATE TYPE feature_flag_scope AS ENUM ('global', 'org', 'user');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await sql.unsafe(`
    DO $$ BEGIN
      CREATE TYPE pa_audit_action AS ENUM (
        'login', 'logout', 'impersonate_start', 'impersonate_end',
        'org_view', 'org_edit', 'org_suspend', 'org_activate',
        'flag_create', 'flag_update', 'flag_delete',
        'user_create', 'user_update', 'user_deactivate',
        'template_create', 'template_update',
        'system_config_update', 'data_export'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  console.log('  ✓ enums');

  // Alter platform_users to use the enum for role column (seed used TEXT)
  await sql.unsafe(`
    ALTER TABLE platform_users
      ALTER COLUMN role TYPE platform_user_role USING role::platform_user_role;
  `).catch(() => {}); // no-op if already correct type
  console.log('  ✓ platform_users role column typed');

  // platform_sessions
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS platform_sessions (
      id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      platform_user_id      UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
      status                platform_session_status NOT NULL DEFAULT 'active',
      ip_address            TEXT,
      user_agent            TEXT,
      mfa_verified          BOOLEAN NOT NULL DEFAULT false,
      impersonating_org_id  UUID,
      impersonation_reason  TEXT,
      last_active           TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at            TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '8 hours'),
      created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_platform_sessions_user ON platform_sessions(platform_user_id);
    CREATE INDEX IF NOT EXISTS idx_platform_sessions_status ON platform_sessions(status);
  `);
  console.log('  ✓ platform_sessions');

  // feature_flags
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS feature_flags (
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
  `);
  console.log('  ✓ feature_flags');

  // tenant_feature_overrides
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS tenant_feature_overrides (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      flag_key        TEXT NOT NULL REFERENCES feature_flags(key) ON DELETE CASCADE,
      enabled         BOOLEAN NOT NULL,
      reason          TEXT,
      set_by          UUID REFERENCES platform_users(id),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(organization_id, flag_key)
    );
  `);
  console.log('  ✓ tenant_feature_overrides');

  // platform_audit_logs
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS platform_audit_logs (
      id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      platform_user_id     UUID REFERENCES platform_users(id),
      platform_user_email  TEXT,
      action               pa_audit_action NOT NULL,
      target_type          TEXT,
      target_id            TEXT,
      target_label         TEXT,
      details              JSONB,
      ip_address           TEXT,
      session_id           UUID,
      impersonating_org_id UUID,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_pa_audit_user    ON platform_audit_logs(platform_user_id);
    CREATE INDEX IF NOT EXISTS idx_pa_audit_action  ON platform_audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_pa_audit_created ON platform_audit_logs(created_at DESC);
  `);
  console.log('  ✓ platform_audit_logs');

  // system_health_snapshots
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS system_health_snapshots (
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
  `);
  console.log('  ✓ system_health_snapshots');

  // platform_notifications
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS platform_notifications (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title            TEXT NOT NULL,
      body             TEXT NOT NULL,
      severity         TEXT NOT NULL DEFAULT 'info',
      target_org_ids   UUID[],
      sent_by          UUID REFERENCES platform_users(id),
      sent_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      read_by_org_ids  UUID[] NOT NULL DEFAULT '{}'
    );
  `);
  console.log('  ✓ platform_notifications');

  // platform_org_notes
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS platform_org_notes (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id  UUID NOT NULL,
      note             TEXT NOT NULL,
      created_by       UUID REFERENCES platform_users(id),
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_pa_org_notes_org ON platform_org_notes(organization_id);
  `);
  console.log('  ✓ platform_org_notes');

  // platform_support_tickets
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS platform_support_tickets (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id  UUID,
      title            TEXT NOT NULL,
      description      TEXT,
      status           TEXT NOT NULL DEFAULT 'open',
      priority         TEXT NOT NULL DEFAULT 'medium',
      assigned_to      UUID REFERENCES platform_users(id),
      created_by       UUID REFERENCES platform_users(id),
      resolved_at      TIMESTAMPTZ,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log('  ✓ platform_support_tickets');

  // Seed feature flags (idempotent via ON CONFLICT DO NOTHING)
  await sql.unsafe(`
    INSERT INTO feature_flags (key, name, description, enabled, scope) VALUES
      ('ai_governance',          'AI Governance Module',           'AI Governance™ module access',                    true,  'global'),
      ('regulatory_intelligence','Regulatory Intelligence',        'Regulatory Intelligence™ module',                 true,  'global'),
      ('trust_api_platform',     'Trust API Platform',             'Trust API Platform™ module',                      true,  'global'),
      ('governance_agents',      'Governance Agent Framework',     'Governance Agent Framework™ module',              true,  'global'),
      ('continuous_compliance',  'Continuous Compliance',          'Continuous Compliance™ module',                   true,  'global'),
      ('auditor_collaboration',  'Auditor Collaboration',          'Auditor Collaboration™ module',                   true,  'global'),
      ('executive_reporting',    'Executive Reporting',            'Executive Reporting & Analytics™',                true,  'global'),
      ('benchmarking',           'Benchmarking',                   'Governance Benchmarking™',                        true,  'global'),
      ('trust_verification',     'Trust Verification Authority',   'Trust Verification Authority™',                   true,  'global'),
      ('asset_intelligence',     'Asset Intelligence',             'Asset Intelligence™ module',                      true,  'global'),
      ('security_command_center','Security Command Center',        'Security Command Center™',                        true,  'global'),
      ('toe',                    'Trust Operations Engine',        'Trust Operations Engine™',                        true,  'global'),
      ('platform_services',      'Platform Services',              'Platform-wide services (activity, tasks, search)',true,  'global'),
      ('beta_renewal_workspace', 'Beta: Vendor Renewal Workspace', 'Epic 1 vendor lifecycle renewal UI',              false, 'global'),
      ('beta_lifecycle_engine',  'Beta: Lifecycle State Machine',  'Epic 1 vendor lifecycle state machine',           false, 'global')
    ON CONFLICT (key) DO NOTHING;
  `);
  console.log('  ✓ feature_flags seeded (15 flags)');

  console.log('\nDone. All platform admin tables are ready.');
}

run()
  .catch(err => { console.error('\nFailed:', err.message); process.exit(1); })
  .finally(() => sql.end());
