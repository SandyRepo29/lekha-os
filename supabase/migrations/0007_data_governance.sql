-- ============================================================
-- Migration 0007 — Data Governance: Phase 1
--
-- 1. storage_providers registry table
-- 2. vendor_documents — storage metadata columns
-- 3. audit_logs — ip_address column
-- ============================================================

--> statement-breakpoint
CREATE TABLE "storage_providers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "type" text DEFAULT 'platform' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "config_json" jsonb DEFAULT '{}',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "storage_providers_name_unique" UNIQUE("name")
);

--> statement-breakpoint
-- Seed the default platform provider
INSERT INTO "storage_providers" ("name", "type", "is_active", "config_json")
VALUES (
  'supabase',
  'platform',
  true,
  '{"region":"ap-south-1","buckets":["vendor-documents","compliance-documents"]}'
)
ON CONFLICT ("name") DO NOTHING;

--> statement-breakpoint
ALTER TABLE "vendor_documents"
  ADD COLUMN "filename" text,
  ADD COLUMN "content_type" text,
  ADD COLUMN "file_size" bigint,
  ADD COLUMN "storage_provider" text DEFAULT 'supabase',
  ADD COLUMN "storage_bucket" text DEFAULT 'vendor-documents',
  ADD COLUMN "checksum" text,
  ADD COLUMN "uploaded_by" uuid REFERENCES "profiles"("id");

--> statement-breakpoint
ALTER TABLE "audit_logs"
  ADD COLUMN "ip_address" text;
