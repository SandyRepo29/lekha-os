-- Migration 0008 — Audit Management Module
-- Applies only the new audit enums + tables (skips 0007 columns already applied).

-- Enums
CREATE TYPE "public"."audit_type" AS ENUM('internal', 'external', 'vendor', 'security', 'compliance', 'regulatory');
CREATE TYPE "public"."audit_status" AS ENUM('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE "public"."audit_program_status" AS ENUM('pending', 'reviewed', 'passed', 'failed');
CREATE TYPE "public"."finding_severity" AS ENUM('critical', 'high', 'medium', 'low');
CREATE TYPE "public"."finding_status" AS ENUM('open', 'accepted', 'remediating', 'closed');
CREATE TYPE "public"."corrective_action_status" AS ENUM('open', 'in_progress', 'completed', 'overdue');

-- audits
CREATE TABLE "audits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" text NOT NULL,
  "audit_type" "audit_type" DEFAULT 'internal' NOT NULL,
  "framework_id" uuid,
  "scope" text,
  "objective" text,
  "owner_id" uuid,
  "auditor_name" text,
  "start_date" date,
  "end_date" date,
  "audit_status" "audit_status" DEFAULT 'planned' NOT NULL,
  "ai_summary" text,
  "ai_summary_at" timestamp with time zone,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "audits" ADD CONSTRAINT "audits_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade;
ALTER TABLE "audits" ADD CONSTRAINT "audits_framework_id_frameworks_id_fk"
  FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE set null;
ALTER TABLE "audits" ADD CONSTRAINT "audits_owner_id_profiles_id_fk"
  FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action;
ALTER TABLE "audits" ADD CONSTRAINT "audits_created_by_profiles_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action;
CREATE INDEX "audits_org_idx" ON "audits" USING btree ("organization_id");
CREATE INDEX "audits_org_status_idx" ON "audits" USING btree ("organization_id", "audit_status");

-- audit_programs
CREATE TABLE "audit_programs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "audit_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "control_id" uuid,
  "expected_evidence" text,
  "audit_program_status" "audit_program_status" DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "audit_programs" ADD CONSTRAINT "audit_programs_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade;
ALTER TABLE "audit_programs" ADD CONSTRAINT "audit_programs_audit_id_audits_id_fk"
  FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade;
ALTER TABLE "audit_programs" ADD CONSTRAINT "audit_programs_control_id_controls_id_fk"
  FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE set null;
CREATE INDEX "audit_programs_audit_idx" ON "audit_programs" USING btree ("audit_id");
CREATE INDEX "audit_programs_org_idx" ON "audit_programs" USING btree ("organization_id");

-- audit_findings
CREATE TABLE "audit_findings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "audit_id" uuid NOT NULL,
  "control_id" uuid,
  "evidence_id" uuid,
  "title" text NOT NULL,
  "description" text,
  "finding_severity" "finding_severity" DEFAULT 'medium' NOT NULL,
  "recommendation" text,
  "finding_status" "finding_status" DEFAULT 'open' NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade;
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_audit_id_audits_id_fk"
  FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade;
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_control_id_controls_id_fk"
  FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE set null;
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_evidence_id_evidence_id_fk"
  FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE set null;
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_created_by_profiles_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action;
CREATE INDEX "audit_findings_audit_idx" ON "audit_findings" USING btree ("audit_id");
CREATE INDEX "audit_findings_org_idx" ON "audit_findings" USING btree ("organization_id");
CREATE INDEX "audit_findings_severity_idx" ON "audit_findings" USING btree ("organization_id", "finding_severity");

-- corrective_actions
CREATE TABLE "corrective_actions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "finding_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "owner_id" uuid,
  "due_date" date,
  "corrective_action_status" "corrective_action_status" DEFAULT 'open' NOT NULL,
  "completion_notes" text,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade;
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_finding_id_audit_findings_id_fk"
  FOREIGN KEY ("finding_id") REFERENCES "public"."audit_findings"("id") ON DELETE cascade;
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_owner_id_profiles_id_fk"
  FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action;
CREATE INDEX "corrective_actions_finding_idx" ON "corrective_actions" USING btree ("finding_id");
CREATE INDEX "corrective_actions_org_idx" ON "corrective_actions" USING btree ("organization_id");
CREATE INDEX "corrective_actions_due_idx" ON "corrective_actions" USING btree ("organization_id", "due_date");

-- audit_reports
CREATE TABLE "audit_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "audit_id" uuid NOT NULL,
  "report_name" text NOT NULL,
  "storage_path" text,
  "generated_by" uuid,
  "generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "audit_reports" ADD CONSTRAINT "audit_reports_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade;
ALTER TABLE "audit_reports" ADD CONSTRAINT "audit_reports_audit_id_audits_id_fk"
  FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade;
ALTER TABLE "audit_reports" ADD CONSTRAINT "audit_reports_generated_by_profiles_id_fk"
  FOREIGN KEY ("generated_by") REFERENCES "public"."profiles"("id") ON DELETE no action;
CREATE INDEX "audit_reports_audit_idx" ON "audit_reports" USING btree ("audit_id");
CREATE INDEX "audit_reports_org_idx" ON "audit_reports" USING btree ("organization_id");
