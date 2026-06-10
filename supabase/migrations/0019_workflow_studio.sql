-- Workflow Studio™ — Module 14
-- Enums
CREATE TYPE workflow_status AS ENUM ('draft','active','archived','deprecated');
CREATE TYPE workflow_node_type AS ENUM ('start','task','approval','condition','decision','wait','notification','webhook','create_record','update_record','end');
CREATE TYPE workflow_run_status AS ENUM ('running','waiting','approved','rejected','failed','completed','cancelled');
CREATE TYPE workflow_trigger_type AS ENUM ('record_created','record_updated','status_changed','date_reached','score_threshold','api_event','manual','scheduled');
CREATE TYPE workflow_approval_status AS ENUM ('pending','approved','rejected','delegated','escalated');
CREATE TYPE workflow_module AS ENUM ('vendor_hub','evidence_vault','audit_management','risk_lens','control_center','policy_governance','dpdp_privacy','contract_governance','issue_hub','trust_intelligence','custom');

-- workflows
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  module workflow_module NOT NULL DEFAULT 'custom',
  status workflow_status NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  is_template BOOLEAN NOT NULL DEFAULT false,
  template_category TEXT,
  trigger_type workflow_trigger_type NOT NULL DEFAULT 'manual',
  trigger_config JSONB,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS workflows_org_idx ON workflows(organization_id);
CREATE INDEX IF NOT EXISTS workflows_status_idx ON workflows(organization_id, status);
CREATE INDEX IF NOT EXISTS workflows_module_idx ON workflows(organization_id, module);

-- workflow_nodes
CREATE TABLE IF NOT EXISTS workflow_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  node_type workflow_node_type NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS workflow_nodes_workflow_idx ON workflow_nodes(workflow_id);

-- workflow_transitions
CREATE TABLE IF NOT EXISTS workflow_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  label TEXT,
  condition_expr TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS workflow_transitions_workflow_idx ON workflow_transitions(workflow_id);

-- workflow_runs
CREATE TABLE IF NOT EXISTS workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status workflow_run_status NOT NULL DEFAULT 'running',
  trigger_type workflow_trigger_type NOT NULL DEFAULT 'manual',
  trigger_entity_id UUID,
  trigger_entity_type TEXT,
  current_node_id UUID REFERENCES workflow_nodes(id) ON DELETE SET NULL,
  started_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_reason TEXT,
  context_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS workflow_runs_org_idx ON workflow_runs(organization_id);
CREATE INDEX IF NOT EXISTS workflow_runs_workflow_idx ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS workflow_runs_status_idx ON workflow_runs(organization_id, status);

-- workflow_run_steps
CREATE TABLE IF NOT EXISTS workflow_run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  status workflow_run_status NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  output_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS workflow_run_steps_run_idx ON workflow_run_steps(run_id);

-- workflow_approvals
CREATE TABLE IF NOT EXISTS workflow_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status workflow_approval_status NOT NULL DEFAULT 'pending',
  decision_notes TEXT,
  delegated_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS workflow_approvals_org_idx ON workflow_approvals(organization_id);
CREATE INDEX IF NOT EXISTS workflow_approvals_run_idx ON workflow_approvals(run_id);
CREATE INDEX IF NOT EXISTS workflow_approvals_approver_idx ON workflow_approvals(approver_id);

-- RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members access workflows" ON workflows FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access workflow_nodes" ON workflow_nodes FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access workflow_transitions" ON workflow_transitions FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access workflow_runs" ON workflow_runs FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access workflow_run_steps" ON workflow_run_steps FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "org members access workflow_approvals" ON workflow_approvals FOR ALL USING (is_org_member(organization_id));
