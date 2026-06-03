CREATE TYPE "public"."control_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."control_status" AS ENUM('implemented', 'partial', 'not_implemented', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."evidence_source" AS ENUM('vendor_document', 'vendor_assessment', 'vendor_review', 'manual', 'policy');--> statement-breakpoint
CREATE TYPE "public"."evidence_status" AS ENUM('draft', 'pending_review', 'approved', 'expired', 'archived');--> statement-breakpoint
CREATE TYPE "public"."framework_status" AS ENUM('not_started', 'in_progress', 'ready', 'certified', 'expired');--> statement-breakpoint
CREATE TYPE "public"."policy_status" AS ENUM('draft', 'review', 'approved', 'archived', 'expired');--> statement-breakpoint
CREATE TABLE "ai_compliance_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"insight_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"content" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"report_type" text NOT NULL,
	"framework_id" uuid,
	"generated_by" uuid,
	"storage_path" text,
	"ai_content" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "control_evidence_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"control_id" uuid NOT NULL,
	"evidence_id" uuid NOT NULL,
	"mapping_type" text DEFAULT 'manual' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"framework_id" uuid NOT NULL,
	"control_ref" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"owner" text,
	"status" "control_status" DEFAULT 'not_implemented' NOT NULL,
	"priority" "control_priority" DEFAULT 'medium' NOT NULL,
	"review_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"source" "evidence_source" DEFAULT 'manual' NOT NULL,
	"source_entity_id" uuid,
	"owner" text,
	"expires_on" date,
	"status" "evidence_status" DEFAULT 'draft' NOT NULL,
	"storage_path" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frameworks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"version" text,
	"owner" text,
	"status" "framework_status" DEFAULT 'not_started' NOT NULL,
	"review_date" date,
	"ai_summary" text,
	"ai_summary_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gap_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"framework_id" uuid NOT NULL,
	"gap_type" text NOT NULL,
	"control_id" uuid,
	"evidence_id" uuid,
	"description" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"is_ai_detected" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"policy_type" text,
	"version" text DEFAULT '1.0' NOT NULL,
	"owner" text,
	"status" "policy_status" DEFAULT 'draft' NOT NULL,
	"review_date" date,
	"approval_date" date,
	"approver" text,
	"storage_path" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"version" text NOT NULL,
	"storage_path" text,
	"notes" text,
	"created_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readiness_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"framework_id" uuid NOT NULL,
	"overall_score" integer DEFAULT 0 NOT NULL,
	"control_coverage" integer DEFAULT 0 NOT NULL,
	"evidence_coverage" integer DEFAULT 0 NOT NULL,
	"policy_coverage" integer DEFAULT 0 NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_compliance_insights" ADD CONSTRAINT "ai_compliance_insights_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_framework_id_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_generated_by_profiles_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_evidence_mappings" ADD CONSTRAINT "control_evidence_mappings_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_evidence_mappings" ADD CONSTRAINT "control_evidence_mappings_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_evidence_mappings" ADD CONSTRAINT "control_evidence_mappings_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controls" ADD CONSTRAINT "controls_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controls" ADD CONSTRAINT "controls_framework_id_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frameworks" ADD CONSTRAINT "frameworks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frameworks" ADD CONSTRAINT "frameworks_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gap_analysis" ADD CONSTRAINT "gap_analysis_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gap_analysis" ADD CONSTRAINT "gap_analysis_framework_id_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gap_analysis" ADD CONSTRAINT "gap_analysis_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gap_analysis" ADD CONSTRAINT "gap_analysis_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_versions" ADD CONSTRAINT "policy_versions_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_versions" ADD CONSTRAINT "policy_versions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_scores" ADD CONSTRAINT "readiness_scores_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_scores" ADD CONSTRAINT "readiness_scores_framework_id_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_insights_type_target_uniq" ON "ai_compliance_insights" USING btree ("organization_id","insight_type","target_id");--> statement-breakpoint
CREATE INDEX "ai_insights_org_idx" ON "ai_compliance_insights" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "compliance_reports_org_idx" ON "compliance_reports" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "control_evidence_uniq" ON "control_evidence_mappings" USING btree ("control_id","evidence_id");--> statement-breakpoint
CREATE INDEX "cem_control_idx" ON "control_evidence_mappings" USING btree ("control_id");--> statement-breakpoint
CREATE INDEX "cem_evidence_idx" ON "control_evidence_mappings" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX "controls_org_idx" ON "controls" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "controls_framework_idx" ON "controls" USING btree ("framework_id");--> statement-breakpoint
CREATE INDEX "evidence_org_idx" ON "evidence" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "evidence_source_idx" ON "evidence" USING btree ("organization_id","source");--> statement-breakpoint
CREATE INDEX "evidence_expiry_idx" ON "evidence" USING btree ("organization_id","expires_on");--> statement-breakpoint
CREATE INDEX "frameworks_org_idx" ON "frameworks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "gaps_org_framework_idx" ON "gap_analysis" USING btree ("organization_id","framework_id");--> statement-breakpoint
CREATE INDEX "gaps_control_idx" ON "gap_analysis" USING btree ("control_id");--> statement-breakpoint
CREATE INDEX "policies_org_idx" ON "policies" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "policy_versions_policy_idx" ON "policy_versions" USING btree ("policy_id");--> statement-breakpoint
CREATE UNIQUE INDEX "readiness_org_framework_uniq" ON "readiness_scores" USING btree ("organization_id","framework_id");--> statement-breakpoint
CREATE INDEX "readiness_org_idx" ON "readiness_scores" USING btree ("organization_id");