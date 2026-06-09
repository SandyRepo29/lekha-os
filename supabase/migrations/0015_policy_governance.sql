-- ============================================================
-- Module 10: Policy Governance™
-- ============================================================

-- Extend policyStatus enum
ALTER TYPE policy_status ADD VALUE IF NOT EXISTS 'published';
ALTER TYPE policy_status ADD VALUE IF NOT EXISTS 'retired';

-- ── Extend policies table ────────────────────────────────────
ALTER TABLE policies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS next_review_date DATE;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 0;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS attestation_required BOOLEAN DEFAULT false;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'everyone';
ALTER TABLE policies ADD COLUMN IF NOT EXISTS change_summary TEXT;

-- ── policy_reviews ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policy_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  review_date DATE NOT NULL,
  outcome TEXT NOT NULL DEFAULT 'approved',
  notes TEXT,
  next_review_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS policy_reviews_policy_idx ON policy_reviews(policy_id);
CREATE INDEX IF NOT EXISTS policy_reviews_org_idx ON policy_reviews(organization_id);

-- ── policy_attestations ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS policy_attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  policy_version TEXT,
  acknowledged_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS policy_attestations_policy_idx ON policy_attestations(policy_id);
CREATE INDEX IF NOT EXISTS policy_attestations_org_idx ON policy_attestations(organization_id);
CREATE INDEX IF NOT EXISTS policy_attestations_user_idx ON policy_attestations(user_id);

-- ── policy_controls ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policy_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(policy_id, control_id)
);

CREATE INDEX IF NOT EXISTS policy_controls_policy_idx ON policy_controls(policy_id);
CREATE INDEX IF NOT EXISTS policy_controls_control_idx ON policy_controls(control_id);

-- ── policy_frameworks ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policy_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(policy_id, framework_id)
);

CREATE INDEX IF NOT EXISTS policy_frameworks_policy_idx ON policy_frameworks(policy_id);
CREATE INDEX IF NOT EXISTS policy_frameworks_framework_idx ON policy_frameworks(framework_id);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE policy_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_reviews_org_member" ON policy_reviews
  FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "policy_attestations_org_member" ON policy_attestations
  FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "policy_controls_org_member" ON policy_controls
  FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "policy_frameworks_org_member" ON policy_frameworks
  FOR ALL USING (is_org_member(organization_id));
