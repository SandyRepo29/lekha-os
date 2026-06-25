-- Migration 0034: Billing Engine
-- Provider-agnostic billing platform: payment transactions, finance console, coupons, credits, tax rates

-- ============================================================
-- 1. ALTER existing subscriptions table
-- ============================================================

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enterprise_contract BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS net_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_provider_slug TEXT DEFAULT 'bank_transfer';

-- Widen status to TEXT (drop enum constraint if any, then retype)
ALTER TABLE subscriptions ALTER COLUMN status TYPE TEXT USING status::TEXT;

-- ============================================================
-- 2. ALTER existing invoices table
-- ============================================================

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS payment_provider_slug TEXT DEFAULT 'bank_transfer',
  ADD COLUMN IF NOT EXISTS tax_amount_cents BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_name TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount_cents BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS purchase_order_number TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT,
  ADD COLUMN IF NOT EXISTS subtotal_cents BIGINT,
  ADD COLUMN IF NOT EXISTS total_cents BIGINT;

ALTER TABLE invoices ALTER COLUMN status TYPE TEXT USING status::TEXT;

-- ============================================================
-- 3. NEW TABLE: payment_providers
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  supports_online BOOLEAN DEFAULT false,
  supports_offline BOOLEAN DEFAULT true,
  config_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. NEW TABLE: payment_transactions
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  provider_slug TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  provider_reference TEXT,
  payment_proof_url TEXT,
  notes TEXT,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_transactions_org_idx ON payment_transactions(organization_id);
CREATE INDEX IF NOT EXISTS payment_transactions_invoice_idx ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS payment_transactions_status_idx ON payment_transactions(status);

-- ============================================================
-- 5. NEW TABLE: finance_actions
-- ============================================================

CREATE TABLE IF NOT EXISTS finance_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  notes TEXT,
  amount_cents BIGINT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_actions_org_idx ON finance_actions(organization_id);
CREATE INDEX IF NOT EXISTS finance_actions_invoice_idx ON finance_actions(invoice_id);
CREATE INDEX IF NOT EXISTS finance_actions_transaction_idx ON finance_actions(transaction_id);

-- ============================================================
-- 6. NEW TABLE: coupons
-- ============================================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL,
  discount_value BIGINT NOT NULL,
  currency TEXT DEFAULT 'INR',
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  applicable_plan_slugs TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons(code);
CREATE INDEX IF NOT EXISTS coupons_active_idx ON coupons(is_active);

-- ============================================================
-- 7. NEW TABLE: billing_credits
-- ============================================================

CREATE TABLE IF NOT EXISTS billing_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'credit',
  expires_at TIMESTAMPTZ,
  applied_to_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS billing_credits_org_idx ON billing_credits(organization_id);

-- ============================================================
-- 8. NEW TABLE: tax_rates
-- ============================================================

CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  rate DECIMAL(5,4) NOT NULL,
  country TEXT,
  region TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. NEW TABLE: bank_details
-- ============================================================

CREATE TABLE IF NOT EXISTS bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT,
  swift_code TEXT,
  account_type TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. SEED: payment_providers
-- ============================================================

INSERT INTO payment_providers (slug, name, description, is_active, supports_online, supports_offline)
VALUES
  ('manual_invoice', 'Manual Invoice', 'Generate and send invoices manually; track payment offline', true, false, true),
  ('bank_transfer', 'Bank Transfer / NEFT / RTGS', 'Direct bank transfer via NEFT, RTGS, or IMPS; submit UTR for verification', true, false, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 11. SEED: tax_rates
-- ============================================================

INSERT INTO tax_rates (name, slug, rate, country, description, is_active)
VALUES
  ('GST 18%', 'gst_18', 0.1800, 'IN', 'Goods and Services Tax at 18% — standard rate for SaaS in India', true),
  ('GST 0%', 'gst_0', 0.0000, 'IN', 'GST at 0% — applicable to zero-rated exports of software services', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 12. SEED: bank_details
-- ============================================================

INSERT INTO bank_details (name, bank_name, account_number, ifsc_code, account_type, currency, is_primary, is_active)
VALUES
  ('AUDT Technologies Pvt Ltd', 'HDFC Bank', 'XXXXXXXXXXXXXXXX', 'HDFC0000000', 'current', 'INR', true, true);

-- ============================================================
-- 13. RLS: Enable on all new tables
-- ============================================================

ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_details ENABLE ROW LEVEL SECURITY;

-- payment_providers, tax_rates, bank_details: global SELECT for authenticated
CREATE POLICY "payment_providers_select_auth" ON payment_providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "tax_rates_select_auth" ON tax_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "bank_details_select_auth" ON bank_details FOR SELECT TO authenticated USING (true);

-- payment_transactions: org-scoped
CREATE POLICY "payment_transactions_select_org_member" ON payment_transactions FOR SELECT TO authenticated USING (is_org_member(organization_id));
CREATE POLICY "payment_transactions_insert_org_admin" ON payment_transactions FOR INSERT TO authenticated WITH CHECK (has_org_role(organization_id, ARRAY['owner', 'admin']));
CREATE POLICY "payment_transactions_update_org_admin" ON payment_transactions FOR UPDATE TO authenticated USING (has_org_role(organization_id, ARRAY['owner', 'admin']));

-- finance_actions: org-scoped
CREATE POLICY "finance_actions_select_org_member" ON finance_actions FOR SELECT TO authenticated USING (is_org_member(organization_id));
CREATE POLICY "finance_actions_insert_org_admin" ON finance_actions FOR INSERT TO authenticated WITH CHECK (has_org_role(organization_id, ARRAY['owner', 'admin']));

-- coupons: readable by all authenticated, writable by any admin
CREATE POLICY "coupons_select_auth" ON coupons FOR SELECT TO authenticated USING (true);
CREATE POLICY "coupons_insert_admin" ON coupons FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.role IN ('owner', 'admin') AND m.is_active = true)
);

-- billing_credits: org-scoped
CREATE POLICY "billing_credits_select_org_member" ON billing_credits FOR SELECT TO authenticated USING (is_org_member(organization_id));
CREATE POLICY "billing_credits_insert_org_admin" ON billing_credits FOR INSERT TO authenticated WITH CHECK (has_org_role(organization_id, ARRAY['owner', 'admin']));
