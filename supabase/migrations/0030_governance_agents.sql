-- Migration 0030: Governance Agent Framework™
-- Module 29 — Governance Agent Framework™
-- Idempotent: uses IF NOT EXISTS throughout

-- ============================================================
-- 1. agents — Agent Registry™
-- ============================================================
CREATE TABLE IF NOT EXISTS agents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name              text NOT NULL,
  slug              text NOT NULL,
  description       text,
  agent_type        text NOT NULL DEFAULT 'custom'
                      CHECK (agent_type IN ('compliance','risk','vendor','audit','privacy','contract','trust','ai_governance','custom')),
  status            text NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','testing','active','paused','disabled','archived')),
  execution_mode    text NOT NULL DEFAULT 'advisory'
                      CHECK (execution_mode IN ('advisory','approval_required','autonomous')),
  trigger_type      text NOT NULL DEFAULT 'manual'
                      CHECK (trigger_type IN ('schedule','event','threshold','workflow','manual','api')),
  trigger_config    jsonb NOT NULL DEFAULT '{}',
  prompt            text,
  tools             jsonb NOT NULL DEFAULT '[]',
  approval_mode     text NOT NULL DEFAULT 'manual'
                      CHECK (approval_mode IN ('manual','manager','role_based','multi_level','automatic')),
  schedule          text,
  success_rate      integer NOT NULL DEFAULT 0,
  total_runs        integer NOT NULL DEFAULT 0,
  last_run_at       timestamptz,
  version           integer NOT NULL DEFAULT 1,
  is_builtin        boolean NOT NULL DEFAULT false,
  created_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_org         ON agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_agents_type        ON agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_agents_status      ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_trigger     ON agents(trigger_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_slug_org ON agents(slug, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- ============================================================
-- 2. agent_runs — execution log
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_runs (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id                 uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  status                   text NOT NULL DEFAULT 'running'
                             CHECK (status IN ('running','completed','failed','cancelled','pending_approval')),
  trigger_type             text
                             CHECK (trigger_type IN ('schedule','event','threshold','workflow','manual','api')),
  triggered_by             uuid REFERENCES profiles(id) ON DELETE SET NULL,
  context                  jsonb NOT NULL DEFAULT '{}',
  observations_count       integer NOT NULL DEFAULT 0,
  recommendations_count    integer NOT NULL DEFAULT 0,
  actions_count            integer NOT NULL DEFAULT 0,
  error_message            text,
  started_at               timestamptz NOT NULL DEFAULT now(),
  completed_at             timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_org      ON agent_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent    ON agent_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status   ON agent_runs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_started  ON agent_runs(organization_id, started_at DESC);

-- ============================================================
-- 3. agent_memory — persistent agent context
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_memory (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id        uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  memory_type     text NOT NULL DEFAULT 'observation'
                    CHECK (memory_type IN ('observation','recommendation','action','approval','conversation','outcome','learning')),
  key             text NOT NULL,
  value           jsonb NOT NULL DEFAULT '{}',
  run_id          uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, key)
);

CREATE INDEX IF NOT EXISTS idx_agent_memory_org    ON agent_memory(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent  ON agent_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_type   ON agent_memory(agent_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_agent_memory_run    ON agent_memory(run_id);

-- ============================================================
-- 4. agent_observations — detected governance events
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_observations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id            uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  run_id              uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
  title               text NOT NULL,
  description         text,
  observation_type    text NOT NULL DEFAULT 'custom'
                        CHECK (observation_type IN ('control_failure','vendor_risk','trust_decline','policy_expiry','overdue_obligation','privacy_risk','audit_gap','ai_risk','contract_risk','compliance_signal','custom')),
  severity            text NOT NULL DEFAULT 'medium'
                        CHECK (severity IN ('info','low','medium','high','critical')),
  source_module       text,
  source_entity_id    uuid,
  source_entity_type  text,
  metadata            jsonb NOT NULL DEFAULT '{}',
  status              text NOT NULL DEFAULT 'new'
                        CHECK (status IN ('new','acknowledged','actioned','dismissed')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_obs_org       ON agent_observations(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_obs_agent     ON agent_observations(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_obs_run       ON agent_observations(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_obs_severity  ON agent_observations(organization_id, severity);
CREATE INDEX IF NOT EXISTS idx_agent_obs_status    ON agent_observations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_obs_type      ON agent_observations(observation_type);

-- ============================================================
-- 5. agent_recommendations — structured recommendations
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_recommendations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id            uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  run_id              uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
  observation_id      uuid REFERENCES agent_observations(id) ON DELETE SET NULL,
  title               text NOT NULL,
  description         text,
  reasoning           text,
  impact              text NOT NULL DEFAULT 'medium'
                        CHECK (impact IN ('low','medium','high','critical')),
  effort              text NOT NULL DEFAULT 'medium'
                        CHECK (effort IN ('low','medium','high')),
  priority            text NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low','medium','high','critical')),
  confidence_score    integer NOT NULL DEFAULT 75
                        CHECK (confidence_score >= 0 AND confidence_score <= 100),
  suggested_actions   jsonb NOT NULL DEFAULT '[]',
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','rejected','actioned','dismissed')),
  actioned_by         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  actioned_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_recs_org        ON agent_recommendations(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_recs_agent      ON agent_recommendations(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_recs_run        ON agent_recommendations(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_recs_obs        ON agent_recommendations(observation_id);
CREATE INDEX IF NOT EXISTS idx_agent_recs_status     ON agent_recommendations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_recs_priority   ON agent_recommendations(organization_id, priority);

-- ============================================================
-- 6. agent_actions — actions agents execute
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_actions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id            uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  run_id              uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
  recommendation_id   uuid REFERENCES agent_recommendations(id) ON DELETE SET NULL,
  action_type         text NOT NULL DEFAULT 'custom'
                        CHECK (action_type IN ('create_issue','create_risk','create_task','create_treatment','launch_workflow','assign_owner','request_evidence','generate_report','notify_stakeholder','create_review','schedule_audit','open_verification_review','custom')),
  title               text NOT NULL,
  description         text,
  parameters          jsonb NOT NULL DEFAULT '{}',
  status              text NOT NULL DEFAULT 'pending_approval'
                        CHECK (status IN ('pending_approval','approved','rejected','executing','completed','failed')),
  result              jsonb NOT NULL DEFAULT '{}',
  error_message       text,
  approved_by         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at         timestamptz,
  executed_at         timestamptz,
  completed_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_actions_org      ON agent_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_agent    ON agent_actions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_run      ON agent_actions(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_rec      ON agent_actions(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_status   ON agent_actions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_actions_type     ON agent_actions(action_type);

-- ============================================================
-- 7. agent_approvals — human approval workflow
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_approvals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action_id       uuid NOT NULL REFERENCES agent_actions(id) ON DELETE CASCADE,
  approver_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approval_level  integer NOT NULL DEFAULT 1,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','expired')),
  notes           text,
  decided_at      timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_approvals_org      ON agent_approvals(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_approvals_action   ON agent_approvals(action_id);
CREATE INDEX IF NOT EXISTS idx_agent_approvals_approver ON agent_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_agent_approvals_status   ON agent_approvals(organization_id, status);

-- ============================================================
-- 8. agent_schedules — cron-style schedules
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_schedules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id        uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  cron_expression text,
  is_active       boolean NOT NULL DEFAULT true,
  last_run_at     timestamptz,
  next_run_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_schedules_org    ON agent_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_schedules_agent  ON agent_schedules(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_schedules_active ON agent_schedules(is_active, next_run_at);

-- ============================================================
-- 9. agent_metrics — analytics aggregates
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_metrics (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id              uuid REFERENCES agents(id) ON DELETE SET NULL,
  metric_date           date NOT NULL,
  total_runs            integer NOT NULL DEFAULT 0,
  successful_runs       integer NOT NULL DEFAULT 0,
  failed_runs           integer NOT NULL DEFAULT 0,
  total_observations    integer NOT NULL DEFAULT 0,
  total_recommendations integer NOT NULL DEFAULT 0,
  total_actions         integer NOT NULL DEFAULT 0,
  approved_actions      integer NOT NULL DEFAULT 0,
  rejected_actions      integer NOT NULL DEFAULT 0,
  time_saved_minutes    integer NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, agent_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_org    ON agent_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent  ON agent_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_date   ON agent_metrics(organization_id, metric_date DESC);

-- ============================================================
-- 10. agent_conversations — Governance Copilot™ chat
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  agent_id        uuid REFERENCES agents(id) ON DELETE SET NULL,
  role            text NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user','assistant','system')),
  content         text NOT NULL,
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_conv_org    ON agent_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_conv_user   ON agent_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_conv_agent  ON agent_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_conv_time   ON agent_conversations(organization_id, created_at DESC);

-- ============================================================
-- 11. agent_events — event bus
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type      text NOT NULL,
  source_module   text,
  payload         jsonb NOT NULL DEFAULT '{}',
  processed       boolean NOT NULL DEFAULT false,
  agent_id        uuid REFERENCES agents(id) ON DELETE SET NULL,
  processed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_events_org        ON agent_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_type       ON agent_events(organization_id, event_type);
CREATE INDEX IF NOT EXISTS idx_agent_events_processed  ON agent_events(organization_id, processed);
CREATE INDEX IF NOT EXISTS idx_agent_events_agent      ON agent_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_created    ON agent_events(organization_id, created_at DESC);

-- ============================================================
-- 12. agent_orchestrations — multi-agent coordination
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_orchestrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  agent_sequence  jsonb NOT NULL DEFAULT '[]',
  status          text NOT NULL DEFAULT 'idle'
                    CHECK (status IN ('idle','running','completed','failed')),
  current_step    integer NOT NULL DEFAULT 0,
  context         jsonb NOT NULL DEFAULT '{}',
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_orch_org     ON agent_orchestrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_orch_status  ON agent_orchestrations(organization_id, status);

-- ============================================================
-- RLS — enable on all 12 tables
-- ============================================================
ALTER TABLE agents                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory            ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_observations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_recommendations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_approvals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_schedules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics           ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_orchestrations    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS policies
-- ============================================================

-- agents (organization_id nullable for built-ins — members see their org + builtins)
DROP POLICY IF EXISTS "agents_org_member" ON agents;
CREATE POLICY "agents_org_member" ON agents
  FOR ALL USING (
    is_builtin = true
    OR is_org_member(organization_id)
  );

-- agent_runs
DROP POLICY IF EXISTS "agent_runs_org_member" ON agent_runs;
CREATE POLICY "agent_runs_org_member" ON agent_runs
  FOR ALL USING (is_org_member(organization_id));

-- agent_memory
DROP POLICY IF EXISTS "agent_memory_org_member" ON agent_memory;
CREATE POLICY "agent_memory_org_member" ON agent_memory
  FOR ALL USING (is_org_member(organization_id));

-- agent_observations
DROP POLICY IF EXISTS "agent_observations_org_member" ON agent_observations;
CREATE POLICY "agent_observations_org_member" ON agent_observations
  FOR ALL USING (is_org_member(organization_id));

-- agent_recommendations
DROP POLICY IF EXISTS "agent_recommendations_org_member" ON agent_recommendations;
CREATE POLICY "agent_recommendations_org_member" ON agent_recommendations
  FOR ALL USING (is_org_member(organization_id));

-- agent_actions
DROP POLICY IF EXISTS "agent_actions_org_member" ON agent_actions;
CREATE POLICY "agent_actions_org_member" ON agent_actions
  FOR ALL USING (is_org_member(organization_id));

-- agent_approvals
DROP POLICY IF EXISTS "agent_approvals_org_member" ON agent_approvals;
CREATE POLICY "agent_approvals_org_member" ON agent_approvals
  FOR ALL USING (is_org_member(organization_id));

-- agent_schedules
DROP POLICY IF EXISTS "agent_schedules_org_member" ON agent_schedules;
CREATE POLICY "agent_schedules_org_member" ON agent_schedules
  FOR ALL USING (is_org_member(organization_id));

-- agent_metrics
DROP POLICY IF EXISTS "agent_metrics_org_member" ON agent_metrics;
CREATE POLICY "agent_metrics_org_member" ON agent_metrics
  FOR ALL USING (is_org_member(organization_id));

-- agent_conversations
DROP POLICY IF EXISTS "agent_conversations_org_member" ON agent_conversations;
CREATE POLICY "agent_conversations_org_member" ON agent_conversations
  FOR ALL USING (is_org_member(organization_id));

-- agent_events
DROP POLICY IF EXISTS "agent_events_org_member" ON agent_events;
CREATE POLICY "agent_events_org_member" ON agent_events
  FOR ALL USING (is_org_member(organization_id));

-- agent_orchestrations
DROP POLICY IF EXISTS "agent_orchestrations_org_member" ON agent_orchestrations;
CREATE POLICY "agent_orchestrations_org_member" ON agent_orchestrations
  FOR ALL USING (is_org_member(organization_id));
