-- ============================================================
-- Migration 0022 — Integration Hub™ (Module 17A)
-- ============================================================

-- ── Enums ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE integration_category AS ENUM (
    'identity', 'cloud', 'source_control', 'project_management',
    'itsm', 'endpoint', 'security', 'communication', 'storage',
    'hr', 'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE integration_connector_status AS ENUM (
    'available', 'connected', 'disconnected', 'error', 'deprecated', 'coming_soon'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE integration_auth_type AS ENUM (
    'oauth2', 'api_key', 'pat', 'basic_auth', 'service_account', 'webhook', 'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE integration_sync_status AS ENUM (
    'pending', 'running', 'completed', 'failed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE integration_sync_frequency AS ENUM (
    'real_time', 'fifteen_minutes', 'hourly', 'daily', 'weekly', 'manual'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE integration_event_type AS ENUM (
    'user_created', 'user_deleted', 'control_failed', 'risk_created',
    'evidence_updated', 'workflow_triggered', 'contract_updated',
    'vendor_updated', 'misconfiguration_detected', 'credential_expiring',
    'sync_completed', 'sync_failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE integration_mapping_target AS ENUM (
    'control', 'risk', 'evidence', 'vendor', 'issue', 'finding'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE integration_webhook_direction AS ENUM ('inbound', 'outbound');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── System-wide connector registry (not per-org) ───────────────────────────────
CREATE TABLE IF NOT EXISTS integration_registry (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  category        integration_category NOT NULL,
  provider        TEXT NOT NULL,
  version         TEXT NOT NULL DEFAULT '1.0.0',
  status          integration_connector_status NOT NULL DEFAULT 'available',
  auth_type       integration_auth_type NOT NULL DEFAULT 'api_key',
  icon            TEXT,
  description     TEXT,
  documentation_url TEXT,
  features        JSONB NOT NULL DEFAULT '[]',
  auth_fields     JSONB NOT NULL DEFAULT '[]',
  is_phase1       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Per-org integration instances ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_instances (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  registry_id         UUID NOT NULL REFERENCES integration_registry(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  status              integration_connector_status NOT NULL DEFAULT 'disconnected',
  sync_frequency      integration_sync_frequency NOT NULL DEFAULT 'daily',
  last_sync_at        TIMESTAMPTZ,
  next_sync_at        TIMESTAMPTZ,
  connected_at        TIMESTAMPTZ,
  connected_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  error_message       TEXT,
  config              JSONB NOT NULL DEFAULT '{}',
  total_synced        INTEGER NOT NULL DEFAULT 0,
  total_evidence      INTEGER NOT NULL DEFAULT 0,
  total_risks         INTEGER NOT NULL DEFAULT 0,
  total_events        INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, registry_id)
);
CREATE INDEX IF NOT EXISTS integration_instances_org_idx ON integration_instances(organization_id);
CREATE INDEX IF NOT EXISTS integration_instances_status_idx ON integration_instances(organization_id, status);
ALTER TABLE integration_instances ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY integration_instances_org ON integration_instances FOR ALL USING (is_org_member(organization_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Encrypted credentials per instance ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     UUID NOT NULL REFERENCES integration_instances(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  encrypted_data  TEXT NOT NULL,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(instance_id)
);
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY integration_credentials_org ON integration_credentials FOR ALL USING (is_org_member(organization_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Sync runs ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_syncs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     UUID NOT NULL REFERENCES integration_instances(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status          integration_sync_status NOT NULL DEFAULT 'pending',
  sync_type       TEXT NOT NULL DEFAULT 'incremental',
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  records_fetched INTEGER NOT NULL DEFAULT 0,
  records_created INTEGER NOT NULL DEFAULT 0,
  records_updated INTEGER NOT NULL DEFAULT 0,
  records_failed  INTEGER NOT NULL DEFAULT 0,
  error_message   TEXT,
  summary         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS integration_syncs_instance_idx  ON integration_syncs(instance_id);
CREATE INDEX IF NOT EXISTS integration_syncs_org_idx       ON integration_syncs(organization_id, started_at DESC);
CREATE INDEX IF NOT EXISTS integration_syncs_status_idx    ON integration_syncs(organization_id, status);
ALTER TABLE integration_syncs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY integration_syncs_org ON integration_syncs FOR ALL USING (is_org_member(organization_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Detailed event log ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     UUID NOT NULL REFERENCES integration_instances(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sync_id         UUID REFERENCES integration_syncs(id) ON DELETE SET NULL,
  level           TEXT NOT NULL DEFAULT 'info',
  message         TEXT NOT NULL,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS integration_logs_instance_idx ON integration_logs(instance_id, created_at DESC);
CREATE INDEX IF NOT EXISTS integration_logs_org_idx      ON integration_logs(organization_id, created_at DESC);
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY integration_logs_org ON integration_logs FOR ALL USING (is_org_member(organization_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Governance events generated by integrations ───────────────────────────────
CREATE TABLE IF NOT EXISTS integration_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     UUID NOT NULL REFERENCES integration_instances(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type      integration_event_type NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  severity        TEXT NOT NULL DEFAULT 'medium',
  source_ref      TEXT,
  resolved        BOOLEAN NOT NULL DEFAULT false,
  resolved_at     TIMESTAMPTZ,
  entity_type     TEXT,
  entity_id       UUID,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS integration_events_instance_idx ON integration_events(instance_id, created_at DESC);
CREATE INDEX IF NOT EXISTS integration_events_org_idx      ON integration_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS integration_events_resolved_idx ON integration_events(organization_id, resolved);
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY integration_events_org ON integration_events FOR ALL USING (is_org_member(organization_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Data-field → AUDT entity mappings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_mappings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     UUID NOT NULL REFERENCES integration_instances(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_field    TEXT NOT NULL,
  target_type     integration_mapping_target NOT NULL,
  target_id       UUID,
  mapping_rule    JSONB,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS integration_mappings_instance_idx ON integration_mappings(instance_id);
CREATE INDEX IF NOT EXISTS integration_mappings_org_idx      ON integration_mappings(organization_id);
ALTER TABLE integration_mappings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY integration_mappings_org ON integration_mappings FOR ALL USING (is_org_member(organization_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Webhook configurations ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_webhooks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  instance_id     UUID REFERENCES integration_instances(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  direction       integration_webhook_direction NOT NULL DEFAULT 'inbound',
  url             TEXT,
  secret_hash     TEXT,
  event_types     TEXT[] NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_triggered  TIMESTAMPTZ,
  total_calls     INTEGER NOT NULL DEFAULT 0,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS integration_webhooks_org_idx ON integration_webhooks(organization_id);
ALTER TABLE integration_webhooks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY integration_webhooks_org ON integration_webhooks FOR ALL USING (is_org_member(organization_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Seed connector registry ───────────────────────────────────────────────────

INSERT INTO integration_registry (name, slug, category, provider, version, status, auth_type, icon, description, features, auth_fields, is_phase1) VALUES

-- Identity
('Microsoft Entra ID', 'microsoft-entra-id', 'identity', 'Microsoft', '1.0.0', 'available', 'oauth2', 'entra',
 'Sync users, groups, MFA status, and conditional access policies from Microsoft Entra ID.',
 '["user_sync","mfa_monitoring","group_sync","conditional_access","inactive_user_detection"]',
 '[{"key":"tenant_id","label":"Tenant ID","type":"text","required":true},{"key":"client_id","label":"Client ID","type":"text","required":true},{"key":"client_secret","label":"Client Secret","type":"password","required":true}]',
 true),

('Okta', 'okta', 'identity', 'Okta', '1.0.0', 'available', 'api_key', 'okta',
 'Monitor users, MFA coverage, inactive accounts, and access reviews from Okta.',
 '["user_sync","mfa_monitoring","group_sync","access_review","inactive_user_detection"]',
 '[{"key":"domain","label":"Okta Domain","type":"text","required":true},{"key":"api_token","label":"API Token","type":"password","required":true}]',
 true),

('Google Workspace', 'google-workspace', 'identity', 'Google', '1.0.0', 'available', 'oauth2', 'google',
 'Sync users, groups, and admin settings from Google Workspace.',
 '["user_sync","group_sync","admin_audit","2fa_monitoring","drive_activity"]',
 '[{"key":"service_account_json","label":"Service Account JSON","type":"textarea","required":true}]',
 true),

('OneLogin', 'onelogin', 'identity', 'OneLogin', '1.0.0', 'available', 'oauth2', 'onelogin',
 'Sync users, roles, and authentication events from OneLogin.',
 '["user_sync","mfa_monitoring","role_sync","auth_events"]',
 '[{"key":"client_id","label":"Client ID","type":"text","required":true},{"key":"client_secret","label":"Client Secret","type":"password","required":true},{"key":"region","label":"Region","type":"text","required":false}]',
 false),

('JumpCloud', 'jumpcloud', 'identity', 'JumpCloud', '1.0.0', 'available', 'api_key', 'jumpcloud',
 'Manage users, devices, and directory services via JumpCloud.',
 '["user_sync","device_sync","group_sync","mfa_monitoring"]',
 '[{"key":"api_key","label":"API Key","type":"password","required":true}]',
 false),

-- Cloud
('AWS', 'aws', 'cloud', 'Amazon', '1.0.0', 'available', 'service_account', 'aws',
 'Collect security posture, CloudTrail events, IAM configuration, and encryption status from AWS.',
 '["iam_audit","cloudtrail","s3_security","encryption_check","mfa_detection","misconfiguration_scan"]',
 '[{"key":"access_key_id","label":"Access Key ID","type":"text","required":true},{"key":"secret_access_key","label":"Secret Access Key","type":"password","required":true},{"key":"region","label":"Default Region","type":"text","required":false}]',
 true),

('Microsoft Azure', 'azure', 'cloud', 'Microsoft', '1.0.0', 'available', 'service_account', 'azure',
 'Monitor Azure resources, security center findings, and IAM configuration.',
 '["resource_inventory","security_center","iam_audit","defender_alerts","encryption_check"]',
 '[{"key":"tenant_id","label":"Tenant ID","type":"text","required":true},{"key":"client_id","label":"Client ID","type":"text","required":true},{"key":"client_secret","label":"Client Secret","type":"password","required":true},{"key":"subscription_id","label":"Subscription ID","type":"text","required":true}]',
 false),

('Google Cloud', 'gcp', 'cloud', 'Google', '1.0.0', 'available', 'service_account', 'gcp',
 'Monitor GCP projects, IAM policies, security command center findings.',
 '["resource_inventory","iam_audit","security_command_center","encryption_check","logging_audit"]',
 '[{"key":"service_account_json","label":"Service Account JSON","type":"textarea","required":true},{"key":"project_id","label":"Project ID","type":"text","required":true}]',
 false),

('DigitalOcean', 'digitalocean', 'cloud', 'DigitalOcean', '1.0.0', 'available', 'api_key', 'digitalocean',
 'Sync droplets, databases, and firewall configurations from DigitalOcean.',
 '["resource_inventory","firewall_audit","database_audit"]',
 '[{"key":"api_token","label":"API Token","type":"password","required":true}]',
 false),

-- Source Control
('GitHub', 'github', 'source_control', 'GitHub', '1.0.0', 'available', 'pat', 'github',
 'Collect branch protection rules, 2FA enforcement, repository visibility, and security alerts.',
 '["branch_protection","2fa_enforcement","repo_visibility","secret_scanning","dependabot","code_scanning"]',
 '[{"key":"token","label":"Personal Access Token","type":"password","required":true},{"key":"org","label":"GitHub Organization","type":"text","required":true}]',
 true),

('GitLab', 'gitlab', 'source_control', 'GitLab', '1.0.0', 'available', 'pat', 'gitlab',
 'Monitor groups, projects, security scanning results, and merge request approvals.',
 '["group_sync","project_audit","security_scan","merge_approvals","2fa_enforcement"]',
 '[{"key":"token","label":"Personal Access Token","type":"password","required":true},{"key":"url","label":"GitLab URL","type":"text","required":false}]',
 false),

('Bitbucket', 'bitbucket', 'source_control', 'Atlassian', '1.0.0', 'available', 'api_key', 'bitbucket',
 'Sync repositories, branch restrictions, and team permissions from Bitbucket.',
 '["repo_audit","branch_restrictions","team_permissions","merge_checks"]',
 '[{"key":"username","label":"Username","type":"text","required":true},{"key":"app_password","label":"App Password","type":"password","required":true},{"key":"workspace","label":"Workspace","type":"text","required":true}]',
 false),

('Azure DevOps', 'azure-devops', 'source_control', 'Microsoft', '1.0.0', 'available', 'pat', 'azuredevops',
 'Collect pipelines, branch policies, and security scanning from Azure DevOps.',
 '["pipeline_audit","branch_policies","work_item_sync","security_scan"]',
 '[{"key":"org","label":"Organization","type":"text","required":true},{"key":"pat","label":"Personal Access Token","type":"password","required":true}]',
 false),

-- Project Management
('Jira', 'jira', 'project_management', 'Atlassian', '1.0.0', 'available', 'api_key', 'jira',
 'Sync issues, security tickets, and project status from Jira.',
 '["issue_sync","project_sync","sprint_tracking","security_tickets","overdue_detection"]',
 '[{"key":"url","label":"Jira URL","type":"text","required":true},{"key":"email","label":"Email","type":"text","required":true},{"key":"api_token","label":"API Token","type":"password","required":true}]',
 true),

('Asana', 'asana', 'project_management', 'Asana', '1.0.0', 'available', 'pat', 'asana',
 'Sync tasks, projects, and compliance action items from Asana.',
 '["task_sync","project_sync","milestone_tracking"]',
 '[{"key":"token","label":"Personal Access Token","type":"password","required":true}]',
 false),

('Linear', 'linear', 'project_management', 'Linear', '1.0.0', 'available', 'api_key', 'linear',
 'Sync issues and cycles from Linear for governance tracking.',
 '["issue_sync","cycle_tracking","team_sync"]',
 '[{"key":"api_key","label":"API Key","type":"password","required":true}]',
 false),

-- ITSM
('ServiceNow', 'servicenow', 'itsm', 'ServiceNow', '1.0.0', 'available', 'basic_auth', 'servicenow',
 'Sync incidents, changes, problems, and audit records from ServiceNow.',
 '["incident_sync","change_management","audit_records","cmdb_sync","sla_tracking"]',
 '[{"key":"instance","label":"Instance URL","type":"text","required":true},{"key":"username","label":"Username","type":"text","required":true},{"key":"password","label":"Password","type":"password","required":true}]',
 false),

('Freshservice', 'freshservice', 'itsm', 'Freshworks', '1.0.0', 'available', 'api_key', 'freshservice',
 'Sync tickets, changes, and asset inventory from Freshservice.',
 '["ticket_sync","change_sync","asset_inventory"]',
 '[{"key":"domain","label":"Domain","type":"text","required":true},{"key":"api_key","label":"API Key","type":"password","required":true}]',
 false),

('Zendesk', 'zendesk', 'itsm', 'Zendesk', '1.0.0', 'available', 'api_key', 'zendesk',
 'Sync tickets and customer interactions from Zendesk.',
 '["ticket_sync","user_sync","sla_tracking"]',
 '[{"key":"subdomain","label":"Subdomain","type":"text","required":true},{"key":"email","label":"Email","type":"text","required":true},{"key":"api_token","label":"API Token","type":"password","required":true}]',
 false),

-- Security
('CrowdStrike', 'crowdstrike', 'security', 'CrowdStrike', '1.0.0', 'available', 'oauth2', 'crowdstrike',
 'Ingest endpoint detections, vulnerabilities, and threat intelligence from CrowdStrike Falcon.',
 '["endpoint_detections","vulnerability_scan","threat_intel","device_inventory","policy_compliance"]',
 '[{"key":"client_id","label":"Client ID","type":"text","required":true},{"key":"client_secret","label":"Client Secret","type":"password","required":true},{"key":"base_url","label":"Base URL","type":"text","required":false}]',
 true),

('Microsoft Defender', 'microsoft-defender', 'security', 'Microsoft', '1.0.0', 'available', 'oauth2', 'defender',
 'Ingest alerts, vulnerability findings, and secure score from Microsoft Defender.',
 '["alert_sync","vulnerability_scan","secure_score","device_inventory","attack_surface"]',
 '[{"key":"tenant_id","label":"Tenant ID","type":"text","required":true},{"key":"client_id","label":"Client ID","type":"text","required":true},{"key":"client_secret","label":"Client Secret","type":"password","required":true}]',
 true),

('Wiz', 'wiz', 'security', 'Wiz', '1.0.0', 'available', 'oauth2', 'wiz',
 'Collect cloud security findings, misconfigurations, and vulnerability data from Wiz.',
 '["cloud_findings","misconfiguration_detection","vulnerability_scan","identity_risk","secret_detection"]',
 '[{"key":"client_id","label":"Client ID","type":"text","required":true},{"key":"client_secret","label":"Client Secret","type":"password","required":true}]',
 false),

('Tenable', 'tenable', 'security', 'Tenable', '1.0.0', 'available', 'api_key', 'tenable',
 'Sync vulnerability scan results and compliance checks from Tenable.',
 '["vulnerability_scan","compliance_check","asset_inventory","risk_scoring"]',
 '[{"key":"access_key","label":"Access Key","type":"text","required":true},{"key":"secret_key","label":"Secret Key","type":"password","required":true}]',
 false),

('Qualys', 'qualys', 'security', 'Qualys', '1.0.0', 'available', 'basic_auth', 'qualys',
 'Ingest vulnerability assessments, policy compliance, and web application scans from Qualys.',
 '["vulnerability_scan","policy_compliance","web_app_scan","asset_inventory"]',
 '[{"key":"api_url","label":"API URL","type":"text","required":true},{"key":"username","label":"Username","type":"text","required":true},{"key":"password","label":"Password","type":"password","required":true}]',
 false),

-- Communication
('Slack', 'slack', 'communication', 'Slack', '1.0.0', 'available', 'oauth2', 'slack',
 'Send governance alerts, workflow notifications, and monitoring updates to Slack channels.',
 '["alert_notifications","workflow_notifications","channel_mapping","incident_alerts"]',
 '[{"key":"bot_token","label":"Bot Token","type":"password","required":true},{"key":"default_channel","label":"Default Channel","type":"text","required":false}]',
 true),

('Microsoft Teams', 'microsoft-teams', 'communication', 'Microsoft', '1.0.0', 'available', 'webhook', 'teams',
 'Send governance alerts and notifications to Microsoft Teams channels.',
 '["alert_notifications","workflow_notifications","adaptive_cards"]',
 '[{"key":"webhook_url","label":"Webhook URL","type":"text","required":true}]',
 false),

('Google Chat', 'google-chat', 'communication', 'Google', '1.0.0', 'available', 'webhook', 'googlechat',
 'Send governance alerts and notifications to Google Chat spaces.',
 '["alert_notifications","workflow_notifications"]',
 '[{"key":"webhook_url","label":"Webhook URL","type":"text","required":true}]',
 false),

-- Storage
('Google Drive', 'google-drive', 'storage', 'Google', '1.0.0', 'available', 'oauth2', 'gdrive',
 'Collect documents, policies, and evidence files from Google Drive.',
 '["document_sync","folder_monitoring","permission_audit","shared_drive_scan"]',
 '[{"key":"service_account_json","label":"Service Account JSON","type":"textarea","required":true}]',
 false),

('OneDrive', 'onedrive', 'storage', 'Microsoft', '1.0.0', 'available', 'oauth2', 'onedrive',
 'Collect documents, policies, and evidence files from OneDrive.',
 '["document_sync","folder_monitoring","permission_audit"]',
 '[{"key":"tenant_id","label":"Tenant ID","type":"text","required":true},{"key":"client_id","label":"Client ID","type":"text","required":true},{"key":"client_secret","label":"Client Secret","type":"password","required":true}]',
 false),

('SharePoint', 'sharepoint', 'storage', 'Microsoft', '1.0.0', 'available', 'oauth2', 'sharepoint',
 'Sync documents, policies, and governance artifacts from SharePoint.',
 '["document_sync","site_audit","permission_audit","policy_library"]',
 '[{"key":"tenant_id","label":"Tenant ID","type":"text","required":true},{"key":"client_id","label":"Client ID","type":"text","required":true},{"key":"client_secret","label":"Client Secret","type":"password","required":true},{"key":"site_url","label":"Site URL","type":"text","required":true}]',
 false),

('Dropbox', 'dropbox', 'storage', 'Dropbox', '1.0.0', 'available', 'oauth2', 'dropbox',
 'Collect documents and evidence files from Dropbox.',
 '["document_sync","folder_monitoring","sharing_audit"]',
 '[{"key":"access_token","label":"Access Token","type":"password","required":true}]',
 false),

('Box', 'box', 'storage', 'Box', '1.0.0', 'available', 'oauth2', 'box',
 'Sync documents, policies, and evidence files from Box.',
 '["document_sync","folder_monitoring","access_audit"]',
 '[{"key":"client_id","label":"Client ID","type":"text","required":true},{"key":"client_secret","label":"Client Secret","type":"password","required":true}]',
 false),

-- HR
('Workday', 'workday', 'hr', 'Workday', '1.0.0', 'available', 'basic_auth', 'workday',
 'Sync employee records, org structure, and access entitlements from Workday.',
 '["employee_sync","org_structure","termination_detection","access_entitlements"]',
 '[{"key":"tenant","label":"Tenant","type":"text","required":true},{"key":"username","label":"Integration Username","type":"text","required":true},{"key":"password","label":"Integration Password","type":"password","required":true}]',
 false),

('BambooHR', 'bamboohr', 'hr', 'BambooHR', '1.0.0', 'available', 'api_key', 'bamboohr',
 'Sync employees, departments, and offboarding events from BambooHR.',
 '["employee_sync","department_sync","offboarding_detection","org_chart"]',
 '[{"key":"subdomain","label":"Subdomain","type":"text","required":true},{"key":"api_key","label":"API Key","type":"password","required":true}]',
 false),

('Rippling', 'rippling', 'hr', 'Rippling', '1.0.0', 'available', 'api_key', 'rippling',
 'Sync employees, devices, and app provisioning from Rippling.',
 '["employee_sync","device_management","app_provisioning","offboarding"]',
 '[{"key":"api_key","label":"API Key","type":"password","required":true}]',
 false),

-- Endpoint
('Intune', 'intune', 'endpoint', 'Microsoft', '1.0.0', 'available', 'oauth2', 'intune',
 'Monitor device compliance, security policies, and patch status from Microsoft Intune.',
 '["device_compliance","patch_status","encryption_check","policy_compliance","app_inventory"]',
 '[{"key":"tenant_id","label":"Tenant ID","type":"text","required":true},{"key":"client_id","label":"Client ID","type":"text","required":true},{"key":"client_secret","label":"Client Secret","type":"password","required":true}]',
 false),

('Jamf', 'jamf', 'endpoint', 'Jamf', '1.0.0', 'available', 'basic_auth', 'jamf',
 'Monitor macOS and iOS device compliance, encryption, and patch status from Jamf Pro.',
 '["device_inventory","compliance_check","encryption_check","patch_status","policy_audit"]',
 '[{"key":"server_url","label":"Jamf Pro URL","type":"text","required":true},{"key":"client_id","label":"Client ID","type":"text","required":true},{"key":"client_secret","label":"Client Secret","type":"password","required":true}]',
 false),

('Kandji', 'kandji', 'endpoint', 'Kandji', '1.0.0', 'available', 'api_key', 'kandji',
 'Monitor Apple device compliance and security posture from Kandji.',
 '["device_inventory","compliance_check","blueprint_audit","patch_status"]',
 '[{"key":"subdomain","label":"Subdomain","type":"text","required":true},{"key":"api_token","label":"API Token","type":"password","required":true}]',
 false)

ON CONFLICT (slug) DO NOTHING;
