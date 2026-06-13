-- Migration 0029: Continuous Compliance™
-- Module 28 — Continuous Compliance™
-- Idempotent: uses IF NOT EXISTS throughout

-- ============================================================
-- 1. compliance_checks — prebuilt automated check library
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_checks (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name                text NOT NULL,
  slug                text NOT NULL,
  description         text,
  category            text NOT NULL DEFAULT 'custom'
                        CHECK (category IN ('aws','azure','gcp','github','microsoft_365','google_workspace','okta','identity','network','endpoint','custom')),
  check_type          text NOT NULL DEFAULT 'manual'
                        CHECK (check_type IN ('automated','semi_automated','manual')),
  severity            text NOT NULL DEFAULT 'medium'
                        CHECK (severity IN ('critical','high','medium','low','info')),
  schedule            text NOT NULL DEFAULT 'daily'
                        CHECK (schedule IN ('realtime','hourly','daily','weekly','monthly','on_demand')),
  status              text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','inactive','archived')),
  is_builtin          boolean NOT NULL DEFAULT false,
  check_logic         jsonb NOT NULL DEFAULT '{}',
  remediation_guide   text,
  frameworks          jsonb NOT NULL DEFAULT '[]',
  created_by          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cc_slug_org ON compliance_checks(slug, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX IF NOT EXISTS idx_cc_org      ON compliance_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_cc_category ON compliance_checks(category);
CREATE INDEX IF NOT EXISTS idx_cc_status   ON compliance_checks(status);

-- ============================================================
-- 2. compliance_check_runs — execution log per check
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_check_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  check_id        uuid NOT NULL REFERENCES compliance_checks(id) ON DELETE CASCADE,
  result          text NOT NULL DEFAULT 'unknown'
                    CHECK (result IN ('pass','fail','warning','unknown','exception_approved')),
  score           integer,
  details         jsonb NOT NULL DEFAULT '{}',
  raw_data        jsonb NOT NULL DEFAULT '{}',
  error_message   text,
  triggered_by    text NOT NULL DEFAULT 'schedule'
                    CHECK (triggered_by IN ('schedule','manual','api','event')),
  run_by          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ccr_org      ON compliance_check_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ccr_check    ON compliance_check_runs(check_id);
CREATE INDEX IF NOT EXISTS idx_ccr_result   ON compliance_check_runs(organization_id, result);
CREATE INDEX IF NOT EXISTS idx_ccr_started  ON compliance_check_runs(organization_id, started_at DESC);

-- ============================================================
-- 3. compliance_evidence — auto-generated evidence
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_evidence (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  check_run_id    uuid REFERENCES compliance_check_runs(id) ON DELETE SET NULL,
  name            text NOT NULL,
  description     text,
  source          text NOT NULL DEFAULT 'system_generated'
                    CHECK (source IN ('system_generated','api_generated','connector_generated','control_generated','audit_generated','review_generated','manual')),
  content         jsonb NOT NULL DEFAULT '{}',
  hash            text,
  status          text NOT NULL DEFAULT 'valid'
                    CHECK (status IN ('valid','expired','superseded','revoked')),
  expires_at      timestamptz,
  collected_at    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ce_org       ON compliance_evidence(organization_id);
CREATE INDEX IF NOT EXISTS idx_ce_run       ON compliance_evidence(check_run_id);
CREATE INDEX IF NOT EXISTS idx_ce_source    ON compliance_evidence(organization_id, source);
CREATE INDEX IF NOT EXISTS idx_ce_status    ON compliance_evidence(organization_id, status);

-- ============================================================
-- 4. control_validations — check results mapped to controls
-- ============================================================
CREATE TABLE IF NOT EXISTS control_validations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  check_id        uuid NOT NULL REFERENCES compliance_checks(id) ON DELETE CASCADE,
  check_run_id    uuid REFERENCES compliance_check_runs(id) ON DELETE SET NULL,
  control_id      uuid REFERENCES controls(id) ON DELETE CASCADE,
  state           text NOT NULL DEFAULT 'unknown'
                    CHECK (state IN ('healthy','warning','failed','exception','unknown')),
  notes           text,
  validated_at    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cv_org     ON control_validations(organization_id);
CREATE INDEX IF NOT EXISTS idx_cv_control ON control_validations(control_id);
CREATE INDEX IF NOT EXISTS idx_cv_check   ON control_validations(check_id);

-- ============================================================
-- 5. framework_mappings — checks mapped to frameworks
-- ============================================================
CREATE TABLE IF NOT EXISTS framework_mappings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  check_id        uuid NOT NULL REFERENCES compliance_checks(id) ON DELETE CASCADE,
  framework_id    uuid REFERENCES frameworks(id) ON DELETE CASCADE,
  framework_name  text NOT NULL,
  control_ref     text,
  requirement     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fm_check_framework ON framework_mappings(check_id, COALESCE(framework_id, '00000000-0000-0000-0000-000000000000'::uuid), framework_name);
CREATE INDEX IF NOT EXISTS idx_fm_org       ON framework_mappings(organization_id);
CREATE INDEX IF NOT EXISTS idx_fm_framework ON framework_mappings(framework_id);

-- ============================================================
-- 6. access_reviews — access review campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS access_reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  campaign_type   text NOT NULL DEFAULT 'quarterly'
                    CHECK (campaign_type IN ('quarterly','privileged','application','vendor','emergency','annual')),
  status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','active','completed','cancelled','overdue')),
  scope           text,
  risk_level      text NOT NULL DEFAULT 'medium'
                    CHECK (risk_level IN ('critical','high','medium','low')),
  due_date        date,
  started_at      timestamptz,
  completed_at    timestamptz,
  completion_rate integer NOT NULL DEFAULT 0,
  total_users     integer NOT NULL DEFAULT 0,
  reviewed_users  integer NOT NULL DEFAULT 0,
  approved_count  integer NOT NULL DEFAULT 0,
  revoked_count   integer NOT NULL DEFAULT 0,
  created_by      uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ar_org    ON access_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_ar_status ON access_reviews(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_ar_due    ON access_reviews(organization_id, due_date);

-- ============================================================
-- 7. access_review_users — per-user review items
-- ============================================================
CREATE TABLE IF NOT EXISTS access_review_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  review_id       uuid NOT NULL REFERENCES access_reviews(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  user_name       text NOT NULL,
  user_email      text NOT NULL,
  role            text,
  department      text,
  risk_level      text NOT NULL DEFAULT 'medium'
                    CHECK (risk_level IN ('critical','high','medium','low')),
  decision        text
                    CHECK (decision IN ('approved','revoked','escalate','needs_investigation','exception')),
  reviewer_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at     timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aru_org    ON access_review_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_aru_review ON access_review_users(review_id);
CREATE INDEX IF NOT EXISTS idx_aru_user   ON access_review_users(user_id);

-- ============================================================
-- 8. attestations — policy attestations
-- ============================================================
CREATE TABLE IF NOT EXISTS attestations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  policy_type     text NOT NULL DEFAULT 'security_policy'
                    CHECK (policy_type IN ('security_policy','acceptable_use','privacy_policy','ai_policy','vendor_policy','custom')),
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','inactive','archived')),
  content         text,
  version         text NOT NULL DEFAULT '1.0',
  due_date        date,
  expires_at      timestamptz,
  total_assigned  integer NOT NULL DEFAULT 0,
  total_completed integer NOT NULL DEFAULT 0,
  completion_rate integer NOT NULL DEFAULT 0,
  created_by      uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_att_org    ON attestations(organization_id);
CREATE INDEX IF NOT EXISTS idx_att_status ON attestations(organization_id, status);

-- ============================================================
-- 9. attestation_responses — per-user attestation responses
-- ============================================================
CREATE TABLE IF NOT EXISTS attestation_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  attestation_id  uuid NOT NULL REFERENCES attestations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'assigned'
                    CHECK (status IN ('assigned','viewed','accepted','declined','expired','renewed')),
  responded_at    timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ar_att_user ON attestation_responses(attestation_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ar2_org      ON attestation_responses(organization_id);
CREATE INDEX IF NOT EXISTS idx_ar2_att      ON attestation_responses(attestation_id);

-- ============================================================
-- 10. training_campaigns — training programs
-- ============================================================
CREATE TABLE IF NOT EXISTS training_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  training_type   text NOT NULL DEFAULT 'security_awareness'
                    CHECK (training_type IN ('security_awareness','privacy_training','ai_governance','vendor_governance','custom')),
  status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','active','completed','archived')),
  due_date        date,
  total_assigned  integer NOT NULL DEFAULT 0,
  total_completed integer NOT NULL DEFAULT 0,
  completion_rate integer NOT NULL DEFAULT 0,
  passing_score   integer NOT NULL DEFAULT 80,
  created_by      uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tc_org    ON training_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_tc_status ON training_campaigns(organization_id, status);

-- ============================================================
-- 11. training_assignments — per-user training assignments
-- ============================================================
CREATE TABLE IF NOT EXISTS training_assignments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id     uuid NOT NULL REFERENCES training_campaigns(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'assigned'
                    CHECK (status IN ('assigned','in_progress','completed','overdue','expired')),
  score           integer,
  completed_at    timestamptz,
  due_date        date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ta_campaign_user ON training_assignments(campaign_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ta_org      ON training_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_ta_campaign ON training_assignments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ta_user     ON training_assignments(user_id);

-- ============================================================
-- 12. workforce_events — onboarding/offboarding lifecycle
-- ============================================================
CREATE TABLE IF NOT EXISTS workforce_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type      text NOT NULL
                    CHECK (event_type IN ('onboarding','offboarding','role_change','access_change','security_incident')),
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','completed','failed')),
  user_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  user_name       text,
  user_email      text,
  department      text,
  checklist       jsonb NOT NULL DEFAULT '[]',
  completed_steps integer NOT NULL DEFAULT 0,
  total_steps     integer NOT NULL DEFAULT 0,
  notes           text,
  due_date        date,
  completed_at    timestamptz,
  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_we_org    ON workforce_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_we_status ON workforce_events(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_we_type   ON workforce_events(organization_id, event_type);

-- ============================================================
-- 13. compliance_signals — generated signals from integrations
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_signals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  signal_type     text NOT NULL,
  severity        text NOT NULL DEFAULT 'medium'
                    CHECK (severity IN ('critical','high','medium','low','info')),
  status          text NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','acknowledged','resolved','suppressed')),
  title           text NOT NULL,
  description     text,
  source_module   text,
  source_id       uuid,
  metadata        jsonb NOT NULL DEFAULT '{}',
  resolved_at     timestamptz,
  resolved_by     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_org      ON compliance_signals(organization_id);
CREATE INDEX IF NOT EXISTS idx_cs_status   ON compliance_signals(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_cs_severity ON compliance_signals(organization_id, severity);
CREATE INDEX IF NOT EXISTS idx_cs_created  ON compliance_signals(organization_id, created_at DESC);

-- ============================================================
-- 14. compliance_health_scores — org-wide health history
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_health_scores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  score           integer NOT NULL,
  level           text NOT NULL DEFAULT 'needs_attention'
                    CHECK (level IN ('excellent','good','needs_attention','at_risk','critical')),
  control_health  integer,
  evidence_freshness integer,
  check_success_rate integer,
  open_findings   integer,
  open_risks      integer,
  training_completion integer,
  access_review_rate  integer,
  trust_score     integer,
  metadata        jsonb NOT NULL DEFAULT '{}',
  snapshot_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chs_org_snap ON compliance_health_scores(organization_id, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_chs_org ON compliance_health_scores(organization_id);

-- ============================================================
-- 15. compliance_exceptions — exception approvals for checks
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_exceptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  check_id        uuid REFERENCES compliance_checks(id) ON DELETE SET NULL,
  title           text NOT NULL,
  reason          text NOT NULL,
  risk_acceptance text,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','expired')),
  approved_by     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at     timestamptz,
  expires_at      timestamptz,
  requested_by    uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cex_org    ON compliance_exceptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_cex_status ON compliance_exceptions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_cex_check  ON compliance_exceptions(check_id);

-- ============================================================
-- 16. automation_rules — if-this-then-that compliance rules
-- ============================================================
CREATE TABLE IF NOT EXISTS automation_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','inactive','draft')),
  trigger_type    text NOT NULL DEFAULT 'check_failed'
                    CHECK (trigger_type IN ('check_failed','check_passed','signal_created','trust_score_drop','policy_expired','contract_obligation','training_overdue','verification_expiring')),
  trigger_config  jsonb NOT NULL DEFAULT '{}',
  actions         jsonb NOT NULL DEFAULT '[]',
  run_count       integer NOT NULL DEFAULT 0,
  last_run_at     timestamptz,
  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rul_org    ON automation_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_rul_status ON automation_rules(organization_id, status);

-- ============================================================
-- 17. continuous_readiness — per-framework readiness snapshots
-- ============================================================
CREATE TABLE IF NOT EXISTS continuous_readiness (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework_id        uuid REFERENCES frameworks(id) ON DELETE CASCADE,
  framework_name      text NOT NULL,
  readiness_score     integer NOT NULL DEFAULT 0,
  passing_checks      integer NOT NULL DEFAULT 0,
  total_checks        integer NOT NULL DEFAULT 0,
  passing_controls    integer NOT NULL DEFAULT 0,
  total_controls      integer NOT NULL DEFAULT 0,
  evidence_coverage   integer NOT NULL DEFAULT 0,
  trend               text NOT NULL DEFAULT 'stable'
                        CHECK (trend IN ('improving','stable','declining')),
  snapshot_at         timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cr_org_fw_snap ON continuous_readiness(organization_id, framework_name, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_cr_org       ON continuous_readiness(organization_id);
CREATE INDEX IF NOT EXISTS idx_cr_framework ON continuous_readiness(framework_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE compliance_checks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_check_runs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_evidence       ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_validations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_mappings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_review_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE attestations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE attestation_responses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_campaigns        ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assignments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_signals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_health_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_exceptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuous_readiness      ENABLE ROW LEVEL SECURITY;

-- compliance_checks: builtin (org_id null) visible to all; org-specific visible to members
DROP POLICY IF EXISTS compliance_checks_policy ON compliance_checks;
CREATE POLICY compliance_checks_policy ON compliance_checks
  USING (organization_id IS NULL OR is_org_member(organization_id));

DROP POLICY IF EXISTS compliance_check_runs_policy ON compliance_check_runs;
CREATE POLICY compliance_check_runs_policy ON compliance_check_runs
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS compliance_evidence_policy ON compliance_evidence;
CREATE POLICY compliance_evidence_policy ON compliance_evidence
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS control_validations_policy ON control_validations;
CREATE POLICY control_validations_policy ON control_validations
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS framework_mappings_policy ON framework_mappings;
CREATE POLICY framework_mappings_policy ON framework_mappings
  USING (organization_id IS NULL OR is_org_member(organization_id));

DROP POLICY IF EXISTS access_reviews_policy ON access_reviews;
CREATE POLICY access_reviews_policy ON access_reviews
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS access_review_users_policy ON access_review_users;
CREATE POLICY access_review_users_policy ON access_review_users
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS attestations_policy ON attestations;
CREATE POLICY attestations_policy ON attestations
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS attestation_responses_policy ON attestation_responses;
CREATE POLICY attestation_responses_policy ON attestation_responses
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS training_campaigns_policy ON training_campaigns;
CREATE POLICY training_campaigns_policy ON training_campaigns
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS training_assignments_policy ON training_assignments;
CREATE POLICY training_assignments_policy ON training_assignments
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS workforce_events_policy ON workforce_events;
CREATE POLICY workforce_events_policy ON workforce_events
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS compliance_signals_policy ON compliance_signals;
CREATE POLICY compliance_signals_policy ON compliance_signals
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS compliance_health_scores_policy ON compliance_health_scores;
CREATE POLICY compliance_health_scores_policy ON compliance_health_scores
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS compliance_exceptions_policy ON compliance_exceptions;
CREATE POLICY compliance_exceptions_policy ON compliance_exceptions
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS automation_rules_policy ON automation_rules;
CREATE POLICY automation_rules_policy ON automation_rules
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS continuous_readiness_policy ON continuous_readiness;
CREATE POLICY continuous_readiness_policy ON continuous_readiness
  USING (is_org_member(organization_id));

-- ============================================================
-- Seed built-in compliance checks
-- ============================================================
INSERT INTO compliance_checks (name, slug, description, category, check_type, severity, schedule, is_builtin, frameworks) VALUES
-- AWS
('AWS Root MFA Enabled',         'aws-root-mfa',          'Ensure MFA is enabled on the AWS root account',                    'aws',             'automated', 'critical', 'daily',  true, '["SOC 2","ISO 27001","NIST"]'),
('No Root Access Keys',          'aws-no-root-keys',      'Ensure no access keys exist for the root account',                 'aws',             'automated', 'critical', 'daily',  true, '["SOC 2","ISO 27001"]'),
('S3 Public Bucket Detection',   'aws-s3-public',         'Detect any S3 buckets with public access enabled',                 'aws',             'automated', 'high',     'hourly', true, '["SOC 2","ISO 27001","DPDP"]'),
('CloudTrail Enabled',           'aws-cloudtrail',        'Ensure CloudTrail is enabled in all regions',                      'aws',             'automated', 'high',     'daily',  true, '["SOC 2","ISO 27001","HIPAA"]'),
('GuardDuty Enabled',            'aws-guardduty',         'Ensure GuardDuty threat detection is active',                      'aws',             'automated', 'high',     'daily',  true, '["SOC 2","NIST"]'),
('Unused IAM Users',             'aws-unused-iam',        'Detect IAM users with no activity in 90+ days',                   'aws',             'automated', 'medium',   'weekly', true, '["SOC 2","ISO 27001"]'),
('Security Group Exposure',      'aws-sg-exposure',       'Detect security groups allowing unrestricted inbound access',      'aws',             'automated', 'high',     'daily',  true, '["SOC 2","PCI DSS"]'),
-- Azure
('Azure MFA Enabled',            'azure-mfa',             'Ensure MFA is required for all Azure AD users',                    'azure',           'automated', 'critical', 'daily',  true, '["SOC 2","ISO 27001"]'),
('Azure Privileged Role Review', 'azure-priv-roles',      'Review users with privileged Azure AD roles',                      'azure',           'automated', 'high',     'weekly', true, '["SOC 2","ISO 27001"]'),
('Azure Defender Enabled',       'azure-defender',        'Ensure Microsoft Defender for Cloud is enabled',                   'azure',           'automated', 'high',     'daily',  true, '["SOC 2","ISO 27001"]'),
-- GitHub
('Branch Protection Enabled',    'github-branch-protect', 'Ensure branch protection rules are on default branches',           'github',          'automated', 'high',     'daily',  true, '["SOC 2","ISO 27001"]'),
('Mandatory Reviews Enabled',    'github-pr-reviews',     'Ensure pull requests require at least one review',                 'github',          'automated', 'high',     'daily',  true, '["SOC 2"]'),
('Secret Scanning Enabled',      'github-secret-scan',    'Ensure secret scanning is enabled on all repositories',            'github',          'automated', 'critical', 'daily',  true, '["SOC 2","ISO 27001"]'),
('Dependabot Enabled',           'github-dependabot',     'Ensure Dependabot security alerts are enabled',                    'github',          'automated', 'medium',   'weekly', true, '["SOC 2"]'),
-- Microsoft 365
('M365 MFA Coverage',            'm365-mfa',              'Ensure MFA is enforced for all Microsoft 365 users',               'microsoft_365',   'automated', 'critical', 'daily',  true, '["SOC 2","ISO 27001"]'),
('M365 External Sharing',        'm365-external-sharing', 'Review external sharing settings in Microsoft 365',                'microsoft_365',   'automated', 'medium',   'weekly', true, '["DPDP","ISO 27001"]'),
-- Okta
('Okta MFA Coverage',            'okta-mfa',              'Ensure MFA is enforced for all Okta users',                        'okta',            'automated', 'critical', 'daily',  true, '["SOC 2","ISO 27001"]'),
('Okta Inactive Users',          'okta-inactive',         'Detect Okta users inactive for 90+ days',                          'okta',            'automated', 'medium',   'weekly', true, '["SOC 2","ISO 27001"]'),
('Okta SSO Coverage',            'okta-sso',              'Ensure critical applications use SSO via Okta',                    'okta',            'automated', 'medium',   'monthly',true, '["SOC 2"]'),
-- Google Workspace
('Google Workspace MFA',         'gws-mfa',               'Ensure 2-Step Verification is enforced for all Workspace users',   'google_workspace','automated', 'critical', 'daily',  true, '["SOC 2","ISO 27001"]'),
('Google Workspace External',    'gws-external-sharing',  'Review external sharing and data sharing settings',                'google_workspace','automated', 'medium',   'weekly', true, '["DPDP","ISO 27001"]')
ON CONFLICT DO NOTHING;
