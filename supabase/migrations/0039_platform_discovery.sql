-- Migration: 0039_platform_discovery.sql
-- Epic 02 Sprint 3: Discovery, Export, and Settings tables

-- 1. saved_searches
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    query TEXT NOT NULL,
    entity_types TEXT[] DEFAULT '{}',
    filters JSONB DEFAULT '{}',
    is_shared BOOLEAN DEFAULT FALSE,
    result_count INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_searches_org_member" ON saved_searches
    FOR ALL USING (is_org_member(organization_id));

-- 2. recent_searches
CREATE TABLE IF NOT EXISTS recent_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    query TEXT NOT NULL,
    entity_types TEXT[] DEFAULT '{}',
    result_count INT,
    searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE recent_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recent_searches_org_member" ON recent_searches
    FOR ALL USING (is_org_member(organization_id));

-- 3. export_jobs
CREATE TABLE IF NOT EXISTS export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    module TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'csv' CHECK (format IN ('csv', 'pdf', 'excel', 'json')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    filters JSONB DEFAULT '{}',
    storage_path TEXT,
    row_count INT,
    file_size BIGINT,
    error_message TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "export_jobs_org_member" ON export_jobs
    FOR ALL USING (is_org_member(organization_id));

-- 4. platform_settings
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, key)
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_settings_org_member" ON platform_settings
    FOR ALL USING (is_org_member(organization_id));

-- 5. notification_templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    event_type TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'slack', 'teams', 'in_app')),
    name TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), event_type, channel)
);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_templates_select_authenticated" ON notification_templates
    FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND (
            organization_id IS NULL
            OR is_org_member(organization_id)
        )
    );

CREATE POLICY "notification_templates_write_org_member" ON notification_templates
    FOR INSERT WITH CHECK (organization_id IS NOT NULL AND is_org_member(organization_id));

CREATE POLICY "notification_templates_update_org_member" ON notification_templates
    FOR UPDATE USING (organization_id IS NOT NULL AND is_org_member(organization_id));

CREATE POLICY "notification_templates_delete_org_member" ON notification_templates
    FOR DELETE USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- 6. search_suggestions
CREATE TABLE IF NOT EXISTS search_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    display_name TEXT NOT NULL,
    secondary_text TEXT,
    search_vector TSVECTOR,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, entity_type, entity_id)
);

ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_suggestions_org_member" ON search_suggestions
    FOR ALL USING (is_org_member(organization_id));

CREATE INDEX IF NOT EXISTS search_suggestions_tsv_idx ON search_suggestions USING GIN(search_vector);

-- Seed 10 built-in notification templates (organization_id = NULL)

INSERT INTO notification_templates (organization_id, event_type, channel, name, subject, body, is_active, is_custom)
VALUES

(NULL, 'vendor_assigned', 'email', 'Vendor Assigned Notification',
 'You have been assigned a vendor: {{entity_name}}',
 'Hi {{actor_name}},

You have been assigned as the owner of vendor "{{entity_name}}" on AUDT.

Please review the vendor profile and ensure all required documents and assessments are up to date.

View vendor: {{link}}

This is an automated notification from AUDT Governance OS.',
 TRUE, FALSE),

(NULL, 'assessment_due', 'email', 'Assessment Due Reminder',
 'Assessment due soon: {{entity_name}}',
 'Hi {{actor_name}},

A security assessment for vendor "{{entity_name}}" is due soon.

Please complete the assessment before the deadline to maintain your compliance posture.

Start assessment: {{link}}

This is an automated notification from AUDT Governance OS.',
 TRUE, FALSE),

(NULL, 'risk_created', 'email', 'New Risk Identified',
 'New risk identified: {{entity_name}}',
 'Hi {{actor_name}},

A new risk has been identified and added to the Risk Register: "{{entity_name}}".

Please review the risk details and assign an appropriate treatment strategy.

View risk: {{link}}

This is an automated notification from AUDT Governance OS.',
 TRUE, FALSE),

(NULL, 'finding_raised', 'email', 'Audit Finding Raised',
 'Audit finding raised: {{entity_name}}',
 'Hi {{actor_name}},

An audit finding has been raised that requires your attention: "{{entity_name}}".

Please review the finding and initiate a corrective action plan (CAPA) within the required timeframe.

View finding: {{link}}

This is an automated notification from AUDT Governance OS.',
 TRUE, FALSE),

(NULL, 'contract_expiring', 'email', 'Contract Expiring Soon',
 'Contract expiring soon: {{entity_name}}',
 'Hi {{actor_name}},

The contract "{{entity_name}}" is approaching its expiry date.

Please review the contract and initiate the renewal or offboarding process as appropriate.

View contract: {{link}}

This is an automated notification from AUDT Governance OS.',
 TRUE, FALSE),

(NULL, 'audit_scheduled', 'email', 'Audit Scheduled',
 'Audit scheduled: {{entity_name}}',
 'Hi {{actor_name}},

An audit has been scheduled: "{{entity_name}}".

Please prepare the required documentation and ensure your compliance controls are up to date before the audit begins.

View audit: {{link}}

This is an automated notification from AUDT Governance OS.',
 TRUE, FALSE),

(NULL, 'workflow_approved', 'in_app', 'Workflow Approved',
 NULL,
 '{{actor_name}} approved your workflow request for "{{entity_name}}". View details: {{link}}',
 TRUE, FALSE),

(NULL, 'evidence_requested', 'in_app', 'Evidence Requested',
 NULL,
 '{{actor_name}} has requested evidence for "{{entity_name}}". Please submit the required documents: {{link}}',
 TRUE, FALSE),

(NULL, 'policy_published', 'in_app', 'Policy Published',
 NULL,
 'A new policy has been published: "{{entity_name}}". Please review and attest your acknowledgement: {{link}}',
 TRUE, FALSE),

(NULL, 'ai_recommendation', 'in_app', 'New AI Recommendation',
 NULL,
 'AUDT AI has a new governance recommendation for "{{entity_name}}". Review and take action: {{link}}',
 TRUE, FALSE)

ON CONFLICT (COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), event_type, channel) DO NOTHING;
