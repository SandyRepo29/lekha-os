-- Module 8: Governance Trends™ + Continuous Monitoring™
-- Extends governance_snapshots with evidence coverage
-- Adds governance_alerts for monitoring engine

-- ─── Extend governance_snapshots ────────────────────────────────────────────

ALTER TABLE governance_snapshots
  ADD COLUMN IF NOT EXISTS evidence_coverage_score INTEGER NOT NULL DEFAULT 0;

-- ─── Alert enums ─────────────────────────────────────────────────────────────

CREATE TYPE alert_severity AS ENUM ('info', 'low', 'medium', 'high', 'critical');
CREATE TYPE alert_entity_type AS ENUM (
  'vendor', 'risk', 'control', 'audit', 'evidence',
  'policy', 'framework', 'organization'
);

-- ─── Governance Alerts ───────────────────────────────────────────────────────

CREATE TABLE governance_alerts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  type              TEXT NOT NULL,         -- e.g. 'evidence_expired', 'control_health_drop'
  severity          alert_severity NOT NULL DEFAULT 'medium',
  title             TEXT NOT NULL,
  description       TEXT,

  entity_type       alert_entity_type,
  entity_id         UUID,

  status            TEXT NOT NULL DEFAULT 'open',  -- open | resolved | snoozed
  resolved_at       TIMESTAMPTZ,
  resolved_by       UUID REFERENCES profiles(id),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX gov_alerts_org_idx       ON governance_alerts(organization_id);
CREATE INDEX gov_alerts_status_idx    ON governance_alerts(organization_id, status);
CREATE INDEX gov_alerts_severity_idx  ON governance_alerts(organization_id, severity);
CREATE INDEX gov_alerts_type_idx      ON governance_alerts(organization_id, type);
CREATE INDEX gov_alerts_created_idx   ON governance_alerts(created_at DESC);

-- RLS
ALTER TABLE governance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read governance alerts"
  ON governance_alerts FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "org members can insert governance alerts"
  ON governance_alerts FOR INSERT
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "org members can update governance alerts"
  ON governance_alerts FOR UPDATE
  USING (is_org_member(organization_id));

CREATE POLICY "org members can delete governance alerts"
  ON governance_alerts FOR DELETE
  USING (is_org_member(organization_id));
