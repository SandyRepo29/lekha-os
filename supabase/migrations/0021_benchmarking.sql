-- ============================================================
-- Migration 0021 — Governance Benchmarking™ (Module 16)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE benchmark_category AS ENUM (
    'organizational_trust', 'vendor_trust', 'risk_posture', 'control_health',
    'audit_readiness', 'compliance_coverage', 'privacy_trust', 'contract_trust',
    'issue_resolution', 'workflow_automation'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE benchmark_maturity_level AS ENUM (
    'reactive', 'managed', 'defined', 'measured', 'optimized', 'trust_leader'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE benchmark_ranking_label AS ENUM (
    'top_1_percent', 'top_5_percent', 'top_10_percent', 'top_quartile',
    'above_average', 'average', 'below_average', 'at_risk'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Industry baseline data (system-wide, not per-org) ──────────────────────
CREATE TABLE IF NOT EXISTS benchmark_industries (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  industry    TEXT    NOT NULL,
  company_size TEXT   NOT NULL DEFAULT 'all',
  category    benchmark_category NOT NULL,
  avg_score   INTEGER NOT NULL DEFAULT 65,
  median_score INTEGER NOT NULL DEFAULT 65,
  top_quartile INTEGER NOT NULL DEFAULT 80,
  top_decile  INTEGER NOT NULL DEFAULT 90,
  bottom_quartile INTEGER NOT NULL DEFAULT 50,
  std_dev     INTEGER NOT NULL DEFAULT 15,
  sample_size INTEGER NOT NULL DEFAULT 100,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(industry, company_size, category)
);

-- ── Per-org benchmark snapshot ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS benchmark_snapshots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_date    TEXT NOT NULL DEFAULT CURRENT_DATE::TEXT,
  industry         TEXT,
  company_size     TEXT,
  overall_score    INTEGER,
  overall_percentile INTEGER,
  maturity_level   benchmark_maturity_level NOT NULL DEFAULT 'reactive',
  overall_ranking  benchmark_ranking_label  NOT NULL DEFAULT 'average',
  peer_count       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS benchmark_snapshots_org_idx  ON benchmark_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS benchmark_snapshots_date_idx ON benchmark_snapshots(organization_id, snapshot_date DESC);
ALTER TABLE benchmark_snapshots ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY benchmark_snapshots_org ON benchmark_snapshots FOR ALL USING (is_org_member(organization_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Per-snapshot category scores ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS benchmark_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id     UUID NOT NULL REFERENCES benchmark_snapshots(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category        benchmark_category NOT NULL,
  org_score       INTEGER,
  industry_avg    INTEGER,
  peer_avg        INTEGER,
  top_quartile    INTEGER,
  percentile      INTEGER,
  ranking_label   benchmark_ranking_label NOT NULL DEFAULT 'average',
  delta_vs_industry INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS benchmark_scores_snapshot_idx  ON benchmark_scores(snapshot_id);
CREATE INDEX IF NOT EXISTS benchmark_scores_org_idx       ON benchmark_scores(organization_id);
CREATE INDEX IF NOT EXISTS benchmark_scores_category_idx  ON benchmark_scores(organization_id, category);
ALTER TABLE benchmark_scores ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY benchmark_scores_org ON benchmark_scores FOR ALL USING (is_org_member(organization_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Monthly trend data (sparklines) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS benchmark_trends (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category        benchmark_category NOT NULL,
  period_month    TEXT NOT NULL,
  score           INTEGER,
  percentile      INTEGER,
  ranking_label   benchmark_ranking_label NOT NULL DEFAULT 'average',
  industry_avg    INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, category, period_month)
);
CREATE INDEX IF NOT EXISTS benchmark_trends_org_idx      ON benchmark_trends(organization_id);
CREATE INDEX IF NOT EXISTS benchmark_trends_category_idx ON benchmark_trends(organization_id, category, period_month DESC);
ALTER TABLE benchmark_trends ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY benchmark_trends_org ON benchmark_trends FOR ALL USING (is_org_member(organization_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Seed industry baseline data
-- ============================================================
INSERT INTO benchmark_industries (industry, company_size, category, avg_score, median_score, top_quartile, top_decile, bottom_quartile, std_dev, sample_size) VALUES
-- Technology / SaaS
('technology', 'all', 'organizational_trust', 72, 73, 84, 92, 59, 14, 500),
('technology', 'all', 'vendor_trust',         74, 75, 86, 93, 62, 13, 500),
('technology', 'all', 'risk_posture',         68, 69, 80, 89, 56, 14, 500),
('technology', 'all', 'control_health',       70, 71, 82, 91, 58, 14, 500),
('technology', 'all', 'audit_readiness',      66, 67, 79, 88, 53, 15, 500),
('technology', 'all', 'compliance_coverage',  71, 72, 83, 91, 59, 14, 500),
('technology', 'all', 'privacy_trust',        69, 70, 81, 90, 57, 14, 500),
('technology', 'all', 'contract_trust',       67, 68, 79, 88, 54, 14, 500),
('technology', 'all', 'issue_resolution',     65, 66, 77, 87, 52, 15, 500),
('technology', 'all', 'workflow_automation',  63, 64, 76, 86, 50, 15, 500),
-- Financial Services
('financial_services', 'all', 'organizational_trust', 75, 76, 87, 94, 63, 13, 400),
('financial_services', 'all', 'vendor_trust',         77, 78, 88, 95, 65, 13, 400),
('financial_services', 'all', 'risk_posture',         78, 79, 89, 95, 66, 12, 400),
('financial_services', 'all', 'control_health',       76, 77, 87, 94, 64, 13, 400),
('financial_services', 'all', 'audit_readiness',      80, 81, 90, 96, 68, 12, 400),
('financial_services', 'all', 'compliance_coverage',  82, 83, 91, 97, 70, 12, 400),
('financial_services', 'all', 'privacy_trust',        74, 75, 85, 93, 62, 13, 400),
('financial_services', 'all', 'contract_trust',       73, 74, 84, 93, 61, 14, 400),
('financial_services', 'all', 'issue_resolution',     71, 72, 83, 92, 59, 14, 400),
('financial_services', 'all', 'workflow_automation',  68, 69, 80, 90, 56, 15, 400),
-- Healthcare
('healthcare', 'all', 'organizational_trust', 68, 69, 80, 89, 56, 14, 300),
('healthcare', 'all', 'vendor_trust',         70, 71, 81, 90, 58, 14, 300),
('healthcare', 'all', 'risk_posture',         67, 68, 79, 88, 55, 14, 300),
('healthcare', 'all', 'control_health',       66, 67, 78, 87, 54, 15, 300),
('healthcare', 'all', 'audit_readiness',      65, 66, 77, 87, 53, 15, 300),
('healthcare', 'all', 'compliance_coverage',  72, 73, 83, 91, 60, 13, 300),
('healthcare', 'all', 'privacy_trust',        74, 75, 85, 93, 62, 13, 300),
('healthcare', 'all', 'contract_trust',       64, 65, 76, 86, 52, 15, 300),
('healthcare', 'all', 'issue_resolution',     62, 63, 75, 85, 50, 15, 300),
('healthcare', 'all', 'workflow_automation',  58, 59, 71, 82, 46, 16, 300),
-- Manufacturing
('manufacturing', 'all', 'organizational_trust', 62, 63, 75, 85, 50, 15, 250),
('manufacturing', 'all', 'vendor_trust',         65, 66, 77, 87, 53, 15, 250),
('manufacturing', 'all', 'risk_posture',         60, 61, 73, 83, 48, 15, 250),
('manufacturing', 'all', 'control_health',       58, 59, 71, 81, 46, 16, 250),
('manufacturing', 'all', 'audit_readiness',      57, 58, 70, 80, 45, 16, 250),
('manufacturing', 'all', 'compliance_coverage',  63, 64, 76, 86, 51, 15, 250),
('manufacturing', 'all', 'privacy_trust',        60, 61, 73, 83, 48, 15, 250),
('manufacturing', 'all', 'contract_trust',       62, 63, 74, 84, 50, 15, 250),
('manufacturing', 'all', 'issue_resolution',     55, 56, 68, 79, 43, 16, 250),
('manufacturing', 'all', 'workflow_automation',  50, 51, 63, 75, 38, 17, 250),
-- Professional Services
('professional_services', 'all', 'organizational_trust', 70, 71, 82, 91, 58, 14, 200),
('professional_services', 'all', 'vendor_trust',         72, 73, 83, 92, 60, 14, 200),
('professional_services', 'all', 'risk_posture',         66, 67, 78, 88, 54, 15, 200),
('professional_services', 'all', 'control_health',       67, 68, 79, 89, 55, 14, 200),
('professional_services', 'all', 'audit_readiness',      68, 69, 80, 89, 56, 14, 200),
('professional_services', 'all', 'compliance_coverage',  69, 70, 81, 90, 57, 14, 200),
('professional_services', 'all', 'privacy_trust',        67, 68, 79, 88, 55, 15, 200),
('professional_services', 'all', 'contract_trust',       70, 71, 82, 91, 58, 14, 200),
('professional_services', 'all', 'issue_resolution',     64, 65, 76, 86, 52, 15, 200),
('professional_services', 'all', 'workflow_automation',  61, 62, 74, 84, 49, 15, 200),
-- All industries (fallback)
('all', 'all', 'organizational_trust', 69, 70, 81, 90, 57, 14, 2000),
('all', 'all', 'vendor_trust',         71, 72, 82, 91, 59, 14, 2000),
('all', 'all', 'risk_posture',         67, 68, 79, 88, 55, 14, 2000),
('all', 'all', 'control_health',       67, 68, 79, 88, 55, 15, 2000),
('all', 'all', 'audit_readiness',      65, 66, 77, 87, 53, 15, 2000),
('all', 'all', 'compliance_coverage',  70, 71, 82, 91, 58, 14, 2000),
('all', 'all', 'privacy_trust',        68, 69, 80, 89, 56, 14, 2000),
('all', 'all', 'contract_trust',       65, 66, 77, 87, 53, 15, 2000),
('all', 'all', 'issue_resolution',     63, 64, 75, 85, 51, 15, 2000),
('all', 'all', 'workflow_automation',  60, 61, 73, 83, 48, 16, 2000)
ON CONFLICT (industry, company_size, category) DO NOTHING;
