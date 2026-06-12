-- Migration 0025: AI Governance™
-- Module 20 — AI Governance™
-- Idempotent: uses IF NOT EXISTS throughout

-- ============================================================
-- 1. ai_systems
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_systems (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                     text NOT NULL,
  description              text,
  system_type              text NOT NULL CHECK (system_type IN ('commercial','open_source','internal','agent','rag','llm_app','workflow')),
  vendor_name              text,
  model_name               text,
  version                  text,
  owner_id                 uuid REFERENCES profiles(id) ON DELETE SET NULL,
  business_unit            text,
  purpose                  text,
  use_case                 text CHECK (use_case IN ('customer_service','software_development','marketing','hr','legal','finance','sales','operations','custom')),
  risk_classification      text NOT NULL DEFAULT 'moderate' CHECK (risk_classification IN ('low','moderate','high','critical','prohibited')),
  data_classification      text CHECK (data_classification IN ('public','internal','confidential','restricted')),
  approval_status          text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','under_review','approved','rejected','decommissioned')),
  ai_trust_score           numeric(5,2),
  review_date              date,
  last_assessed_at         timestamptz,
  deployment_environment   text CHECK (deployment_environment IN ('production','staging','development','research')),
  is_active                boolean NOT NULL DEFAULT true,
  metadata                 jsonb NOT NULL DEFAULT '{}',
  created_by               uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. ai_vendors
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_vendors (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                text NOT NULL,
  website             text,
  description         text,
  vendor_type         text NOT NULL DEFAULT 'commercial' CHECK (vendor_type IN ('commercial','open_source','custom')),
  risk_rating         text NOT NULL DEFAULT 'moderate' CHECK (risk_rating IN ('low','moderate','high','critical')),
  privacy_posture     text CHECK (privacy_posture IN ('strong','adequate','weak','unknown')),
  security_posture    text CHECK (security_posture IN ('strong','adequate','weak','unknown')),
  contract_status     text CHECK (contract_status IN ('active','expired','pending','none')),
  assessment_status   text CHECK (assessment_status IN ('assessed','pending','overdue','not_required')),
  last_assessed_at    timestamptz,
  trust_score         numeric(5,2),
  notes               text,
  created_by          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. ai_risks
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_risks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ai_system_id     uuid REFERENCES ai_systems(id) ON DELETE SET NULL,
  title            text NOT NULL,
  description      text,
  risk_category    text NOT NULL CHECK (risk_category IN (
                     'hallucination','bias','privacy_leakage','copyright_risk',
                     'prompt_injection','data_poisoning','model_drift','regulatory_risk',
                     'security_risk','vendor_dependency','explainability_risk',
                     'autonomous_decision_risk','other'
                   )),
  likelihood       int NOT NULL DEFAULT 3 CHECK (likelihood BETWEEN 1 AND 5),
  impact           int NOT NULL DEFAULT 3 CHECK (impact BETWEEN 1 AND 5),
  risk_score       int GENERATED ALWAYS AS (likelihood * impact) STORED,
  risk_level       text NOT NULL DEFAULT 'moderate' CHECK (risk_level IN ('low','moderate','high','critical')),
  status           text NOT NULL DEFAULT 'open' CHECK (status IN ('open','mitigating','accepted','closed')),
  treatment        text,
  owner_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  target_date      date,
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. ai_controls
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_controls (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              text NOT NULL,
  description       text,
  control_category  text NOT NULL CHECK (control_category IN (
                      'human_oversight','output_review','prompt_logging','model_approval',
                      'data_classification','access_control','vendor_review','model_monitoring',
                      'content_filtering','red_team_testing','other'
                    )),
  status            text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','implemented','partially_implemented','not_applicable')),
  effectiveness     text CHECK (effectiveness IN ('effective','partially_effective','ineffective','not_tested')),
  owner_id          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  last_tested_at    date,
  next_review_date  date,
  notes             text,
  created_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. ai_policies
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_policies (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             text NOT NULL,
  policy_type      text NOT NULL CHECK (policy_type IN ('acceptable_use','development','procurement','responsible_ai','privacy','security','custom')),
  description      text,
  status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','under_review','archived')),
  version          text NOT NULL DEFAULT '1.0',
  content          text,
  owner_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at      timestamptz,
  review_date      date,
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. ai_assessments
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_assessments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ai_system_id     uuid NOT NULL REFERENCES ai_systems(id) ON DELETE CASCADE,
  assessment_type  text NOT NULL CHECK (assessment_type IN ('impact','risk','vendor','privacy','security','eu_ai_act','custom')),
  title            text NOT NULL,
  status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_progress','completed','approved')),
  score            numeric(5,2),
  findings         jsonb NOT NULL DEFAULT '[]',
  recommendations  jsonb NOT NULL DEFAULT '[]',
  assessor_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  completed_at     timestamptz,
  approved_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at      timestamptz,
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. ai_incidents
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_incidents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ai_system_id     uuid REFERENCES ai_systems(id) ON DELETE SET NULL,
  title            text NOT NULL,
  description      text NOT NULL,
  incident_type    text NOT NULL CHECK (incident_type IN (
                     'hallucination','bias_event','data_exposure','unauthorized_usage',
                     'model_failure','prompt_injection','compliance_violation','other'
                   )),
  severity         text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status           text NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','contained','resolved','closed')),
  root_cause       text,
  remediation      text,
  reporter_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  detected_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. ai_compliance
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_compliance (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework             text NOT NULL CHECK (framework IN ('iso_42001','nist_ai_rmf','eu_ai_act','oecd_ai_principles','dpdp_ai','internal')),
  status                text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','compliant','partial','non_compliant')),
  readiness_score       numeric(5,2) DEFAULT 0,
  total_controls        int NOT NULL DEFAULT 0,
  implemented_controls  int NOT NULL DEFAULT 0,
  open_gaps             int NOT NULL DEFAULT 0,
  last_assessed_at      timestamptz,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, framework)
);

-- ============================================================
-- 9. ai_trust_scores
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_trust_scores (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ai_system_id      uuid NOT NULL REFERENCES ai_systems(id) ON DELETE CASCADE,
  overall_score     numeric(5,2) NOT NULL DEFAULT 0,
  risk_score        numeric(5,2) DEFAULT 0,
  controls_score    numeric(5,2) DEFAULT 0,
  compliance_score  numeric(5,2) DEFAULT 0,
  monitoring_score  numeric(5,2) DEFAULT 0,
  vendor_score      numeric(5,2) DEFAULT 0,
  incident_score    numeric(5,2) DEFAULT 0,
  trust_level       text NOT NULL DEFAULT 'monitored' CHECK (trust_level IN ('trusted','managed','monitored','needs_attention','high_risk','restricted')),
  breakdown         jsonb NOT NULL DEFAULT '{}',
  computed_at       timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. ai_system_controls (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_system_controls (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_system_id uuid NOT NULL REFERENCES ai_systems(id) ON DELETE CASCADE,
  control_id   uuid NOT NULL REFERENCES ai_controls(id) ON DELETE CASCADE,
  UNIQUE (ai_system_id, control_id)
);

-- ============================================================
-- 11. ai_system_risks (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_system_risks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_system_id uuid NOT NULL REFERENCES ai_systems(id) ON DELETE CASCADE,
  risk_id      uuid NOT NULL REFERENCES ai_risks(id) ON DELETE CASCADE,
  UNIQUE (ai_system_id, risk_id)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ai_systems_org_id
  ON ai_systems (organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_systems_org_status
  ON ai_systems (organization_id, approval_status);

CREATE INDEX IF NOT EXISTS idx_ai_systems_org_risk
  ON ai_systems (organization_id, risk_classification);

CREATE INDEX IF NOT EXISTS idx_ai_vendors_org_id
  ON ai_vendors (organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_risks_org_id
  ON ai_risks (organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_risks_system_id
  ON ai_risks (ai_system_id);

CREATE INDEX IF NOT EXISTS idx_ai_risks_org_status
  ON ai_risks (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_ai_controls_org_id
  ON ai_controls (organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_controls_org_status
  ON ai_controls (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_ai_policies_org_id
  ON ai_policies (organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_policies_org_status
  ON ai_policies (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_ai_assessments_org_id
  ON ai_assessments (organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_assessments_system_id
  ON ai_assessments (ai_system_id);

CREATE INDEX IF NOT EXISTS idx_ai_incidents_org_id
  ON ai_incidents (organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_incidents_system_id
  ON ai_incidents (ai_system_id);

CREATE INDEX IF NOT EXISTS idx_ai_incidents_org_status
  ON ai_incidents (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_ai_compliance_org_id
  ON ai_compliance (organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_trust_scores_org_id
  ON ai_trust_scores (organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_trust_scores_system_id
  ON ai_trust_scores (ai_system_id);

CREATE INDEX IF NOT EXISTS idx_ai_system_controls_system_id
  ON ai_system_controls (ai_system_id);

CREATE INDEX IF NOT EXISTS idx_ai_system_controls_control_id
  ON ai_system_controls (control_id);

CREATE INDEX IF NOT EXISTS idx_ai_system_risks_system_id
  ON ai_system_risks (ai_system_id);

CREATE INDEX IF NOT EXISTS idx_ai_system_risks_risk_id
  ON ai_system_risks (risk_id);

-- ============================================================
-- Row-Level Security
-- ============================================================

ALTER TABLE ai_systems          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_vendors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_risks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_controls         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_policies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_assessments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_incidents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_compliance       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_trust_scores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_system_controls  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_system_risks     ENABLE ROW LEVEL SECURITY;

-- ai_systems
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_systems' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON ai_systems FOR SELECT
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_systems' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON ai_systems FOR INSERT
      WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_systems' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON ai_systems FOR UPDATE
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_systems' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON ai_systems FOR DELETE
      USING (is_org_member(organization_id));
  END IF;
END $$;

-- ai_vendors
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_vendors' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON ai_vendors FOR SELECT
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_vendors' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON ai_vendors FOR INSERT
      WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_vendors' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON ai_vendors FOR UPDATE
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_vendors' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON ai_vendors FOR DELETE
      USING (is_org_member(organization_id));
  END IF;
END $$;

-- ai_risks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_risks' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON ai_risks FOR SELECT
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_risks' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON ai_risks FOR INSERT
      WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_risks' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON ai_risks FOR UPDATE
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_risks' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON ai_risks FOR DELETE
      USING (is_org_member(organization_id));
  END IF;
END $$;

-- ai_controls
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_controls' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON ai_controls FOR SELECT
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_controls' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON ai_controls FOR INSERT
      WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_controls' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON ai_controls FOR UPDATE
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_controls' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON ai_controls FOR DELETE
      USING (is_org_member(organization_id));
  END IF;
END $$;

-- ai_policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_policies' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON ai_policies FOR SELECT
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_policies' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON ai_policies FOR INSERT
      WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_policies' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON ai_policies FOR UPDATE
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_policies' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON ai_policies FOR DELETE
      USING (is_org_member(organization_id));
  END IF;
END $$;

-- ai_assessments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_assessments' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON ai_assessments FOR SELECT
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_assessments' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON ai_assessments FOR INSERT
      WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_assessments' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON ai_assessments FOR UPDATE
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_assessments' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON ai_assessments FOR DELETE
      USING (is_org_member(organization_id));
  END IF;
END $$;

-- ai_incidents
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_incidents' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON ai_incidents FOR SELECT
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_incidents' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON ai_incidents FOR INSERT
      WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_incidents' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON ai_incidents FOR UPDATE
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_incidents' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON ai_incidents FOR DELETE
      USING (is_org_member(organization_id));
  END IF;
END $$;

-- ai_compliance
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_compliance' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON ai_compliance FOR SELECT
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_compliance' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON ai_compliance FOR INSERT
      WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_compliance' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON ai_compliance FOR UPDATE
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_compliance' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON ai_compliance FOR DELETE
      USING (is_org_member(organization_id));
  END IF;
END $$;

-- ai_trust_scores
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_trust_scores' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON ai_trust_scores FOR SELECT
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_trust_scores' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON ai_trust_scores FOR INSERT
      WITH CHECK (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_trust_scores' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON ai_trust_scores FOR UPDATE
      USING (is_org_member(organization_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_trust_scores' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON ai_trust_scores FOR DELETE
      USING (is_org_member(organization_id));
  END IF;
END $$;

-- ai_system_controls (junction — org validated via ai_systems)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_system_controls' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON ai_system_controls FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM ai_systems s
        WHERE s.id = ai_system_id AND is_org_member(s.organization_id)
      ));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_system_controls' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON ai_system_controls FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM ai_systems s
        WHERE s.id = ai_system_id AND is_org_member(s.organization_id)
      ));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_system_controls' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON ai_system_controls FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM ai_systems s
        WHERE s.id = ai_system_id AND is_org_member(s.organization_id)
      ));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_system_controls' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON ai_system_controls FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM ai_systems s
        WHERE s.id = ai_system_id AND is_org_member(s.organization_id)
      ));
  END IF;
END $$;

-- ai_system_risks (junction — org validated via ai_systems)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_system_risks' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON ai_system_risks FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM ai_systems s
        WHERE s.id = ai_system_id AND is_org_member(s.organization_id)
      ));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_system_risks' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON ai_system_risks FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM ai_systems s
        WHERE s.id = ai_system_id AND is_org_member(s.organization_id)
      ));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_system_risks' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON ai_system_risks FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM ai_systems s
        WHERE s.id = ai_system_id AND is_org_member(s.organization_id)
      ));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_system_risks' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON ai_system_risks FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM ai_systems s
        WHERE s.id = ai_system_id AND is_org_member(s.organization_id)
      ));
  END IF;
END $$;
