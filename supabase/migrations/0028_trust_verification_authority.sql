-- Migration 0028: Trust Verification Authority™
-- Module 23 — Trust Verification Authority™ (TVA™)
-- Idempotent: uses IF NOT EXISTS throughout

-- ============================================================
-- 1. verification_programs — built-in + custom programs
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_programs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  slug                  text NOT NULL,
  description           text,
  program_type          text NOT NULL DEFAULT 'custom'
                          CHECK (program_type IN ('builtin','custom')),
  status                text NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','inactive','archived')),
  min_trust_score       integer NOT NULL DEFAULT 85,
  min_control_health    integer NOT NULL DEFAULT 80,
  min_evidence_coverage integer NOT NULL DEFAULT 80,
  required_controls     jsonb NOT NULL DEFAULT '[]',
  required_evidence     jsonb NOT NULL DEFAULT '[]',
  required_assessments  jsonb NOT NULL DEFAULT '[]',
  requirements          jsonb NOT NULL DEFAULT '[]',
  review_frequency      text NOT NULL DEFAULT 'annual'
                          CHECK (review_frequency IN ('quarterly','semi_annual','annual','biennial')),
  validity_months       integer NOT NULL DEFAULT 12,
  badge_color           text NOT NULL DEFAULT '#6366f1',
  badge_icon            text,
  is_public             boolean NOT NULL DEFAULT true,
  created_by            uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vp_slug_org ON verification_programs(slug, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX IF NOT EXISTS idx_vp_org ON verification_programs(organization_id);
CREATE INDEX IF NOT EXISTS idx_vp_type ON verification_programs(program_type);

-- ============================================================
-- 2. tva_verifications — verification applications
-- ============================================================
CREATE TABLE IF NOT EXISTS tva_verifications (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id              uuid NOT NULL REFERENCES verification_programs(id) ON DELETE RESTRICT,
  certificate_id          uuid,
  status                  text NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','in_review','approved','conditionally_approved','rejected','suspended','revoked','expired','renewal_required')),
  verification_level      text NOT NULL DEFAULT 'level_1'
                            CHECK (verification_level IN ('level_1','level_2','level_3','level_4')),
  readiness_score         integer,
  trust_score_at_apply    integer,
  applied_at              timestamptz NOT NULL DEFAULT now(),
  review_started_at       timestamptz,
  decided_at              timestamptz,
  expires_at              timestamptz,
  last_monitored_at       timestamptz,
  applicant_id            uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  assigned_reviewer_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  decision_notes          text,
  conditions              jsonb NOT NULL DEFAULT '[]',
  suspension_reason       text,
  revocation_reason       text,
  metadata                jsonb NOT NULL DEFAULT '{}',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tv_org        ON tva_verifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_tv_program    ON tva_verifications(program_id);
CREATE INDEX IF NOT EXISTS idx_tv_status     ON tva_verifications(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tv_expires    ON tva_verifications(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================
-- 3. verification_reviews — review records per verification
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_reviews (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  verification_id     uuid NOT NULL REFERENCES tva_verifications(id) ON DELETE CASCADE,
  review_type         text NOT NULL DEFAULT 'initial'
                        CHECK (review_type IN ('initial','annual','quarterly','event_driven','appeal','renewal')),
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','in_progress','completed','cancelled')),
  reviewer_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewer_notes      text,
  checklist           jsonb NOT NULL DEFAULT '{}',
  score               integer,
  recommendation      text CHECK (recommendation IN ('approve','conditionally_approve','reject','suspend','defer')),
  started_at          timestamptz,
  completed_at        timestamptz,
  due_date            date,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vr_org            ON verification_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_vr_verification   ON verification_reviews(verification_id);

-- ============================================================
-- 4. verification_evidence — evidence submitted per verification
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_evidence (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  verification_id     uuid NOT NULL REFERENCES tva_verifications(id) ON DELETE CASCADE,
  evidence_type       text NOT NULL DEFAULT 'policy'
                        CHECK (evidence_type IN ('policy','control_test','audit_report','risk_register','vendor_assessment','privacy_record','contract','ai_assessment','trust_score','compliance_report','custom')),
  title               text NOT NULL,
  description         text,
  source_id           uuid,
  source_table        text,
  file_url            text,
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','rejected','requires_update')),
  reviewer_notes      text,
  freshness_days      integer,
  submitted_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  submitted_at        timestamptz NOT NULL DEFAULT now(),
  reviewed_at         timestamptz,
  expires_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ve_org           ON verification_evidence(organization_id);
CREATE INDEX IF NOT EXISTS idx_ve_verification  ON verification_evidence(verification_id);

-- ============================================================
-- 5. verification_badges — issued trust badges
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_badges (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  verification_id     uuid NOT NULL REFERENCES tva_verifications(id) ON DELETE CASCADE,
  program_id          uuid NOT NULL REFERENCES verification_programs(id) ON DELETE RESTRICT,
  badge_type          text NOT NULL DEFAULT 'audt_verified'
                        CHECK (badge_type IN ('audt_verified','trusted_vendor','privacy_ready','ai_governed','enterprise_ready','risk_managed','compliance_ready','trust_leader','custom')),
  name                text NOT NULL,
  description         text,
  status              text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','suspended','revoked','expired')),
  issued_at           timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz,
  revoked_at          timestamptz,
  revocation_reason   text,
  badge_data          jsonb NOT NULL DEFAULT '{}',
  issued_by           uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vb_org           ON verification_badges(organization_id);
CREATE INDEX IF NOT EXISTS idx_vb_verification  ON verification_badges(verification_id);
CREATE INDEX IF NOT EXISTS idx_vb_status        ON verification_badges(organization_id, status);

-- ============================================================
-- 6. verification_certificates — issued trust certificates
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_certificates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  verification_id     uuid NOT NULL REFERENCES tva_verifications(id) ON DELETE CASCADE,
  program_id          uuid NOT NULL REFERENCES verification_programs(id) ON DELETE RESTRICT,
  certificate_number  text NOT NULL UNIQUE,
  verification_level  text NOT NULL DEFAULT 'level_1',
  status              text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','suspended','revoked','expired')),
  issued_at           timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz NOT NULL,
  revoked_at          timestamptz,
  revocation_reason   text,
  verification_hash   text NOT NULL,
  public_url          text NOT NULL,
  qr_data             text,
  issued_by           uuid REFERENCES profiles(id) ON DELETE SET NULL,
  certificate_data    jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vc_org           ON verification_certificates(organization_id);
CREATE INDEX IF NOT EXISTS idx_vc_verification  ON verification_certificates(verification_id);
CREATE INDEX IF NOT EXISTS idx_vc_number        ON verification_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_vc_status        ON verification_certificates(status);

-- ============================================================
-- 7. verification_registry — public trust registry entries
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_registry (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  certificate_id      uuid NOT NULL REFERENCES verification_certificates(id) ON DELETE CASCADE,
  display_name        text NOT NULL,
  industry            text,
  country             text,
  trust_score         integer,
  verification_level  text NOT NULL DEFAULT 'level_1',
  program_name        text NOT NULL,
  badge_types         jsonb NOT NULL DEFAULT '[]',
  is_public           boolean NOT NULL DEFAULT true,
  published_at        timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vreg_cert ON verification_registry(certificate_id);
CREATE INDEX IF NOT EXISTS idx_vreg_org   ON verification_registry(organization_id);
CREATE INDEX IF NOT EXISTS idx_vreg_pub   ON verification_registry(is_public, expires_at);

-- ============================================================
-- 8. verification_events — audit trail of all TVA events
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  verification_id     uuid REFERENCES tva_verifications(id) ON DELETE CASCADE,
  event_type          text NOT NULL,
  actor_id            uuid REFERENCES profiles(id) ON DELETE SET NULL,
  details             jsonb NOT NULL DEFAULT '{}',
  ip_address          text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vev_org          ON verification_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_vev_verification ON verification_events(verification_id);
CREATE INDEX IF NOT EXISTS idx_vev_type         ON verification_events(organization_id, event_type);

-- ============================================================
-- 9. verification_renewals — renewal tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_renewals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  verification_id     uuid NOT NULL REFERENCES tva_verifications(id) ON DELETE CASCADE,
  certificate_id      uuid REFERENCES verification_certificates(id) ON DELETE SET NULL,
  status              text NOT NULL DEFAULT 'upcoming'
                        CHECK (status IN ('upcoming','due_soon','in_progress','renewed','expired','cancelled')),
  renewal_due_date    date NOT NULL,
  started_at          timestamptz,
  completed_at        timestamptz,
  previous_cert_id    uuid REFERENCES verification_certificates(id) ON DELETE SET NULL,
  initiated_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vrn_org          ON verification_renewals(organization_id);
CREATE INDEX IF NOT EXISTS idx_vrn_verification ON verification_renewals(verification_id);
CREATE INDEX IF NOT EXISTS idx_vrn_due          ON verification_renewals(renewal_due_date);

-- ============================================================
-- 10. verification_assessments — structured verification assessment
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_assessments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  verification_id     uuid NOT NULL REFERENCES tva_verifications(id) ON DELETE CASCADE,
  assessor_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  governance_score    integer,
  risk_score          integer,
  control_score       integer,
  compliance_score    integer,
  privacy_score       integer,
  contract_score      integer,
  vendor_score        integer,
  ai_governance_score integer,
  overall_score       integer,
  findings            jsonb NOT NULL DEFAULT '[]',
  recommendations     jsonb NOT NULL DEFAULT '[]',
  ai_summary          text,
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','in_progress','completed')),
  assessed_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_va_org           ON verification_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_va_verification  ON verification_assessments(verification_id);

-- ============================================================
-- 11. verification_decisions — formal decision record
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_decisions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  verification_id     uuid NOT NULL REFERENCES tva_verifications(id) ON DELETE CASCADE,
  decision            text NOT NULL
                        CHECK (decision IN ('approved','conditionally_approved','rejected','suspended','revoked','expired','renewal_required')),
  decided_by          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  rationale           text,
  conditions          jsonb NOT NULL DEFAULT '[]',
  effective_date      date,
  review_date         date,
  appeal_deadline     date,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vd_org           ON verification_decisions(organization_id);
CREATE INDEX IF NOT EXISTS idx_vd_verification  ON verification_decisions(verification_id);

-- ============================================================
-- 12. verification_auditors — authorized verification officers
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_auditors (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role                text NOT NULL DEFAULT 'trust_reviewer'
                        CHECK (role IN ('verification_manager','trust_reviewer','compliance_reviewer','privacy_reviewer','ai_governance_reviewer','lead_approver','external_reviewer')),
  status              text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','inactive')),
  specializations     jsonb NOT NULL DEFAULT '[]',
  assigned_at         timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_vaud_org ON verification_auditors(organization_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE verification_programs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tva_verifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_evidence      ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_badges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_certificates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_registry      ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_renewals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_assessments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_decisions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_auditors      ENABLE ROW LEVEL SECURITY;

-- verification_programs: builtin programs visible to all org members; custom programs scoped to org
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_programs' AND policyname = 'vp_select') THEN
    CREATE POLICY vp_select ON verification_programs FOR SELECT USING (
      program_type = 'builtin' OR (organization_id IS NOT NULL AND is_org_member(organization_id))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_programs' AND policyname = 'vp_insert') THEN
    CREATE POLICY vp_insert ON verification_programs FOR INSERT WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_programs' AND policyname = 'vp_update') THEN
    CREATE POLICY vp_update ON verification_programs FOR UPDATE USING (is_org_member(organization_id));
  END IF;
END $$;

-- All other tables: scoped by organization_id membership
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tva_verifications' AND policyname = 'tv_all') THEN
    CREATE POLICY tv_all ON tva_verifications USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_reviews' AND policyname = 'vr_all') THEN
    CREATE POLICY vr_all ON verification_reviews USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_evidence' AND policyname = 've_all') THEN
    CREATE POLICY ve_all ON verification_evidence USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_badges' AND policyname = 'vb_all') THEN
    CREATE POLICY vb_all ON verification_badges USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_certificates' AND policyname = 'vc_all') THEN
    CREATE POLICY vc_all ON verification_certificates USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_registry' AND policyname = 'vreg_all') THEN
    CREATE POLICY vreg_all ON verification_registry USING (is_public = true OR is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_events' AND policyname = 'vev_all') THEN
    CREATE POLICY vev_all ON verification_events USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_renewals' AND policyname = 'vrn_all') THEN
    CREATE POLICY vrn_all ON verification_renewals USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_assessments' AND policyname = 'va_all') THEN
    CREATE POLICY va_all ON verification_assessments USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_decisions' AND policyname = 'vd_all') THEN
    CREATE POLICY vd_all ON verification_decisions USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_auditors' AND policyname = 'vaud_all') THEN
    CREATE POLICY vaud_all ON verification_auditors USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
  END IF;
END $$;

-- ============================================================
-- Seed built-in verification programs
-- ============================================================
INSERT INTO verification_programs (
  id, organization_id, name, slug, description, program_type, status,
  min_trust_score, min_control_health, min_evidence_coverage,
  requirements, review_frequency, validity_months, badge_color, badge_icon, is_public
) VALUES
  ('10000000-0000-0000-0000-000000000001', NULL, 'AUDT Verified™',       'audt-verified',       'AUDT''s flagship verification program. Demonstrates a strong governance foundation across all key dimensions.', 'builtin', 'active', 85, 80, 80, '[{"id":"ts85","label":"Trust Score ≥ 85"},{"id":"nocritical","label":"No Open Critical Risks"},{"id":"nofindings","label":"No Open Critical Findings"},{"id":"evidence80","label":"Evidence Coverage ≥ 80%"},{"id":"control80","label":"Control Health ≥ 80%"},{"id":"monitoring","label":"Active Monitoring Enabled"}]', 'annual', 12, '#6366f1', 'shield-check', true),
  ('10000000-0000-0000-0000-000000000002', NULL, 'Trusted Vendor™',       'trusted-vendor',       'For organizations demonstrating excellence in vendor governance and supply chain trust.', 'builtin', 'active', 80, 75, 75, '[{"id":"ts80","label":"Trust Score ≥ 80"},{"id":"vendorrisk","label":"Vendor Risk Managed"},{"id":"contracts","label":"Contracts Tracked"}]', 'annual', 12, '#10b981', 'building-2', true),
  ('10000000-0000-0000-0000-000000000003', NULL, 'Privacy Ready™',        'privacy-ready',        'Demonstrates compliance with DPDP, GDPR, and privacy best practices.', 'builtin', 'active', 78, 75, 80, '[{"id":"dpdp","label":"DPDP Privacy Controls Active"},{"id":"consent","label":"Consent Records Maintained"},{"id":"pia","label":"Privacy Assessment Completed"}]', 'annual', 12, '#0ea5e9', 'lock', true),
  ('10000000-0000-0000-0000-000000000004', NULL, 'AI Governed™',          'ai-governed',          'Verifies responsible AI practices including risk management, controls, and compliance frameworks.', 'builtin', 'active', 78, 75, 75, '[{"id":"aiinventory","label":"AI System Inventory Maintained"},{"id":"airisks","label":"AI Risks Tracked"},{"id":"aicontrols","label":"AI Controls Active"}]', 'annual', 12, '#a855f7', 'brain', true),
  ('10000000-0000-0000-0000-000000000005', NULL, 'Risk Managed™',         'risk-managed',         'Demonstrates a mature, active risk management program with treatments and reviews.', 'builtin', 'active', 80, 75, 75, '[{"id":"ts80","label":"Trust Score ≥ 80"},{"id":"riskregister","label":"Risk Register Active"},{"id":"treatments","label":"Treatments in Progress"}]', 'annual', 12, '#f59e0b', 'alert-triangle', true),
  ('10000000-0000-0000-0000-000000000006', NULL, 'Enterprise Ready™',     'enterprise-ready',     'Comprehensive verification for organizations ready for enterprise procurement and partnership.', 'builtin', 'active', 88, 85, 85, '[{"id":"ts88","label":"Trust Score ≥ 88"},{"id":"audit","label":"Audit Completed"},{"id":"compliance","label":"Compliance Framework Active"},{"id":"contracts","label":"Contract Governance Active"}]', 'annual', 12, '#ec4899', 'star', true),
  ('10000000-0000-0000-0000-000000000007', NULL, 'Audit Ready™',          'audit-ready',          'Certifies that an organization is prepared for external audits with evidence and controls in place.', 'builtin', 'active', 80, 78, 82, '[{"id":"audits","label":"Audit Program Active"},{"id":"evidence","label":"Evidence Vault Maintained"},{"id":"capasdone","label":"CAPAs Resolved"}]', 'annual', 12, '#14b8a6', 'clipboard-check', true),
  ('10000000-0000-0000-0000-000000000008', NULL, 'Compliance Ready™',     'compliance-ready',     'Verifies readiness across one or more compliance frameworks including ISO 27001, SOC 2, and DPDP.', 'builtin', 'active', 78, 75, 85, '[{"id":"framework","label":"Framework Adopted"},{"id":"controls","label":"Controls Mapped"},{"id":"gaps","label":"Gaps Remediated"}]', 'annual', 12, '#f97316', 'shield', true),
  ('10000000-0000-0000-0000-000000000009', NULL, 'DPDP Ready™',           'dpdp-ready',           'Specialized verification for India DPDP Act 2023 compliance readiness.', 'builtin', 'active', 75, 73, 80, '[{"id":"dpdp","label":"DPDP Privacy Module Active"},{"id":"consent","label":"Consent Records Maintained"},{"id":"dsrprocess","label":"DSR Process Defined"}]', 'annual', 12, '#06b6d4', 'flag', true),
  ('10000000-0000-0000-0000-000000000010', NULL, 'ISO Ready™',            'iso-ready',            'Indicates readiness for ISO 27001 certification based on AUDT governance data.', 'builtin', 'active', 80, 80, 85, '[{"id":"iso27001","label":"ISO 27001 Framework Adopted"},{"id":"controls93","label":"93+ Controls Mapped"},{"id":"auditready","label":"Internal Audit Completed"}]', 'annual', 12, '#8b5cf6', 'award', true)
ON CONFLICT DO NOTHING;
