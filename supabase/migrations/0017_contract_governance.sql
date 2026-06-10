-- ============================================================
-- Module 12: Contract Governance™
-- ============================================================

-- Enums
CREATE TYPE contract_type AS ENUM ('vendor_agreement','msa','sow','nda','dpa','employment','partner_agreement','procurement','custom');
CREATE TYPE contract_status AS ENUM ('draft','review','negotiation','active','expiring','expired','renewed','terminated','archived');
CREATE TYPE clause_category AS ENUM ('privacy','security','financial','operational','legal','compliance','termination','renewal','custom');
CREATE TYPE obligation_status AS ENUM ('open','in_progress','completed','overdue','waived');
CREATE TYPE clause_risk_level AS ENUM ('low','medium','high','critical');

-- ── contracts ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  contract_type contract_type NOT NULL DEFAULT 'vendor_agreement',
  status contract_status NOT NULL DEFAULT 'draft',
  effective_date DATE,
  expiry_date DATE,
  renewal_date DATE,
  notice_period_days INTEGER NOT NULL DEFAULT 30,
  auto_renewal BOOLEAN NOT NULL DEFAULT false,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  value NUMERIC(15,2),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  storage_path TEXT,
  ai_summary TEXT,
  trust_score INTEGER,
  trust_score_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contracts_org_idx ON contracts(organization_id);
CREATE INDEX IF NOT EXISTS contracts_status_idx ON contracts(organization_id, status);
CREATE INDEX IF NOT EXISTS contracts_vendor_idx ON contracts(vendor_id);
CREATE INDEX IF NOT EXISTS contracts_expiry_idx ON contracts(organization_id, expiry_date);

-- ── contract_clauses ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category clause_category NOT NULL DEFAULT 'legal',
  content TEXT NOT NULL,
  risk_level clause_risk_level NOT NULL DEFAULT 'low',
  ai_analysis TEXT,
  is_missing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contract_clauses_contract_idx ON contract_clauses(contract_id);

-- ── contract_obligations ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE,
  status obligation_status NOT NULL DEFAULT 'open',
  risk_level clause_risk_level NOT NULL DEFAULT 'low',
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contract_obligations_contract_idx ON contract_obligations(contract_id);
CREATE INDEX IF NOT EXISTS contract_obligations_org_idx ON contract_obligations(organization_id);
CREATE INDEX IF NOT EXISTS contract_obligations_status_idx ON contract_obligations(organization_id, status);
CREATE INDEX IF NOT EXISTS contract_obligations_due_idx ON contract_obligations(organization_id, due_date);

-- ── contract_risks ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contract_id, risk_id)
);

CREATE INDEX IF NOT EXISTS contract_risks_contract_idx ON contract_risks(contract_id);

-- ── contract_controls ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contract_id, control_id)
);

CREATE INDEX IF NOT EXISTS contract_controls_contract_idx ON contract_controls(contract_id);

-- ── contract_policies ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contract_id, policy_id)
);

CREATE INDEX IF NOT EXISTS contract_policies_contract_idx ON contract_policies(contract_id);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members access contracts" ON contracts FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "org members access contract_clauses" ON contract_clauses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_id AND is_org_member(c.organization_id))
  );

CREATE POLICY "org members access contract_obligations" ON contract_obligations FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "org members access contract_risks" ON contract_risks FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "org members access contract_controls" ON contract_controls FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "org members access contract_policies" ON contract_policies FOR ALL USING (is_org_member(organization_id));
