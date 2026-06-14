-- Migration 0032: Asset Intelligence™
-- 20 tables: assets, asset_types, asset_relationships, asset_dependencies,
-- asset_reviews, asset_scores, asset_alerts, asset_risks, asset_controls,
-- asset_vendors, asset_contracts, asset_policies, asset_regulations,
-- asset_ai_systems, asset_data_flows, asset_incidents, asset_snapshots,
-- asset_owners, asset_tags, asset_criticality_log

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE asset_type_enum AS ENUM (
  'application', 'database', 'api', 'server', 'cloud_resource',
  'data_asset', 'business_process', 'ai_system', 'vendor_service',
  'network_asset', 'endpoint', 'custom'
);

CREATE TYPE asset_status_enum AS ENUM (
  'active', 'inactive', 'retired', 'planned', 'deprecated', 'under_review'
);

CREATE TYPE asset_env_enum AS ENUM (
  'production', 'staging', 'development', 'testing', 'dr', 'sandbox'
);

CREATE TYPE asset_criticality_enum AS ENUM (
  'low', 'medium', 'high', 'critical', 'mission_critical'
);

CREATE TYPE asset_data_class_enum AS ENUM (
  'public', 'internal', 'confidential', 'restricted', 'critical'
);

CREATE TYPE asset_relationship_type_enum AS ENUM (
  'depends_on', 'uses', 'stores', 'processes', 'connects_to',
  'owned_by', 'provided_by', 'supports', 'protected_by', 'governed_by',
  'impacted_by', 'monitored_by'
);

CREATE TYPE asset_alert_type_enum AS ENUM (
  'unreviewed', 'missing_owner', 'missing_controls', 'missing_risk_assessment',
  'missing_classification', 'critical_change', 'score_drop', 'custom'
);

-- ─── asset_types ─────────────────────────────────────────────────────────────

CREATE TABLE asset_types (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  icon            TEXT,
  is_builtin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_types_org ON asset_types(organization_id);

-- Seed built-in types (organization_id = NULL means global)
INSERT INTO asset_types (name, description, icon, is_builtin) VALUES
  ('Application',      'Software applications and systems',           'monitor',      TRUE),
  ('Database',         'Databases and data stores',                   'database',     TRUE),
  ('API',              'APIs and integration endpoints',              'zap',          TRUE),
  ('Server',           'Physical and virtual servers',                'server',       TRUE),
  ('Cloud Resource',   'Cloud-hosted infrastructure resources',       'cloud',        TRUE),
  ('Data Asset',       'Data collections and datasets',               'file-text',    TRUE),
  ('Business Process', 'Business processes and workflows',            'git-branch',   TRUE),
  ('AI System',        'AI models and AI-powered systems',            'brain',        TRUE),
  ('Vendor Service',   'External services provided by vendors',       'building-2',   TRUE),
  ('Network Asset',    'Network infrastructure and components',       'network',      TRUE),
  ('Endpoint',         'End-user devices and endpoints',              'laptop',       TRUE),
  ('Custom',           'Custom asset type',                           'box',          TRUE);

-- ─── assets ──────────────────────────────────────────────────────────────────

CREATE TABLE assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  asset_type      asset_type_enum NOT NULL DEFAULT 'application',
  category        TEXT,
  status          asset_status_enum NOT NULL DEFAULT 'active',
  environment     asset_env_enum NOT NULL DEFAULT 'production',
  criticality     asset_criticality_enum NOT NULL DEFAULT 'medium',
  data_class      asset_data_class_enum,
  owner_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  business_unit   TEXT,
  location        TEXT,
  cloud_provider  TEXT,
  technology_stack TEXT,
  compliance_scope TEXT[],
  contains_pii    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  is_cross_border BOOLEAN NOT NULL DEFAULT FALSE,
  encryption_status TEXT,
  recovery_time_objective TEXT,
  recovery_point_objective TEXT,
  vendor_id       UUID REFERENCES vendors(id) ON DELETE SET NULL,
  trust_score     INTEGER,
  trust_score_at  TIMESTAMPTZ,
  last_review_at  TIMESTAMPTZ,
  next_review_at  TIMESTAMPTZ,
  notes           TEXT,
  external_id     TEXT,
  metadata        JSONB DEFAULT '{}',
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_org ON assets(organization_id);
CREATE INDEX idx_assets_type ON assets(organization_id, asset_type);
CREATE INDEX idx_assets_criticality ON assets(organization_id, criticality);
CREATE INDEX idx_assets_status ON assets(organization_id, status);
CREATE INDEX idx_assets_owner ON assets(owner_id);

-- ─── asset_owners (multiple owners per asset) ────────────────────────────────

CREATE TABLE asset_owners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_type      TEXT NOT NULL DEFAULT 'business', -- business, technical, security, privacy
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE (asset_id, profile_id)
);

CREATE INDEX idx_asset_owners_asset ON asset_owners(asset_id);
CREATE INDEX idx_asset_owners_org ON asset_owners(organization_id);

-- ─── asset_tags ──────────────────────────────────────────────────────────────

CREATE TABLE asset_tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  tag             TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_tags_asset ON asset_tags(asset_id);
CREATE INDEX idx_asset_tags_org ON asset_tags(organization_id);

-- ─── asset_relationships ─────────────────────────────────────────────────────

CREATE TABLE asset_relationships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_asset_id   UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  target_asset_id   UUID REFERENCES assets(id) ON DELETE SET NULL,
  -- for cross-entity relationships
  target_entity_type TEXT, -- vendor, risk, control, contract, regulation, ai_system
  target_entity_id   UUID,
  relationship_type  asset_relationship_type_enum NOT NULL,
  description        TEXT,
  is_critical        BOOLEAN NOT NULL DEFAULT FALSE,
  created_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_rel_source ON asset_relationships(source_asset_id);
CREATE INDEX idx_asset_rel_org ON asset_relationships(organization_id);

-- ─── asset_dependencies ──────────────────────────────────────────────────────

CREATE TABLE asset_dependencies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  depends_on_id   UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'runtime', -- runtime, build, data, network
  is_critical     BOOLEAN NOT NULL DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asset_id, depends_on_id)
);

CREATE INDEX idx_asset_deps_asset ON asset_dependencies(asset_id);
CREATE INDEX idx_asset_deps_org ON asset_dependencies(organization_id);

-- ─── asset_reviews ───────────────────────────────────────────────────────────

CREATE TABLE asset_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  reviewer_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  review_type     TEXT NOT NULL DEFAULT 'periodic', -- periodic, triggered, security, compliance
  outcome         TEXT NOT NULL DEFAULT 'no_change', -- no_change, updated, escalated, retired
  findings        TEXT,
  recommendations TEXT,
  next_review_at  DATE,
  reviewed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_reviews_asset ON asset_reviews(asset_id);
CREATE INDEX idx_asset_reviews_org ON asset_reviews(organization_id);

-- ─── asset_scores ────────────────────────────────────────────────────────────

CREATE TABLE asset_scores (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id              UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  trust_score           INTEGER NOT NULL DEFAULT 0,
  security_controls     INTEGER NOT NULL DEFAULT 0,  -- 0-100
  compliance_coverage   INTEGER NOT NULL DEFAULT 0,
  risk_posture          INTEGER NOT NULL DEFAULT 0,
  data_protection       INTEGER NOT NULL DEFAULT 0,
  operational_health    INTEGER NOT NULL DEFAULT 0,
  monitoring_coverage   INTEGER NOT NULL DEFAULT 0,
  trigger_event         TEXT NOT NULL DEFAULT 'computed',
  computed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_scores_asset ON asset_scores(asset_id);
CREATE INDEX idx_asset_scores_org ON asset_scores(organization_id);

-- ─── asset_alerts ────────────────────────────────────────────────────────────

CREATE TABLE asset_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id        UUID REFERENCES assets(id) ON DELETE CASCADE,
  alert_type      asset_alert_type_enum NOT NULL DEFAULT 'custom',
  severity        TEXT NOT NULL DEFAULT 'medium',
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'open', -- open, acknowledged, resolved
  due_date        DATE,
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_alerts_org ON asset_alerts(organization_id);
CREATE INDEX idx_asset_alerts_asset ON asset_alerts(asset_id);
CREATE INDEX idx_asset_alerts_status ON asset_alerts(organization_id, status);

-- ─── asset_data_flows ────────────────────────────────────────────────────────

CREATE TABLE asset_data_flows (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  target_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  target_name     TEXT,
  data_types      TEXT[],
  flow_purpose    TEXT,
  is_cross_border BOOLEAN NOT NULL DEFAULT FALSE,
  destination_country TEXT,
  encryption_in_transit BOOLEAN NOT NULL DEFAULT FALSE,
  data_volume     TEXT,
  frequency       TEXT NOT NULL DEFAULT 'continuous',
  legal_basis     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_flows_source ON asset_data_flows(source_asset_id);
CREATE INDEX idx_asset_flows_org ON asset_data_flows(organization_id);

-- ─── asset_incidents ─────────────────────────────────────────────────────────

CREATE TABLE asset_incidents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  severity        TEXT NOT NULL DEFAULT 'medium',
  status          TEXT NOT NULL DEFAULT 'open', -- open, investigating, contained, resolved
  root_cause      TEXT,
  remediation     TEXT,
  occurred_at     TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  reported_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_incidents_asset ON asset_incidents(asset_id);
CREATE INDEX idx_asset_incidents_org ON asset_incidents(organization_id);

-- ─── asset_snapshots ─────────────────────────────────────────────────────────

CREATE TABLE asset_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  total_assets    INTEGER NOT NULL DEFAULT 0,
  active_assets   INTEGER NOT NULL DEFAULT 0,
  critical_assets INTEGER NOT NULL DEFAULT 0,
  assets_by_type  JSONB DEFAULT '{}',
  assets_by_env   JSONB DEFAULT '{}',
  avg_trust_score INTEGER,
  open_alerts     INTEGER NOT NULL DEFAULT 0,
  snapshotted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_snapshots_org ON asset_snapshots(organization_id);

-- ─── asset_criticality_log ───────────────────────────────────────────────────

CREATE TABLE asset_criticality_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  previous_level  asset_criticality_enum,
  new_level       asset_criticality_enum NOT NULL,
  reason          TEXT,
  changed_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_crit_log_asset ON asset_criticality_log(asset_id);

-- ─── Junction tables ─────────────────────────────────────────────────────────

CREATE TABLE asset_risks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  risk_id         UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asset_id, risk_id)
);
CREATE INDEX idx_asset_risks_asset ON asset_risks(asset_id);

CREATE TABLE asset_controls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  control_id      UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asset_id, control_id)
);
CREATE INDEX idx_asset_controls_asset ON asset_controls(asset_id);

CREATE TABLE asset_vendors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  access_type     TEXT NOT NULL DEFAULT 'provides', -- provides, manages, accesses, stores
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asset_id, vendor_id)
);
CREATE INDEX idx_asset_vendors_asset ON asset_vendors(asset_id);

CREATE TABLE asset_contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  contract_id     UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asset_id, contract_id)
);
CREATE INDEX idx_asset_contracts_asset ON asset_contracts(asset_id);

CREATE TABLE asset_regulations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  regulation_id   UUID NOT NULL REFERENCES regulations(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asset_id, regulation_id)
);
CREATE INDEX idx_asset_regulations_asset ON asset_regulations(asset_id);

CREATE TABLE asset_ai_systems (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  ai_system_id    UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asset_id, ai_system_id)
);
CREATE INDEX idx_asset_ai_systems_asset ON asset_ai_systems(asset_id);

-- ─── RLS Policies ────────────────────────────────────────────────────────────

ALTER TABLE asset_types           ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets                ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_owners          ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_tags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_relationships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_dependencies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_scores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_alerts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_data_flows      ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_incidents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_snapshots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_criticality_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_risks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_controls        ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_vendors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_contracts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_regulations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_ai_systems      ENABLE ROW LEVEL SECURITY;

-- asset_types: builtin (org_id IS NULL) visible to all; org-specific only to members
CREATE POLICY "org_asset_types" ON asset_types
  FOR ALL USING (organization_id IS NULL OR is_org_member(organization_id));

-- main assets table
CREATE POLICY "org_assets" ON assets
  FOR ALL USING (is_org_member(organization_id));

-- helper for junction validation
CREATE OR REPLACE FUNCTION is_asset_member(p_asset_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM assets WHERE id = p_asset_id AND is_org_member(organization_id)
  );
$$;

CREATE POLICY "org_asset_owners"    ON asset_owners          FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org_asset_tags"      ON asset_tags            FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org_asset_rels"      ON asset_relationships   FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org_asset_deps"      ON asset_dependencies    FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org_asset_reviews"   ON asset_reviews         FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org_asset_scores"    ON asset_scores          FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org_asset_alerts"    ON asset_alerts          FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org_asset_flows"     ON asset_data_flows      FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org_asset_incidents" ON asset_incidents       FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org_asset_snapshots" ON asset_snapshots       FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org_asset_crit_log"  ON asset_criticality_log FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org_asset_risks"     ON asset_risks           FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org_asset_controls"  ON asset_controls        FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org_asset_vendors"   ON asset_vendors         FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org_asset_contracts" ON asset_contracts       FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org_asset_regs"      ON asset_regulations     FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org_asset_ai"        ON asset_ai_systems      FOR ALL USING (is_org_member(organization_id));
