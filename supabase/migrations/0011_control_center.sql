-- Control Center™ — Module 6
-- Extends controls table + adds control_tests + control_vendors + control_frameworks

-- ─── New Enums ────────────────────────────────────────────────────────────────

CREATE TYPE control_type AS ENUM (
  'preventive', 'detective', 'corrective', 'compensating',
  'administrative', 'technical', 'physical', 'hybrid'
);

CREATE TYPE control_frequency AS ENUM (
  'continuous', 'daily', 'weekly', 'monthly', 'quarterly',
  'semi_annual', 'annual', 'ad_hoc'
);

CREATE TYPE automation_level AS ENUM (
  'manual', 'semi_automated', 'automated', 'ai_assisted'
);

CREATE TYPE control_test_result AS ENUM (
  'passed', 'failed', 'partially_effective', 'exception', 'not_tested'
);

-- ─── Extend controls table ────────────────────────────────────────────────────

-- Make frameworkId nullable (controls become platform entities)
ALTER TABLE controls ALTER COLUMN framework_id DROP NOT NULL;

-- New columns
ALTER TABLE controls
  ADD COLUMN IF NOT EXISTS objective          text,
  ADD COLUMN IF NOT EXISTS control_type      control_type,
  ADD COLUMN IF NOT EXISTS owner_id          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS frequency         control_frequency,
  ADD COLUMN IF NOT EXISTS automation_level  automation_level DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS health_score      integer CHECK (health_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS effectiveness_score integer CHECK (effectiveness_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS last_tested       date,
  ADD COLUMN IF NOT EXISTS next_test_date    date,
  ADD COLUMN IF NOT EXISTS next_review_date  date;

-- ─── control_frameworks: many-to-many control ↔ framework ────────────────────

CREATE TABLE IF NOT EXISTS control_frameworks (
  control_id    uuid NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  framework_id  uuid NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (control_id, framework_id)
);

CREATE INDEX IF NOT EXISTS control_frameworks_framework_idx ON control_frameworks(framework_id);

-- ─── control_vendors: many-to-many control ↔ vendor ──────────────────────────

CREATE TABLE IF NOT EXISTS control_vendors (
  control_id   uuid NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  vendor_id    uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (control_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS control_vendors_vendor_idx ON control_vendors(vendor_id);

-- ─── control_tests ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS control_tests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  control_id    uuid NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  test_date     date NOT NULL,
  tester_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  tester_name   text,
  method        text,
  result        control_test_result NOT NULL DEFAULT 'not_tested',
  evidence_ref  text,
  comments      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS control_tests_control_idx ON control_tests(control_id);
CREATE INDEX IF NOT EXISTS control_tests_org_idx ON control_tests(organization_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE control_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_vendors    ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_tests      ENABLE ROW LEVEL SECURITY;

-- control_frameworks — org members can read; owners/admins/compliance/security can write
CREATE POLICY "org members can read control_frameworks"
  ON control_frameworks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM controls c
    JOIN memberships m ON m.organization_id = c.organization_id
    WHERE c.id = control_frameworks.control_id
      AND m.user_id = auth.uid()
      AND m.is_active = true
  ));

CREATE POLICY "compliance roles can manage control_frameworks"
  ON control_frameworks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM controls c
    JOIN memberships m ON m.organization_id = c.organization_id
    WHERE c.id = control_frameworks.control_id
      AND m.user_id = auth.uid()
      AND m.is_active = true
      AND m.role = ANY(ARRAY['owner','admin','compliance_manager','security_manager']::public.membership_role[])
  ));

-- control_vendors
CREATE POLICY "org members can read control_vendors"
  ON control_vendors FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM controls c
    JOIN memberships m ON m.organization_id = c.organization_id
    WHERE c.id = control_vendors.control_id
      AND m.user_id = auth.uid()
      AND m.is_active = true
  ));

CREATE POLICY "compliance roles can manage control_vendors"
  ON control_vendors FOR ALL
  USING (EXISTS (
    SELECT 1 FROM controls c
    JOIN memberships m ON m.organization_id = c.organization_id
    WHERE c.id = control_vendors.control_id
      AND m.user_id = auth.uid()
      AND m.is_active = true
      AND m.role = ANY(ARRAY['owner','admin','compliance_manager','security_manager','procurement_manager']::public.membership_role[])
  ));

-- control_tests
CREATE POLICY "org members can read control_tests"
  ON control_tests FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "compliance roles can manage control_tests"
  ON control_tests FOR ALL
  USING (public.has_org_role(organization_id, ARRAY['owner','admin','compliance_manager','security_manager']::public.membership_role[]));
