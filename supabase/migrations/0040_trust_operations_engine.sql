-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0040 — Trust Operations Engine (Epic 03)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Enums ─────────────────────────────────────────────────────────────────────

CREATE TYPE toe_event_severity   AS ENUM ('critical', 'high', 'medium', 'low', 'info');
CREATE TYPE toe_workflow_status  AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE toe_instance_status  AS ENUM ('pending', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled');
CREATE TYPE toe_step_status      AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped', 'waiting');
CREATE TYPE toe_approval_status  AS ENUM ('pending', 'approved', 'rejected', 'escalated', 'expired');
CREATE TYPE toe_ai_decision_status AS ENUM ('pending', 'accepted', 'dismissed', 'expired');
CREATE TYPE toe_automation_action  AS ENUM ('create_task', 'create_issue', 'send_notification', 'trigger_workflow', 'update_status', 'assign_owner', 'escalate', 'ai_analyze');

-- ── Event Catalogue (global, no org_id) ───────────────────────────────────────

CREATE TABLE toe_event_types (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT UNIQUE NOT NULL,
  label          TEXT NOT NULL,
  description    TEXT,
  module         TEXT NOT NULL,
  severity       toe_event_severity DEFAULT 'info',
  payload_schema JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ── Event Log ─────────────────────────────────────────────────────────────────

CREATE TABLE toe_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL,
  entity_type  TEXT,
  entity_id    UUID,
  actor_id     UUID,
  payload      JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX toe_events_org_idx  ON toe_events(org_id, published_at DESC);
CREATE INDEX toe_events_type_idx ON toe_events(org_id, event_type, published_at DESC);

-- ── Event Subscriptions ───────────────────────────────────────────────────────

CREATE TABLE toe_event_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  channel     TEXT NOT NULL,
  config      JSONB DEFAULT '{}',
  active      BOOLEAN DEFAULT true,
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Workflow Definitions ──────────────────────────────────────────────────────

CREATE TABLE toe_workflows (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  trigger_event TEXT,
  steps         JSONB DEFAULT '[]',
  status        toe_workflow_status DEFAULT 'draft',
  version       INT DEFAULT 1,
  is_template   BOOLEAN DEFAULT false,
  created_by    UUID,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Workflow Instances ────────────────────────────────────────────────────────

CREATE TABLE toe_workflow_instances (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_id      UUID REFERENCES toe_workflows(id) ON DELETE SET NULL,
  workflow_name    TEXT NOT NULL,
  trigger_event_id UUID,
  status           toe_instance_status DEFAULT 'pending',
  current_step     INT DEFAULT 0,
  total_steps      INT DEFAULT 0,
  context          JSONB DEFAULT '{}',
  error_message    TEXT,
  started_at       TIMESTAMPTZ DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  created_by       UUID,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX toe_instances_org_idx    ON toe_workflow_instances(org_id, started_at DESC);
CREATE INDEX toe_instances_status_idx ON toe_workflow_instances(org_id, status);

-- ── Workflow Instance Steps ───────────────────────────────────────────────────

CREATE TABLE toe_workflow_instance_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES toe_workflow_instances(id) ON DELETE CASCADE,
  step_index  INT NOT NULL,
  step_name   TEXT NOT NULL,
  step_type   TEXT DEFAULT 'action',
  status      toe_step_status DEFAULT 'pending',
  input       JSONB DEFAULT '{}',
  output      JSONB DEFAULT '{}',
  assigned_to UUID,
  started_at  TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Approval Queue ────────────────────────────────────────────────────────────

CREATE TABLE toe_approvals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type   TEXT,
  entity_id     UUID,
  request_type  TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  requester_id  UUID,
  assignee_id   UUID,
  status        toe_approval_status DEFAULT 'pending',
  context       JSONB DEFAULT '{}',
  notes         TEXT,
  instance_id   UUID,
  due_at        TIMESTAMPTZ,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX toe_approvals_org_idx    ON toe_approvals(org_id, created_at DESC);
CREATE INDEX toe_approvals_status_idx ON toe_approvals(org_id, status);

-- ── Automation Rules ──────────────────────────────────────────────────────────

CREATE TABLE toe_automation_rules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  trigger_event TEXT NOT NULL,
  conditions    JSONB DEFAULT '{}',
  action_type   toe_automation_action NOT NULL,
  action_config JSONB DEFAULT '{}',
  active        BOOLEAN DEFAULT true,
  run_count     INT DEFAULT 0,
  last_run_at   TIMESTAMPTZ,
  created_by    UUID,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE toe_automation_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id          UUID REFERENCES toe_automation_rules(id) ON DELETE CASCADE,
  org_id           UUID NOT NULL,
  trigger_event_id UUID,
  status           TEXT DEFAULT 'success',
  output           JSONB DEFAULT '{}',
  executed_at      TIMESTAMPTZ DEFAULT now()
);

-- ── AI Decisions ──────────────────────────────────────────────────────────────

CREATE TABLE toe_ai_decisions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  context        TEXT,
  recommendation TEXT NOT NULL,
  confidence     INT DEFAULT 0,
  priority       TEXT DEFAULT 'medium',
  status         toe_ai_decision_status DEFAULT 'pending',
  entity_type    TEXT,
  entity_id      UUID,
  instance_id    UUID,
  reasoning      TEXT,
  actions        JSONB DEFAULT '[]',
  accepted_at    TIMESTAMPTZ,
  dismissed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX toe_decisions_org_idx ON toe_ai_decisions(org_id, created_at DESC);

-- ── Workflow Analytics ────────────────────────────────────────────────────────

CREATE TABLE toe_workflow_analytics (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_id          UUID,
  workflow_name        TEXT,
  period_start         DATE NOT NULL,
  avg_duration_ms      BIGINT DEFAULT 0,
  completion_rate      INT DEFAULT 0,
  sla_compliance_rate  INT DEFAULT 0,
  total_runs           INT DEFAULT 0,
  successful_runs      INT DEFAULT 0,
  failed_runs          INT DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, workflow_id, period_start)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE toe_event_types           ENABLE ROW LEVEL SECURITY;
ALTER TABLE toe_events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE toe_event_subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE toe_workflows             ENABLE ROW LEVEL SECURITY;
ALTER TABLE toe_workflow_instances    ENABLE ROW LEVEL SECURITY;
ALTER TABLE toe_workflow_instance_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE toe_approvals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE toe_automation_rules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE toe_automation_runs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE toe_ai_decisions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE toe_workflow_analytics    ENABLE ROW LEVEL SECURITY;

-- toe_event_types: global catalogue, read-only for all authenticated users
CREATE POLICY "Authenticated users can read event types" ON toe_event_types
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Org-scoped tables
CREATE POLICY "Org members can manage events" ON toe_events
  FOR ALL USING (is_org_member(org_id));

CREATE POLICY "Org members can manage subscriptions" ON toe_event_subscriptions
  FOR ALL USING (is_org_member(org_id));

CREATE POLICY "Org members can manage workflows" ON toe_workflows
  FOR ALL USING (org_id IS NULL OR is_org_member(org_id));

CREATE POLICY "Org members can manage instances" ON toe_workflow_instances
  FOR ALL USING (is_org_member(org_id));

CREATE POLICY "Org members can manage instance steps" ON toe_workflow_instance_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM toe_workflow_instances wi
      WHERE wi.id = instance_id AND is_org_member(wi.org_id)
    )
  );

CREATE POLICY "Org members can manage approvals" ON toe_approvals
  FOR ALL USING (is_org_member(org_id));

CREATE POLICY "Org members can manage automation rules" ON toe_automation_rules
  FOR ALL USING (is_org_member(org_id));

CREATE POLICY "Org members can read automation runs" ON toe_automation_runs
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "Org members can manage ai decisions" ON toe_ai_decisions
  FOR ALL USING (is_org_member(org_id));

CREATE POLICY "Org members can read workflow analytics" ON toe_workflow_analytics
  FOR SELECT USING (is_org_member(org_id));

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: Built-in Event Types
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO toe_event_types (name, label, description, module, severity) VALUES
  -- Vendor
  ('vendor.created',          'Vendor Created',              'A new vendor was added',                               'vendor_hub',   'info'),
  ('vendor.approved',         'Vendor Approved',             'Vendor was approved and activated',                    'vendor_hub',   'info'),
  ('vendor.status_changed',   'Vendor Status Changed',       'Vendor lifecycle state changed',                       'vendor_hub',   'medium'),
  ('vendor.renewal_due',      'Vendor Renewal Due',          'Vendor contract is due for renewal',                   'vendor_hub',   'high'),
  ('vendor.offboarded',       'Vendor Offboarded',           'Vendor has been offboarded',                           'vendor_hub',   'medium'),
  -- Assessment
  ('assessment.started',      'Assessment Started',          'A security assessment was initiated',                  'vendor_hub',   'info'),
  ('assessment.completed',    'Assessment Completed',        'A security assessment was completed',                  'vendor_hub',   'medium'),
  -- Risk
  ('risk.created',            'Risk Created',                'A new risk was identified',                            'risk_lens',    'medium'),
  ('risk.accepted',           'Risk Accepted',               'A risk was formally accepted',                         'risk_lens',    'medium'),
  ('risk.critical',           'Critical Risk Open',          'A critical risk remains open',                         'risk_lens',    'critical'),
  ('risk.closed',             'Risk Closed',                 'A risk was resolved and closed',                       'risk_lens',    'info'),
  -- Control
  ('control.failed',          'Control Failed',              'A control test has failed',                            'control_center', 'high'),
  ('control.health_critical', 'Control Health Critical',     'Control health score dropped below critical threshold','control_center', 'critical'),
  -- Evidence
  ('evidence.uploaded',       'Evidence Uploaded',           'New evidence was uploaded',                            'evidence_vault', 'info'),
  ('evidence.expiring_soon',  'Evidence Expiring Soon',      'Evidence will expire within 30 days',                  'evidence_vault', 'high'),
  ('evidence.expired',        'Evidence Expired',            'Evidence has expired',                                 'evidence_vault', 'critical'),
  -- Audit
  ('audit.created',           'Audit Created',               'A new audit was created',                              'audit_mgmt',   'info'),
  ('audit.completed',         'Audit Completed',             'An audit was completed',                               'audit_mgmt',   'info'),
  ('audit.overdue',           'Audit Overdue',               'An active audit has passed its end date',              'audit_mgmt',   'high'),
  -- Finding
  ('finding.raised',          'Finding Raised',              'A new audit finding was raised',                       'audit_mgmt',   'high'),
  ('finding.critical',        'Critical Finding Open',       'A critical finding remains unresolved',                'audit_mgmt',   'critical'),
  ('finding.closed',          'Finding Closed',              'An audit finding was closed',                          'audit_mgmt',   'info'),
  -- CAPA
  ('capa.created',            'CAPA Created',                'A corrective action was created',                      'audit_mgmt',   'medium'),
  ('capa.overdue',            'CAPA Overdue',                'A corrective action passed its due date',              'audit_mgmt',   'high'),
  ('capa.completed',          'CAPA Completed',              'A corrective action was completed',                    'audit_mgmt',   'info'),
  -- Policy
  ('policy.published',        'Policy Published',            'A compliance policy was published',                    'policy_gov',   'info'),
  ('policy.expiring',         'Policy Expiring',             'A policy is approaching its review date',              'policy_gov',   'medium'),
  -- Contract
  ('contract.expiring',       'Contract Expiring',           'A contract is expiring within 90 days',                'contract_gov', 'high'),
  ('contract.renewed',        'Contract Renewed',            'A contract was successfully renewed',                  'contract_gov', 'info'),
  ('contract.expired',        'Contract Expired',            'A contract has expired',                               'contract_gov', 'critical'),
  -- Trust Score
  ('trust_score.dropped',     'Trust Score Dropped',         'Vendor trust score declined significantly',            'trust_score',  'high'),
  ('trust_score.critical',    'Trust Score Critical',        'Vendor trust score reached critical level',            'trust_score',  'critical'),
  -- Platform
  ('workflow.started',        'Workflow Started',            'A governance workflow was initiated',                  'toe',          'info'),
  ('workflow.completed',      'Workflow Completed',          'A governance workflow was completed',                  'toe',          'info'),
  ('workflow.failed',         'Workflow Failed',             'A governance workflow encountered an error',           'toe',          'high'),
  ('approval.requested',      'Approval Requested',         'A governance action requires approval',                'toe',          'medium'),
  ('approval.overdue',        'Approval Overdue',            'A pending approval has passed its due date',           'toe',          'high')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: Built-in Workflow Templates (org_id = NULL = global)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO toe_workflows (name, description, trigger_event, steps, status, is_template) VALUES
  (
    'Vendor Onboarding',
    'End-to-end vendor onboarding from invitation through first assessment.',
    'vendor.created',
    '[
      {"index":0,"name":"Send Welcome","type":"notification","config":{"channel":"email","template":"vendor_welcome"}},
      {"index":1,"name":"Request Documents","type":"action","config":{"action":"create_task","title":"Upload onboarding documents"}},
      {"index":2,"name":"Conduct Assessment","type":"action","config":{"action":"trigger_workflow","target":"assessment"}},
      {"index":3,"name":"Manager Approval","type":"approval","config":{"request_type":"vendor_activation","title":"Approve vendor activation"}},
      {"index":4,"name":"Activate Vendor","type":"action","config":{"action":"update_status","status":"active"}}
    ]',
    'active', true
  ),
  (
    'Evidence Expiry Response',
    'Automatically request renewed evidence when existing evidence expires.',
    'evidence.expiring_soon',
    '[
      {"index":0,"name":"Notify Evidence Owner","type":"notification","config":{"channel":"email","template":"evidence_expiry"}},
      {"index":1,"name":"Create Renewal Task","type":"action","config":{"action":"create_task","title":"Renew expiring evidence"}},
      {"index":2,"name":"Escalate if Overdue","type":"conditional","config":{"condition":"task_overdue","then_step":3}},
      {"index":3,"name":"Manager Escalation","type":"notification","config":{"channel":"email","template":"evidence_escalation"}}
    ]',
    'active', true
  ),
  (
    'Trust Score Drop Response',
    'Initiate a governance review when a vendor trust score drops significantly.',
    'trust_score.dropped',
    '[
      {"index":0,"name":"Create Governance Issue","type":"action","config":{"action":"create_issue","severity":"high"}},
      {"index":1,"name":"Assign Owner","type":"action","config":{"action":"assign_owner"}},
      {"index":2,"name":"Notify Manager","type":"notification","config":{"channel":"email","template":"trust_score_alert"}},
      {"index":3,"name":"Schedule Assessment","type":"action","config":{"action":"create_task","title":"Conduct trust score review"}}
    ]',
    'active', true
  ),
  (
    'Contract Renewal Workflow',
    'Orchestrate contract renewal from notification through approval.',
    'contract.expiring',
    '[
      {"index":0,"name":"Notify Contract Owner","type":"notification","config":{"channel":"email","template":"contract_expiry"}},
      {"index":1,"name":"Generate Renewal Assessment","type":"ai_action","config":{"action":"ai_analyze","context":"renewal_readiness"}},
      {"index":2,"name":"Renewal Decision","type":"approval","config":{"request_type":"contract_renewal","title":"Approve contract renewal"}},
      {"index":3,"name":"Update Contract","type":"action","config":{"action":"update_status","status":"renewed"}}
    ]',
    'active', true
  ),
  (
    'Vendor Offboarding',
    'Structured vendor offboarding with data deletion and access revocation.',
    'vendor.offboarded',
    '[
      {"index":0,"name":"Revoke System Access","type":"action","config":{"action":"create_task","title":"Revoke all system access"}},
      {"index":1,"name":"Archive Documents","type":"action","config":{"action":"create_task","title":"Archive vendor documents"}},
      {"index":2,"name":"Final Risk Review","type":"action","config":{"action":"create_task","title":"Conduct final risk review"}},
      {"index":3,"name":"Notify Stakeholders","type":"notification","config":{"channel":"email","template":"offboarding_complete"}},
      {"index":4,"name":"Archive Vendor","type":"action","config":{"action":"update_status","status":"archived"}}
    ]',
    'active', true
  ),
  (
    'Critical Risk Escalation',
    'Automatically escalate critical risks to senior management.',
    'risk.critical',
    '[
      {"index":0,"name":"AI Risk Analysis","type":"ai_action","config":{"action":"ai_analyze","context":"risk_impact"}},
      {"index":1,"name":"Create Urgent Issue","type":"action","config":{"action":"create_issue","severity":"critical"}},
      {"index":2,"name":"Executive Notification","type":"notification","config":{"channel":"email","template":"critical_risk_alert"}},
      {"index":3,"name":"Board Approval Required","type":"approval","config":{"request_type":"risk_acceptance","title":"Board approval for critical risk"}}
    ]',
    'active', true
  )
ON CONFLICT DO NOTHING;
