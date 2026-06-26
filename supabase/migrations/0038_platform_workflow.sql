-- Migration 0038: Platform Workflow & Work Management Tables (Epic 02 Sprint 2)

-- 1. platform_tasks
CREATE TABLE platform_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  entity_type TEXT,
  entity_id UUID,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'blocked')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  assigned_to UUID REFERENCES auth.users(id),
  assigned_to_name TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sla_hours INT DEFAULT 0,
  sla_breached BOOLEAN DEFAULT FALSE,
  reminder_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE platform_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage platform_tasks"
  ON platform_tasks
  FOR ALL
  USING (is_org_member(organization_id));

CREATE INDEX idx_platform_tasks_assigned ON platform_tasks (organization_id, assigned_to);
CREATE INDEX idx_platform_tasks_entity ON platform_tasks (organization_id, entity_type, entity_id);
CREATE INDEX idx_platform_tasks_status_due ON platform_tasks (organization_id, status, due_date);

-- 2. task_dependencies
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES platform_tasks(id) ON DELETE CASCADE,
  depends_on_id UUID NOT NULL REFERENCES platform_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'related_to', 'duplicates')),
  UNIQUE (task_id, depends_on_id)
);

ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage task_dependencies"
  ON task_dependencies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM platform_tasks pt
      WHERE pt.id = task_id
        AND is_org_member(pt.organization_id)
    )
  );

-- 3. platform_attachments
CREATE TABLE platform_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  content_type TEXT,
  storage_path TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'compliance-documents',
  version INT NOT NULL DEFAULT 1,
  is_latest BOOLEAN DEFAULT TRUE,
  checksum TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_by_name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE platform_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage platform_attachments"
  ON platform_attachments
  FOR ALL
  USING (is_org_member(organization_id));

CREATE INDEX idx_platform_attachments_entity ON platform_attachments (organization_id, entity_type, entity_id);

-- 4. attachment_versions
CREATE TABLE attachment_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attachment_id UUID NOT NULL REFERENCES platform_attachments(id) ON DELETE CASCADE,
  version INT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT,
  checksum TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  change_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE attachment_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage attachment_versions"
  ON attachment_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM platform_attachments pa
      WHERE pa.id = attachment_id
        AND is_org_member(pa.organization_id)
    )
  );

-- 5. workflow_triggers
CREATE TABLE workflow_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL,
  trigger_entity_type TEXT,
  conditions JSONB DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  run_count INT DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workflow_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage workflow_triggers"
  ON workflow_triggers
  FOR ALL
  USING (is_org_member(organization_id));

CREATE INDEX idx_workflow_triggers_active_event ON workflow_triggers (organization_id, is_active, trigger_event);

-- 6. workflow_trigger_runs
CREATE TABLE workflow_trigger_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trigger_id UUID NOT NULL REFERENCES workflow_triggers(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'skipped')),
  actions_executed INT DEFAULT 0,
  error_message TEXT,
  duration_ms INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workflow_trigger_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage workflow_trigger_runs"
  ON workflow_trigger_runs
  FOR ALL
  USING (is_org_member(organization_id));

CREATE INDEX idx_workflow_trigger_runs_trigger ON workflow_trigger_runs (organization_id, trigger_id, created_at DESC);

-- 7. approval_delegations
CREATE TABLE approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  delegator_id UUID NOT NULL REFERENCES auth.users(id),
  delegate_id UUID NOT NULL REFERENCES auth.users(id),
  scope TEXT NOT NULL DEFAULT 'all' CHECK (scope IN ('all', 'vendors', 'risks', 'contracts', 'policies', 'exceptions')),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE approval_delegations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage approval_delegations"
  ON approval_delegations
  FOR ALL
  USING (is_org_member(organization_id));
