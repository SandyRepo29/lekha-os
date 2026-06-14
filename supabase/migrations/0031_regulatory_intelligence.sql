-- ============================================================
-- Module 30 — Regulatory Intelligence™
-- 14 Tables
-- ============================================================

-- ---- Regulations ----
CREATE TABLE IF NOT EXISTS regulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  short_name text,
  authority text,
  country text,
  region text,
  industry text,
  category text NOT NULL DEFAULT 'security' CHECK (category IN (
    'privacy','security','ai_governance','financial','operational_risk',
    'third_party_risk','cloud_security','business_continuity','audit','industry_specific','custom'
  )),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','retired','under_review')),
  version text,
  effective_date date,
  review_date date,
  source_url text,
  description text,
  is_builtin boolean NOT NULL DEFAULT false,
  is_applicable boolean NOT NULL DEFAULT true,
  obligation_count integer NOT NULL DEFAULT 0,
  compliance_score integer,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_regulations_org ON regulations(organization_id);
CREATE INDEX IF NOT EXISTS idx_regulations_category ON regulations(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_regulations_status ON regulations(organization_id, status);

-- ---- Regulation Versions ----
CREATE TABLE IF NOT EXISTS regulation_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regulation_id uuid NOT NULL REFERENCES regulations(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  version text NOT NULL,
  summary text,
  changes jsonb DEFAULT '[]',
  effective_date date,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reg_versions_reg ON regulation_versions(regulation_id);

-- ---- Regulatory Changes ----
CREATE TABLE IF NOT EXISTS regulatory_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  regulation_id uuid REFERENCES regulations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  change_type text NOT NULL DEFAULT 'amendment' CHECK (change_type IN (
    'amendment','new_regulation','guidance','enforcement','repeal','draft','consultation','other'
  )),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','under_review','assessed','actioned','closed')),
  source text,
  source_url text,
  published_date date,
  effective_date date,
  impact_score integer,
  affected_controls integer DEFAULT 0,
  affected_policies integer DEFAULT 0,
  ai_summary text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reg_changes_org ON regulatory_changes(organization_id);
CREATE INDEX IF NOT EXISTS idx_reg_changes_status ON regulatory_changes(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_reg_changes_severity ON regulatory_changes(organization_id, severity);

-- ---- Obligations ----
CREATE TABLE IF NOT EXISTS obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  regulation_id uuid REFERENCES regulations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  requirement text,
  obligation_ref text,
  category text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started','planned','in_progress','implemented','validated','exception','retired'
  )),
  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  business_unit text,
  review_date date,
  due_date date,
  evidence_requirements text,
  notes text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_obligations_org ON obligations(organization_id);
CREATE INDEX IF NOT EXISTS idx_obligations_regulation ON obligations(regulation_id);
CREATE INDEX IF NOT EXISTS idx_obligations_status ON obligations(organization_id, status);

-- ---- Obligation Mappings ----
CREATE TABLE IF NOT EXISTS obligation_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obligation_id uuid NOT NULL REFERENCES obligations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('control','policy','risk','framework','vendor','ai_system','contract')),
  entity_id uuid NOT NULL,
  relationship text NOT NULL DEFAULT 'satisfies' CHECK (relationship IN ('satisfies','partially_satisfies','requires_update','gap')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_obligation_mappings_obligation ON obligation_mappings(obligation_id);
CREATE INDEX IF NOT EXISTS idx_obligation_mappings_org ON obligation_mappings(organization_id);

-- ---- Regulatory Assessments ----
CREATE TABLE IF NOT EXISTS regulatory_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  change_id uuid REFERENCES regulatory_changes(id) ON DELETE SET NULL,
  regulation_id uuid REFERENCES regulations(id) ON DELETE SET NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_progress','completed','approved')),
  impact_level text NOT NULL DEFAULT 'medium' CHECK (impact_level IN ('low','medium','high','critical')),
  summary text,
  ai_analysis text,
  affected_controls integer DEFAULT 0,
  affected_policies integer DEFAULT 0,
  affected_risks integer DEFAULT 0,
  affected_vendors integer DEFAULT 0,
  affected_contracts integer DEFAULT 0,
  remediation_effort text CHECK (remediation_effort IN ('low','medium','high')),
  estimated_days integer,
  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  due_date date,
  completed_at timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reg_assessments_org ON regulatory_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_reg_assessments_status ON regulatory_assessments(organization_id, status);

-- ---- Regulatory Impacts ----
CREATE TABLE IF NOT EXISTS regulatory_impacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES regulatory_assessments(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('control','policy','risk','vendor','framework','ai_system','contract','process')),
  entity_id uuid,
  entity_name text NOT NULL,
  impact_type text NOT NULL DEFAULT 'update_required' CHECK (impact_type IN (
    'update_required','new_requirement','gap_identified','review_required','no_change'
  )),
  impact_level text NOT NULL DEFAULT 'medium' CHECK (impact_level IN ('low','medium','high','critical')),
  description text,
  action_required text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','accepted')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reg_impacts_assessment ON regulatory_impacts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_reg_impacts_org ON regulatory_impacts(organization_id);

-- ---- Regulatory Reviews ----
CREATE TABLE IF NOT EXISTS regulatory_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regulation_id uuid NOT NULL REFERENCES regulations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','overdue')),
  outcome text CHECK (outcome IN ('no_change','minor_update','major_update','gap_identified','fully_compliant')),
  notes text,
  reviewed_at timestamptz,
  next_review_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reg_reviews_org ON regulatory_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_reg_reviews_regulation ON regulatory_reviews(regulation_id);

-- ---- Regulatory Alerts ----
CREATE TABLE IF NOT EXISTS regulatory_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  regulation_id uuid REFERENCES regulations(id) ON DELETE CASCADE,
  change_id uuid REFERENCES regulatory_changes(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  alert_type text NOT NULL DEFAULT 'change_detected' CHECK (alert_type IN (
    'change_detected','deadline_approaching','new_obligation','review_due','compliance_gap','enforcement_action','other'
  )),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  due_date date,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reg_alerts_org ON regulatory_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_reg_alerts_status ON regulatory_alerts(organization_id, status);

-- ---- Regulatory Watchlists ----
CREATE TABLE IF NOT EXISTS regulatory_watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  watch_type text NOT NULL DEFAULT 'regulation' CHECK (watch_type IN (
    'regulation','country','regulator','industry','framework','topic'
  )),
  criteria jsonb DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  alert_on_change boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reg_watchlists_org ON regulatory_watchlists(organization_id);

-- ---- Regulatory Sources ----
CREATE TABLE IF NOT EXISTS regulatory_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  source_type text NOT NULL DEFAULT 'manual' CHECK (source_type IN (
    'government_portal','regulator_website','standards_body','industry_association','internal_upload','partner_feed','manual','rss'
  )),
  url text,
  country text,
  authority text,
  is_active boolean NOT NULL DEFAULT true,
  last_checked_at timestamptz,
  is_builtin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reg_sources_org ON regulatory_sources(organization_id);

-- ---- Regulatory Agents (sub-type of governance agents) ----
CREATE TABLE IF NOT EXISTS regulatory_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  schedule text DEFAULT 'daily',
  last_run_at timestamptz,
  total_runs integer NOT NULL DEFAULT 0,
  changes_detected integer NOT NULL DEFAULT 0,
  watchlist_ids jsonb DEFAULT '[]',
  source_ids jsonb DEFAULT '[]',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reg_agents_org ON regulatory_agents(organization_id);

-- ---- Regulatory Tasks ----
CREATE TABLE IF NOT EXISTS regulatory_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  change_id uuid REFERENCES regulatory_changes(id) ON DELETE SET NULL,
  assessment_id uuid REFERENCES regulatory_assessments(id) ON DELETE SET NULL,
  obligation_id uuid REFERENCES obligations(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  task_type text NOT NULL DEFAULT 'review' CHECK (task_type IN (
    'review','update_control','update_policy','assess_impact','notify_stakeholders','implement','verify','other'
  )),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','cancelled')),
  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  due_date date,
  completed_at timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reg_tasks_org ON regulatory_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_reg_tasks_status ON regulatory_tasks(organization_id, status);

-- ---- Regulatory Updates (curated feed) ----
CREATE TABLE IF NOT EXISTS regulatory_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  regulation_id uuid REFERENCES regulations(id) ON DELETE SET NULL,
  source_id uuid REFERENCES regulatory_sources(id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text,
  content text,
  update_date date,
  published_at timestamptz,
  source_url text,
  is_read boolean NOT NULL DEFAULT false,
  is_builtin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reg_updates_org ON regulatory_updates(organization_id);
CREATE INDEX IF NOT EXISTS idx_reg_updates_regulation ON regulatory_updates(regulation_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE obligation_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_updates ENABLE ROW LEVEL SECURITY;

-- regulations: org-scoped OR builtin (no org_id)
DROP POLICY IF EXISTS "reg_read" ON regulations;
CREATE POLICY "reg_read" ON regulations FOR SELECT TO authenticated
  USING (organization_id IS NULL OR is_org_member(organization_id));
DROP POLICY IF EXISTS "reg_write" ON regulations;
CREATE POLICY "reg_write" ON regulations FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND is_org_member(organization_id))
  WITH CHECK (organization_id IS NOT NULL AND is_org_member(organization_id));

-- regulation_versions
DROP POLICY IF EXISTS "reg_versions_read" ON regulation_versions;
CREATE POLICY "reg_versions_read" ON regulation_versions FOR SELECT TO authenticated
  USING (organization_id IS NULL OR is_org_member(organization_id));
DROP POLICY IF EXISTS "reg_versions_write" ON regulation_versions;
CREATE POLICY "reg_versions_write" ON regulation_versions FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND is_org_member(organization_id))
  WITH CHECK (organization_id IS NOT NULL AND is_org_member(organization_id));

-- regulatory_changes
DROP POLICY IF EXISTS "reg_changes_read" ON regulatory_changes;
CREATE POLICY "reg_changes_read" ON regulatory_changes FOR SELECT TO authenticated
  USING (is_org_member(organization_id));
DROP POLICY IF EXISTS "reg_changes_write" ON regulatory_changes;
CREATE POLICY "reg_changes_write" ON regulatory_changes FOR ALL TO authenticated
  USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));

-- obligations
DROP POLICY IF EXISTS "obligations_read" ON obligations;
CREATE POLICY "obligations_read" ON obligations FOR SELECT TO authenticated
  USING (is_org_member(organization_id));
DROP POLICY IF EXISTS "obligations_write" ON obligations;
CREATE POLICY "obligations_write" ON obligations FOR ALL TO authenticated
  USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));

-- obligation_mappings
DROP POLICY IF EXISTS "obligation_mappings_read" ON obligation_mappings;
CREATE POLICY "obligation_mappings_read" ON obligation_mappings FOR SELECT TO authenticated
  USING (is_org_member(organization_id));
DROP POLICY IF EXISTS "obligation_mappings_write" ON obligation_mappings;
CREATE POLICY "obligation_mappings_write" ON obligation_mappings FOR ALL TO authenticated
  USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));

-- regulatory_assessments
DROP POLICY IF EXISTS "reg_assessments_read" ON regulatory_assessments;
CREATE POLICY "reg_assessments_read" ON regulatory_assessments FOR SELECT TO authenticated
  USING (is_org_member(organization_id));
DROP POLICY IF EXISTS "reg_assessments_write" ON regulatory_assessments;
CREATE POLICY "reg_assessments_write" ON regulatory_assessments FOR ALL TO authenticated
  USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));

-- regulatory_impacts
DROP POLICY IF EXISTS "reg_impacts_read" ON regulatory_impacts;
CREATE POLICY "reg_impacts_read" ON regulatory_impacts FOR SELECT TO authenticated
  USING (is_org_member(organization_id));
DROP POLICY IF EXISTS "reg_impacts_write" ON regulatory_impacts;
CREATE POLICY "reg_impacts_write" ON regulatory_impacts FOR ALL TO authenticated
  USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));

-- regulatory_reviews
DROP POLICY IF EXISTS "reg_reviews_read" ON regulatory_reviews;
CREATE POLICY "reg_reviews_read" ON regulatory_reviews FOR SELECT TO authenticated
  USING (is_org_member(organization_id));
DROP POLICY IF EXISTS "reg_reviews_write" ON regulatory_reviews;
CREATE POLICY "reg_reviews_write" ON regulatory_reviews FOR ALL TO authenticated
  USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));

-- regulatory_alerts
DROP POLICY IF EXISTS "reg_alerts_read" ON regulatory_alerts;
CREATE POLICY "reg_alerts_read" ON regulatory_alerts FOR SELECT TO authenticated
  USING (is_org_member(organization_id));
DROP POLICY IF EXISTS "reg_alerts_write" ON regulatory_alerts;
CREATE POLICY "reg_alerts_write" ON regulatory_alerts FOR ALL TO authenticated
  USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));

-- regulatory_watchlists
DROP POLICY IF EXISTS "reg_watchlists_read" ON regulatory_watchlists;
CREATE POLICY "reg_watchlists_read" ON regulatory_watchlists FOR SELECT TO authenticated
  USING (is_org_member(organization_id));
DROP POLICY IF EXISTS "reg_watchlists_write" ON regulatory_watchlists;
CREATE POLICY "reg_watchlists_write" ON regulatory_watchlists FOR ALL TO authenticated
  USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));

-- regulatory_sources
DROP POLICY IF EXISTS "reg_sources_read" ON regulatory_sources;
CREATE POLICY "reg_sources_read" ON regulatory_sources FOR SELECT TO authenticated
  USING (organization_id IS NULL OR is_org_member(organization_id));
DROP POLICY IF EXISTS "reg_sources_write" ON regulatory_sources;
CREATE POLICY "reg_sources_write" ON regulatory_sources FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND is_org_member(organization_id))
  WITH CHECK (organization_id IS NOT NULL AND is_org_member(organization_id));

-- regulatory_agents
DROP POLICY IF EXISTS "reg_agents_read" ON regulatory_agents;
CREATE POLICY "reg_agents_read" ON regulatory_agents FOR SELECT TO authenticated
  USING (is_org_member(organization_id));
DROP POLICY IF EXISTS "reg_agents_write" ON regulatory_agents;
CREATE POLICY "reg_agents_write" ON regulatory_agents FOR ALL TO authenticated
  USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));

-- regulatory_tasks
DROP POLICY IF EXISTS "reg_tasks_read" ON regulatory_tasks;
CREATE POLICY "reg_tasks_read" ON regulatory_tasks FOR SELECT TO authenticated
  USING (is_org_member(organization_id));
DROP POLICY IF EXISTS "reg_tasks_write" ON regulatory_tasks;
CREATE POLICY "reg_tasks_write" ON regulatory_tasks FOR ALL TO authenticated
  USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));

-- regulatory_updates
DROP POLICY IF EXISTS "reg_updates_read" ON regulatory_updates;
CREATE POLICY "reg_updates_read" ON regulatory_updates FOR SELECT TO authenticated
  USING (organization_id IS NULL OR is_org_member(organization_id));
DROP POLICY IF EXISTS "reg_updates_write" ON regulatory_updates;
CREATE POLICY "reg_updates_write" ON regulatory_updates FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND is_org_member(organization_id))
  WITH CHECK (organization_id IS NOT NULL AND is_org_member(organization_id));

-- ============================================================
-- Seed Built-in Regulations (organization_id = NULL → every org)
-- ============================================================
INSERT INTO regulations (id, organization_id, name, short_name, authority, country, region, industry, category, status, version, is_builtin, is_applicable, description)
VALUES
  (gen_random_uuid(), NULL, 'Digital Personal Data Protection Act', 'DPDP', 'Ministry of Electronics and IT', 'India', 'Asia-Pacific', 'All', 'privacy', 'active', '2023', true, true, 'India''s primary data protection legislation governing personal data processing.'),
  (gen_random_uuid(), NULL, 'General Data Protection Regulation', 'GDPR', 'European Data Protection Board', 'European Union', 'Europe', 'All', 'privacy', 'active', '2018', true, true, 'EU regulation on data protection and privacy for all individuals within the EU and EEA.'),
  (gen_random_uuid(), NULL, 'California Consumer Privacy Act', 'CCPA', 'California Attorney General', 'USA', 'North America', 'All', 'privacy', 'active', '2020', true, true, 'California state statute intended to enhance privacy rights and consumer protection.'),
  (gen_random_uuid(), NULL, 'Health Insurance Portability and Accountability Act', 'HIPAA', 'HHS Office for Civil Rights', 'USA', 'North America', 'Healthcare', 'privacy', 'active', '1996', true, true, 'US legislation providing data privacy and security provisions for medical information.'),
  (gen_random_uuid(), NULL, 'ISO/IEC 27001 Information Security', 'ISO 27001', 'ISO/IEC', 'Global', 'Global', 'All', 'security', 'active', '2022', true, true, 'International standard for information security management systems.'),
  (gen_random_uuid(), NULL, 'ISO/IEC 27701 Privacy Information Management', 'ISO 27701', 'ISO/IEC', 'Global', 'Global', 'All', 'privacy', 'active', '2019', true, true, 'Extension to ISO 27001 for privacy information management.'),
  (gen_random_uuid(), NULL, 'ISO/IEC 42001 AI Management System', 'ISO 42001', 'ISO/IEC', 'Global', 'Global', 'Technology', 'ai_governance', 'active', '2023', true, true, 'International standard for AI management systems.'),
  (gen_random_uuid(), NULL, 'NIST Cybersecurity Framework', 'NIST CSF', 'NIST', 'USA', 'North America', 'All', 'security', 'active', '2.0', true, true, 'Framework for improving critical infrastructure cybersecurity.'),
  (gen_random_uuid(), NULL, 'NIST AI Risk Management Framework', 'NIST AI RMF', 'NIST', 'USA', 'North America', 'Technology', 'ai_governance', 'active', '1.0', true, true, 'Framework for managing AI risks across the AI lifecycle.'),
  (gen_random_uuid(), NULL, 'Payment Card Industry Data Security Standard', 'PCI DSS', 'PCI Security Standards Council', 'Global', 'Global', 'Financial', 'financial', 'active', '4.0', true, true, 'Standard for organizations that handle branded credit cards.'),
  (gen_random_uuid(), NULL, 'Digital Operational Resilience Act', 'DORA', 'European Parliament', 'European Union', 'Europe', 'Financial', 'operational_risk', 'active', '2025', true, true, 'EU regulation on digital operational resilience for financial entities.'),
  (gen_random_uuid(), NULL, 'Network and Information Security Directive 2', 'NIS2', 'European Parliament', 'European Union', 'Europe', 'All', 'security', 'active', '2024', true, true, 'EU directive on measures for a high common level of cybersecurity.'),
  (gen_random_uuid(), NULL, 'Sarbanes-Oxley Act', 'SOX', 'SEC', 'USA', 'North America', 'Financial', 'financial', 'active', '2002', true, true, 'US federal law mandating certain practices in financial record keeping.'),
  (gen_random_uuid(), NULL, 'RBI Cybersecurity Framework', 'RBI CSF', 'Reserve Bank of India', 'India', 'Asia-Pacific', 'Financial', 'security', 'active', '2016', true, true, 'RBI guidelines on cybersecurity framework for banks.'),
  (gen_random_uuid(), NULL, 'SEBI Cybersecurity and Cyber Resilience Framework', 'SEBI CSCRF', 'SEBI', 'India', 'Asia-Pacific', 'Financial', 'security', 'active', '2024', true, true, 'SEBI framework for cybersecurity and cyber resilience for regulated entities.'),
  (gen_random_uuid(), NULL, 'IRDAI Information and Cyber Security Guidelines', 'IRDAI ICS', 'IRDAI', 'India', 'Asia-Pacific', 'Insurance', 'security', 'active', '2023', true, true, 'IRDAI guidelines on information and cyber security for insurers.'),
  (gen_random_uuid(), NULL, 'EU AI Act', 'EU AI Act', 'European Parliament', 'European Union', 'Europe', 'Technology', 'ai_governance', 'active', '2024', true, true, 'First comprehensive legal framework on AI regulation in the EU.'),
  (gen_random_uuid(), NULL, 'SOC 2 Trust Services Criteria', 'SOC 2', 'AICPA', 'USA', 'Global', 'Technology', 'security', 'active', '2017', true, true, 'Auditing standard for service organizations regarding security, availability, and privacy.')
ON CONFLICT DO NOTHING;

-- Seed built-in regulatory sources
INSERT INTO regulatory_sources (id, organization_id, name, source_type, url, country, authority, is_builtin)
VALUES
  (gen_random_uuid(), NULL, 'MeitY DPDP Portal', 'government_portal', 'https://www.meity.gov.in', 'India', 'MeitY', true),
  (gen_random_uuid(), NULL, 'European Data Protection Board', 'regulator_website', 'https://edpb.europa.eu', 'European Union', 'EDPB', true),
  (gen_random_uuid(), NULL, 'ISO Standards', 'standards_body', 'https://www.iso.org', 'Global', 'ISO/IEC', true),
  (gen_random_uuid(), NULL, 'NIST Publications', 'standards_body', 'https://csrc.nist.gov', 'USA', 'NIST', true),
  (gen_random_uuid(), NULL, 'RBI Notifications', 'regulator_website', 'https://www.rbi.org.in', 'India', 'RBI', true),
  (gen_random_uuid(), NULL, 'SEBI Circulars', 'regulator_website', 'https://www.sebi.gov.in', 'India', 'SEBI', true)
ON CONFLICT DO NOTHING;
