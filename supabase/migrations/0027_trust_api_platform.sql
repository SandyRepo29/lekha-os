-- Migration 0027: Trust API Platform™
-- Module 22 — Trust API Platform™
-- Idempotent: uses IF NOT EXISTS throughout

-- ============================================================
-- 1. tap_products — public API product catalog
-- ============================================================
CREATE TABLE IF NOT EXISTS tap_products (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  slug                  text NOT NULL UNIQUE,
  description           text,
  category              text NOT NULL DEFAULT 'trust'
                          CHECK (category IN ('trust','vendor','ai','benchmark','verification','network','governance','compliance')),
  tier                  text NOT NULL DEFAULT 'free'
                          CHECK (tier IN ('free','growth','business','enterprise')),
  status                text NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','beta','deprecated','coming_soon')),
  endpoints             jsonb NOT NULL DEFAULT '[]',
  rate_limit_per_day    int  NOT NULL DEFAULT 100,
  rate_limit_per_month  int  NOT NULL DEFAULT 1000,
  documentation         text,
  version               text NOT NULL DEFAULT 'v1',
  is_public             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. tap_clients — registered API consumers
-- ============================================================
CREATE TABLE IF NOT EXISTS tap_clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  client_type     text NOT NULL DEFAULT 'application'
                    CHECK (client_type IN ('application','partner','internal','vendor','auditor','custom')),
  plan            text NOT NULL DEFAULT 'free'
                    CHECK (plan IN ('free','growth','business','enterprise')),
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','suspended','revoked')),
  website         text,
  contact_email   text,
  allowed_ips     jsonb NOT NULL DEFAULT '[]',
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tap_clients_org ON tap_clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_tap_clients_status ON tap_clients(organization_id, status);

-- ============================================================
-- 3. tap_api_keys — API keys for Trust API Platform consumers
-- ============================================================
CREATE TABLE IF NOT EXISTS tap_api_keys (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id            uuid REFERENCES tap_clients(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  key_prefix           text NOT NULL,
  key_hash             text NOT NULL,
  plan                 text NOT NULL DEFAULT 'free'
                         CHECK (plan IN ('free','growth','business','enterprise')),
  status               text NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active','revoked','expired')),
  permissions          jsonb NOT NULL DEFAULT '["read"]',
  expires_at           timestamptz,
  last_used_at         timestamptz,
  usage_count          int NOT NULL DEFAULT 0,
  rate_limit_override  int,
  created_by           uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tap_api_keys_org    ON tap_api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_tap_api_keys_prefix ON tap_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_tap_api_keys_status ON tap_api_keys(organization_id, status);

-- ============================================================
-- 4. tap_subscriptions — client subscriptions to API products
-- ============================================================
CREATE TABLE IF NOT EXISTS tap_subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id       uuid NOT NULL REFERENCES tap_clients(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL REFERENCES tap_products(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','paused','cancelled','trial')),
  subscribed_at   timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz,
  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tap_subs_org    ON tap_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_tap_subs_client ON tap_subscriptions(client_id);

-- ============================================================
-- 5. tap_usage — API usage tracking (per-request)
-- ============================================================
CREATE TABLE IF NOT EXISTS tap_usage (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id       uuid REFERENCES tap_clients(id) ON DELETE SET NULL,
  key_id          uuid REFERENCES tap_api_keys(id) ON DELETE SET NULL,
  product_id      uuid REFERENCES tap_products(id) ON DELETE SET NULL,
  endpoint        text NOT NULL,
  method          text NOT NULL DEFAULT 'GET',
  status_code     int,
  latency_ms      int,
  request_size    int,
  response_size   int,
  ip_address      text,
  user_agent      text,
  error_message   text,
  called_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tap_usage_org    ON tap_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_tap_usage_client ON tap_usage(organization_id, client_id);
CREATE INDEX IF NOT EXISTS idx_tap_usage_called ON tap_usage(organization_id, called_at DESC);

-- ============================================================
-- 6. tap_webhooks — webhook endpoint registrations
-- ============================================================
CREATE TABLE IF NOT EXISTS tap_webhooks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id         uuid REFERENCES tap_clients(id) ON DELETE CASCADE,
  name              text NOT NULL,
  url               text NOT NULL,
  secret            text,
  events            jsonb NOT NULL DEFAULT '[]',
  status            text NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','paused','failed')),
  failure_count     int NOT NULL DEFAULT 0,
  last_triggered_at timestamptz,
  last_status_code  int,
  created_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tap_webhooks_org    ON tap_webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tap_webhooks_status ON tap_webhooks(organization_id, status);

-- ============================================================
-- 7. tap_webhook_deliveries — webhook delivery log
-- ============================================================
CREATE TABLE IF NOT EXISTS tap_webhook_deliveries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  webhook_id      uuid NOT NULL REFERENCES tap_webhooks(id) ON DELETE CASCADE,
  event_type      text NOT NULL,
  payload         jsonb NOT NULL DEFAULT '{}',
  status_code     int,
  response_body   text,
  attempt_count   int NOT NULL DEFAULT 1,
  delivered_at    timestamptz,
  failed_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tap_deliveries_webhook ON tap_webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_tap_deliveries_org     ON tap_webhook_deliveries(organization_id, created_at DESC);

-- ============================================================
-- 8. tap_rate_limits — per-client rate limit windows
-- ============================================================
CREATE TABLE IF NOT EXISTS tap_rate_limits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id       uuid REFERENCES tap_clients(id) ON DELETE CASCADE,
  key_id          uuid REFERENCES tap_api_keys(id) ON DELETE CASCADE,
  limit_type      text NOT NULL DEFAULT 'per_day'
                    CHECK (limit_type IN ('per_minute','per_hour','per_day','per_month')),
  limit_value     int NOT NULL DEFAULT 100,
  current_count   int NOT NULL DEFAULT 0,
  window_start    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. tap_audit_events — audit trail for TAP admin actions
-- ============================================================
CREATE TABLE IF NOT EXISTS tap_audit_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_type      text NOT NULL,
  resource_type   text,
  resource_id     text,
  details         jsonb NOT NULL DEFAULT '{}',
  ip_address      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tap_audit_org   ON tap_audit_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_tap_audit_event ON tap_audit_events(organization_id, event_type);

-- ============================================================
-- Row-Level Security
-- ============================================================
ALTER TABLE tap_clients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tap_api_keys          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tap_subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tap_usage             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tap_webhooks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tap_webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tap_rate_limits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tap_audit_events      ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- tap_clients
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tap_clients' AND policyname='tap_clients_org') THEN
    CREATE POLICY tap_clients_org ON tap_clients
      USING (is_org_member(organization_id));
  END IF;

  -- tap_api_keys
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tap_api_keys' AND policyname='tap_api_keys_org') THEN
    CREATE POLICY tap_api_keys_org ON tap_api_keys
      USING (is_org_member(organization_id));
  END IF;

  -- tap_subscriptions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tap_subscriptions' AND policyname='tap_subscriptions_org') THEN
    CREATE POLICY tap_subscriptions_org ON tap_subscriptions
      USING (is_org_member(organization_id));
  END IF;

  -- tap_usage
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tap_usage' AND policyname='tap_usage_org') THEN
    CREATE POLICY tap_usage_org ON tap_usage
      USING (is_org_member(organization_id));
  END IF;

  -- tap_webhooks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tap_webhooks' AND policyname='tap_webhooks_org') THEN
    CREATE POLICY tap_webhooks_org ON tap_webhooks
      USING (is_org_member(organization_id));
  END IF;

  -- tap_webhook_deliveries
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tap_webhook_deliveries' AND policyname='tap_deliveries_org') THEN
    CREATE POLICY tap_deliveries_org ON tap_webhook_deliveries
      USING (is_org_member(organization_id));
  END IF;

  -- tap_rate_limits
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tap_rate_limits' AND policyname='tap_rate_limits_org') THEN
    CREATE POLICY tap_rate_limits_org ON tap_rate_limits
      USING (is_org_member(organization_id));
  END IF;

  -- tap_audit_events
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tap_audit_events' AND policyname='tap_audit_events_org') THEN
    CREATE POLICY tap_audit_events_org ON tap_audit_events
      USING (is_org_member(organization_id));
  END IF;
END $$;

-- ============================================================
-- Seed: API Product Catalog (global, no org_id)
-- ============================================================
INSERT INTO tap_products (name, slug, description, category, tier, status, endpoints, rate_limit_per_day, rate_limit_per_month, version)
VALUES
  ('Trust Score API™',       'trust-score',       'Real-time organizational trust score, components, history, and trend analysis.',            'trust',       'free',       'active',       '["GET /api/v1/public/trust-score"]',                           100,    1000,   'v1'),
  ('Vendor Trust API™',      'vendor-trust',       'Vendor trust scores, risk levels, verification status, and certification data.',            'vendor',      'growth',     'active',       '["GET /api/v1/public/vendor-trust"]',                          1000,   10000,  'v1'),
  ('AI Trust API™',          'ai-trust',          'AI system trust scores, risk ratings, compliance status, and governance maturity.',          'ai',          'business',   'active',       '["GET /api/v1/public/ai-trust"]',                              5000,   50000,  'v1'),
  ('Benchmark API™',         'benchmarking',      'Industry percentile rankings, peer comparison, and governance maturity benchmarks.',         'benchmark',   'growth',     'active',       '["GET /api/v1/public/benchmarking"]',                          1000,   10000,  'v1'),
  ('Verification API™',      'verification',      'Trust badge verification, certification status, audit results, and compliance proofs.',      'verification','free',       'active',       '["GET /api/v1/public/verification"]',                          100,    1000,   'v1'),
  ('Trust Network API™',     'trust-network',     'Public trust profiles, network reputation, relationships, and activity feed.',              'network',     'growth',     'active',       '["GET /api/v1/public/trust-network"]',                         1000,   10000,  'v1'),
  ('Governance Insights API™','governance-insights','Governance recommendations, risk trends, trust drivers, and governance signals.',           'governance',  'business',   'active',       '["GET /api/v1/public/governance-insights"]',                   5000,   50000,  'v1'),
  ('Compliance Readiness API™','compliance-readiness','Framework readiness scores, gap counts, control health, and audit readiness metrics.',    'compliance',  'enterprise', 'active',       '["GET /api/v1/public/compliance-readiness"]',                  10000,  100000, 'v1')
ON CONFLICT (slug) DO NOTHING;
