-- Migration 0024: Executive Reporting & Analytics™
-- Module 19 — Executive Reporting & Analytics™
-- Idempotent: uses IF NOT EXISTS throughout

-- ============================================================
-- 1. analytics_dashboards
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_dashboards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  dashboard_type  text NOT NULL CHECK (dashboard_type IN ('ceo','cro','ciso','compliance','board','custom')),
  description     text,
  layout_config   jsonb NOT NULL DEFAULT '{}',
  is_default      boolean NOT NULL DEFAULT false,
  is_shared       boolean NOT NULL DEFAULT false,
  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. analytics_widgets
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_widgets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id  uuid NOT NULL REFERENCES analytics_dashboards(id) ON DELETE CASCADE,
  widget_type   text NOT NULL,
  title         text NOT NULL,
  config        jsonb NOT NULL DEFAULT '{}',
  position_x    int NOT NULL DEFAULT 0,
  position_y    int NOT NULL DEFAULT 0,
  width         int NOT NULL DEFAULT 4,
  height        int NOT NULL DEFAULT 3,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. analytics_reports
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  report_type     text NOT NULL CHECK (report_type IN (
                    'board_governance','risk_committee','audit_committee',
                    'privacy_governance','vendor_governance','contract_governance',
                    'executive_governance','trust_intelligence'
                  )),
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generating','ready','failed')),
  format          text NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf','excel','csv','pptx','json')),
  config          jsonb NOT NULL DEFAULT '{}',
  content_snapshot jsonb NOT NULL DEFAULT '{}',
  file_path       text,
  generated_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  generated_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. analytics_schedules
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_schedules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             text NOT NULL,
  report_type      text NOT NULL,
  frequency        text NOT NULL CHECK (frequency IN ('daily','weekly','monthly','quarterly','annually')),
  delivery_method  text NOT NULL DEFAULT 'email' CHECK (delivery_method IN ('email','pdf','link')),
  recipients       jsonb NOT NULL DEFAULT '[]',
  config           jsonb NOT NULL DEFAULT '{}',
  is_active        boolean NOT NULL DEFAULT true,
  last_run_at      timestamptz,
  next_run_at      timestamptz,
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. analytics_snapshots
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_date    date NOT NULL,
  kpi_data         jsonb NOT NULL DEFAULT '{}',
  trend_data       jsonb NOT NULL DEFAULT '{}',
  benchmark_data   jsonb NOT NULL DEFAULT '{}',
  forecast_data    jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, snapshot_date)
);

-- ============================================================
-- 6. analytics_exports
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_exports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_id    uuid REFERENCES analytics_reports(id) ON DELETE SET NULL,
  export_type  text NOT NULL,
  format       text NOT NULL,
  file_path    text,
  file_size    bigint,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','failed')),
  exported_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. analytics_forecasts
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_forecasts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_name      text NOT NULL,
  horizon_days     int NOT NULL CHECK (horizon_days IN (30,90,180,365)),
  current_value    numeric(5,2),
  forecast_value   numeric(5,2),
  confidence_score numeric(5,2),
  forecast_data    jsonb NOT NULL DEFAULT '[]',
  generated_at     timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. analytics_subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  schedule_id  uuid REFERENCES analytics_schedules(id) ON DELETE CASCADE,
  report_type  text NOT NULL,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (schedule_id, user_id)
);

-- ============================================================
-- 9. analytics_kpis
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_kpis (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kpi_key         text NOT NULL,
  kpi_name        text NOT NULL,
  current_value   numeric(10,2),
  previous_value  numeric(10,2),
  target_value    numeric(10,2),
  unit            text,
  trend           text CHECK (trend IN ('up','down','stable')),
  period          text,
  computed_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, kpi_key)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_org_id
  ON analytics_dashboards (org_id);

CREATE INDEX IF NOT EXISTS idx_analytics_reports_org_type
  ON analytics_reports (org_id, report_type);

CREATE INDEX IF NOT EXISTS idx_analytics_reports_org_status
  ON analytics_reports (org_id, status);

CREATE INDEX IF NOT EXISTS idx_analytics_schedules_org_active
  ON analytics_schedules (org_id, is_active);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_org_date
  ON analytics_snapshots (org_id, snapshot_date);

CREATE INDEX IF NOT EXISTS idx_analytics_forecasts_org_metric
  ON analytics_forecasts (org_id, metric_name);

CREATE INDEX IF NOT EXISTS idx_analytics_kpis_org_id
  ON analytics_kpis (org_id);

-- ============================================================
-- Row-Level Security
-- ============================================================

ALTER TABLE analytics_dashboards      ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_widgets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_schedules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_exports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_forecasts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_kpis            ENABLE ROW LEVEL SECURITY;

-- analytics_dashboards
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_dashboards' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON analytics_dashboards FOR SELECT
      USING (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_dashboards' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON analytics_dashboards FOR INSERT
      WITH CHECK (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_dashboards' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON analytics_dashboards FOR UPDATE
      USING (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_dashboards' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON analytics_dashboards FOR DELETE
      USING (is_org_member(org_id));
  END IF;
END $$;

-- analytics_widgets (org_id via dashboard join)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_widgets' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON analytics_widgets FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM analytics_dashboards d
        WHERE d.id = dashboard_id AND is_org_member(d.org_id)
      ));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_widgets' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON analytics_widgets FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM analytics_dashboards d
        WHERE d.id = dashboard_id AND is_org_member(d.org_id)
      ));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_widgets' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON analytics_widgets FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM analytics_dashboards d
        WHERE d.id = dashboard_id AND is_org_member(d.org_id)
      ));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_widgets' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON analytics_widgets FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM analytics_dashboards d
        WHERE d.id = dashboard_id AND is_org_member(d.org_id)
      ));
  END IF;
END $$;

-- analytics_reports
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_reports' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON analytics_reports FOR SELECT
      USING (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_reports' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON analytics_reports FOR INSERT
      WITH CHECK (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_reports' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON analytics_reports FOR UPDATE
      USING (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_reports' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON analytics_reports FOR DELETE
      USING (is_org_member(org_id));
  END IF;
END $$;

-- analytics_schedules
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_schedules' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON analytics_schedules FOR SELECT
      USING (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_schedules' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON analytics_schedules FOR INSERT
      WITH CHECK (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_schedules' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON analytics_schedules FOR UPDATE
      USING (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_schedules' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON analytics_schedules FOR DELETE
      USING (is_org_member(org_id));
  END IF;
END $$;

-- analytics_snapshots
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_snapshots' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON analytics_snapshots FOR SELECT
      USING (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_snapshots' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON analytics_snapshots FOR INSERT
      WITH CHECK (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_snapshots' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON analytics_snapshots FOR UPDATE
      USING (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_snapshots' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON analytics_snapshots FOR DELETE
      USING (is_org_member(org_id));
  END IF;
END $$;

-- analytics_exports
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_exports' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON analytics_exports FOR SELECT
      USING (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_exports' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON analytics_exports FOR INSERT
      WITH CHECK (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_exports' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON analytics_exports FOR UPDATE
      USING (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_exports' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON analytics_exports FOR DELETE
      USING (is_org_member(org_id));
  END IF;
END $$;

-- analytics_forecasts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_forecasts' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON analytics_forecasts FOR SELECT
      USING (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_forecasts' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON analytics_forecasts FOR INSERT
      WITH CHECK (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_forecasts' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON analytics_forecasts FOR UPDATE
      USING (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_forecasts' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON analytics_forecasts FOR DELETE
      USING (is_org_member(org_id));
  END IF;
END $$;

-- analytics_subscriptions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_subscriptions' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON analytics_subscriptions FOR SELECT
      USING (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_subscriptions' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON analytics_subscriptions FOR INSERT
      WITH CHECK (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_subscriptions' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON analytics_subscriptions FOR UPDATE
      USING (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_subscriptions' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON analytics_subscriptions FOR DELETE
      USING (is_org_member(org_id));
  END IF;
END $$;

-- analytics_kpis
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_kpis' AND policyname = 'org_member_select'
  ) THEN
    CREATE POLICY org_member_select ON analytics_kpis FOR SELECT
      USING (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_kpis' AND policyname = 'org_member_insert'
  ) THEN
    CREATE POLICY org_member_insert ON analytics_kpis FOR INSERT
      WITH CHECK (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_kpis' AND policyname = 'org_member_update'
  ) THEN
    CREATE POLICY org_member_update ON analytics_kpis FOR UPDATE
      USING (is_org_member(org_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_kpis' AND policyname = 'org_member_delete'
  ) THEN
    CREATE POLICY org_member_delete ON analytics_kpis FOR DELETE
      USING (is_org_member(org_id));
  END IF;
END $$;
