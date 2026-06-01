ALTER TABLE "assessments" ADD COLUMN "ai_summary" text;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "ai_summary_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "ai_score_explanation" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "ai_score_explained_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "ai_risk_explanation" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "ai_risk_explained_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "ai_recommended_actions" jsonb;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "ai_actions_generated_at" timestamp with time zone;