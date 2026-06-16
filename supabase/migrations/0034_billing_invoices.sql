-- Migration 0034: Billing Invoices + Subscription lifecycle columns
-- Adds invoices table and extends subscriptions with cancellation/upgrade fields

-- Extend subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS requested_plan       TEXT,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cancelled_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_reason        TEXT;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id          UUID REFERENCES billing_plans(id),
  invoice_number   TEXT NOT NULL UNIQUE,
  status           TEXT NOT NULL DEFAULT 'draft',  -- draft | sent | paid | void
  amount_cents     INTEGER NOT NULL DEFAULT 0,
  currency         TEXT NOT NULL DEFAULT 'USD',
  payment_method   TEXT NOT NULL DEFAULT 'bank_transfer', -- bank_transfer | razorpay | stripe | manual
  payment_reference TEXT,
  billing_name     TEXT,
  billing_email    TEXT,
  billing_gstin    TEXT,
  notes            TEXT,
  pdf_url          TEXT,
  due_at           TIMESTAMPTZ,
  paid_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read invoices"
  ON invoices FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "org owners create invoices"
  ON invoices FOR INSERT
  WITH CHECK (has_org_role(organization_id, ARRAY['owner','admin']::public.membership_role[]));

CREATE POLICY "org owners update invoices"
  ON invoices FOR UPDATE
  USING (has_org_role(organization_id, ARRAY['owner','admin']::public.membership_role[]));

-- Index for fast org lookups
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
