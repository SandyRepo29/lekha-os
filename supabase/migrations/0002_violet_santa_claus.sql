CREATE TABLE "notification_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"notification_type" text NOT NULL,
	"entity_id" uuid,
	"sent_to" jsonb NOT NULL,
	"resend_id" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"expiry_alerts_enabled" boolean DEFAULT true NOT NULL,
	"weekly_digest_enabled" boolean DEFAULT true NOT NULL,
	"recipient_emails" jsonb DEFAULT '[]'::jsonb,
	"alert_days_before" jsonb DEFAULT '[90,60,30,15,7]'::jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
ALTER TABLE "notification_history" ADD CONSTRAINT "notification_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notif_history_org_idx" ON "notification_history" USING btree ("organization_id","sent_at");--> statement-breakpoint
CREATE INDEX "notif_history_dedup_idx" ON "notification_history" USING btree ("organization_id","notification_type","entity_id");