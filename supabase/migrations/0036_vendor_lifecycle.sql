-- ============================================================
-- Migration 0036 — Vendor Hub 2.0 Lifecycle Orchestration
-- Epic 1: Vendor Lifecycle State Machine, Approval Engine,
--         Contacts, Timeline, Onboarding Progress
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Enums
-- ────────────────────────────────────────────────────────────

CREATE TYPE vendor_state AS ENUM (
  'draft',
  'invited',
  'onboarding',
  'active',
  'under_review',
  'renewal_due',
  'renewing',
  'offboarding',
  'offboarded',
  'archived'
);

CREATE TYPE contact_type AS ENUM (
  'primary',
  'security',
  'privacy_officer',
  'legal',
  'finance',
  'technical',
  'escalation'
);

CREATE TYPE timeline_event_type AS ENUM (
  'vendor_created',
  'lifecycle_changed',
  'contact_added',
  'contact_updated',
  'assessment_completed',
  'risk_identified',
  'risk_closed',
  'evidence_uploaded',
  'evidence_expired',
  'policy_acknowledged',
  'audit_executed',
  'finding_raised',
  'finding_closed',
  'issue_created',
  'issue_resolved',
  'remediation_completed',
  'contract_created',
  'contract_renewed',
  'contract_expired',
  'approval_started',
  'approval_approved',
  'approval_rejected',
  'onboarding_started',
  'onboarding_step_completed',
  'onboarding_completed',
  'renewal_started',
  'renewal_completed',
  'offboarding_started',
  'offboarding_step_completed',
  'offboarding_completed',
  'note_added',
  'trust_score_updated',
  'monitoring_alert'
);

CREATE TYPE approval_type AS ENUM (
  'procurement',
  'security',
  'compliance',
  'legal',
  'privacy',
  'finance',
  'executive'
);

CREATE TYPE approval_workflow_type AS ENUM (
  'sequential',
  'parallel',
  'conditional'
);

CREATE TYPE approval_status AS ENUM (
  'pending',
  'in_progress',
  'approved',
  'rejected',
  'cancelled',
  'escalated'
);

CREATE TYPE approval_decision_type AS ENUM (
  'approved',
  'rejected',
  'delegated',
  'requested_changes'
);

-- ────────────────────────────────────────────────────────────
-- Add lifecycle_state column to vendors
-- ────────────────────────────────────────────────────────────

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS lifecycle_state vendor_state NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS lifecycle_state_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS lifecycle_state_reason TEXT,
  -- extended vendor profile fields
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS state_region TEXT,
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS registration_number TEXT,
  ADD COLUMN IF NOT EXISTS employee_count TEXT,
  ADD COLUMN IF NOT EXISTS annual_revenue TEXT,
  ADD COLUMN IF NOT EXISTS founded_year INTEGER,
  -- onboarding
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  -- renewal
  ADD COLUMN IF NOT EXISTS next_review_date DATE,
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ,
  -- approval reference
  ADD COLUMN IF NOT EXISTS active_approval_instance_id UUID;

-- Backfill existing active vendors
UPDATE vendors SET lifecycle_state = 'active', lifecycle_state_at = created_at WHERE status = 'active';
UPDATE vendors SET lifecycle_state = 'onboarding', lifecycle_state_at = created_at WHERE status = 'pending';
UPDATE vendors SET lifecycle_state = 'offboarded', lifecycle_state_at = updated_at WHERE status = 'inactive';

-- ────────────────────────────────────────────────────────────
-- vendor_lifecycle_history — state machine transition log
-- ────────────────────────────────────────────────────────────

CREATE TABLE vendor_lifecycle_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id         UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  from_state        vendor_state,
  to_state          vendor_state NOT NULL,
  transition_reason TEXT,
  triggered_by      TEXT NOT NULL DEFAULT 'manual', -- manual | automatic | approval | cron
  actor_id          UUID REFERENCES profiles(id),
  actor_name        TEXT,
  metadata          JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX vlh_org_idx    ON vendor_lifecycle_history(organization_id);
CREATE INDEX vlh_vendor_idx ON vendor_lifecycle_history(vendor_id);
CREATE INDEX vlh_created_idx ON vendor_lifecycle_history(created_at DESC);

-- ────────────────────────────────────────────────────────────
-- vendor_contacts — enterprise contact management
-- ────────────────────────────────────────────────────────────

CREATE TABLE vendor_contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  contact_type    contact_type NOT NULL DEFAULT 'primary',
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  title           TEXT,
  department      TEXT,
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
  linkedin_url    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX vc_org_idx    ON vendor_contacts(organization_id);
CREATE INDEX vc_vendor_idx ON vendor_contacts(vendor_id);

-- ────────────────────────────────────────────────────────────
-- vendor_timeline — complete chronological history
-- ────────────────────────────────────────────────────────────

CREATE TABLE vendor_timeline (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  event_type      timeline_event_type NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  actor_id        UUID REFERENCES profiles(id),
  actor_name      TEXT,
  entity_type     TEXT,    -- risk | finding | contract | assessment | document | approval | etc.
  entity_id       UUID,    -- the related entity UUID
  metadata        JSONB,
  severity        TEXT,    -- info | warn | danger | success
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX vt_org_idx    ON vendor_timeline(organization_id);
CREATE INDEX vt_vendor_idx ON vendor_timeline(vendor_id);
CREATE INDEX vt_created_idx ON vendor_timeline(vendor_id, created_at DESC);

-- ────────────────────────────────────────────────────────────
-- approval_templates — configurable approval workflow templates
-- ────────────────────────────────────────────────────────────

CREATE TABLE approval_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  approval_type   approval_type NOT NULL,
  workflow_type   approval_workflow_type NOT NULL DEFAULT 'sequential',
  trigger_on      TEXT,    -- vendor_onboarding | vendor_renewal | vendor_offboarding | manual
  auto_approve_days INTEGER, -- auto-approve after N days if no action
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX at_org_idx ON approval_templates(organization_id);

-- ────────────────────────────────────────────────────────────
-- approval_steps — steps within a template
-- ────────────────────────────────────────────────────────────

CREATE TABLE approval_steps (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id         UUID NOT NULL REFERENCES approval_templates(id) ON DELETE CASCADE,
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  step_order          INTEGER NOT NULL DEFAULT 1,
  name                TEXT NOT NULL,
  description         TEXT,
  approver_role       TEXT,  -- membership_role value; NULL = any admin
  approver_user_id    UUID REFERENCES profiles(id),  -- specific user override
  timeout_hours       INTEGER DEFAULT 72,  -- SLA
  escalation_user_id  UUID REFERENCES profiles(id),
  is_required         BOOLEAN NOT NULL DEFAULT TRUE,
  conditions          JSONB,  -- conditional step rules
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX as_template_idx ON approval_steps(template_id);

-- ────────────────────────────────────────────────────────────
-- approval_instances — running approval workflows
-- ────────────────────────────────────────────────────────────

CREATE TABLE approval_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id     UUID REFERENCES approval_templates(id),
  entity_type     TEXT NOT NULL DEFAULT 'vendor',
  entity_id       UUID NOT NULL,
  title           TEXT NOT NULL,
  approval_type   approval_type NOT NULL,
  workflow_type   approval_workflow_type NOT NULL DEFAULT 'sequential',
  status          approval_status NOT NULL DEFAULT 'pending',
  current_step    INTEGER DEFAULT 1,
  total_steps     INTEGER DEFAULT 1,
  initiated_by    UUID REFERENCES profiles(id),
  initiated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at          TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  metadata        JSONB,
  notes           TEXT
);

CREATE INDEX ai_org_idx    ON approval_instances(organization_id);
CREATE INDEX ai_entity_idx ON approval_instances(entity_type, entity_id);
CREATE INDEX ai_status_idx ON approval_instances(organization_id, status);

-- ────────────────────────────────────────────────────────────
-- approval_decisions — per-step decisions
-- ────────────────────────────────────────────────────────────

CREATE TABLE approval_decisions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id      UUID NOT NULL REFERENCES approval_instances(id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  step_number      INTEGER NOT NULL,
  step_name        TEXT,
  approver_id      UUID REFERENCES profiles(id),
  approver_name    TEXT,
  decision         approval_decision_type NOT NULL,
  comments         TEXT,
  delegated_to_id  UUID REFERENCES profiles(id),
  decided_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ad_instance_idx ON approval_decisions(instance_id);
CREATE INDEX ad_org_idx      ON approval_decisions(organization_id);

-- ────────────────────────────────────────────────────────────
-- vendor_onboarding_progress — save & resume wizard
-- ────────────────────────────────────────────────────────────

CREATE TABLE vendor_onboarding_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  current_step    INTEGER NOT NULL DEFAULT 1,
  completed_steps INTEGER[] NOT NULL DEFAULT '{}',
  form_data       JSONB NOT NULL DEFAULT '{}',
  is_complete     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vendor_id)
);

CREATE INDEX vop_org_idx    ON vendor_onboarding_progress(organization_id);
CREATE INDEX vop_vendor_idx ON vendor_onboarding_progress(vendor_id);

-- ────────────────────────────────────────────────────────────
-- vendor_renewal_assessments — renewal decision workspace
-- ────────────────────────────────────────────────────────────

CREATE TABLE vendor_renewal_assessments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id        UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  assessment_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  trust_score      INTEGER,
  compliance_score INTEGER,
  open_risks       INTEGER DEFAULT 0,
  critical_risks   INTEGER DEFAULT 0,
  open_findings    INTEGER DEFAULT 0,
  open_capas       INTEGER DEFAULT 0,
  contract_health  INTEGER,
  recommendation   TEXT,  -- renew | renew_with_conditions | renegotiate | suspend | offboard
  confidence_pct   INTEGER,
  conditions       TEXT[],
  notes            TEXT,
  decided_by       UUID REFERENCES profiles(id),
  decided_at       TIMESTAMPTZ,
  ai_analysis      TEXT,
  created_by       UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX vra_org_idx    ON vendor_renewal_assessments(organization_id);
CREATE INDEX vra_vendor_idx ON vendor_renewal_assessments(vendor_id);

-- ────────────────────────────────────────────────────────────
-- vendor_offboarding_checklists — structured offboarding
-- ────────────────────────────────────────────────────────────

CREATE TABLE vendor_offboarding_checklists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  initiated_by    UUID REFERENCES profiles(id),
  initiated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason          TEXT,
  target_date     DATE,
  -- checklist item completion flags
  access_disabled          BOOLEAN NOT NULL DEFAULT FALSE,
  access_disabled_at       TIMESTAMPTZ,
  contracts_closed         BOOLEAN NOT NULL DEFAULT FALSE,
  contracts_closed_at      TIMESTAMPTZ,
  documents_archived       BOOLEAN NOT NULL DEFAULT FALSE,
  documents_archived_at    TIMESTAMPTZ,
  final_assessment_done    BOOLEAN NOT NULL DEFAULT FALSE,
  final_assessment_at      TIMESTAMPTZ,
  evidence_verified        BOOLEAN NOT NULL DEFAULT FALSE,
  evidence_verified_at     TIMESTAMPTZ,
  open_tasks_closed        BOOLEAN NOT NULL DEFAULT FALSE,
  open_tasks_closed_at     TIMESTAMPTZ,
  lessons_captured         BOOLEAN NOT NULL DEFAULT FALSE,
  lessons_captured_at      TIMESTAMPTZ,
  archive_package_generated BOOLEAN NOT NULL DEFAULT FALSE,
  archive_package_at       TIMESTAMPTZ,
  lifecycle_updated        BOOLEAN NOT NULL DEFAULT FALSE,
  lifecycle_updated_at     TIMESTAMPTZ,
  lessons_learned          TEXT,
  completed_at             TIMESTAMPTZ,
  UNIQUE(vendor_id)
);

CREATE INDEX voc_org_idx    ON vendor_offboarding_checklists(organization_id);
CREATE INDEX voc_vendor_idx ON vendor_offboarding_checklists(vendor_id);

-- ────────────────────────────────────────────────────────────
-- RLS Policies
-- ────────────────────────────────────────────────────────────

ALTER TABLE vendor_lifecycle_history        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contacts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_timeline                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_templates              ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_steps                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_instances              ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_decisions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_onboarding_progress      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_renewal_assessments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_offboarding_checklists   ENABLE ROW LEVEL SECURITY;

-- vendor_lifecycle_history
CREATE POLICY vlh_select ON vendor_lifecycle_history FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY vlh_insert ON vendor_lifecycle_history FOR INSERT WITH CHECK (is_org_member(organization_id));

-- vendor_contacts
CREATE POLICY vc_select ON vendor_contacts FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY vc_insert ON vendor_contacts FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY vc_update ON vendor_contacts FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY vc_delete ON vendor_contacts FOR DELETE USING (is_org_member(organization_id));

-- vendor_timeline
CREATE POLICY vt_select ON vendor_timeline FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY vt_insert ON vendor_timeline FOR INSERT WITH CHECK (is_org_member(organization_id));

-- approval_templates
CREATE POLICY at_select ON approval_templates FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY at_insert ON approval_templates FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY at_update ON approval_templates FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY at_delete ON approval_templates FOR DELETE USING (is_org_member(organization_id));

-- approval_steps
CREATE POLICY as_select ON approval_steps FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY as_insert ON approval_steps FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY as_update ON approval_steps FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY as_delete ON approval_steps FOR DELETE USING (is_org_member(organization_id));

-- approval_instances
CREATE POLICY ai_select ON approval_instances FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY ai_insert ON approval_instances FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY ai_update ON approval_instances FOR UPDATE USING (is_org_member(organization_id));

-- approval_decisions
CREATE POLICY ad_select ON approval_decisions FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY ad_insert ON approval_decisions FOR INSERT WITH CHECK (is_org_member(organization_id));

-- vendor_onboarding_progress
CREATE POLICY vop_select ON vendor_onboarding_progress FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY vop_insert ON vendor_onboarding_progress FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY vop_update ON vendor_onboarding_progress FOR UPDATE USING (is_org_member(organization_id));

-- vendor_renewal_assessments
CREATE POLICY vra_select ON vendor_renewal_assessments FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY vra_insert ON vendor_renewal_assessments FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY vra_update ON vendor_renewal_assessments FOR UPDATE USING (is_org_member(organization_id));

-- vendor_offboarding_checklists
CREATE POLICY voc_select ON vendor_offboarding_checklists FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY voc_insert ON vendor_offboarding_checklists FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY voc_update ON vendor_offboarding_checklists FOR UPDATE USING (is_org_member(organization_id));
