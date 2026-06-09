-- ============================================================
-- Module 11: DPDP Privacy™
-- ============================================================

-- Enums
CREATE TYPE data_category AS ENUM ('customer','employee','vendor','marketing','financial','health','biometric','custom');
CREATE TYPE sensitivity_level AS ENUM ('low','medium','high','critical');
CREATE TYPE data_asset_status AS ENUM ('active','inactive','archived','under_review');
CREATE TYPE consent_status AS ENUM ('granted','withdrawn','expired','pending','rejected');
CREATE TYPE privacy_request_type AS ENUM ('access','correction','deletion','portability','consent_withdrawal','grievance');
CREATE TYPE privacy_request_status AS ENUM ('submitted','assigned','investigating','completed','closed');
CREATE TYPE privacy_assessment_status AS ENUM ('draft','in_progress','completed','approved','archived');
CREATE TYPE privacy_risk_level AS ENUM ('low','medium','high','critical');
CREATE TYPE transfer_status AS ENUM ('active','pending_approval','approved','rejected','suspended');

-- ── data_assets ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  department TEXT,
  data_category data_category NOT NULL DEFAULT 'custom',
  sensitivity sensitivity_level NOT NULL DEFAULT 'medium',
  purpose TEXT,
  storage_location TEXT,
  retention_period INTEGER,
  cross_border BOOLEAN NOT NULL DEFAULT false,
  status data_asset_status NOT NULL DEFAULT 'active',
  health_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS data_assets_org_idx ON data_assets(organization_id);
CREATE INDEX IF NOT EXISTS data_assets_status_idx ON data_assets(organization_id, status);
CREATE INDEX IF NOT EXISTS data_assets_category_idx ON data_assets(organization_id, data_category);

-- ── consent_records ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL,
  subject_name TEXT,
  subject_email TEXT,
  purpose TEXT NOT NULL,
  consent_status consent_status NOT NULL DEFAULT 'pending',
  data_asset_id UUID REFERENCES data_assets(id) ON DELETE SET NULL,
  obtained_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS consent_records_org_idx ON consent_records(organization_id);
CREATE INDEX IF NOT EXISTS consent_records_status_idx ON consent_records(organization_id, consent_status);
CREATE INDEX IF NOT EXISTS consent_records_subject_idx ON consent_records(organization_id, subject_id);

-- ── privacy_requests (DSR) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS privacy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_type privacy_request_type NOT NULL,
  subject_name TEXT NOT NULL,
  subject_email TEXT NOT NULL,
  status privacy_request_status NOT NULL DEFAULT 'submitted',
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  description TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS privacy_requests_org_idx ON privacy_requests(organization_id);
CREATE INDEX IF NOT EXISTS privacy_requests_status_idx ON privacy_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS privacy_requests_due_idx ON privacy_requests(organization_id, due_date);

-- ── retention_policies ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  data_category data_category NOT NULL DEFAULT 'custom',
  retention_days INTEGER NOT NULL,
  legal_basis TEXT,
  action_on_expiry TEXT NOT NULL DEFAULT 'delete',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS retention_policies_org_idx ON retention_policies(organization_id);

-- ── retention_events ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS retention_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  data_asset_id UUID NOT NULL REFERENCES data_assets(id) ON DELETE CASCADE,
  retention_policy_id UUID REFERENCES retention_policies(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  actioned_at TIMESTAMPTZ,
  actioned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS retention_events_org_idx ON retention_events(organization_id);
CREATE INDEX IF NOT EXISTS retention_events_asset_idx ON retention_events(data_asset_id);

-- ── privacy_assessments (PIA) ────────────────────────────────
CREATE TABLE IF NOT EXISTS privacy_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scope TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  risk_level privacy_risk_level NOT NULL DEFAULT 'medium',
  status privacy_assessment_status NOT NULL DEFAULT 'draft',
  purpose TEXT,
  data_types TEXT,
  risks TEXT,
  mitigations TEXT,
  controls TEXT,
  residual_risk TEXT,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  review_date TIMESTAMPTZ,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS privacy_assessments_org_idx ON privacy_assessments(organization_id);
CREATE INDEX IF NOT EXISTS privacy_assessments_status_idx ON privacy_assessments(organization_id, status);

-- ── data_transfers (cross-border) ────────────────────────────
CREATE TABLE IF NOT EXISTS data_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  data_asset_id UUID REFERENCES data_assets(id) ON DELETE SET NULL,
  destination_country TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  transfer_basis TEXT NOT NULL,
  status transfer_status NOT NULL DEFAULT 'pending_approval',
  risk_notes TEXT,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  review_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS data_transfers_org_idx ON data_transfers(organization_id);
CREATE INDEX IF NOT EXISTS data_transfers_status_idx ON data_transfers(organization_id, status);

-- ── privacy_trust_scores ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS privacy_trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  inventory_score INTEGER NOT NULL DEFAULT 0,
  consent_score INTEGER NOT NULL DEFAULT 0,
  dsr_score INTEGER NOT NULL DEFAULT 0,
  retention_score INTEGER NOT NULL DEFAULT 0,
  risk_score INTEGER NOT NULL DEFAULT 0,
  controls_score INTEGER NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS privacy_trust_scores_org_idx ON privacy_trust_scores(organization_id);
CREATE INDEX IF NOT EXISTS privacy_trust_scores_date_idx ON privacy_trust_scores(organization_id, computed_at);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE data_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_trust_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members access data_assets" ON data_assets FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access consent_records" ON consent_records FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access privacy_requests" ON privacy_requests FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access retention_policies" ON retention_policies FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access retention_events" ON retention_events FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access privacy_assessments" ON privacy_assessments FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access data_transfers" ON data_transfers FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access privacy_trust_scores" ON privacy_trust_scores FOR ALL USING (is_org_member(organization_id));
