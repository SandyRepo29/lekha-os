CREATE TYPE "public"."assessment_answer" AS ENUM('yes', 'no', 'partial', 'na');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('requested', 'submitted', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'rejected', 'needs_followup');--> statement-breakpoint
CREATE TYPE "public"."review_type" AS ENUM('annual', 'quarterly', 'security', 'compliance');--> statement-breakpoint
CREATE TABLE "assessment_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"question_key" text NOT NULL,
	"answer" "assessment_answer",
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"title" text NOT NULL,
	"score" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"conducted_by" uuid,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"message" text,
	"due_date" date,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" "request_status" DEFAULT 'requested' NOT NULL,
	"requested_by" uuid,
	"completed_document_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_portal_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_portal_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "vendor_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"review_type" "review_type" NOT NULL,
	"review_status" "review_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"summary" text,
	"next_review_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_type_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_type_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "ai_summary" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "ai_summary_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "owner_name" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "owner_email" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "owner_department" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "vendor_type_id" uuid;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "checklist_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_conducted_by_profiles_id_fk" FOREIGN KEY ("conducted_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_requested_by_profiles_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_portal_tokens" ADD CONSTRAINT "vendor_portal_tokens_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_portal_tokens" ADD CONSTRAINT "vendor_portal_tokens_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_portal_tokens" ADD CONSTRAINT "vendor_portal_tokens_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_type_documents" ADD CONSTRAINT "vendor_type_documents_vendor_type_id_vendor_types_id_fk" FOREIGN KEY ("vendor_type_id") REFERENCES "public"."vendor_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_types" ADD CONSTRAINT "vendor_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_response_uniq" ON "assessment_responses" USING btree ("assessment_id","question_key");--> statement-breakpoint
CREATE INDEX "assessments_vendor_idx" ON "assessments" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "doc_requests_org_idx" ON "document_requests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "doc_requests_vendor_idx" ON "document_requests" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "portal_tokens_vendor_idx" ON "vendor_portal_tokens" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "portal_tokens_token_idx" ON "vendor_portal_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "reviews_vendor_idx" ON "vendor_reviews" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_type_docs_type_idx" ON "vendor_type_documents" USING btree ("vendor_type_id");--> statement-breakpoint
CREATE INDEX "vendor_types_org_idx" ON "vendor_types" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vendor_documents_expiry_idx" ON "vendor_documents" USING btree ("organization_id","expires_on");--> statement-breakpoint
CREATE INDEX "vendors_owner_idx" ON "vendors" USING btree ("organization_id","owner_email");