-- Migration 0035: Strengthen RLS on asset junction tables
--
-- Problem: asset_risks, asset_controls, asset_vendors, asset_contracts,
-- asset_regulations, asset_ai_systems currently only check
-- is_org_member(organization_id) on the junction row itself.
-- A member of Org A could theoretically insert a junction row that links
-- their asset to a risk/control/vendor owned by Org B.
-- The application layer prevents this, but RLS should enforce it as
-- defense-in-depth (principle of least privilege).
--
-- Fix: Add EXISTS sub-selects to verify the linked entity also belongs
-- to the same org as the junction row. SELECT policies are unchanged —
-- they already only return rows for the caller's org.

-- ── asset_risks ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org_asset_risks" ON asset_risks;
CREATE POLICY "org_asset_risks" ON asset_risks FOR ALL USING (
  is_org_member(organization_id)
) WITH CHECK (
  is_org_member(organization_id)
  AND EXISTS (
    SELECT 1 FROM assets a
    WHERE a.id = asset_id AND a.organization_id = organization_id
  )
  AND EXISTS (
    SELECT 1 FROM risks r
    WHERE r.id = risk_id AND r.organization_id = organization_id
  )
);

-- ── asset_controls ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org_asset_controls" ON asset_controls;
CREATE POLICY "org_asset_controls" ON asset_controls FOR ALL USING (
  is_org_member(organization_id)
) WITH CHECK (
  is_org_member(organization_id)
  AND EXISTS (
    SELECT 1 FROM assets a
    WHERE a.id = asset_id AND a.organization_id = organization_id
  )
  AND EXISTS (
    SELECT 1 FROM controls c
    WHERE c.id = control_id AND c.organization_id = organization_id
  )
);

-- ── asset_vendors ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org_asset_vendors" ON asset_vendors;
CREATE POLICY "org_asset_vendors" ON asset_vendors FOR ALL USING (
  is_org_member(organization_id)
) WITH CHECK (
  is_org_member(organization_id)
  AND EXISTS (
    SELECT 1 FROM assets a
    WHERE a.id = asset_id AND a.organization_id = organization_id
  )
  AND EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_id AND v.organization_id = organization_id
  )
);

-- ── asset_contracts ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org_asset_contracts" ON asset_contracts;
CREATE POLICY "org_asset_contracts" ON asset_contracts FOR ALL USING (
  is_org_member(organization_id)
) WITH CHECK (
  is_org_member(organization_id)
  AND EXISTS (
    SELECT 1 FROM assets a
    WHERE a.id = asset_id AND a.organization_id = organization_id
  )
  AND EXISTS (
    SELECT 1 FROM contracts ct
    WHERE ct.id = contract_id AND ct.organization_id = organization_id
  )
);

-- ── asset_regulations ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org_asset_regs" ON asset_regulations;
CREATE POLICY "org_asset_regs" ON asset_regulations FOR ALL USING (
  is_org_member(organization_id)
) WITH CHECK (
  is_org_member(organization_id)
  AND EXISTS (
    SELECT 1 FROM assets a
    WHERE a.id = asset_id AND a.organization_id = organization_id
  )
  -- Regulations can be global (organization_id IS NULL) or org-scoped
  AND EXISTS (
    SELECT 1 FROM regulations reg
    WHERE reg.id = regulation_id
      AND (reg.organization_id IS NULL OR reg.organization_id = organization_id)
  )
);

-- ── asset_ai_systems ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org_asset_ai" ON asset_ai_systems;
CREATE POLICY "org_asset_ai" ON asset_ai_systems FOR ALL USING (
  is_org_member(organization_id)
) WITH CHECK (
  is_org_member(organization_id)
  AND EXISTS (
    SELECT 1 FROM assets a
    WHERE a.id = asset_id AND a.organization_id = organization_id
  )
  AND EXISTS (
    SELECT 1 FROM ai_systems ai
    WHERE ai.id = ai_system_id AND ai.organization_id = organization_id
  )
);
