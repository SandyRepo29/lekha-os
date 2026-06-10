-- Issue & Remediation Hub™ — Module 13
-- Enums
CREATE TYPE issue_type AS ENUM ('risk','audit_finding','capa','control_failure','policy_gap','privacy_issue','vendor_issue','contract_obligation','compliance_gap','security_incident','custom');
CREATE TYPE issue_severity AS ENUM ('critical','high','medium','low','informational');
CREATE TYPE issue_priority AS ENUM ('p1','p2','p3','p4','p5');
CREATE TYPE issue_status AS ENUM ('open','assigned','in_progress','blocked','pending_review','resolved','closed','accepted_risk','deferred');
CREATE TYPE issue_task_status AS ENUM ('open','in_progress','blocked','completed','cancelled');
CREATE TYPE exception_status AS ENUM ('pending','approved','rejected','expired','revoked');
CREATE TYPE escalation_level AS ENUM ('owner','manager','department_head','executive','board');

-- issues
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  issue_type issue_type NOT NULL DEFAULT 'custom',
  source_module TEXT,
  source_entity_id UUID,
  severity issue_severity NOT NULL DEFAULT 'medium',
  priority issue_priority NOT NULL DEFAULT 'p3',
  status issue_status NOT NULL DEFAULT 'open',
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE,
  resolved_date DATE,
  resolution_notes TEXT,
  sla_days INTEGER NOT NULL DEFAULT 30,
  sla_breached BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS issues_org_idx ON issues(organization_id);
CREATE INDEX IF NOT EXISTS issues_status_idx ON issues(organization_id, status);
CREATE INDEX IF NOT EXISTS issues_severity_idx ON issues(organization_id, severity);
CREATE INDEX IF NOT EXISTS issues_due_idx ON issues(organization_id, due_date);
CREATE INDEX IF NOT EXISTS issues_owner_idx ON issues(owner_id);

-- issue_tasks
CREATE TABLE IF NOT EXISTS issue_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status issue_task_status NOT NULL DEFAULT 'open',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS issue_tasks_issue_idx ON issue_tasks(issue_id);
CREATE INDEX IF NOT EXISTS issue_tasks_org_idx ON issue_tasks(organization_id);

-- issue_comments
CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS issue_comments_issue_idx ON issue_comments(issue_id);

-- issue_exceptions
CREATE TABLE IF NOT EXISTS issue_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_justification TEXT NOT NULL,
  approver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approval_date DATE,
  expiry_date DATE,
  review_date DATE,
  status exception_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS issue_exceptions_issue_idx ON issue_exceptions(issue_id);
CREATE INDEX IF NOT EXISTS issue_exceptions_org_idx ON issue_exceptions(organization_id);

-- issue_escalations
CREATE TABLE IF NOT EXISTS issue_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  escalated_to escalation_level NOT NULL DEFAULT 'manager',
  reason TEXT NOT NULL,
  escalated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS issue_escalations_issue_idx ON issue_escalations(issue_id);
CREATE INDEX IF NOT EXISTS issue_escalations_org_idx ON issue_escalations(organization_id);

-- issue_history
CREATE TABLE IF NOT EXISTS issue_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS issue_history_issue_idx ON issue_history(issue_id);

-- RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members access issues" ON issues FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access issue_tasks" ON issue_tasks FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access issue_comments" ON issue_comments FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access issue_exceptions" ON issue_exceptions FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access issue_escalations" ON issue_escalations FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access issue_history" ON issue_history FOR ALL USING (is_org_member(organization_id));
