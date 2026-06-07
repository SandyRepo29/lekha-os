-- Migration: Trust Score™
-- Adds trust_score columns to vendors and creates vendor_trust_history table.

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS trust_score integer,
  ADD COLUMN IF NOT EXISTS trust_score_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS ai_trust_narrative text,
  ADD COLUMN IF NOT EXISTS ai_trust_narrative_at timestamp with time zone;

CREATE TABLE IF NOT EXISTS vendor_trust_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  overall_score integer NOT NULL,
  evidence_score integer NOT NULL,
  compliance_score integer NOT NULL,
  risk_score integer NOT NULL,
  assessment_score integer NOT NULL,
  operational_score integer NOT NULL,
  freshness_score integer NOT NULL,
  trigger_event text,
  snapshot_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendor_trust_history_vendor_idx ON vendor_trust_history(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_trust_history_org_idx ON vendor_trust_history(organization_id);
CREATE INDEX IF NOT EXISTS vendor_trust_history_snapshot_idx ON vendor_trust_history(vendor_id, snapshot_at DESC);

-- RLS
ALTER TABLE vendor_trust_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_trust_history" ON vendor_trust_history
  FOR ALL USING (is_org_member(organization_id));
