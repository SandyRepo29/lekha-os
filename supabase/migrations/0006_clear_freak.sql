CREATE TYPE "public"."api_key_permission" AS ENUM('read_only', 'read_write', 'admin');--> statement-breakpoint
CREATE TYPE "public"."api_key_status" AS ENUM('active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."company_size_range" AS ENUM('1_10', '11_50', '51_200', '201_500', '501_1000', '1000_plus');--> statement-breakpoint
CREATE TYPE "public"."industry_type" AS ENUM('saas', 'it_services', 'fintech', 'healthcare', 'manufacturing', 'government', 'education', 'other');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('resend', 'smtp', 'google_workspace', 'microsoft_365', 'slack', 'teams', 'whatsapp', 'google_drive', 'onedrive', 'sharepoint');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('connected', 'disconnected', 'error', 'pending');--> statement-breakpoint
ALTER TYPE "public"."membership_role" ADD VALUE 'compliance_manager';--> statement-breakpoint
ALTER TYPE "public"."membership_role" ADD VALUE 'security_manager';--> statement-breakpoint
ALTER TYPE "public"."membership_role" ADD VALUE 'procurement_manager';--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" uuid,
	"name" text NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"permissions" "api_key_permission" DEFAULT 'read_only' NOT NULL,
	"last_used_at" timestamp with time zone,
	"status" "api_key_status" DEFAULT 'active' NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_monthly" integer DEFAULT 0 NOT NULL,
	"price_yearly" integer DEFAULT 0 NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb,
	"max_users" integer DEFAULT 5 NOT NULL,
	"max_vendors" integer DEFAULT 10 NOT NULL,
	"max_storage_gb" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"display_name" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"status" "integration_status" DEFAULT 'disconnected' NOT NULL,
	"connected_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"location" text,
	"status" text DEFAULT 'success' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"primary_color" text DEFAULT '#6366f1',
	"accent_color" text DEFAULT '#8b5cf6',
	"report_footer" text,
	"email_signature" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_settings_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" text DEFAULT 'trial' NOT NULL,
	"billing_cycle" text DEFAULT 'trial' NOT NULL,
	"current_period_start" timestamp with time zone DEFAULT now(),
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "legal_name" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "industry" "industry_type";--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "company_size" "company_size_range";--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "country" text DEFAULT 'India';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "timezone" text DEFAULT 'Asia/Kolkata';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "job_title" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "timezone" text DEFAULT 'Asia/Kolkata';--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "language" text DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_billing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."billing_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_org_idx" ON "api_keys" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "integrations_org_provider_uniq" ON "integrations" USING btree ("organization_id","provider");--> statement-breakpoint
CREATE INDEX "integrations_org_idx" ON "integrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "login_history_org_idx" ON "login_history" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "login_history_user_idx" ON "login_history" USING btree ("user_id","created_at");