CREATE TYPE "public"."agent_action_type" AS ENUM('create_issue', 'create_risk', 'create_task', 'create_treatment', 'launch_workflow', 'assign_owner', 'request_evidence', 'generate_report', 'notify_stakeholder', 'create_review', 'schedule_audit', 'open_verification_review', 'custom');--> statement-breakpoint
CREATE TYPE "public"."agent_approval_mode" AS ENUM('manual', 'manager', 'role_based', 'multi_level', 'automatic');--> statement-breakpoint
CREATE TYPE "public"."agent_execution_mode" AS ENUM('advisory', 'approval_required', 'autonomous');--> statement-breakpoint
CREATE TYPE "public"."agent_memory_type" AS ENUM('observation', 'recommendation', 'action', 'approval', 'conversation', 'outcome', 'learning');--> statement-breakpoint
CREATE TYPE "public"."agent_observation_type" AS ENUM('control_failure', 'vendor_risk', 'trust_decline', 'policy_expiry', 'overdue_obligation', 'privacy_risk', 'audit_gap', 'ai_risk', 'contract_risk', 'compliance_signal', 'custom');--> statement-breakpoint
CREATE TYPE "public"."agent_run_status" AS ENUM('running', 'completed', 'failed', 'cancelled', 'pending_approval');--> statement-breakpoint
CREATE TYPE "public"."agent_severity" AS ENUM('info', 'low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."agent_status" AS ENUM('draft', 'testing', 'active', 'paused', 'disabled', 'archived');--> statement-breakpoint
CREATE TYPE "public"."agent_trigger_type" AS ENUM('schedule', 'event', 'threshold', 'workflow', 'manual', 'api');--> statement-breakpoint
CREATE TYPE "public"."agent_type" AS ENUM('compliance', 'risk', 'vendor', 'audit', 'privacy', 'contract', 'trust', 'ai_governance', 'custom');--> statement-breakpoint
CREATE TYPE "public"."ai_approval_status" AS ENUM('pending', 'under_review', 'approved', 'rejected', 'decommissioned');--> statement-breakpoint
CREATE TYPE "public"."ai_compliance_framework" AS ENUM('iso_42001', 'nist_ai_rmf', 'eu_ai_act', 'oecd_ai_principles', 'dpdp_ai', 'internal');--> statement-breakpoint
CREATE TYPE "public"."ai_control_category" AS ENUM('human_oversight', 'output_review', 'prompt_logging', 'model_approval', 'data_classification', 'access_control', 'vendor_review', 'model_monitoring', 'content_filtering', 'red_team_testing', 'other');--> statement-breakpoint
CREATE TYPE "public"."ai_incident_type" AS ENUM('hallucination', 'bias_event', 'data_exposure', 'unauthorized_usage', 'model_failure', 'prompt_injection', 'compliance_violation', 'other');--> statement-breakpoint
CREATE TYPE "public"."ai_risk_category" AS ENUM('hallucination', 'bias', 'privacy_leakage', 'copyright_risk', 'prompt_injection', 'data_poisoning', 'model_drift', 'regulatory_risk', 'security_risk', 'vendor_dependency', 'explainability_risk', 'autonomous_decision_risk', 'other');--> statement-breakpoint
CREATE TYPE "public"."ai_risk_classification" AS ENUM('low', 'moderate', 'high', 'critical', 'prohibited');--> statement-breakpoint
CREATE TYPE "public"."ai_system_type" AS ENUM('commercial', 'open_source', 'internal', 'agent', 'rag', 'llm_app', 'workflow');--> statement-breakpoint
CREATE TYPE "public"."ai_trust_level" AS ENUM('trusted', 'managed', 'monitored', 'needs_attention', 'high_risk', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."alert_entity_type" AS ENUM('vendor', 'risk', 'control', 'audit', 'evidence', 'policy', 'framework', 'organization');--> statement-breakpoint
CREATE TYPE "public"."alert_severity" AS ENUM('info', 'low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."asset_alert_type_enum" AS ENUM('unreviewed', 'missing_owner', 'missing_controls', 'missing_risk_assessment', 'missing_classification', 'critical_change', 'score_drop', 'custom');--> statement-breakpoint
CREATE TYPE "public"."asset_criticality_enum" AS ENUM('low', 'medium', 'high', 'critical', 'mission_critical');--> statement-breakpoint
CREATE TYPE "public"."asset_data_class_enum" AS ENUM('public', 'internal', 'confidential', 'restricted', 'critical');--> statement-breakpoint
CREATE TYPE "public"."asset_env_enum" AS ENUM('production', 'staging', 'development', 'testing', 'dr', 'sandbox');--> statement-breakpoint
CREATE TYPE "public"."asset_relationship_type_enum" AS ENUM('depends_on', 'uses', 'stores', 'processes', 'connects_to', 'owned_by', 'provided_by', 'supports', 'protected_by', 'governed_by', 'impacted_by', 'monitored_by');--> statement-breakpoint
CREATE TYPE "public"."asset_status_enum" AS ENUM('active', 'inactive', 'retired', 'planned', 'deprecated', 'under_review');--> statement-breakpoint
CREATE TYPE "public"."asset_type_enum" AS ENUM('application', 'database', 'api', 'server', 'cloud_resource', 'data_asset', 'business_process', 'ai_system', 'vendor_service', 'network_asset', 'endpoint', 'custom');--> statement-breakpoint
CREATE TYPE "public"."attestation_status" AS ENUM('pending', 'acknowledged', 'rejected', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."automation_level" AS ENUM('manual', 'semi_automated', 'automated', 'ai_assisted');--> statement-breakpoint
CREATE TYPE "public"."benchmark_category" AS ENUM('organizational_trust', 'vendor_trust', 'risk_posture', 'control_health', 'audit_readiness', 'compliance_coverage', 'privacy_trust', 'contract_trust', 'issue_resolution', 'workflow_automation');--> statement-breakpoint
CREATE TYPE "public"."benchmark_maturity_level" AS ENUM('reactive', 'managed', 'defined', 'measured', 'optimized', 'trust_leader');--> statement-breakpoint
CREATE TYPE "public"."benchmark_ranking_label" AS ENUM('top_1_percent', 'top_5_percent', 'top_10_percent', 'top_quartile', 'above_average', 'average', 'below_average', 'at_risk');--> statement-breakpoint
CREATE TYPE "public"."clause_category" AS ENUM('privacy', 'security', 'financial', 'operational', 'legal', 'compliance', 'termination', 'renewal', 'custom');--> statement-breakpoint
CREATE TYPE "public"."clause_risk_level" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."consent_status" AS ENUM('granted', 'withdrawn', 'expired', 'pending', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('draft', 'review', 'negotiation', 'active', 'expiring', 'expired', 'renewed', 'terminated', 'archived');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('vendor_agreement', 'msa', 'sow', 'nda', 'dpa', 'employment', 'partner_agreement', 'procurement', 'custom');--> statement-breakpoint
CREATE TYPE "public"."control_frequency" AS ENUM('continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'ad_hoc');--> statement-breakpoint
CREATE TYPE "public"."control_test_result" AS ENUM('passed', 'failed', 'partially_effective', 'exception', 'not_tested');--> statement-breakpoint
CREATE TYPE "public"."control_type" AS ENUM('preventive', 'detective', 'corrective', 'compensating', 'administrative', 'technical', 'physical', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."data_asset_status" AS ENUM('active', 'inactive', 'archived', 'under_review');--> statement-breakpoint
CREATE TYPE "public"."data_category" AS ENUM('customer', 'employee', 'vendor', 'marketing', 'financial', 'health', 'biometric', 'custom');--> statement-breakpoint
CREATE TYPE "public"."escalation_level" AS ENUM('owner', 'manager', 'department_head', 'executive', 'board');--> statement-breakpoint
CREATE TYPE "public"."exception_status" AS ENUM('pending', 'approved', 'rejected', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."graph_entity_type" AS ENUM('vendor', 'evidence', 'control', 'risk', 'audit', 'finding', 'policy', 'framework', 'trust_score', 'org_trust');--> statement-breakpoint
CREATE TYPE "public"."graph_relationship_type" AS ENUM('vendor_provides_evidence', 'vendor_has_risk', 'vendor_linked_control', 'vendor_has_audit', 'evidence_supports_control', 'evidence_in_framework', 'control_reduces_risk', 'control_in_audit', 'control_supported_by_policy', 'control_in_framework', 'audit_has_finding', 'finding_creates_risk', 'policy_in_framework', 'risk_affects_trust_score', 'trust_score_affects_org_trust');--> statement-breakpoint
CREATE TYPE "public"."integration_auth_type" AS ENUM('oauth2', 'api_key', 'pat', 'basic_auth', 'service_account', 'webhook', 'custom');--> statement-breakpoint
CREATE TYPE "public"."integration_category" AS ENUM('identity', 'cloud', 'source_control', 'project_management', 'itsm', 'endpoint', 'security', 'communication', 'storage', 'hr', 'custom');--> statement-breakpoint
CREATE TYPE "public"."integration_connector_status" AS ENUM('available', 'connected', 'disconnected', 'error', 'deprecated', 'coming_soon');--> statement-breakpoint
CREATE TYPE "public"."integration_event_type" AS ENUM('user_created', 'user_deleted', 'control_failed', 'risk_created', 'evidence_updated', 'workflow_triggered', 'contract_updated', 'vendor_updated', 'misconfiguration_detected', 'credential_expiring', 'sync_completed', 'sync_failed');--> statement-breakpoint
CREATE TYPE "public"."integration_mapping_target" AS ENUM('control', 'risk', 'evidence', 'vendor', 'issue', 'finding');--> statement-breakpoint
CREATE TYPE "public"."integration_sync_frequency" AS ENUM('real_time', 'fifteen_minutes', 'hourly', 'daily', 'weekly', 'manual');--> statement-breakpoint
CREATE TYPE "public"."integration_sync_status" AS ENUM('pending', 'running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."integration_webhook_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."issue_priority" AS ENUM('p1', 'p2', 'p3', 'p4', 'p5');--> statement-breakpoint
CREATE TYPE "public"."issue_severity" AS ENUM('critical', 'high', 'medium', 'low', 'informational');--> statement-breakpoint
CREATE TYPE "public"."issue_status" AS ENUM('open', 'assigned', 'in_progress', 'blocked', 'pending_review', 'resolved', 'closed', 'accepted_risk', 'deferred');--> statement-breakpoint
CREATE TYPE "public"."issue_task_status" AS ENUM('open', 'in_progress', 'blocked', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."issue_type" AS ENUM('risk', 'audit_finding', 'capa', 'control_failure', 'policy_gap', 'privacy_issue', 'vendor_issue', 'contract_obligation', 'compliance_gap', 'security_incident', 'custom');--> statement-breakpoint
CREATE TYPE "public"."obligation_status" AS ENUM('open', 'in_progress', 'completed', 'overdue', 'waived');--> statement-breakpoint
CREATE TYPE "public"."policy_review_outcome" AS ENUM('approved', 'changes_required', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."privacy_assessment_status" AS ENUM('draft', 'in_progress', 'completed', 'approved', 'archived');--> statement-breakpoint
CREATE TYPE "public"."privacy_request_status" AS ENUM('submitted', 'assigned', 'investigating', 'completed', 'closed');--> statement-breakpoint
CREATE TYPE "public"."privacy_request_type" AS ENUM('access', 'correction', 'deletion', 'portability', 'consent_withdrawal', 'grievance');--> statement-breakpoint
CREATE TYPE "public"."privacy_risk_level" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."risk_category" AS ENUM('operational', 'cyber_security', 'compliance', 'vendor', 'privacy', 'financial', 'legal', 'strategic', 'technology', 'business_continuity', 'third_party', 'regulatory', 'custom');--> statement-breakpoint
CREATE TYPE "public"."risk_source" AS ENUM('manual', 'vendor', 'audit_finding', 'compliance_gap', 'control_failure', 'policy_exception', 'ai_generated', 'api');--> statement-breakpoint
CREATE TYPE "public"."risk_status" AS ENUM('identified', 'under_assessment', 'open', 'mitigating', 'accepted', 'transferred', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."risk_treatment_status" AS ENUM('open', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."risk_treatment_strategy" AS ENUM('mitigate', 'accept', 'transfer', 'avoid', 'monitor');--> statement-breakpoint
CREATE TYPE "public"."sensitivity_level" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('active', 'pending_approval', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."trust_activity_type" AS ENUM('profile_created', 'profile_updated', 'document_shared', 'document_verified', 'badge_issued', 'relationship_created', 'questionnaire_answered', 'verification_requested');--> statement-breakpoint
CREATE TYPE "public"."trust_badge_type" AS ENUM('audt_verified', 'dpdp_ready', 'privacy_verified', 'vendor_trusted', 'low_risk', 'enterprise_ready', 'iso_verified', 'soc2_verified', 'custom');--> statement-breakpoint
CREATE TYPE "public"."trust_doc_type" AS ENUM('soc2', 'iso27001', 'iso27701', 'pci_dss', 'hipaa', 'dpdp', 'cyber_insurance', 'pen_test', 'dpa', 'security_whitepaper', 'sig_questionnaire', 'caiq', 'custom');--> statement-breakpoint
CREATE TYPE "public"."trust_relationship_status" AS ENUM('pending', 'active', 'inactive', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."trust_relationship_type" AS ENUM('customer', 'vendor', 'partner');--> statement-breakpoint
CREATE TYPE "public"."trust_verification_level" AS ENUM('self_attested', 'customer_verified', 'auditor_verified', 'audt_verified');--> statement-breakpoint
CREATE TYPE "public"."trust_visibility" AS ENUM('private', 'specific', 'network', 'public');--> statement-breakpoint
CREATE TYPE "public"."vendor_lifecycle_stage" AS ENUM('discover', 'inventory', 'classify', 'assess', 'risk', 'comply', 'monitor', 'audit', 'renew', 'offboard');--> statement-breakpoint
CREATE TYPE "public"."workflow_approval_status" AS ENUM('pending', 'approved', 'rejected', 'delegated', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."workflow_module" AS ENUM('vendor_hub', 'evidence_vault', 'audit_management', 'risk_lens', 'control_center', 'policy_governance', 'dpdp_privacy', 'contract_governance', 'issue_hub', 'trust_intelligence', 'custom');--> statement-breakpoint
CREATE TYPE "public"."workflow_node_type" AS ENUM('start', 'task', 'approval', 'condition', 'decision', 'wait', 'notification', 'webhook', 'create_record', 'update_record', 'end');--> statement-breakpoint
CREATE TYPE "public"."workflow_run_status" AS ENUM('running', 'waiting', 'approved', 'rejected', 'failed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."workflow_status" AS ENUM('draft', 'active', 'archived', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."workflow_trigger_type" AS ENUM('record_created', 'record_updated', 'status_changed', 'date_reached', 'score_threshold', 'api_event', 'manual', 'scheduled');--> statement-breakpoint
ALTER TYPE "public"."policy_status" ADD VALUE 'published';--> statement-breakpoint
ALTER TYPE "public"."policy_status" ADD VALUE 'retired';--> statement-breakpoint
CREATE TABLE "access_review_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"review_id" uuid NOT NULL,
	"user_id" uuid,
	"user_name" text NOT NULL,
	"user_email" text NOT NULL,
	"role" text,
	"department" text,
	"risk_level" text DEFAULT 'medium' NOT NULL,
	"decision" text,
	"reviewer_id" uuid,
	"reviewed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "access_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"campaign_type" text DEFAULT 'quarterly' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scope" text,
	"risk_level" text DEFAULT 'medium' NOT NULL,
	"due_date" date,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"completion_rate" integer DEFAULT 0 NOT NULL,
	"total_users" integer DEFAULT 0 NOT NULL,
	"reviewed_users" integer DEFAULT 0 NOT NULL,
	"approved_count" integer DEFAULT 0 NOT NULL,
	"revoked_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"run_id" uuid,
	"recommendation_id" uuid,
	"action_type" "agent_action_type" DEFAULT 'custom' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"parameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"result" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_message" text,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"executed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"action_id" uuid NOT NULL,
	"approver_id" uuid,
	"approval_level" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"decided_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"agent_id" uuid,
	"role" text DEFAULT 'user' NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"source_module" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"agent_id" uuid,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"memory_type" "agent_memory_type" DEFAULT 'observation' NOT NULL,
	"key" text NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"run_id" uuid,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid,
	"metric_date" date NOT NULL,
	"total_runs" integer DEFAULT 0 NOT NULL,
	"successful_runs" integer DEFAULT 0 NOT NULL,
	"failed_runs" integer DEFAULT 0 NOT NULL,
	"total_observations" integer DEFAULT 0 NOT NULL,
	"total_recommendations" integer DEFAULT 0 NOT NULL,
	"total_actions" integer DEFAULT 0 NOT NULL,
	"approved_actions" integer DEFAULT 0 NOT NULL,
	"rejected_actions" integer DEFAULT 0 NOT NULL,
	"time_saved_minutes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"run_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"observation_type" "agent_observation_type" DEFAULT 'custom' NOT NULL,
	"severity" "agent_severity" DEFAULT 'medium' NOT NULL,
	"source_module" text,
	"source_entity_id" uuid,
	"source_entity_type" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_orchestrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"agent_sequence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"run_id" uuid,
	"observation_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"reasoning" text,
	"impact" text DEFAULT 'medium' NOT NULL,
	"effort" text DEFAULT 'medium' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"confidence_score" integer DEFAULT 75 NOT NULL,
	"suggested_actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"actioned_by" uuid,
	"actioned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"status" "agent_run_status" DEFAULT 'running' NOT NULL,
	"trigger_type" "agent_trigger_type",
	"triggered_by" uuid,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"observations_count" integer DEFAULT 0 NOT NULL,
	"recommendations_count" integer DEFAULT 0 NOT NULL,
	"actions_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"cron_expression" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"agent_type" "agent_type" DEFAULT 'custom' NOT NULL,
	"status" "agent_status" DEFAULT 'draft' NOT NULL,
	"execution_mode" "agent_execution_mode" DEFAULT 'advisory' NOT NULL,
	"trigger_type" "agent_trigger_type" DEFAULT 'manual' NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"prompt" text,
	"tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"approval_mode" "agent_approval_mode" DEFAULT 'manual' NOT NULL,
	"schedule" text,
	"success_rate" integer DEFAULT 0 NOT NULL,
	"total_runs" integer DEFAULT 0 NOT NULL,
	"last_run_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"is_builtin" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"ai_system_id" uuid,
	"assessment_type" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"score" numeric(5, 2),
	"findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"assessor_id" uuid,
	"completed_at" timestamp with time zone,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_compliance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"framework" "ai_compliance_framework" NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"readiness_score" numeric(5, 2) DEFAULT '0',
	"total_controls" integer DEFAULT 0 NOT NULL,
	"implemented_controls" integer DEFAULT 0 NOT NULL,
	"open_gaps" integer DEFAULT 0 NOT NULL,
	"last_assessed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"control_category" "ai_control_category" NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"effectiveness" text,
	"owner_id" uuid,
	"last_tested_at" date,
	"next_review_date" date,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"ai_system_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"incident_type" "ai_incident_type" NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"root_cause" text,
	"remediation" text,
	"reporter_id" uuid,
	"assigned_to" uuid,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"policy_type" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"content" text,
	"owner_id" uuid,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"review_date" date,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_risks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"ai_system_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"risk_category" "ai_risk_category" NOT NULL,
	"likelihood" integer DEFAULT 3 NOT NULL,
	"impact" integer DEFAULT 3 NOT NULL,
	"risk_level" "ai_risk_classification" DEFAULT 'moderate' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"treatment" text,
	"owner_id" uuid,
	"target_date" date,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_system_controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ai_system_id" uuid NOT NULL,
	"control_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_system_risks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ai_system_id" uuid NOT NULL,
	"risk_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_systems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"system_type" "ai_system_type" NOT NULL,
	"vendor_name" text,
	"model_name" text,
	"version" text,
	"owner_id" uuid,
	"business_unit" text,
	"purpose" text,
	"use_case" text,
	"risk_classification" "ai_risk_classification" DEFAULT 'moderate' NOT NULL,
	"data_classification" text,
	"approval_status" "ai_approval_status" DEFAULT 'pending' NOT NULL,
	"ai_trust_score" numeric(5, 2),
	"review_date" date,
	"last_assessed_at" timestamp with time zone,
	"deployment_environment" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_trust_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"ai_system_id" uuid NOT NULL,
	"overall_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"risk_score" numeric(5, 2) DEFAULT '0',
	"controls_score" numeric(5, 2) DEFAULT '0',
	"compliance_score" numeric(5, 2) DEFAULT '0',
	"monitoring_score" numeric(5, 2) DEFAULT '0',
	"vendor_score" numeric(5, 2) DEFAULT '0',
	"incident_score" numeric(5, 2) DEFAULT '0',
	"trust_level" "ai_trust_level" DEFAULT 'monitored' NOT NULL,
	"breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"description" text,
	"vendor_type" text DEFAULT 'commercial' NOT NULL,
	"risk_rating" text DEFAULT 'moderate' NOT NULL,
	"privacy_posture" text,
	"security_posture" text,
	"contract_status" text,
	"assessment_status" text,
	"last_assessed_at" timestamp with time zone,
	"trust_score" numeric(5, 2),
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_dashboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"dashboard_type" text NOT NULL,
	"description" text,
	"layout_config" jsonb DEFAULT '{}'::jsonb,
	"is_default" boolean DEFAULT false,
	"is_shared" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"report_id" uuid,
	"export_type" text NOT NULL,
	"format" text NOT NULL,
	"file_path" text,
	"file_size" bigint,
	"status" text DEFAULT 'pending' NOT NULL,
	"exported_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_forecasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"metric_name" text NOT NULL,
	"horizon_days" integer NOT NULL,
	"current_value" numeric(5, 2),
	"forecast_value" numeric(5, 2),
	"confidence_score" numeric(5, 2),
	"forecast_data" jsonb DEFAULT '[]'::jsonb,
	"generated_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_kpis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"kpi_key" text NOT NULL,
	"kpi_name" text NOT NULL,
	"current_value" numeric(10, 2),
	"previous_value" numeric(10, 2),
	"target_value" numeric(10, 2),
	"unit" text,
	"trend" text,
	"period" text,
	"computed_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"report_type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"format" text DEFAULT 'pdf' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"content_snapshot" jsonb DEFAULT '{}'::jsonb,
	"file_path" text,
	"generated_by" uuid,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"report_type" text NOT NULL,
	"frequency" text NOT NULL,
	"delivery_method" text DEFAULT 'email' NOT NULL,
	"recipients" jsonb DEFAULT '[]'::jsonb,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"snapshot_date" date NOT NULL,
	"kpi_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"trend_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"benchmark_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"forecast_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"schedule_id" uuid,
	"report_type" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_widgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dashboard_id" uuid NOT NULL,
	"widget_type" text NOT NULL,
	"title" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"position_x" integer DEFAULT 0,
	"position_y" integer DEFAULT 0,
	"width" integer DEFAULT 4,
	"height" integer DEFAULT 3,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_ai_systems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"ai_system_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid,
	"alert_type" "asset_alert_type_enum" DEFAULT 'custom' NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"due_date" date,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"control_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_criticality_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"previous_level" "asset_criticality_enum",
	"new_level" "asset_criticality_enum" NOT NULL,
	"reason" text,
	"changed_by" uuid,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_data_flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"source_asset_id" uuid NOT NULL,
	"target_asset_id" uuid,
	"target_name" text,
	"data_types" text[],
	"flow_purpose" text,
	"is_cross_border" boolean DEFAULT false NOT NULL,
	"destination_country" text,
	"encryption_in_transit" boolean DEFAULT false NOT NULL,
	"data_volume" text,
	"frequency" text DEFAULT 'continuous' NOT NULL,
	"legal_basis" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"depends_on_id" uuid NOT NULL,
	"dependency_type" text DEFAULT 'runtime' NOT NULL,
	"is_critical" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"root_cause" text,
	"remediation" text,
	"occurred_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"reported_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_owners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"owner_type" text DEFAULT 'business' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" uuid
);
--> statement-breakpoint
CREATE TABLE "asset_regulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"regulation_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"source_asset_id" uuid NOT NULL,
	"target_asset_id" uuid,
	"target_entity_type" text,
	"target_entity_id" uuid,
	"relationship_type" "asset_relationship_type_enum" NOT NULL,
	"description" text,
	"is_critical" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"reviewer_id" uuid,
	"review_type" text DEFAULT 'periodic' NOT NULL,
	"outcome" text DEFAULT 'no_change' NOT NULL,
	"findings" text,
	"recommendations" text,
	"next_review_at" date,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_risks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"risk_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"trust_score" integer DEFAULT 0 NOT NULL,
	"security_controls" integer DEFAULT 0 NOT NULL,
	"compliance_coverage" integer DEFAULT 0 NOT NULL,
	"risk_posture" integer DEFAULT 0 NOT NULL,
	"data_protection" integer DEFAULT 0 NOT NULL,
	"operational_health" integer DEFAULT 0 NOT NULL,
	"monitoring_coverage" integer DEFAULT 0 NOT NULL,
	"trigger_event" text DEFAULT 'computed' NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"total_assets" integer DEFAULT 0 NOT NULL,
	"active_assets" integer DEFAULT 0 NOT NULL,
	"critical_assets" integer DEFAULT 0 NOT NULL,
	"assets_by_type" jsonb DEFAULT '{}'::jsonb,
	"assets_by_env" jsonb DEFAULT '{}'::jsonb,
	"avg_trust_score" integer,
	"open_alerts" integer DEFAULT 0 NOT NULL,
	"snapshotted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"tag" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"is_builtin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"access_type" text DEFAULT 'provides' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"asset_type" "asset_type_enum" DEFAULT 'application' NOT NULL,
	"category" text,
	"status" "asset_status_enum" DEFAULT 'active' NOT NULL,
	"environment" "asset_env_enum" DEFAULT 'production' NOT NULL,
	"criticality" "asset_criticality_enum" DEFAULT 'medium' NOT NULL,
	"data_class" "asset_data_class_enum",
	"owner_id" uuid,
	"business_unit" text,
	"location" text,
	"cloud_provider" text,
	"technology_stack" text,
	"compliance_scope" text[],
	"contains_pii" boolean DEFAULT false NOT NULL,
	"contains_sensitive" boolean DEFAULT false NOT NULL,
	"is_cross_border" boolean DEFAULT false NOT NULL,
	"encryption_status" text,
	"recovery_time_objective" text,
	"recovery_point_objective" text,
	"vendor_id" uuid,
	"trust_score" integer,
	"trust_score_at" timestamp with time zone,
	"last_review_at" timestamp with time zone,
	"next_review_at" timestamp with time zone,
	"notes" text,
	"external_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attestation_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"attestation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"responded_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attestations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"policy_type" text DEFAULT 'security_policy' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"content" text,
	"version" text DEFAULT '1.0' NOT NULL,
	"due_date" date,
	"expires_at" timestamp with time zone,
	"total_assigned" integer DEFAULT 0 NOT NULL,
	"total_completed" integer DEFAULT 0 NOT NULL,
	"completion_rate" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"review_area" text DEFAULT 'general' NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"notes" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_room_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"activity_type" text NOT NULL,
	"description" text NOT NULL,
	"actor_id" uuid,
	"external_user_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_room_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"document_name" text NOT NULL,
	"document_type" text DEFAULT 'evidence' NOT NULL,
	"storage_path" text,
	"file_size" bigint,
	"content_type" text,
	"source_module" text,
	"source_id" text,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"room_type" text DEFAULT 'audit' NOT NULL,
	"framework" text,
	"scope" text,
	"objective" text,
	"status" text DEFAULT 'planning' NOT NULL,
	"start_date" date,
	"end_date" date,
	"completion_pct" integer DEFAULT 0 NOT NULL,
	"auditor_org_id" uuid,
	"lead_auditor_id" uuid,
	"owner_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditor_organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"firm_type" text DEFAULT 'audit_firm' NOT NULL,
	"website" text,
	"country" text,
	"specializations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"contact_email" text,
	"contact_name" text,
	"verification_status" text DEFAULT 'unverified' NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"trigger_type" text DEFAULT 'check_failed' NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"run_count" integer DEFAULT 0 NOT NULL,
	"last_run_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benchmark_industries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"industry" text NOT NULL,
	"company_size" text DEFAULT 'all' NOT NULL,
	"category" "benchmark_category" NOT NULL,
	"avg_score" integer DEFAULT 65 NOT NULL,
	"median_score" integer DEFAULT 65 NOT NULL,
	"top_quartile" integer DEFAULT 80 NOT NULL,
	"top_decile" integer DEFAULT 90 NOT NULL,
	"bottom_quartile" integer DEFAULT 50 NOT NULL,
	"std_dev" integer DEFAULT 15 NOT NULL,
	"sample_size" integer DEFAULT 100 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benchmark_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"category" "benchmark_category" NOT NULL,
	"org_score" integer,
	"industry_avg" integer,
	"peer_avg" integer,
	"top_quartile" integer,
	"percentile" integer,
	"ranking_label" "benchmark_ranking_label" DEFAULT 'average' NOT NULL,
	"delta_vs_industry" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benchmark_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"snapshot_date" text NOT NULL,
	"industry" text,
	"company_size" text,
	"overall_score" integer,
	"overall_percentile" integer,
	"maturity_level" "benchmark_maturity_level" DEFAULT 'reactive' NOT NULL,
	"overall_ranking" "benchmark_ranking_label" DEFAULT 'average' NOT NULL,
	"peer_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benchmark_trends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"category" "benchmark_category" NOT NULL,
	"period_month" text NOT NULL,
	"score" integer,
	"percentile" integer,
	"ranking_label" "benchmark_ranking_label" DEFAULT 'average' NOT NULL,
	"industry_avg" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"check_run_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"source" text DEFAULT 'system_generated' NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"hash" text,
	"status" text DEFAULT 'valid' NOT NULL,
	"expires_at" timestamp with time zone,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_check_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"check_id" uuid NOT NULL,
	"result" text DEFAULT 'unknown' NOT NULL,
	"score" integer,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"raw_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_message" text,
	"triggered_by" text DEFAULT 'schedule' NOT NULL,
	"run_by" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'custom' NOT NULL,
	"check_type" text DEFAULT 'manual' NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"schedule" text DEFAULT 'daily' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"is_builtin" boolean DEFAULT false NOT NULL,
	"check_logic" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"remediation_guide" text,
	"frameworks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"check_id" uuid,
	"title" text NOT NULL,
	"reason" text NOT NULL,
	"risk_acceptance" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"requested_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_health_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"level" text DEFAULT 'needs_attention' NOT NULL,
	"control_health" integer,
	"evidence_freshness" integer,
	"check_success_rate" integer,
	"open_findings" integer,
	"open_risks" integer,
	"training_completion" integer,
	"access_review_rate" integer,
	"trust_score" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"signal_type" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"source_module" text,
	"source_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"subject_id" text NOT NULL,
	"subject_name" text,
	"subject_email" text,
	"purpose" text NOT NULL,
	"consent_status" "consent_status" DEFAULT 'pending' NOT NULL,
	"data_asset_id" uuid,
	"obtained_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"withdrawn_at" timestamp with time zone,
	"source" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "continuous_readiness" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"framework_id" uuid,
	"framework_name" text NOT NULL,
	"readiness_score" integer DEFAULT 0 NOT NULL,
	"passing_checks" integer DEFAULT 0 NOT NULL,
	"total_checks" integer DEFAULT 0 NOT NULL,
	"passing_controls" integer DEFAULT 0 NOT NULL,
	"total_controls" integer DEFAULT 0 NOT NULL,
	"evidence_coverage" integer DEFAULT 0 NOT NULL,
	"trend" text DEFAULT 'stable' NOT NULL,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_clauses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" "clause_category" DEFAULT 'legal' NOT NULL,
	"content" text NOT NULL,
	"risk_level" "clause_risk_level" DEFAULT 'low' NOT NULL,
	"ai_analysis" text,
	"is_missing" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"control_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_obligations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"owner_id" uuid,
	"due_date" date,
	"status" "obligation_status" DEFAULT 'open' NOT NULL,
	"risk_level" "clause_risk_level" DEFAULT 'low' NOT NULL,
	"completed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"policy_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_risks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"risk_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"vendor_id" uuid,
	"title" text NOT NULL,
	"contract_type" "contract_type" DEFAULT 'vendor_agreement' NOT NULL,
	"status" "contract_status" DEFAULT 'draft' NOT NULL,
	"effective_date" date,
	"expiry_date" date,
	"renewal_date" date,
	"notice_period_days" integer DEFAULT 30 NOT NULL,
	"auto_renewal" boolean DEFAULT false NOT NULL,
	"owner_id" uuid,
	"value" numeric(15, 2),
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"storage_path" text,
	"ai_summary" text,
	"trust_score" integer,
	"trust_score_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "control_frameworks" (
	"control_id" uuid NOT NULL,
	"framework_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "control_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"control_id" uuid NOT NULL,
	"test_date" date NOT NULL,
	"tester_id" uuid,
	"tester_name" text,
	"method" text,
	"result" "control_test_result" DEFAULT 'not_tested' NOT NULL,
	"evidence_ref" text,
	"comments" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "control_validations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"check_id" uuid NOT NULL,
	"check_run_id" uuid,
	"control_id" uuid,
	"state" text DEFAULT 'unknown' NOT NULL,
	"notes" text,
	"validated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "control_vendors" (
	"control_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_id" uuid,
	"department" text,
	"data_category" "data_category" DEFAULT 'custom' NOT NULL,
	"sensitivity" "sensitivity_level" DEFAULT 'medium' NOT NULL,
	"purpose" text,
	"storage_location" text,
	"retention_period" integer,
	"cross_border" boolean DEFAULT false NOT NULL,
	"status" "data_asset_status" DEFAULT 'active' NOT NULL,
	"health_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"data_asset_id" uuid,
	"destination_country" text NOT NULL,
	"recipient_name" text NOT NULL,
	"transfer_basis" text NOT NULL,
	"status" "transfer_status" DEFAULT 'pending_approval' NOT NULL,
	"risk_notes" text,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"review_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"evidence_type" text DEFAULT 'custom' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"due_date" date,
	"requested_by_id" uuid,
	"assigned_owner_id" uuid,
	"reviewer_notes" text,
	"rejection_reason" text,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"document_name" text NOT NULL,
	"storage_path" text,
	"file_size" bigint,
	"content_type" text,
	"description" text,
	"source_module" text,
	"source_id" text,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"assessment_type" text DEFAULT 'custom' NOT NULL,
	"status" text DEFAULT 'planning' NOT NULL,
	"completion_pct" integer DEFAULT 0 NOT NULL,
	"start_date" date,
	"end_date" date,
	"lead_assessor_id" uuid,
	"open_findings" integer DEFAULT 0 NOT NULL,
	"pending_evidence" integer DEFAULT 0 NOT NULL,
	"total_milestones" integer DEFAULT 0 NOT NULL,
	"completed_milestones" integer DEFAULT 0 NOT NULL,
	"ai_readiness_score" numeric(5, 2),
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"parent_id" uuid,
	"content" text NOT NULL,
	"comment_type" text DEFAULT 'external' NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"author_id" uuid,
	"external_author_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"severity" text DEFAULT 'medium' NOT NULL,
	"finding_type" text DEFAULT 'observation' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"framework" text,
	"control_ref" text,
	"recommendation" text,
	"due_date" date,
	"evidence_ref" text,
	"raised_by_id" uuid,
	"owner_id" uuid,
	"issue_id" uuid,
	"verified_by_id" uuid,
	"verified_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"external_user_id" uuid NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"permission_level" text DEFAULT 'read' NOT NULL,
	"granted_by" uuid,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"auditor_org_id" uuid,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"user_type" text DEFAULT 'auditor' NOT NULL,
	"title" text,
	"company" text,
	"phone" text,
	"status" text DEFAULT 'invited' NOT NULL,
	"access_expires_at" timestamp with time zone,
	"last_accessed_at" timestamp with time zone,
	"invite_token" text,
	"invite_sent_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "external_users_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "framework_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"check_id" uuid NOT NULL,
	"framework_id" uuid,
	"framework_name" text NOT NULL,
	"control_ref" text,
	"requirement" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" text NOT NULL,
	"severity" "alert_severity" DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"entity_type" "alert_entity_type",
	"entity_id" uuid,
	"status" text DEFAULT 'open' NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"snapshot_date" date NOT NULL,
	"org_trust_score" integer DEFAULT 0 NOT NULL,
	"vendor_trust_score" integer DEFAULT 0 NOT NULL,
	"risk_posture_score" integer DEFAULT 0 NOT NULL,
	"control_health_score" integer DEFAULT 0 NOT NULL,
	"audit_readiness_score" integer DEFAULT 0 NOT NULL,
	"compliance_coverage_score" integer DEFAULT 0 NOT NULL,
	"total_vendors" integer DEFAULT 0 NOT NULL,
	"scored_vendors" integer DEFAULT 0 NOT NULL,
	"active_risks" integer DEFAULT 0 NOT NULL,
	"critical_risks" integer DEFAULT 0 NOT NULL,
	"open_findings" integer DEFAULT 0 NOT NULL,
	"avg_control_health" integer DEFAULT 0 NOT NULL,
	"avg_framework_readiness" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "graph_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"source_node_id" uuid NOT NULL,
	"target_node_id" uuid NOT NULL,
	"relationship_type" "graph_relationship_type" NOT NULL,
	"strength" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "graph_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" "graph_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"name" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"encrypted_data" text NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_type" "integration_event_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"severity" text DEFAULT 'medium' NOT NULL,
	"source_ref" text,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"entity_type" text,
	"entity_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"registry_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" "integration_connector_status" DEFAULT 'disconnected' NOT NULL,
	"sync_frequency" "integration_sync_frequency" DEFAULT 'daily' NOT NULL,
	"last_sync_at" timestamp with time zone,
	"next_sync_at" timestamp with time zone,
	"connected_at" timestamp with time zone,
	"connected_by" uuid,
	"error_message" text,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"total_synced" integer DEFAULT 0 NOT NULL,
	"total_evidence" integer DEFAULT 0 NOT NULL,
	"total_risks" integer DEFAULT 0 NOT NULL,
	"total_events" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"sync_id" uuid,
	"level" text DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"source_field" text NOT NULL,
	"target_type" "integration_mapping_target" NOT NULL,
	"target_id" uuid,
	"mapping_rule" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" "integration_category" NOT NULL,
	"provider" text NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"status" "integration_connector_status" DEFAULT 'available' NOT NULL,
	"auth_type" "integration_auth_type" DEFAULT 'api_key' NOT NULL,
	"icon" text,
	"description" text,
	"documentation_url" text,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"auth_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_phase1" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integration_registry_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "integration_syncs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"status" "integration_sync_status" DEFAULT 'pending' NOT NULL,
	"sync_type" text DEFAULT 'incremental' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"records_fetched" integer DEFAULT 0 NOT NULL,
	"records_created" integer DEFAULT 0 NOT NULL,
	"records_updated" integer DEFAULT 0 NOT NULL,
	"records_failed" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"summary" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"instance_id" uuid,
	"name" text NOT NULL,
	"direction" "integration_webhook_direction" DEFAULT 'inbound' NOT NULL,
	"url" text,
	"secret_hash" text,
	"event_types" text[] DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_triggered" timestamp with time zone,
	"total_calls" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"plan_id" uuid,
	"invoice_number" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"payment_method" text DEFAULT 'bank_transfer' NOT NULL,
	"payment_reference" text,
	"billing_name" text,
	"billing_email" text,
	"billing_gstin" text,
	"notes" text,
	"pdf_url" text,
	"due_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "issue_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"author_id" uuid,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_escalations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"escalated_to" "escalation_level" DEFAULT 'manager' NOT NULL,
	"reason" text NOT NULL,
	"escalated_by" uuid,
	"acknowledged_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"business_justification" text NOT NULL,
	"approver_id" uuid,
	"approval_date" date,
	"expiry_date" date,
	"review_date" date,
	"status" "exception_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"changed_by" uuid,
	"field_changed" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"owner_id" uuid,
	"status" "issue_task_status" DEFAULT 'open' NOT NULL,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"completion_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"issue_type" "issue_type" DEFAULT 'custom' NOT NULL,
	"source_module" text,
	"source_entity_id" uuid,
	"severity" "issue_severity" DEFAULT 'medium' NOT NULL,
	"priority" "issue_priority" DEFAULT 'p3' NOT NULL,
	"status" "issue_status" DEFAULT 'open' NOT NULL,
	"owner_id" uuid,
	"assignee_id" uuid,
	"due_date" date,
	"resolved_date" date,
	"resolution_notes" text,
	"sla_days" integer DEFAULT 30 NOT NULL,
	"sla_breached" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "network_followers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_org_id" uuid NOT NULL,
	"following_org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "network_profile_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"viewed_org_id" uuid NOT NULL,
	"viewer_org_id" uuid,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obligation_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"obligation_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"relationship" text DEFAULT 'satisfies' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obligations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"regulation_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"requirement" text,
	"obligation_ref" text,
	"category" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"owner_id" uuid,
	"business_unit" text,
	"review_date" date,
	"due_date" date,
	"evidence_requirements" text,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_attestations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"policy_version" text,
	"acknowledged_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"due_date" date,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"control_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_frameworks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"framework_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"reviewer_id" uuid,
	"review_date" date NOT NULL,
	"outcome" text DEFAULT 'approved' NOT NULL,
	"notes" text,
	"next_review_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "privacy_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"scope" text,
	"owner_id" uuid,
	"risk_level" "privacy_risk_level" DEFAULT 'medium' NOT NULL,
	"status" "privacy_assessment_status" DEFAULT 'draft' NOT NULL,
	"purpose" text,
	"data_types" text,
	"risks" text,
	"mitigations" text,
	"controls" text,
	"residual_risk" text,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"review_date" timestamp with time zone,
	"ai_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "privacy_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"request_type" "privacy_request_type" NOT NULL,
	"subject_name" text NOT NULL,
	"subject_email" text NOT NULL,
	"status" "privacy_request_status" DEFAULT 'submitted' NOT NULL,
	"owner_id" uuid,
	"description" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "privacy_trust_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"inventory_score" integer DEFAULT 0 NOT NULL,
	"consent_score" integer DEFAULT 0 NOT NULL,
	"dsr_score" integer DEFAULT 0 NOT NULL,
	"retention_score" integer DEFAULT 0 NOT NULL,
	"risk_score" integer DEFAULT 0 NOT NULL,
	"controls_score" integer DEFAULT 0 NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulation_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regulation_id" uuid NOT NULL,
	"organization_id" uuid,
	"version" text NOT NULL,
	"summary" text,
	"changes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"effective_date" date,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"short_name" text,
	"authority" text,
	"country" text,
	"region" text,
	"industry" text,
	"category" text DEFAULT 'security' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"version" text,
	"effective_date" date,
	"review_date" date,
	"source_url" text,
	"description" text,
	"is_builtin" boolean DEFAULT false NOT NULL,
	"is_applicable" boolean DEFAULT true NOT NULL,
	"obligation_count" integer DEFAULT 0 NOT NULL,
	"compliance_score" integer,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"schedule" text DEFAULT 'daily',
	"last_run_at" timestamp with time zone,
	"total_runs" integer DEFAULT 0 NOT NULL,
	"changes_detected" integer DEFAULT 0 NOT NULL,
	"watchlist_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"regulation_id" uuid,
	"change_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"alert_type" text DEFAULT 'change_detected' NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"due_date" date,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"change_id" uuid,
	"regulation_id" uuid,
	"title" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"impact_level" text DEFAULT 'medium' NOT NULL,
	"summary" text,
	"ai_analysis" text,
	"affected_controls" integer DEFAULT 0 NOT NULL,
	"affected_policies" integer DEFAULT 0 NOT NULL,
	"affected_risks" integer DEFAULT 0 NOT NULL,
	"affected_vendors" integer DEFAULT 0 NOT NULL,
	"affected_contracts" integer DEFAULT 0 NOT NULL,
	"remediation_effort" text,
	"estimated_days" integer,
	"owner_id" uuid,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"regulation_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"change_type" text DEFAULT 'amendment' NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"source" text,
	"source_url" text,
	"published_date" date,
	"effective_date" date,
	"impact_score" integer,
	"affected_controls" integer DEFAULT 0 NOT NULL,
	"affected_policies" integer DEFAULT 0 NOT NULL,
	"ai_summary" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_impacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"entity_name" text NOT NULL,
	"impact_type" text DEFAULT 'update_required' NOT NULL,
	"impact_level" text DEFAULT 'medium' NOT NULL,
	"description" text,
	"action_required" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regulation_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"reviewer_id" uuid,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"outcome" text,
	"notes" text,
	"reviewed_at" timestamp with time zone,
	"next_review_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"url" text,
	"country" text,
	"authority" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_checked_at" timestamp with time zone,
	"is_builtin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"change_id" uuid,
	"assessment_id" uuid,
	"obligation_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"task_type" text DEFAULT 'review' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"owner_id" uuid,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"regulation_id" uuid,
	"source_id" uuid,
	"title" text NOT NULL,
	"summary" text,
	"content" text,
	"update_date" date,
	"published_at" timestamp with time zone,
	"source_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_builtin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_watchlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"watch_type" text DEFAULT 'regulation' NOT NULL,
	"criteria" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"alert_on_change" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retention_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"data_asset_id" uuid NOT NULL,
	"retention_policy_id" uuid,
	"event_type" text NOT NULL,
	"scheduled_date" timestamp with time zone NOT NULL,
	"actioned_at" timestamp with time zone,
	"actioned_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retention_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"data_category" "data_category" DEFAULT 'custom' NOT NULL,
	"retention_days" integer NOT NULL,
	"legal_basis" text,
	"action_on_expiry" text DEFAULT 'delete' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"risk_id" uuid NOT NULL,
	"control_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"risk_id" uuid NOT NULL,
	"evidence_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"risk_id" uuid NOT NULL,
	"finding_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_frameworks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"risk_id" uuid NOT NULL,
	"framework_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"risk_id" uuid NOT NULL,
	"policy_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"risk_id" uuid NOT NULL,
	"reviewer_id" uuid,
	"review_date" date NOT NULL,
	"outcome" text DEFAULT 'no_change' NOT NULL,
	"notes" text,
	"previous_status" "risk_status",
	"new_status" "risk_status",
	"previous_score" integer,
	"new_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_treatments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"risk_id" uuid NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"owner_id" uuid,
	"target_date" date,
	"status" "risk_treatment_status" DEFAULT 'open' NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"evidence" text,
	"completed_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"risk_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" "risk_category" DEFAULT 'operational' NOT NULL,
	"status" "risk_status" DEFAULT 'identified' NOT NULL,
	"owner_id" uuid,
	"source" "risk_source" DEFAULT 'manual' NOT NULL,
	"impact" integer DEFAULT 3 NOT NULL,
	"likelihood" integer DEFAULT 3 NOT NULL,
	"inherent_score" integer DEFAULT 9 NOT NULL,
	"residual_score" integer,
	"treatment_strategy" "risk_treatment_strategy" DEFAULT 'mitigate',
	"target_date" date,
	"identified_date" date,
	"last_reviewed_date" date,
	"next_review_date" date,
	"source_vendor_id" uuid,
	"source_finding_id" uuid,
	"source_gap_id" uuid,
	"ai_narrative" text,
	"ai_narrative_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tap_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"client_id" uuid,
	"name" text NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"permissions" jsonb DEFAULT '["read"]'::jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"rate_limit_override" integer,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tap_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"actor_id" uuid,
	"event_type" text NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tap_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"client_type" text DEFAULT 'application' NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"website" text,
	"contact_email" text,
	"allowed_ips" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tap_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'trust' NOT NULL,
	"tier" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"endpoints" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rate_limit_per_day" integer DEFAULT 100 NOT NULL,
	"rate_limit_per_month" integer DEFAULT 1000 NOT NULL,
	"documentation" text,
	"version" text DEFAULT 'v1' NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tap_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"client_id" uuid,
	"key_id" uuid,
	"limit_type" text DEFAULT 'per_day' NOT NULL,
	"limit_value" integer DEFAULT 100 NOT NULL,
	"current_count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tap_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tap_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"client_id" uuid,
	"key_id" uuid,
	"product_id" uuid,
	"endpoint" text NOT NULL,
	"method" text DEFAULT 'GET' NOT NULL,
	"status_code" integer,
	"latency_ms" integer,
	"request_size" integer,
	"response_size" integer,
	"ip_address" text,
	"user_agent" text,
	"error_message" text,
	"called_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tap_webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"webhook_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status_code" integer,
	"response_body" text,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"delivered_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tap_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"client_id" uuid,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"secret" text,
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"last_triggered_at" timestamp with time zone,
	"last_status_code" integer,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"score" integer,
	"completed_at" timestamp with time zone,
	"due_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"training_type" text DEFAULT 'security_awareness' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"due_date" date,
	"total_assigned" integer DEFAULT 0 NOT NULL,
	"total_completed" integer DEFAULT 0 NOT NULL,
	"completion_rate" integer DEFAULT 0 NOT NULL,
	"passing_score" integer DEFAULT 80 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"actor_id" uuid,
	"activity_type" "trust_activity_type" NOT NULL,
	"entity_id" uuid,
	"entity_type" text,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"trust_profile_id" uuid NOT NULL,
	"questionnaire_id" uuid NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completion_percent" integer DEFAULT 0 NOT NULL,
	"visibility" "trust_visibility" DEFAULT 'private' NOT NULL,
	"last_updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"trust_profile_id" uuid NOT NULL,
	"badge_type" "trust_badge_type" DEFAULT 'audt_verified' NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"issued_by" uuid,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"trust_profile_id" uuid NOT NULL,
	"doc_type" "trust_doc_type" DEFAULT 'custom' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_name" text,
	"file_size" bigint,
	"storage_path" text,
	"storage_bucket" text,
	"issued_date" date,
	"expiry_date" date,
	"issuer" text,
	"visibility" "trust_visibility" DEFAULT 'private' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_level" "trust_verification_level" DEFAULT 'self_attested',
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"tagline" text,
	"description" text,
	"industry" text,
	"company_size" text,
	"country" text,
	"website" text,
	"logo_url" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"visibility" "trust_visibility" DEFAULT 'private' NOT NULL,
	"trust_score" integer,
	"privacy_score" integer,
	"risk_level" text DEFAULT 'unknown',
	"profile_completeness" integer DEFAULT 0 NOT NULL,
	"certifications" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trust_profiles_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "trust_questionnaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'security' NOT NULL,
	"is_global" boolean DEFAULT false NOT NULL,
	"question_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_org_id" uuid NOT NULL,
	"target_org_id" uuid NOT NULL,
	"relationship_type" "trust_relationship_type" DEFAULT 'customer' NOT NULL,
	"status" "trust_relationship_status" DEFAULT 'pending' NOT NULL,
	"initiated_by" uuid,
	"accepted_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trust_document_id" uuid NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"recipient_org_id" uuid,
	"share_token" text,
	"expires_at" timestamp with time zone,
	"accessed_at" timestamp with time zone,
	"access_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trust_shares_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "trust_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trust_document_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"verification_level" "trust_verification_level" DEFAULT 'customer_verified' NOT NULL,
	"verified_by" uuid,
	"verifier_org_id" uuid,
	"verification_notes" text,
	"valid_until" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tva_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"certificate_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"verification_level" text DEFAULT 'level_1' NOT NULL,
	"readiness_score" integer,
	"trust_score_at_apply" integer,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"review_started_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"last_monitored_at" timestamp with time zone,
	"applicant_id" uuid NOT NULL,
	"assigned_reviewer_id" uuid,
	"decision_notes" text,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"suspension_reason" text,
	"revocation_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_trust_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"overall_score" integer NOT NULL,
	"evidence_score" integer NOT NULL,
	"compliance_score" integer NOT NULL,
	"risk_score" integer NOT NULL,
	"assessment_score" integer NOT NULL,
	"operational_score" integer NOT NULL,
	"freshness_score" integer NOT NULL,
	"trigger_event" text,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"verification_id" uuid NOT NULL,
	"assessor_id" uuid,
	"governance_score" integer,
	"risk_score" integer,
	"control_score" integer,
	"compliance_score" integer,
	"privacy_score" integer,
	"contract_score" integer,
	"vendor_score" integer,
	"ai_governance_score" integer,
	"overall_score" integer,
	"findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_summary" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"assessed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_auditors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"role" text DEFAULT 'trust_reviewer' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"specializations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"verification_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"badge_type" text DEFAULT 'audt_verified' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revocation_reason" text,
	"badge_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"issued_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"verification_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"certificate_number" text NOT NULL,
	"verification_level" text DEFAULT 'level_1' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"revocation_reason" text,
	"verification_hash" text NOT NULL,
	"public_url" text NOT NULL,
	"qr_data" text,
	"issued_by" uuid,
	"certificate_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verification_certificates_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint
CREATE TABLE "verification_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"verification_id" uuid NOT NULL,
	"decision" text NOT NULL,
	"decided_by" uuid,
	"rationale" text,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"effective_date" date,
	"review_date" date,
	"appeal_deadline" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"verification_id" uuid,
	"event_type" text NOT NULL,
	"actor_id" uuid,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"verification_id" uuid NOT NULL,
	"evidence_type" text DEFAULT 'policy' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"source_id" uuid,
	"source_table" text,
	"file_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewer_notes" text,
	"freshness_days" integer,
	"submitted_by" uuid,
	"reviewed_by" uuid,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"program_type" text DEFAULT 'custom' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"min_trust_score" integer DEFAULT 85 NOT NULL,
	"min_control_health" integer DEFAULT 80 NOT NULL,
	"min_evidence_coverage" integer DEFAULT 80 NOT NULL,
	"required_controls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"required_evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"required_assessments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"review_frequency" text DEFAULT 'annual' NOT NULL,
	"validity_months" integer DEFAULT 12 NOT NULL,
	"badge_color" text DEFAULT '#6366f1' NOT NULL,
	"badge_icon" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"certificate_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"industry" text,
	"country" text,
	"trust_score" integer,
	"verification_level" text DEFAULT 'level_1' NOT NULL,
	"program_name" text NOT NULL,
	"badge_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_renewals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"verification_id" uuid NOT NULL,
	"certificate_id" uuid,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"renewal_due_date" date NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"previous_cert_id" uuid,
	"initiated_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"verification_id" uuid NOT NULL,
	"review_type" text DEFAULT 'initial' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewer_id" uuid,
	"reviewer_notes" text,
	"checklist" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"score" integer,
	"recommendation" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"due_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"approver_id" uuid,
	"status" "workflow_approval_status" DEFAULT 'pending' NOT NULL,
	"decision_notes" text,
	"delegated_to" uuid,
	"decided_at" timestamp with time zone,
	"due_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"node_type" "workflow_node_type" NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"position_x" double precision DEFAULT 0 NOT NULL,
	"position_y" double precision DEFAULT 0 NOT NULL,
	"config" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_run_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"status" "workflow_run_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"output_data" jsonb,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"status" "workflow_run_status" DEFAULT 'running' NOT NULL,
	"trigger_type" "workflow_trigger_type" DEFAULT 'manual' NOT NULL,
	"trigger_entity_id" uuid,
	"trigger_entity_type" text,
	"current_node_id" uuid,
	"started_by" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"failed_reason" text,
	"context_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_transitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"from_node_id" uuid NOT NULL,
	"to_node_id" uuid NOT NULL,
	"label" text,
	"condition_expr" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"module" "workflow_module" DEFAULT 'custom' NOT NULL,
	"status" "workflow_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"template_category" text,
	"trigger_type" "workflow_trigger_type" DEFAULT 'manual' NOT NULL,
	"trigger_config" jsonb,
	"created_by" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workforce_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_id" uuid,
	"user_name" text,
	"user_email" text,
	"department" text,
	"checklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completed_steps" integer DEFAULT 0 NOT NULL,
	"total_steps" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "controls" ALTER COLUMN "framework_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "objective" text;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "control_type" "control_type";--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "frequency" "control_frequency";--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "automation_level" "automation_level" DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "health_score" integer;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "effectiveness_score" integer;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "next_review_date" date;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "last_tested" date;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "next_test_date" date;--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "next_review_date" date;--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "effective_date" date;--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "health_score" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "attestation_required" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "audience" text DEFAULT 'everyone';--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "change_summary" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "requested_plan" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "cancel_at_period_end" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "cancel_reason" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "trust_score" integer;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "trust_score_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "ai_trust_narrative" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "ai_trust_narrative_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "lifecycle_stage" "vendor_lifecycle_stage" DEFAULT 'inventory' NOT NULL;--> statement-breakpoint
ALTER TABLE "access_review_users" ADD CONSTRAINT "access_review_users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_review_users" ADD CONSTRAINT "access_review_users_review_id_access_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."access_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_review_users" ADD CONSTRAINT "access_review_users_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_review_users" ADD CONSTRAINT "access_review_users_reviewer_id_profiles_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_reviews" ADD CONSTRAINT "access_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_reviews" ADD CONSTRAINT "access_reviews_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_recommendation_id_agent_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."agent_recommendations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_approved_by_profiles_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_approvals" ADD CONSTRAINT "agent_approvals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_approvals" ADD CONSTRAINT "agent_approvals_action_id_agent_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."agent_actions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_approvals" ADD CONSTRAINT "agent_approvals_approver_id_profiles_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_events" ADD CONSTRAINT "agent_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_events" ADD CONSTRAINT "agent_events_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_memory" ADD CONSTRAINT "agent_memory_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_memory" ADD CONSTRAINT "agent_memory_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_memory" ADD CONSTRAINT "agent_memory_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_metrics" ADD CONSTRAINT "agent_metrics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_metrics" ADD CONSTRAINT "agent_metrics_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_observations" ADD CONSTRAINT "agent_observations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_observations" ADD CONSTRAINT "agent_observations_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_observations" ADD CONSTRAINT "agent_observations_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_orchestrations" ADD CONSTRAINT "agent_orchestrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_recommendations" ADD CONSTRAINT "agent_recommendations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_recommendations" ADD CONSTRAINT "agent_recommendations_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_recommendations" ADD CONSTRAINT "agent_recommendations_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_recommendations" ADD CONSTRAINT "agent_recommendations_observation_id_agent_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."agent_observations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_recommendations" ADD CONSTRAINT "agent_recommendations_actioned_by_profiles_id_fk" FOREIGN KEY ("actioned_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_triggered_by_profiles_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_schedules" ADD CONSTRAINT "agent_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_schedules" ADD CONSTRAINT "agent_schedules_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_assessments" ADD CONSTRAINT "ai_assessments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_assessments" ADD CONSTRAINT "ai_assessments_ai_system_id_ai_systems_id_fk" FOREIGN KEY ("ai_system_id") REFERENCES "public"."ai_systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_assessments" ADD CONSTRAINT "ai_assessments_assessor_id_profiles_id_fk" FOREIGN KEY ("assessor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_assessments" ADD CONSTRAINT "ai_assessments_approved_by_profiles_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_assessments" ADD CONSTRAINT "ai_assessments_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_compliance" ADD CONSTRAINT "ai_compliance_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_controls" ADD CONSTRAINT "ai_controls_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_controls" ADD CONSTRAINT "ai_controls_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_controls" ADD CONSTRAINT "ai_controls_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_incidents" ADD CONSTRAINT "ai_incidents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_incidents" ADD CONSTRAINT "ai_incidents_ai_system_id_ai_systems_id_fk" FOREIGN KEY ("ai_system_id") REFERENCES "public"."ai_systems"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_incidents" ADD CONSTRAINT "ai_incidents_reporter_id_profiles_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_incidents" ADD CONSTRAINT "ai_incidents_assigned_to_profiles_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_policies" ADD CONSTRAINT "ai_policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_policies" ADD CONSTRAINT "ai_policies_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_policies" ADD CONSTRAINT "ai_policies_approved_by_profiles_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_policies" ADD CONSTRAINT "ai_policies_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_risks" ADD CONSTRAINT "ai_risks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_risks" ADD CONSTRAINT "ai_risks_ai_system_id_ai_systems_id_fk" FOREIGN KEY ("ai_system_id") REFERENCES "public"."ai_systems"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_risks" ADD CONSTRAINT "ai_risks_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_risks" ADD CONSTRAINT "ai_risks_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_system_controls" ADD CONSTRAINT "ai_system_controls_ai_system_id_ai_systems_id_fk" FOREIGN KEY ("ai_system_id") REFERENCES "public"."ai_systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_system_controls" ADD CONSTRAINT "ai_system_controls_control_id_ai_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."ai_controls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_system_risks" ADD CONSTRAINT "ai_system_risks_ai_system_id_ai_systems_id_fk" FOREIGN KEY ("ai_system_id") REFERENCES "public"."ai_systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_system_risks" ADD CONSTRAINT "ai_system_risks_risk_id_ai_risks_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."ai_risks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_systems" ADD CONSTRAINT "ai_systems_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_systems" ADD CONSTRAINT "ai_systems_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_systems" ADD CONSTRAINT "ai_systems_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_trust_scores" ADD CONSTRAINT "ai_trust_scores_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_trust_scores" ADD CONSTRAINT "ai_trust_scores_ai_system_id_ai_systems_id_fk" FOREIGN KEY ("ai_system_id") REFERENCES "public"."ai_systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_vendors" ADD CONSTRAINT "ai_vendors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_vendors" ADD CONSTRAINT "ai_vendors_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_dashboards" ADD CONSTRAINT "analytics_dashboards_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_dashboards" ADD CONSTRAINT "analytics_dashboards_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_exports" ADD CONSTRAINT "analytics_exports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_exports" ADD CONSTRAINT "analytics_exports_report_id_analytics_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."analytics_reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_exports" ADD CONSTRAINT "analytics_exports_exported_by_profiles_id_fk" FOREIGN KEY ("exported_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_forecasts" ADD CONSTRAINT "analytics_forecasts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_kpis" ADD CONSTRAINT "analytics_kpis_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_reports" ADD CONSTRAINT "analytics_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_reports" ADD CONSTRAINT "analytics_reports_generated_by_profiles_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_schedules" ADD CONSTRAINT "analytics_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_schedules" ADD CONSTRAINT "analytics_schedules_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_subscriptions" ADD CONSTRAINT "analytics_subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_subscriptions" ADD CONSTRAINT "analytics_subscriptions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_subscriptions" ADD CONSTRAINT "analytics_subscriptions_schedule_id_analytics_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."analytics_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_widgets" ADD CONSTRAINT "analytics_widgets_dashboard_id_analytics_dashboards_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."analytics_dashboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_ai_systems" ADD CONSTRAINT "asset_ai_systems_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_ai_systems" ADD CONSTRAINT "asset_ai_systems_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_alerts" ADD CONSTRAINT "asset_alerts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_alerts" ADD CONSTRAINT "asset_alerts_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_alerts" ADD CONSTRAINT "asset_alerts_resolved_by_profiles_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_contracts" ADD CONSTRAINT "asset_contracts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_contracts" ADD CONSTRAINT "asset_contracts_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_controls" ADD CONSTRAINT "asset_controls_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_controls" ADD CONSTRAINT "asset_controls_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_controls" ADD CONSTRAINT "asset_controls_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_criticality_log" ADD CONSTRAINT "asset_criticality_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_criticality_log" ADD CONSTRAINT "asset_criticality_log_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_criticality_log" ADD CONSTRAINT "asset_criticality_log_changed_by_profiles_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_data_flows" ADD CONSTRAINT "asset_data_flows_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_data_flows" ADD CONSTRAINT "asset_data_flows_source_asset_id_assets_id_fk" FOREIGN KEY ("source_asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_data_flows" ADD CONSTRAINT "asset_data_flows_target_asset_id_assets_id_fk" FOREIGN KEY ("target_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_dependencies" ADD CONSTRAINT "asset_dependencies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_dependencies" ADD CONSTRAINT "asset_dependencies_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_dependencies" ADD CONSTRAINT "asset_dependencies_depends_on_id_assets_id_fk" FOREIGN KEY ("depends_on_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_incidents" ADD CONSTRAINT "asset_incidents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_incidents" ADD CONSTRAINT "asset_incidents_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_incidents" ADD CONSTRAINT "asset_incidents_reported_by_profiles_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_owners" ADD CONSTRAINT "asset_owners_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_owners" ADD CONSTRAINT "asset_owners_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_owners" ADD CONSTRAINT "asset_owners_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_owners" ADD CONSTRAINT "asset_owners_assigned_by_profiles_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_regulations" ADD CONSTRAINT "asset_regulations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_regulations" ADD CONSTRAINT "asset_regulations_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_regulations" ADD CONSTRAINT "asset_regulations_regulation_id_regulations_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."regulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_source_asset_id_assets_id_fk" FOREIGN KEY ("source_asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_target_asset_id_assets_id_fk" FOREIGN KEY ("target_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_reviews" ADD CONSTRAINT "asset_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_reviews" ADD CONSTRAINT "asset_reviews_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_reviews" ADD CONSTRAINT "asset_reviews_reviewer_id_profiles_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_risks" ADD CONSTRAINT "asset_risks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_risks" ADD CONSTRAINT "asset_risks_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_risks" ADD CONSTRAINT "asset_risks_risk_id_risks_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_scores" ADD CONSTRAINT "asset_scores_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_scores" ADD CONSTRAINT "asset_scores_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_snapshots" ADD CONSTRAINT "asset_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_tags" ADD CONSTRAINT "asset_tags_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_tags" ADD CONSTRAINT "asset_tags_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_types" ADD CONSTRAINT "asset_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_vendors" ADD CONSTRAINT "asset_vendors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_vendors" ADD CONSTRAINT "asset_vendors_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_vendors" ADD CONSTRAINT "asset_vendors_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attestation_responses" ADD CONSTRAINT "attestation_responses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attestation_responses" ADD CONSTRAINT "attestation_responses_attestation_id_attestations_id_fk" FOREIGN KEY ("attestation_id") REFERENCES "public"."attestations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attestation_responses" ADD CONSTRAINT "attestation_responses_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_reviews" ADD CONSTRAINT "audit_reviews_room_id_audit_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."audit_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_reviews" ADD CONSTRAINT "audit_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_reviews" ADD CONSTRAINT "audit_reviews_reviewer_id_external_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."external_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_room_activities" ADD CONSTRAINT "audit_room_activities_room_id_audit_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."audit_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_room_activities" ADD CONSTRAINT "audit_room_activities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_room_activities" ADD CONSTRAINT "audit_room_activities_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_room_activities" ADD CONSTRAINT "audit_room_activities_external_user_id_external_users_id_fk" FOREIGN KEY ("external_user_id") REFERENCES "public"."external_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_room_documents" ADD CONSTRAINT "audit_room_documents_room_id_audit_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."audit_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_room_documents" ADD CONSTRAINT "audit_room_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_room_documents" ADD CONSTRAINT "audit_room_documents_uploaded_by_profiles_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_rooms" ADD CONSTRAINT "audit_rooms_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_rooms" ADD CONSTRAINT "audit_rooms_auditor_org_id_auditor_organizations_id_fk" FOREIGN KEY ("auditor_org_id") REFERENCES "public"."auditor_organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_rooms" ADD CONSTRAINT "audit_rooms_lead_auditor_id_external_users_id_fk" FOREIGN KEY ("lead_auditor_id") REFERENCES "public"."external_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_rooms" ADD CONSTRAINT "audit_rooms_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_rooms" ADD CONSTRAINT "audit_rooms_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditor_organizations" ADD CONSTRAINT "auditor_organizations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditor_organizations" ADD CONSTRAINT "auditor_organizations_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benchmark_scores" ADD CONSTRAINT "benchmark_scores_snapshot_id_benchmark_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."benchmark_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benchmark_scores" ADD CONSTRAINT "benchmark_scores_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benchmark_snapshots" ADD CONSTRAINT "benchmark_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benchmark_trends" ADD CONSTRAINT "benchmark_trends_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_evidence" ADD CONSTRAINT "compliance_evidence_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_evidence" ADD CONSTRAINT "compliance_evidence_check_run_id_compliance_check_runs_id_fk" FOREIGN KEY ("check_run_id") REFERENCES "public"."compliance_check_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_check_runs" ADD CONSTRAINT "compliance_check_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_check_runs" ADD CONSTRAINT "compliance_check_runs_check_id_compliance_checks_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."compliance_checks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_check_runs" ADD CONSTRAINT "compliance_check_runs_run_by_profiles_id_fk" FOREIGN KEY ("run_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_exceptions" ADD CONSTRAINT "compliance_exceptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_exceptions" ADD CONSTRAINT "compliance_exceptions_check_id_compliance_checks_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."compliance_checks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_exceptions" ADD CONSTRAINT "compliance_exceptions_approved_by_profiles_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_exceptions" ADD CONSTRAINT "compliance_exceptions_requested_by_profiles_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_health_scores" ADD CONSTRAINT "compliance_health_scores_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_signals" ADD CONSTRAINT "compliance_signals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_signals" ADD CONSTRAINT "compliance_signals_resolved_by_profiles_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_data_asset_id_data_assets_id_fk" FOREIGN KEY ("data_asset_id") REFERENCES "public"."data_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "continuous_readiness" ADD CONSTRAINT "continuous_readiness_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "continuous_readiness" ADD CONSTRAINT "continuous_readiness_framework_id_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_clauses" ADD CONSTRAINT "contract_clauses_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_controls" ADD CONSTRAINT "contract_controls_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_controls" ADD CONSTRAINT "contract_controls_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_controls" ADD CONSTRAINT "contract_controls_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_obligations" ADD CONSTRAINT "contract_obligations_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_obligations" ADD CONSTRAINT "contract_obligations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_obligations" ADD CONSTRAINT "contract_obligations_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_policies" ADD CONSTRAINT "contract_policies_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_policies" ADD CONSTRAINT "contract_policies_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_policies" ADD CONSTRAINT "contract_policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_risks" ADD CONSTRAINT "contract_risks_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_risks" ADD CONSTRAINT "contract_risks_risk_id_risks_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_risks" ADD CONSTRAINT "contract_risks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_frameworks" ADD CONSTRAINT "control_frameworks_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_frameworks" ADD CONSTRAINT "control_frameworks_framework_id_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_tests" ADD CONSTRAINT "control_tests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_tests" ADD CONSTRAINT "control_tests_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_tests" ADD CONSTRAINT "control_tests_tester_id_profiles_id_fk" FOREIGN KEY ("tester_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_validations" ADD CONSTRAINT "control_validations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_validations" ADD CONSTRAINT "control_validations_check_id_compliance_checks_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."compliance_checks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_validations" ADD CONSTRAINT "control_validations_check_run_id_compliance_check_runs_id_fk" FOREIGN KEY ("check_run_id") REFERENCES "public"."compliance_check_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_validations" ADD CONSTRAINT "control_validations_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_vendors" ADD CONSTRAINT "control_vendors_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_vendors" ADD CONSTRAINT "control_vendors_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_assets" ADD CONSTRAINT "data_assets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_assets" ADD CONSTRAINT "data_assets_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_transfers" ADD CONSTRAINT "data_transfers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_transfers" ADD CONSTRAINT "data_transfers_data_asset_id_data_assets_id_fk" FOREIGN KEY ("data_asset_id") REFERENCES "public"."data_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_transfers" ADD CONSTRAINT "data_transfers_approved_by_profiles_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_requests" ADD CONSTRAINT "evidence_requests_room_id_audit_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."audit_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_requests" ADD CONSTRAINT "evidence_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_requests" ADD CONSTRAINT "evidence_requests_requested_by_id_external_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."external_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_requests" ADD CONSTRAINT "evidence_requests_assigned_owner_id_profiles_id_fk" FOREIGN KEY ("assigned_owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_requests" ADD CONSTRAINT "evidence_requests_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_responses" ADD CONSTRAINT "evidence_responses_request_id_evidence_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."evidence_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_responses" ADD CONSTRAINT "evidence_responses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_responses" ADD CONSTRAINT "evidence_responses_uploaded_by_profiles_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_assessments" ADD CONSTRAINT "external_assessments_room_id_audit_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."audit_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_assessments" ADD CONSTRAINT "external_assessments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_assessments" ADD CONSTRAINT "external_assessments_lead_assessor_id_external_users_id_fk" FOREIGN KEY ("lead_assessor_id") REFERENCES "public"."external_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_assessments" ADD CONSTRAINT "external_assessments_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_comments" ADD CONSTRAINT "external_comments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_comments" ADD CONSTRAINT "external_comments_room_id_audit_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."audit_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_comments" ADD CONSTRAINT "external_comments_resolved_by_profiles_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_comments" ADD CONSTRAINT "external_comments_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_comments" ADD CONSTRAINT "external_comments_external_author_id_external_users_id_fk" FOREIGN KEY ("external_author_id") REFERENCES "public"."external_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_findings" ADD CONSTRAINT "external_findings_room_id_audit_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."audit_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_findings" ADD CONSTRAINT "external_findings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_findings" ADD CONSTRAINT "external_findings_raised_by_id_external_users_id_fk" FOREIGN KEY ("raised_by_id") REFERENCES "public"."external_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_findings" ADD CONSTRAINT "external_findings_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_findings" ADD CONSTRAINT "external_findings_verified_by_id_external_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."external_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_findings" ADD CONSTRAINT "external_findings_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_permissions" ADD CONSTRAINT "external_permissions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_permissions" ADD CONSTRAINT "external_permissions_external_user_id_external_users_id_fk" FOREIGN KEY ("external_user_id") REFERENCES "public"."external_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_permissions" ADD CONSTRAINT "external_permissions_granted_by_profiles_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_users" ADD CONSTRAINT "external_users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_users" ADD CONSTRAINT "external_users_auditor_org_id_auditor_organizations_id_fk" FOREIGN KEY ("auditor_org_id") REFERENCES "public"."auditor_organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_users" ADD CONSTRAINT "external_users_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "framework_mappings" ADD CONSTRAINT "framework_mappings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "framework_mappings" ADD CONSTRAINT "framework_mappings_check_id_compliance_checks_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."compliance_checks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "framework_mappings" ADD CONSTRAINT "framework_mappings_framework_id_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_alerts" ADD CONSTRAINT "governance_alerts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_alerts" ADD CONSTRAINT "governance_alerts_resolved_by_profiles_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_snapshots" ADD CONSTRAINT "governance_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_source_node_id_graph_nodes_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "public"."graph_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_target_node_id_graph_nodes_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "public"."graph_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graph_nodes" ADD CONSTRAINT "graph_nodes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_credentials" ADD CONSTRAINT "integration_credentials_instance_id_integration_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."integration_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_credentials" ADD CONSTRAINT "integration_credentials_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_events" ADD CONSTRAINT "integration_events_instance_id_integration_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."integration_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_events" ADD CONSTRAINT "integration_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_instances" ADD CONSTRAINT "integration_instances_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_instances" ADD CONSTRAINT "integration_instances_registry_id_integration_registry_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."integration_registry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_instances" ADD CONSTRAINT "integration_instances_connected_by_profiles_id_fk" FOREIGN KEY ("connected_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_instance_id_integration_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."integration_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_sync_id_integration_syncs_id_fk" FOREIGN KEY ("sync_id") REFERENCES "public"."integration_syncs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_mappings" ADD CONSTRAINT "integration_mappings_instance_id_integration_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."integration_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_mappings" ADD CONSTRAINT "integration_mappings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_mappings" ADD CONSTRAINT "integration_mappings_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_syncs" ADD CONSTRAINT "integration_syncs_instance_id_integration_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."integration_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_syncs" ADD CONSTRAINT "integration_syncs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_webhooks" ADD CONSTRAINT "integration_webhooks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_webhooks" ADD CONSTRAINT "integration_webhooks_instance_id_integration_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."integration_instances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_webhooks" ADD CONSTRAINT "integration_webhooks_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_plan_id_billing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."billing_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_comments" ADD CONSTRAINT "issue_comments_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_comments" ADD CONSTRAINT "issue_comments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_comments" ADD CONSTRAINT "issue_comments_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_escalations" ADD CONSTRAINT "issue_escalations_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_escalations" ADD CONSTRAINT "issue_escalations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_escalations" ADD CONSTRAINT "issue_escalations_escalated_by_profiles_id_fk" FOREIGN KEY ("escalated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_exceptions" ADD CONSTRAINT "issue_exceptions_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_exceptions" ADD CONSTRAINT "issue_exceptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_exceptions" ADD CONSTRAINT "issue_exceptions_approver_id_profiles_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_exceptions" ADD CONSTRAINT "issue_exceptions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_history" ADD CONSTRAINT "issue_history_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_history" ADD CONSTRAINT "issue_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_history" ADD CONSTRAINT "issue_history_changed_by_profiles_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_tasks" ADD CONSTRAINT "issue_tasks_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_tasks" ADD CONSTRAINT "issue_tasks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_tasks" ADD CONSTRAINT "issue_tasks_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_assignee_id_profiles_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_followers" ADD CONSTRAINT "network_followers_follower_org_id_organizations_id_fk" FOREIGN KEY ("follower_org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_followers" ADD CONSTRAINT "network_followers_following_org_id_organizations_id_fk" FOREIGN KEY ("following_org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_profile_views" ADD CONSTRAINT "network_profile_views_viewed_org_id_organizations_id_fk" FOREIGN KEY ("viewed_org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_profile_views" ADD CONSTRAINT "network_profile_views_viewer_org_id_organizations_id_fk" FOREIGN KEY ("viewer_org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligation_mappings" ADD CONSTRAINT "obligation_mappings_obligation_id_obligations_id_fk" FOREIGN KEY ("obligation_id") REFERENCES "public"."obligations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligation_mappings" ADD CONSTRAINT "obligation_mappings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_regulation_id_regulations_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."regulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_attestations" ADD CONSTRAINT "policy_attestations_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_attestations" ADD CONSTRAINT "policy_attestations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_attestations" ADD CONSTRAINT "policy_attestations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_controls" ADD CONSTRAINT "policy_controls_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_controls" ADD CONSTRAINT "policy_controls_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_controls" ADD CONSTRAINT "policy_controls_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_frameworks" ADD CONSTRAINT "policy_frameworks_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_frameworks" ADD CONSTRAINT "policy_frameworks_framework_id_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_frameworks" ADD CONSTRAINT "policy_frameworks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_reviews" ADD CONSTRAINT "policy_reviews_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_reviews" ADD CONSTRAINT "policy_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_reviews" ADD CONSTRAINT "policy_reviews_reviewer_id_profiles_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_assessments" ADD CONSTRAINT "privacy_assessments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_assessments" ADD CONSTRAINT "privacy_assessments_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_assessments" ADD CONSTRAINT "privacy_assessments_approved_by_profiles_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_trust_scores" ADD CONSTRAINT "privacy_trust_scores_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulation_versions" ADD CONSTRAINT "regulation_versions_regulation_id_regulations_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."regulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulation_versions" ADD CONSTRAINT "regulation_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulations" ADD CONSTRAINT "regulations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulations" ADD CONSTRAINT "regulations_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_agents" ADD CONSTRAINT "regulatory_agents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_agents" ADD CONSTRAINT "regulatory_agents_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_alerts" ADD CONSTRAINT "regulatory_alerts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_alerts" ADD CONSTRAINT "regulatory_alerts_regulation_id_regulations_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."regulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_alerts" ADD CONSTRAINT "regulatory_alerts_change_id_regulatory_changes_id_fk" FOREIGN KEY ("change_id") REFERENCES "public"."regulatory_changes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_alerts" ADD CONSTRAINT "regulatory_alerts_resolved_by_profiles_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_assessments" ADD CONSTRAINT "regulatory_assessments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_assessments" ADD CONSTRAINT "regulatory_assessments_change_id_regulatory_changes_id_fk" FOREIGN KEY ("change_id") REFERENCES "public"."regulatory_changes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_assessments" ADD CONSTRAINT "regulatory_assessments_regulation_id_regulations_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."regulations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_assessments" ADD CONSTRAINT "regulatory_assessments_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_assessments" ADD CONSTRAINT "regulatory_assessments_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_changes" ADD CONSTRAINT "regulatory_changes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_changes" ADD CONSTRAINT "regulatory_changes_regulation_id_regulations_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."regulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_changes" ADD CONSTRAINT "regulatory_changes_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_impacts" ADD CONSTRAINT "regulatory_impacts_assessment_id_regulatory_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."regulatory_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_impacts" ADD CONSTRAINT "regulatory_impacts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_reviews" ADD CONSTRAINT "regulatory_reviews_regulation_id_regulations_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."regulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_reviews" ADD CONSTRAINT "regulatory_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_reviews" ADD CONSTRAINT "regulatory_reviews_reviewer_id_profiles_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_sources" ADD CONSTRAINT "regulatory_sources_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_tasks" ADD CONSTRAINT "regulatory_tasks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_tasks" ADD CONSTRAINT "regulatory_tasks_change_id_regulatory_changes_id_fk" FOREIGN KEY ("change_id") REFERENCES "public"."regulatory_changes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_tasks" ADD CONSTRAINT "regulatory_tasks_assessment_id_regulatory_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."regulatory_assessments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_tasks" ADD CONSTRAINT "regulatory_tasks_obligation_id_obligations_id_fk" FOREIGN KEY ("obligation_id") REFERENCES "public"."obligations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_tasks" ADD CONSTRAINT "regulatory_tasks_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_tasks" ADD CONSTRAINT "regulatory_tasks_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_updates" ADD CONSTRAINT "regulatory_updates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_updates" ADD CONSTRAINT "regulatory_updates_regulation_id_regulations_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."regulations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_updates" ADD CONSTRAINT "regulatory_updates_source_id_regulatory_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."regulatory_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_watchlists" ADD CONSTRAINT "regulatory_watchlists_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_watchlists" ADD CONSTRAINT "regulatory_watchlists_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retention_events" ADD CONSTRAINT "retention_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retention_events" ADD CONSTRAINT "retention_events_data_asset_id_data_assets_id_fk" FOREIGN KEY ("data_asset_id") REFERENCES "public"."data_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retention_events" ADD CONSTRAINT "retention_events_retention_policy_id_retention_policies_id_fk" FOREIGN KEY ("retention_policy_id") REFERENCES "public"."retention_policies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retention_events" ADD CONSTRAINT "retention_events_actioned_by_profiles_id_fk" FOREIGN KEY ("actioned_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retention_policies" ADD CONSTRAINT "retention_policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_controls" ADD CONSTRAINT "risk_controls_risk_id_risks_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_controls" ADD CONSTRAINT "risk_controls_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_evidence" ADD CONSTRAINT "risk_evidence_risk_id_risks_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_evidence" ADD CONSTRAINT "risk_evidence_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_findings" ADD CONSTRAINT "risk_findings_risk_id_risks_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_findings" ADD CONSTRAINT "risk_findings_finding_id_audit_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."audit_findings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_frameworks" ADD CONSTRAINT "risk_frameworks_risk_id_risks_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_frameworks" ADD CONSTRAINT "risk_frameworks_framework_id_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_policies" ADD CONSTRAINT "risk_policies_risk_id_risks_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_policies" ADD CONSTRAINT "risk_policies_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_reviews" ADD CONSTRAINT "risk_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_reviews" ADD CONSTRAINT "risk_reviews_risk_id_risks_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_reviews" ADD CONSTRAINT "risk_reviews_reviewer_id_profiles_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_treatments" ADD CONSTRAINT "risk_treatments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_treatments" ADD CONSTRAINT "risk_treatments_risk_id_risks_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_treatments" ADD CONSTRAINT "risk_treatments_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_treatments" ADD CONSTRAINT "risk_treatments_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_vendors" ADD CONSTRAINT "risk_vendors_risk_id_risks_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_vendors" ADD CONSTRAINT "risk_vendors_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risks" ADD CONSTRAINT "risks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risks" ADD CONSTRAINT "risks_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risks" ADD CONSTRAINT "risks_source_vendor_id_vendors_id_fk" FOREIGN KEY ("source_vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risks" ADD CONSTRAINT "risks_source_finding_id_audit_findings_id_fk" FOREIGN KEY ("source_finding_id") REFERENCES "public"."audit_findings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risks" ADD CONSTRAINT "risks_source_gap_id_gap_analysis_id_fk" FOREIGN KEY ("source_gap_id") REFERENCES "public"."gap_analysis"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risks" ADD CONSTRAINT "risks_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_api_keys" ADD CONSTRAINT "tap_api_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_api_keys" ADD CONSTRAINT "tap_api_keys_client_id_tap_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."tap_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_api_keys" ADD CONSTRAINT "tap_api_keys_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_audit_events" ADD CONSTRAINT "tap_audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_audit_events" ADD CONSTRAINT "tap_audit_events_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_clients" ADD CONSTRAINT "tap_clients_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_clients" ADD CONSTRAINT "tap_clients_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_rate_limits" ADD CONSTRAINT "tap_rate_limits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_rate_limits" ADD CONSTRAINT "tap_rate_limits_client_id_tap_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."tap_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_rate_limits" ADD CONSTRAINT "tap_rate_limits_key_id_tap_api_keys_id_fk" FOREIGN KEY ("key_id") REFERENCES "public"."tap_api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_subscriptions" ADD CONSTRAINT "tap_subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_subscriptions" ADD CONSTRAINT "tap_subscriptions_client_id_tap_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."tap_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_subscriptions" ADD CONSTRAINT "tap_subscriptions_product_id_tap_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."tap_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_subscriptions" ADD CONSTRAINT "tap_subscriptions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_usage" ADD CONSTRAINT "tap_usage_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_usage" ADD CONSTRAINT "tap_usage_client_id_tap_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."tap_clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_usage" ADD CONSTRAINT "tap_usage_key_id_tap_api_keys_id_fk" FOREIGN KEY ("key_id") REFERENCES "public"."tap_api_keys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_usage" ADD CONSTRAINT "tap_usage_product_id_tap_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."tap_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_webhook_deliveries" ADD CONSTRAINT "tap_webhook_deliveries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_webhook_deliveries" ADD CONSTRAINT "tap_webhook_deliveries_webhook_id_tap_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."tap_webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_webhooks" ADD CONSTRAINT "tap_webhooks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_webhooks" ADD CONSTRAINT "tap_webhooks_client_id_tap_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."tap_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_webhooks" ADD CONSTRAINT "tap_webhooks_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_campaign_id_training_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."training_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_campaigns" ADD CONSTRAINT "training_campaigns_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_campaigns" ADD CONSTRAINT "training_campaigns_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_activity" ADD CONSTRAINT "trust_activity_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_activity" ADD CONSTRAINT "trust_activity_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_answers" ADD CONSTRAINT "trust_answers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_answers" ADD CONSTRAINT "trust_answers_trust_profile_id_trust_profiles_id_fk" FOREIGN KEY ("trust_profile_id") REFERENCES "public"."trust_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_answers" ADD CONSTRAINT "trust_answers_questionnaire_id_trust_questionnaires_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."trust_questionnaires"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_answers" ADD CONSTRAINT "trust_answers_last_updated_by_profiles_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_badges" ADD CONSTRAINT "trust_badges_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_badges" ADD CONSTRAINT "trust_badges_trust_profile_id_trust_profiles_id_fk" FOREIGN KEY ("trust_profile_id") REFERENCES "public"."trust_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_badges" ADD CONSTRAINT "trust_badges_issued_by_profiles_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_documents" ADD CONSTRAINT "trust_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_documents" ADD CONSTRAINT "trust_documents_trust_profile_id_trust_profiles_id_fk" FOREIGN KEY ("trust_profile_id") REFERENCES "public"."trust_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_documents" ADD CONSTRAINT "trust_documents_verified_by_profiles_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_documents" ADD CONSTRAINT "trust_documents_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_profiles" ADD CONSTRAINT "trust_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_questionnaires" ADD CONSTRAINT "trust_questionnaires_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_questionnaires" ADD CONSTRAINT "trust_questionnaires_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_relationships" ADD CONSTRAINT "trust_relationships_requester_org_id_organizations_id_fk" FOREIGN KEY ("requester_org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_relationships" ADD CONSTRAINT "trust_relationships_target_org_id_organizations_id_fk" FOREIGN KEY ("target_org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_relationships" ADD CONSTRAINT "trust_relationships_initiated_by_profiles_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_relationships" ADD CONSTRAINT "trust_relationships_accepted_by_profiles_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_shares" ADD CONSTRAINT "trust_shares_trust_document_id_trust_documents_id_fk" FOREIGN KEY ("trust_document_id") REFERENCES "public"."trust_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_shares" ADD CONSTRAINT "trust_shares_owner_org_id_organizations_id_fk" FOREIGN KEY ("owner_org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_shares" ADD CONSTRAINT "trust_shares_recipient_org_id_organizations_id_fk" FOREIGN KEY ("recipient_org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_shares" ADD CONSTRAINT "trust_shares_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_verifications" ADD CONSTRAINT "trust_verifications_trust_document_id_trust_documents_id_fk" FOREIGN KEY ("trust_document_id") REFERENCES "public"."trust_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_verifications" ADD CONSTRAINT "trust_verifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_verifications" ADD CONSTRAINT "trust_verifications_verified_by_profiles_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_verifications" ADD CONSTRAINT "trust_verifications_verifier_org_id_organizations_id_fk" FOREIGN KEY ("verifier_org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tva_verifications" ADD CONSTRAINT "tva_verifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tva_verifications" ADD CONSTRAINT "tva_verifications_program_id_verification_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."verification_programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tva_verifications" ADD CONSTRAINT "tva_verifications_applicant_id_profiles_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tva_verifications" ADD CONSTRAINT "tva_verifications_assigned_reviewer_id_profiles_id_fk" FOREIGN KEY ("assigned_reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_trust_history" ADD CONSTRAINT "vendor_trust_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_trust_history" ADD CONSTRAINT "vendor_trust_history_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_assessments" ADD CONSTRAINT "verification_assessments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_assessments" ADD CONSTRAINT "verification_assessments_verification_id_tva_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."tva_verifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_assessments" ADD CONSTRAINT "verification_assessments_assessor_id_profiles_id_fk" FOREIGN KEY ("assessor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_auditors" ADD CONSTRAINT "verification_auditors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_auditors" ADD CONSTRAINT "verification_auditors_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_badges" ADD CONSTRAINT "verification_badges_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_badges" ADD CONSTRAINT "verification_badges_verification_id_tva_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."tva_verifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_badges" ADD CONSTRAINT "verification_badges_program_id_verification_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."verification_programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_badges" ADD CONSTRAINT "verification_badges_issued_by_profiles_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_certificates" ADD CONSTRAINT "verification_certificates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_certificates" ADD CONSTRAINT "verification_certificates_verification_id_tva_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."tva_verifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_certificates" ADD CONSTRAINT "verification_certificates_program_id_verification_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."verification_programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_certificates" ADD CONSTRAINT "verification_certificates_issued_by_profiles_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_decisions" ADD CONSTRAINT "verification_decisions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_decisions" ADD CONSTRAINT "verification_decisions_verification_id_tva_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."tva_verifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_decisions" ADD CONSTRAINT "verification_decisions_decided_by_profiles_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_events" ADD CONSTRAINT "verification_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_events" ADD CONSTRAINT "verification_events_verification_id_tva_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."tva_verifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_events" ADD CONSTRAINT "verification_events_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_evidence" ADD CONSTRAINT "verification_evidence_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_evidence" ADD CONSTRAINT "verification_evidence_verification_id_tva_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."tva_verifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_evidence" ADD CONSTRAINT "verification_evidence_submitted_by_profiles_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_evidence" ADD CONSTRAINT "verification_evidence_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_programs" ADD CONSTRAINT "verification_programs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_programs" ADD CONSTRAINT "verification_programs_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_registry" ADD CONSTRAINT "verification_registry_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_registry" ADD CONSTRAINT "verification_registry_certificate_id_verification_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."verification_certificates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_renewals" ADD CONSTRAINT "verification_renewals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_renewals" ADD CONSTRAINT "verification_renewals_verification_id_tva_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."tva_verifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_renewals" ADD CONSTRAINT "verification_renewals_certificate_id_verification_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."verification_certificates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_renewals" ADD CONSTRAINT "verification_renewals_previous_cert_id_verification_certificates_id_fk" FOREIGN KEY ("previous_cert_id") REFERENCES "public"."verification_certificates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_renewals" ADD CONSTRAINT "verification_renewals_initiated_by_profiles_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_reviews" ADD CONSTRAINT "verification_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_reviews" ADD CONSTRAINT "verification_reviews_verification_id_tva_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."tva_verifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_reviews" ADD CONSTRAINT "verification_reviews_reviewer_id_profiles_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_approvals" ADD CONSTRAINT "workflow_approvals_run_id_workflow_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."workflow_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_approvals" ADD CONSTRAINT "workflow_approvals_node_id_workflow_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."workflow_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_approvals" ADD CONSTRAINT "workflow_approvals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_approvals" ADD CONSTRAINT "workflow_approvals_approver_id_profiles_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_approvals" ADD CONSTRAINT "workflow_approvals_delegated_to_profiles_id_fk" FOREIGN KEY ("delegated_to") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_nodes" ADD CONSTRAINT "workflow_nodes_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_nodes" ADD CONSTRAINT "workflow_nodes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_run_steps" ADD CONSTRAINT "workflow_run_steps_run_id_workflow_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."workflow_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_run_steps" ADD CONSTRAINT "workflow_run_steps_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_run_steps" ADD CONSTRAINT "workflow_run_steps_node_id_workflow_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."workflow_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_current_node_id_workflow_nodes_id_fk" FOREIGN KEY ("current_node_id") REFERENCES "public"."workflow_nodes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_started_by_profiles_id_fk" FOREIGN KEY ("started_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_from_node_id_workflow_nodes_id_fk" FOREIGN KEY ("from_node_id") REFERENCES "public"."workflow_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_to_node_id_workflow_nodes_id_fk" FOREIGN KEY ("to_node_id") REFERENCES "public"."workflow_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workforce_events" ADD CONSTRAINT "workforce_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workforce_events" ADD CONSTRAINT "workforce_events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workforce_events" ADD CONSTRAINT "workforce_events_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "aru_org_idx" ON "access_review_users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "aru_review_idx" ON "access_review_users" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "ar_org_idx" ON "access_reviews" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ar_status_idx" ON "access_reviews" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_agent_actions_org" ON "agent_actions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_agent_actions_agent" ON "agent_actions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_agent_actions_status" ON "agent_actions" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_agent_approvals_org" ON "agent_approvals" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_agent_approvals_action" ON "agent_approvals" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "idx_agent_approvals_status" ON "agent_approvals" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_agent_conv_org" ON "agent_conversations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_agent_conv_user" ON "agent_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_agent_conv_agent" ON "agent_conversations" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_agent_conv_time" ON "agent_conversations" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_agent_events_org" ON "agent_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_agent_events_type" ON "agent_events" USING btree ("organization_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_agent_events_processed" ON "agent_events" USING btree ("organization_id","processed");--> statement-breakpoint
CREATE INDEX "idx_agent_memory_org" ON "agent_memory" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_agent_memory_agent" ON "agent_memory" USING btree ("agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_agent_memory_key" ON "agent_memory" USING btree ("agent_id","key");--> statement-breakpoint
CREATE INDEX "idx_agent_metrics_org" ON "agent_metrics" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_agent_metrics_agent" ON "agent_metrics" USING btree ("agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_agent_metrics_uniq" ON "agent_metrics" USING btree ("organization_id","agent_id","metric_date");--> statement-breakpoint
CREATE INDEX "idx_agent_obs_org" ON "agent_observations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_agent_obs_agent" ON "agent_observations" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_agent_obs_severity" ON "agent_observations" USING btree ("organization_id","severity");--> statement-breakpoint
CREATE INDEX "idx_agent_obs_status" ON "agent_observations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_agent_orch_org" ON "agent_orchestrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_agent_orch_status" ON "agent_orchestrations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_agent_recs_org" ON "agent_recommendations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_agent_recs_agent" ON "agent_recommendations" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_agent_recs_priority" ON "agent_recommendations" USING btree ("organization_id","priority");--> statement-breakpoint
CREATE INDEX "idx_agent_recs_status" ON "agent_recommendations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_agent_runs_org" ON "agent_runs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_agent_runs_agent" ON "agent_runs" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_agent_runs_status" ON "agent_runs" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_agent_runs_started" ON "agent_runs" USING btree ("organization_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_agent_schedules_org" ON "agent_schedules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_agent_schedules_agent" ON "agent_schedules" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_agents_org" ON "agents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_agents_type" ON "agents" USING btree ("agent_type");--> statement-breakpoint
CREATE INDEX "idx_agents_status" ON "agents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ai_assessments_org" ON "ai_assessments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ai_assessments_system" ON "ai_assessments" USING btree ("ai_system_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ai_compliance_org_framework" ON "ai_compliance" USING btree ("organization_id","framework");--> statement-breakpoint
CREATE INDEX "idx_ai_compliance_org" ON "ai_compliance" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ai_controls_org" ON "ai_controls" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ai_incidents_org" ON "ai_incidents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ai_incidents_status" ON "ai_incidents" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_ai_policies_org" ON "ai_policies" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ai_risks_org" ON "ai_risks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ai_risks_system" ON "ai_risks" USING btree ("ai_system_id");--> statement-breakpoint
CREATE INDEX "idx_ai_risks_status" ON "ai_risks" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ai_system_controls" ON "ai_system_controls" USING btree ("ai_system_id","control_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ai_system_risks" ON "ai_system_risks" USING btree ("ai_system_id","risk_id");--> statement-breakpoint
CREATE INDEX "idx_ai_systems_org" ON "ai_systems" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ai_systems_status" ON "ai_systems" USING btree ("organization_id","approval_status");--> statement-breakpoint
CREATE INDEX "idx_ai_systems_risk" ON "ai_systems" USING btree ("organization_id","risk_classification");--> statement-breakpoint
CREATE INDEX "idx_ai_trust_scores_system" ON "ai_trust_scores" USING btree ("ai_system_id");--> statement-breakpoint
CREATE INDEX "idx_ai_trust_scores_org" ON "ai_trust_scores" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ai_vendors_org" ON "ai_vendors" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_dashboards_org" ON "analytics_dashboards" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_forecasts_org_metric" ON "analytics_forecasts" USING btree ("organization_id","metric_name");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_analytics_kpis_org_key" ON "analytics_kpis" USING btree ("organization_id","kpi_key");--> statement-breakpoint
CREATE INDEX "idx_analytics_kpis_org" ON "analytics_kpis" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_reports_org_type" ON "analytics_reports" USING btree ("organization_id","report_type");--> statement-breakpoint
CREATE INDEX "idx_analytics_reports_org_status" ON "analytics_reports" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_analytics_schedules_org" ON "analytics_schedules" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_analytics_snapshots_org_date" ON "analytics_snapshots" USING btree ("organization_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "idx_analytics_snapshots_org_date" ON "analytics_snapshots" USING btree ("organization_id","snapshot_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_analytics_sub_schedule_user" ON "analytics_subscriptions" USING btree ("schedule_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_asset_alerts_org" ON "asset_alerts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_asset_rel_org" ON "asset_relationships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_asset_reviews_org" ON "asset_reviews" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_asset_scores_org" ON "asset_scores" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_asset_types_org" ON "asset_types" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_assets_org" ON "assets" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_assets_type" ON "assets" USING btree ("organization_id","asset_type");--> statement-breakpoint
CREATE INDEX "ar2_org_idx" ON "attestation_responses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ar2_att_idx" ON "attestation_responses" USING btree ("attestation_id");--> statement-breakpoint
CREATE INDEX "att_org_idx" ON "attestations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "att_status_idx" ON "attestations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "rul_org_idx" ON "automation_rules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "rul_status_idx" ON "automation_rules" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "benchmark_industries_cat_idx" ON "benchmark_industries" USING btree ("industry","company_size","category");--> statement-breakpoint
CREATE INDEX "benchmark_scores_snapshot_idx" ON "benchmark_scores" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "benchmark_scores_org_idx" ON "benchmark_scores" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "benchmark_scores_category_idx" ON "benchmark_scores" USING btree ("organization_id","category");--> statement-breakpoint
CREATE INDEX "benchmark_snapshots_org_idx" ON "benchmark_snapshots" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "benchmark_snapshots_date_idx" ON "benchmark_snapshots" USING btree ("organization_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "benchmark_trends_org_idx" ON "benchmark_trends" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "benchmark_trends_cat_idx" ON "benchmark_trends" USING btree ("organization_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "benchmark_trends_uniq" ON "benchmark_trends" USING btree ("organization_id","category","period_month");--> statement-breakpoint
CREATE INDEX "cce_org_idx" ON "compliance_evidence" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cce_run_idx" ON "compliance_evidence" USING btree ("check_run_id");--> statement-breakpoint
CREATE INDEX "cce_status_idx" ON "compliance_evidence" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "ccr_org_idx" ON "compliance_check_runs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ccr_check_idx" ON "compliance_check_runs" USING btree ("check_id");--> statement-breakpoint
CREATE INDEX "ccr_result_idx" ON "compliance_check_runs" USING btree ("organization_id","result");--> statement-breakpoint
CREATE INDEX "cc_org_idx" ON "compliance_checks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cc_category_idx" ON "compliance_checks" USING btree ("category");--> statement-breakpoint
CREATE INDEX "cc_status_idx" ON "compliance_checks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cex_org_idx" ON "compliance_exceptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cex_status_idx" ON "compliance_exceptions" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "chs_org_idx" ON "compliance_health_scores" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cs_org_idx" ON "compliance_signals" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cs_status_idx" ON "compliance_signals" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "cs_severity_idx" ON "compliance_signals" USING btree ("organization_id","severity");--> statement-breakpoint
CREATE INDEX "cs_created_idx" ON "compliance_signals" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "consent_records_org_idx" ON "consent_records" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "consent_records_status_idx" ON "consent_records" USING btree ("organization_id","consent_status");--> statement-breakpoint
CREATE INDEX "consent_records_subject_idx" ON "consent_records" USING btree ("organization_id","subject_id");--> statement-breakpoint
CREATE INDEX "cr_org_idx" ON "continuous_readiness" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cr_framework_idx" ON "continuous_readiness" USING btree ("framework_id");--> statement-breakpoint
CREATE INDEX "contract_clauses_contract_idx" ON "contract_clauses" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "contract_controls_contract_idx" ON "contract_controls" USING btree ("contract_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contract_controls_unique" ON "contract_controls" USING btree ("contract_id","control_id");--> statement-breakpoint
CREATE INDEX "contract_obligations_contract_idx" ON "contract_obligations" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "contract_obligations_org_idx" ON "contract_obligations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "contract_obligations_status_idx" ON "contract_obligations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "contract_obligations_due_idx" ON "contract_obligations" USING btree ("organization_id","due_date");--> statement-breakpoint
CREATE INDEX "contract_policies_contract_idx" ON "contract_policies" USING btree ("contract_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contract_policies_unique" ON "contract_policies" USING btree ("contract_id","policy_id");--> statement-breakpoint
CREATE INDEX "contract_risks_contract_idx" ON "contract_risks" USING btree ("contract_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contract_risks_unique" ON "contract_risks" USING btree ("contract_id","risk_id");--> statement-breakpoint
CREATE INDEX "contracts_org_idx" ON "contracts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "contracts_status_idx" ON "contracts" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "contracts_vendor_idx" ON "contracts" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "contracts_expiry_idx" ON "contracts" USING btree ("organization_id","expiry_date");--> statement-breakpoint
CREATE INDEX "control_frameworks_framework_idx" ON "control_frameworks" USING btree ("framework_id");--> statement-breakpoint
CREATE INDEX "control_tests_control_idx" ON "control_tests" USING btree ("control_id");--> statement-breakpoint
CREATE INDEX "control_tests_org_idx" ON "control_tests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cv_org_idx" ON "control_validations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cv_control_idx" ON "control_validations" USING btree ("control_id");--> statement-breakpoint
CREATE INDEX "control_vendors_vendor_idx" ON "control_vendors" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "data_assets_org_idx" ON "data_assets" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "data_assets_status_idx" ON "data_assets" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "data_assets_category_idx" ON "data_assets" USING btree ("organization_id","data_category");--> statement-breakpoint
CREATE INDEX "data_transfers_org_idx" ON "data_transfers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "data_transfers_status_idx" ON "data_transfers" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "fm_org_idx" ON "framework_mappings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "fm_framework_idx" ON "framework_mappings" USING btree ("framework_id");--> statement-breakpoint
CREATE INDEX "gov_alerts_org_idx" ON "governance_alerts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "gov_alerts_status_idx" ON "governance_alerts" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "gov_alerts_severity_idx" ON "governance_alerts" USING btree ("organization_id","severity");--> statement-breakpoint
CREATE INDEX "gov_snapshots_org_idx" ON "governance_snapshots" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "gov_snapshots_date_idx" ON "governance_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "graph_edges_org_idx" ON "graph_edges" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "graph_edges_source_idx" ON "graph_edges" USING btree ("source_node_id");--> statement-breakpoint
CREATE INDEX "graph_edges_target_idx" ON "graph_edges" USING btree ("target_node_id");--> statement-breakpoint
CREATE UNIQUE INDEX "graph_edges_uniq" ON "graph_edges" USING btree ("organization_id","source_node_id","target_node_id","relationship_type");--> statement-breakpoint
CREATE INDEX "graph_nodes_org_idx" ON "graph_nodes" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "graph_nodes_entity_idx" ON "graph_nodes" USING btree ("organization_id","entity_type");--> statement-breakpoint
CREATE UNIQUE INDEX "graph_nodes_entity_uniq" ON "graph_nodes" USING btree ("organization_id","entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_credentials_instance_uniq" ON "integration_credentials" USING btree ("instance_id");--> statement-breakpoint
CREATE INDEX "integration_events_instance_idx" ON "integration_events" USING btree ("instance_id","created_at");--> statement-breakpoint
CREATE INDEX "integration_events_org_idx" ON "integration_events" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "integration_events_resolved_idx" ON "integration_events" USING btree ("organization_id","resolved");--> statement-breakpoint
CREATE INDEX "integration_instances_org_idx" ON "integration_instances" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "integration_instances_status_idx" ON "integration_instances" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_instances_org_registry_uniq" ON "integration_instances" USING btree ("organization_id","registry_id");--> statement-breakpoint
CREATE INDEX "integration_logs_instance_idx" ON "integration_logs" USING btree ("instance_id","created_at");--> statement-breakpoint
CREATE INDEX "integration_logs_org_idx" ON "integration_logs" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "integration_mappings_instance_idx" ON "integration_mappings" USING btree ("instance_id");--> statement-breakpoint
CREATE INDEX "integration_mappings_org_idx" ON "integration_mappings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "integration_registry_category_idx" ON "integration_registry" USING btree ("category");--> statement-breakpoint
CREATE INDEX "integration_syncs_instance_idx" ON "integration_syncs" USING btree ("instance_id");--> statement-breakpoint
CREATE INDEX "integration_syncs_org_idx" ON "integration_syncs" USING btree ("organization_id","started_at");--> statement-breakpoint
CREATE INDEX "integration_syncs_status_idx" ON "integration_syncs" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "integration_webhooks_org_idx" ON "integration_webhooks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "issue_comments_issue_idx" ON "issue_comments" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "issue_escalations_issue_idx" ON "issue_escalations" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "issue_exceptions_issue_idx" ON "issue_exceptions" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "issue_exceptions_org_idx" ON "issue_exceptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "issue_history_issue_idx" ON "issue_history" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "issue_tasks_issue_idx" ON "issue_tasks" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "issues_org_idx" ON "issues" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "issues_status_idx" ON "issues" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "issues_severity_idx" ON "issues" USING btree ("organization_id","severity");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_network_followers" ON "network_followers" USING btree ("follower_org_id","following_org_id");--> statement-breakpoint
CREATE INDEX "idx_nf_following" ON "network_followers" USING btree ("following_org_id");--> statement-breakpoint
CREATE INDEX "idx_npv_viewed_org" ON "network_profile_views" USING btree ("viewed_org_id","viewed_at");--> statement-breakpoint
CREATE INDEX "idx_obligation_mappings_org" ON "obligation_mappings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_obligations_org" ON "obligations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_obligations_status" ON "obligations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "policy_attestations_policy_idx" ON "policy_attestations" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "policy_attestations_org_idx" ON "policy_attestations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "policy_attestations_user_idx" ON "policy_attestations" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "policy_controls_uniq" ON "policy_controls" USING btree ("policy_id","control_id");--> statement-breakpoint
CREATE INDEX "policy_controls_policy_idx" ON "policy_controls" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "policy_controls_control_idx" ON "policy_controls" USING btree ("control_id");--> statement-breakpoint
CREATE UNIQUE INDEX "policy_frameworks_uniq" ON "policy_frameworks" USING btree ("policy_id","framework_id");--> statement-breakpoint
CREATE INDEX "policy_frameworks_policy_idx" ON "policy_frameworks" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "policy_frameworks_framework_idx" ON "policy_frameworks" USING btree ("framework_id");--> statement-breakpoint
CREATE INDEX "policy_reviews_policy_idx" ON "policy_reviews" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "policy_reviews_org_idx" ON "policy_reviews" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "privacy_assessments_org_idx" ON "privacy_assessments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "privacy_assessments_status_idx" ON "privacy_assessments" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "privacy_requests_org_idx" ON "privacy_requests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "privacy_requests_status_idx" ON "privacy_requests" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "privacy_requests_due_idx" ON "privacy_requests" USING btree ("organization_id","due_date");--> statement-breakpoint
CREATE INDEX "privacy_trust_scores_org_idx" ON "privacy_trust_scores" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "privacy_trust_scores_date_idx" ON "privacy_trust_scores" USING btree ("organization_id","computed_at");--> statement-breakpoint
CREATE INDEX "idx_reg_versions_reg" ON "regulation_versions" USING btree ("regulation_id");--> statement-breakpoint
CREATE INDEX "idx_regulations_org" ON "regulations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_regulations_category" ON "regulations" USING btree ("organization_id","category");--> statement-breakpoint
CREATE INDEX "idx_reg_agents_org" ON "regulatory_agents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_reg_alerts_org" ON "regulatory_alerts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_reg_alerts_status" ON "regulatory_alerts" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_reg_assessments_org" ON "regulatory_assessments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_reg_assessments_status" ON "regulatory_assessments" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_reg_changes_org" ON "regulatory_changes" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_reg_changes_status" ON "regulatory_changes" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_reg_impacts_assessment" ON "regulatory_impacts" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "idx_reg_impacts_org" ON "regulatory_impacts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_reg_reviews_org" ON "regulatory_reviews" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_reg_sources_org" ON "regulatory_sources" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_reg_tasks_org" ON "regulatory_tasks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_reg_tasks_status" ON "regulatory_tasks" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_reg_updates_org" ON "regulatory_updates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_reg_updates_regulation" ON "regulatory_updates" USING btree ("regulation_id");--> statement-breakpoint
CREATE INDEX "idx_reg_watchlists_org" ON "regulatory_watchlists" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "retention_events_org_idx" ON "retention_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "retention_events_asset_idx" ON "retention_events" USING btree ("data_asset_id");--> statement-breakpoint
CREATE INDEX "retention_policies_org_idx" ON "retention_policies" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "risk_controls_uniq" ON "risk_controls" USING btree ("risk_id","control_id");--> statement-breakpoint
CREATE INDEX "risk_controls_control_idx" ON "risk_controls" USING btree ("control_id");--> statement-breakpoint
CREATE UNIQUE INDEX "risk_evidence_uniq" ON "risk_evidence" USING btree ("risk_id","evidence_id");--> statement-breakpoint
CREATE INDEX "risk_evidence_evidence_idx" ON "risk_evidence" USING btree ("evidence_id");--> statement-breakpoint
CREATE UNIQUE INDEX "risk_findings_uniq" ON "risk_findings" USING btree ("risk_id","finding_id");--> statement-breakpoint
CREATE INDEX "risk_findings_finding_idx" ON "risk_findings" USING btree ("finding_id");--> statement-breakpoint
CREATE UNIQUE INDEX "risk_frameworks_uniq" ON "risk_frameworks" USING btree ("risk_id","framework_id");--> statement-breakpoint
CREATE INDEX "risk_frameworks_framework_idx" ON "risk_frameworks" USING btree ("framework_id");--> statement-breakpoint
CREATE UNIQUE INDEX "risk_policies_uniq" ON "risk_policies" USING btree ("risk_id","policy_id");--> statement-breakpoint
CREATE INDEX "risk_policies_policy_idx" ON "risk_policies" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "risk_reviews_risk_idx" ON "risk_reviews" USING btree ("risk_id");--> statement-breakpoint
CREATE INDEX "risk_reviews_org_idx" ON "risk_reviews" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "risk_treatments_risk_idx" ON "risk_treatments" USING btree ("risk_id");--> statement-breakpoint
CREATE INDEX "risk_treatments_org_idx" ON "risk_treatments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "risk_treatments_due_idx" ON "risk_treatments" USING btree ("organization_id","target_date");--> statement-breakpoint
CREATE UNIQUE INDEX "risk_vendors_uniq" ON "risk_vendors" USING btree ("risk_id","vendor_id");--> statement-breakpoint
CREATE INDEX "risk_vendors_vendor_idx" ON "risk_vendors" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "risks_org_idx" ON "risks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "risks_org_status_idx" ON "risks" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "risks_org_category_idx" ON "risks" USING btree ("organization_id","category");--> statement-breakpoint
CREATE INDEX "risks_owner_idx" ON "risks" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "ta_org_idx" ON "training_assignments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ta_campaign_idx" ON "training_assignments" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "ta_user_idx" ON "training_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tc_org_idx" ON "training_campaigns" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "tc_status_idx" ON "training_campaigns" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "trust_activity_org_idx" ON "trust_activity" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "trust_activity_created_idx" ON "trust_activity" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "trust_answers_org_idx" ON "trust_answers" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "trust_answers_org_q_uniq" ON "trust_answers" USING btree ("organization_id","questionnaire_id");--> statement-breakpoint
CREATE INDEX "trust_badges_org_idx" ON "trust_badges" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "trust_badges_active_idx" ON "trust_badges" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "trust_docs_org_idx" ON "trust_documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "trust_docs_profile_idx" ON "trust_documents" USING btree ("trust_profile_id");--> statement-breakpoint
CREATE INDEX "trust_docs_type_idx" ON "trust_documents" USING btree ("doc_type");--> statement-breakpoint
CREATE INDEX "trust_docs_expiry_idx" ON "trust_documents" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "trust_profiles_org_idx" ON "trust_profiles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "trust_profiles_published_idx" ON "trust_profiles" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "trust_q_org_idx" ON "trust_questionnaires" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "trust_q_global_idx" ON "trust_questionnaires" USING btree ("is_global");--> statement-breakpoint
CREATE UNIQUE INDEX "trust_relationships_uniq" ON "trust_relationships" USING btree ("requester_org_id","target_org_id");--> statement-breakpoint
CREATE INDEX "trust_relationships_target_idx" ON "trust_relationships" USING btree ("target_org_id");--> statement-breakpoint
CREATE INDEX "trust_relationships_status_idx" ON "trust_relationships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trust_shares_doc_idx" ON "trust_shares" USING btree ("trust_document_id");--> statement-breakpoint
CREATE INDEX "trust_shares_owner_idx" ON "trust_shares" USING btree ("owner_org_id");--> statement-breakpoint
CREATE INDEX "trust_shares_recipient_idx" ON "trust_shares" USING btree ("recipient_org_id");--> statement-breakpoint
CREATE INDEX "trust_verif_doc_idx" ON "trust_verifications" USING btree ("trust_document_id");--> statement-breakpoint
CREATE INDEX "trust_verif_org_idx" ON "trust_verifications" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vendor_trust_history_vendor_idx" ON "vendor_trust_history" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_trust_history_org_idx" ON "vendor_trust_history" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vendor_trust_history_snapshot_idx" ON "vendor_trust_history" USING btree ("vendor_id","snapshot_at");--> statement-breakpoint
CREATE INDEX "workflow_approvals_org_idx" ON "workflow_approvals" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "workflow_approvals_run_idx" ON "workflow_approvals" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "workflow_approvals_approver_idx" ON "workflow_approvals" USING btree ("approver_id");--> statement-breakpoint
CREATE INDEX "workflow_nodes_workflow_idx" ON "workflow_nodes" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_run_steps_run_idx" ON "workflow_run_steps" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "workflow_runs_org_idx" ON "workflow_runs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "workflow_runs_status_idx" ON "workflow_runs" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "workflow_transitions_workflow_idx" ON "workflow_transitions" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflows_org_idx" ON "workflows" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "workflows_status_idx" ON "workflows" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "we_org_idx" ON "workforce_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "we_status_idx" ON "workforce_events" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "we_type_idx" ON "workforce_events" USING btree ("organization_id","event_type");--> statement-breakpoint
ALTER TABLE "controls" ADD CONSTRAINT "controls_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;