-- Migration 0034: Rename org_id → organization_id on all analytics tables
--
-- Why: All other 250+ tables in AUDT use `organization_id`. The analytics
-- tables were created with `org_id`, which creates a naming inconsistency
-- that is a developer error magnet (wrong Drizzle field in copy-paste,
-- silent query failures, cross-tenant risk).
--
-- Approach: ALTER TABLE ... RENAME COLUMN is atomic and preserves FK
-- constraints and indexes in Postgres. RLS policies reference column names
-- in stored text, so they must be dropped and recreated.
--
-- Tables affected (8 with direct org_id):
--   analytics_dashboards, analytics_reports, analytics_schedules,
--   analytics_snapshots, analytics_exports, analytics_forecasts,
--   analytics_subscriptions, analytics_kpis
--
-- analytics_widgets has no direct org_id (scoped via dashboard_id FK).

-- ── Step 1: Drop existing RLS policies (they reference "org_id" by name) ────

DROP POLICY IF EXISTS org_member_select ON analytics_dashboards;
DROP POLICY IF EXISTS org_member_insert ON analytics_dashboards;
DROP POLICY IF EXISTS org_member_update ON analytics_dashboards;
DROP POLICY IF EXISTS org_member_delete ON analytics_dashboards;

DROP POLICY IF EXISTS org_member_select ON analytics_reports;
DROP POLICY IF EXISTS org_member_insert ON analytics_reports;
DROP POLICY IF EXISTS org_member_update ON analytics_reports;
DROP POLICY IF EXISTS org_member_delete ON analytics_reports;

DROP POLICY IF EXISTS org_member_select ON analytics_schedules;
DROP POLICY IF EXISTS org_member_insert ON analytics_schedules;
DROP POLICY IF EXISTS org_member_update ON analytics_schedules;
DROP POLICY IF EXISTS org_member_delete ON analytics_schedules;

DROP POLICY IF EXISTS org_member_select ON analytics_snapshots;
DROP POLICY IF EXISTS org_member_insert ON analytics_snapshots;
DROP POLICY IF EXISTS org_member_update ON analytics_snapshots;
DROP POLICY IF EXISTS org_member_delete ON analytics_snapshots;

DROP POLICY IF EXISTS org_member_select ON analytics_exports;
DROP POLICY IF EXISTS org_member_insert ON analytics_exports;
DROP POLICY IF EXISTS org_member_update ON analytics_exports;
DROP POLICY IF EXISTS org_member_delete ON analytics_exports;

DROP POLICY IF EXISTS org_member_select ON analytics_forecasts;
DROP POLICY IF EXISTS org_member_insert ON analytics_forecasts;
DROP POLICY IF EXISTS org_member_update ON analytics_forecasts;
DROP POLICY IF EXISTS org_member_delete ON analytics_forecasts;

DROP POLICY IF EXISTS org_member_select ON analytics_subscriptions;
DROP POLICY IF EXISTS org_member_insert ON analytics_subscriptions;
DROP POLICY IF EXISTS org_member_update ON analytics_subscriptions;
DROP POLICY IF EXISTS org_member_delete ON analytics_subscriptions;

DROP POLICY IF EXISTS org_member_select ON analytics_kpis;
DROP POLICY IF EXISTS org_member_insert ON analytics_kpis;
DROP POLICY IF EXISTS org_member_update ON analytics_kpis;
DROP POLICY IF EXISTS org_member_delete ON analytics_kpis;

-- ── Step 2: Rename columns (atomic, preserves FKs and indexes) ───────────────

ALTER TABLE analytics_dashboards    RENAME COLUMN org_id TO organization_id;
ALTER TABLE analytics_reports       RENAME COLUMN org_id TO organization_id;
ALTER TABLE analytics_schedules     RENAME COLUMN org_id TO organization_id;
ALTER TABLE analytics_snapshots     RENAME COLUMN org_id TO organization_id;
ALTER TABLE analytics_exports       RENAME COLUMN org_id TO organization_id;
ALTER TABLE analytics_forecasts     RENAME COLUMN org_id TO organization_id;
ALTER TABLE analytics_subscriptions RENAME COLUMN org_id TO organization_id;
ALTER TABLE analytics_kpis          RENAME COLUMN org_id TO organization_id;

-- ── Step 3: Recreate RLS policies referencing organization_id ────────────────

-- analytics_dashboards
CREATE POLICY org_member_select ON analytics_dashboards FOR SELECT
  USING (is_org_member(organization_id));
CREATE POLICY org_member_insert ON analytics_dashboards FOR INSERT
  WITH CHECK (is_org_member(organization_id));
CREATE POLICY org_member_update ON analytics_dashboards FOR UPDATE
  USING (is_org_member(organization_id));
CREATE POLICY org_member_delete ON analytics_dashboards FOR DELETE
  USING (is_org_member(organization_id));

-- analytics_reports
CREATE POLICY org_member_select ON analytics_reports FOR SELECT
  USING (is_org_member(organization_id));
CREATE POLICY org_member_insert ON analytics_reports FOR INSERT
  WITH CHECK (is_org_member(organization_id));
CREATE POLICY org_member_update ON analytics_reports FOR UPDATE
  USING (is_org_member(organization_id));
CREATE POLICY org_member_delete ON analytics_reports FOR DELETE
  USING (is_org_member(organization_id));

-- analytics_schedules
CREATE POLICY org_member_select ON analytics_schedules FOR SELECT
  USING (is_org_member(organization_id));
CREATE POLICY org_member_insert ON analytics_schedules FOR INSERT
  WITH CHECK (is_org_member(organization_id));
CREATE POLICY org_member_update ON analytics_schedules FOR UPDATE
  USING (is_org_member(organization_id));
CREATE POLICY org_member_delete ON analytics_schedules FOR DELETE
  USING (is_org_member(organization_id));

-- analytics_snapshots
CREATE POLICY org_member_select ON analytics_snapshots FOR SELECT
  USING (is_org_member(organization_id));
CREATE POLICY org_member_insert ON analytics_snapshots FOR INSERT
  WITH CHECK (is_org_member(organization_id));
CREATE POLICY org_member_update ON analytics_snapshots FOR UPDATE
  USING (is_org_member(organization_id));
CREATE POLICY org_member_delete ON analytics_snapshots FOR DELETE
  USING (is_org_member(organization_id));

-- analytics_exports
CREATE POLICY org_member_select ON analytics_exports FOR SELECT
  USING (is_org_member(organization_id));
CREATE POLICY org_member_insert ON analytics_exports FOR INSERT
  WITH CHECK (is_org_member(organization_id));
CREATE POLICY org_member_update ON analytics_exports FOR UPDATE
  USING (is_org_member(organization_id));
CREATE POLICY org_member_delete ON analytics_exports FOR DELETE
  USING (is_org_member(organization_id));

-- analytics_forecasts
CREATE POLICY org_member_select ON analytics_forecasts FOR SELECT
  USING (is_org_member(organization_id));
CREATE POLICY org_member_insert ON analytics_forecasts FOR INSERT
  WITH CHECK (is_org_member(organization_id));
CREATE POLICY org_member_update ON analytics_forecasts FOR UPDATE
  USING (is_org_member(organization_id));
CREATE POLICY org_member_delete ON analytics_forecasts FOR DELETE
  USING (is_org_member(organization_id));

-- analytics_subscriptions
CREATE POLICY org_member_select ON analytics_subscriptions FOR SELECT
  USING (is_org_member(organization_id));
CREATE POLICY org_member_insert ON analytics_subscriptions FOR INSERT
  WITH CHECK (is_org_member(organization_id));
CREATE POLICY org_member_update ON analytics_subscriptions FOR UPDATE
  USING (is_org_member(organization_id));
CREATE POLICY org_member_delete ON analytics_subscriptions FOR DELETE
  USING (is_org_member(organization_id));

-- analytics_kpis
CREATE POLICY org_member_select ON analytics_kpis FOR SELECT
  USING (is_org_member(organization_id));
CREATE POLICY org_member_insert ON analytics_kpis FOR INSERT
  WITH CHECK (is_org_member(organization_id));
CREATE POLICY org_member_update ON analytics_kpis FOR UPDATE
  USING (is_org_member(organization_id));
CREATE POLICY org_member_delete ON analytics_kpis FOR DELETE
  USING (is_org_member(organization_id));
