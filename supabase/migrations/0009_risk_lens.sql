-- Migration 0009: Risk Lens™ Module
-- Creates enums and tables for the Risk Management module

-- Enums
CREATE TYPE risk_category AS ENUM (
  'operational', 'cyber_security', 'compliance', 'vendor', 'privacy',
  'financial', 'legal', 'strategic', 'technology', 'business_continuity',
  'third_party', 'regulatory', 'custom'
);

CREATE TYPE risk_status AS ENUM (
  'identified', 'under_assessment', 'open', 'mitigating',
  'accepted', 'transferred', 'closed', 'archived'
);

CREATE TYPE risk_treatment_strategy AS ENUM (
  'mitigate', 'accept', 'transfer', 'avoid', 'monitor'
);

CREATE TYPE risk_source AS ENUM (
  'manual', 'vendor', 'audit_finding', 'compliance_gap',
  'control_failure', 'policy_exception', 'ai_generated', 'api'
);

CREATE TYPE risk_treatment_status AS ENUM (
  'open', 'in_progress', 'completed', 'cancelled'
);

-- Core risks table
CREATE TABLE risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category risk_category NOT NULL DEFAULT 'operational',
  status risk_status NOT NULL DEFAULT 'identified',
  owner_id UUID REFERENCES profiles(id),
  source risk_source NOT NULL DEFAULT 'manual',
  impact INTEGER NOT NULL DEFAULT 3 CHECK (impact BETWEEN 1 AND 5),
  likelihood INTEGER NOT NULL DEFAULT 3 CHECK (likelihood BETWEEN 1 AND 5),
  inherent_score INTEGER NOT NULL DEFAULT 9,
  residual_score INTEGER,
  treatment_strategy risk_treatment_strategy DEFAULT 'mitigate',
  target_date DATE,
  identified_date DATE,
  last_reviewed_date DATE,
  next_review_date DATE,
  source_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  source_finding_id UUID REFERENCES audit_findings(id) ON DELETE SET NULL,
  source_gap_id UUID REFERENCES gap_analysis(id) ON DELETE SET NULL,
  ai_narrative TEXT,
  ai_narrative_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX risks_org_idx ON risks(organization_id);
CREATE INDEX risks_org_status_idx ON risks(organization_id, status);
CREATE INDEX risks_org_category_idx ON risks(organization_id, category);
CREATE INDEX risks_owner_idx ON risks(owner_id);

-- Risk reviews
CREATE TABLE risk_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id),
  review_date DATE NOT NULL,
  outcome TEXT NOT NULL DEFAULT 'no_change',
  notes TEXT,
  previous_status risk_status,
  new_status risk_status,
  previous_score INTEGER,
  new_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX risk_reviews_risk_idx ON risk_reviews(risk_id);
CREATE INDEX risk_reviews_org_idx ON risk_reviews(organization_id);

-- Risk treatments
CREATE TABLE risk_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id),
  target_date DATE,
  status risk_treatment_status NOT NULL DEFAULT 'open',
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  evidence TEXT,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX risk_treatments_risk_idx ON risk_treatments(risk_id);
CREATE INDEX risk_treatments_org_idx ON risk_treatments(organization_id);
CREATE INDEX risk_treatments_due_idx ON risk_treatments(organization_id, target_date);

-- Relationship tables (many-to-many)
CREATE TABLE risk_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(risk_id, vendor_id)
);
CREATE INDEX risk_vendors_vendor_idx ON risk_vendors(vendor_id);

CREATE TABLE risk_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(risk_id, control_id)
);
CREATE INDEX risk_controls_control_idx ON risk_controls(control_id);

CREATE TABLE risk_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  finding_id UUID NOT NULL REFERENCES audit_findings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(risk_id, finding_id)
);
CREATE INDEX risk_findings_finding_idx ON risk_findings(finding_id);

CREATE TABLE risk_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(risk_id, policy_id)
);
CREATE INDEX risk_policies_policy_idx ON risk_policies(policy_id);

CREATE TABLE risk_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(risk_id, framework_id)
);
CREATE INDEX risk_frameworks_framework_idx ON risk_frameworks(framework_id);

CREATE TABLE risk_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(risk_id, evidence_id)
);
CREATE INDEX risk_evidence_evidence_idx ON risk_evidence(evidence_id);

-- RLS (enabled but policies applied via rls.sql)
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_evidence ENABLE ROW LEVEL SECURITY;
