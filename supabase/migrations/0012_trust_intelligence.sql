-- Trust Intelligence™ — Module 7
-- Organizational governance snapshot table for trend tracking

CREATE TABLE governance_snapshots (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_date           DATE NOT NULL,

  -- Organizational Trust Score™ (0–100)
  org_trust_score         INTEGER NOT NULL DEFAULT 0,

  -- Component scores (0–100 each)
  vendor_trust_score      INTEGER NOT NULL DEFAULT 0,
  risk_posture_score      INTEGER NOT NULL DEFAULT 0,
  control_health_score    INTEGER NOT NULL DEFAULT 0,
  audit_readiness_score   INTEGER NOT NULL DEFAULT 0,
  compliance_coverage_score INTEGER NOT NULL DEFAULT 0,

  -- Raw counts for context
  total_vendors           INTEGER NOT NULL DEFAULT 0,
  scored_vendors          INTEGER NOT NULL DEFAULT 0,
  active_risks            INTEGER NOT NULL DEFAULT 0,
  critical_risks          INTEGER NOT NULL DEFAULT 0,
  open_findings           INTEGER NOT NULL DEFAULT 0,
  avg_control_health      INTEGER NOT NULL DEFAULT 0,
  avg_framework_readiness INTEGER NOT NULL DEFAULT 0,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX gov_snapshots_org_date_uniq
  ON governance_snapshots(organization_id, snapshot_date);

CREATE INDEX gov_snapshots_org_idx
  ON governance_snapshots(organization_id);

CREATE INDEX gov_snapshots_date_idx
  ON governance_snapshots(snapshot_date);

-- RLS
ALTER TABLE governance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read governance snapshots"
  ON governance_snapshots FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "org members can insert governance snapshots"
  ON governance_snapshots FOR INSERT
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "org members can update governance snapshots"
  ON governance_snapshots FOR UPDATE
  USING (is_org_member(organization_id));
