-- Migration 0041: Soft Delete & Recovery for 7 entity types
-- Adds deleted_at TIMESTAMPTZ to vendors, risks, controls, evidence, policies, contracts, assessments
-- NULL = active row; non-NULL = soft-deleted

ALTER TABLE vendors     ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE risks       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE controls    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE evidence    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE policies    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE contracts   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Partial indexes for efficient "show me deleted items" queries
CREATE INDEX IF NOT EXISTS idx_vendors_deleted_at     ON vendors(organization_id, deleted_at)     WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_risks_deleted_at       ON risks(organization_id, deleted_at)       WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_controls_deleted_at    ON controls(organization_id, deleted_at)    WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_evidence_deleted_at    ON evidence(organization_id, deleted_at)    WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_policies_deleted_at    ON policies(organization_id, deleted_at)    WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_deleted_at   ON contracts(organization_id, deleted_at)   WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assessments_deleted_at ON assessments(organization_id, deleted_at) WHERE deleted_at IS NOT NULL;
