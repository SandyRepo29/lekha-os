-- Migration 0037: Platform Foundation Services
-- Epic 02 Sprint 1 — Activity feed, comments, tags, notification channels/subscriptions

-- 1. platform_activity
CREATE TABLE platform_activity (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type      TEXT        NOT NULL,
  entity_id        UUID        NOT NULL,
  entity_name      TEXT,
  event_type       TEXT        NOT NULL,
  actor_id         UUID        REFERENCES auth.users(id),
  actor_name       TEXT,
  title            TEXT        NOT NULL,
  description      TEXT,
  severity         TEXT        NOT NULL DEFAULT 'info' CHECK (severity IN ('info','success','warn','error')),
  metadata         JSONB       NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE platform_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_member" ON platform_activity
  FOR ALL
  USING (is_org_member(organization_id));

CREATE INDEX idx_platform_activity_entity
  ON platform_activity (organization_id, entity_type, entity_id);

CREATE INDEX idx_platform_activity_created
  ON platform_activity (organization_id, created_at DESC);

CREATE INDEX idx_platform_activity_actor
  ON platform_activity (organization_id, actor_id);


-- 2. platform_comments
CREATE TABLE platform_comments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type      TEXT        NOT NULL,
  entity_id        UUID        NOT NULL,
  parent_id        UUID        REFERENCES platform_comments(id) ON DELETE CASCADE,
  author_id        UUID        REFERENCES auth.users(id),
  author_name      TEXT,
  body             TEXT        NOT NULL,
  is_edited        BOOLEAN     NOT NULL DEFAULT FALSE,
  is_resolved      BOOLEAN     NOT NULL DEFAULT FALSE,
  resolved_by      UUID        REFERENCES auth.users(id),
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE platform_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_member" ON platform_comments
  FOR ALL
  USING (is_org_member(organization_id));

CREATE INDEX idx_platform_comments_entity
  ON platform_comments (organization_id, entity_type, entity_id);

CREATE INDEX idx_platform_comments_parent
  ON platform_comments (parent_id);


-- 3. comment_reactions
CREATE TABLE comment_reactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  UUID        NOT NULL REFERENCES platform_comments(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id),
  emoji       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (comment_id, user_id, emoji)
);

ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_member" ON comment_reactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM platform_comments pc
      WHERE pc.id = comment_id
        AND is_org_member(pc.organization_id)
    )
  );


-- 4. platform_tags
CREATE TABLE platform_tags (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  color            TEXT        NOT NULL DEFAULT '#6366f1',
  description      TEXT,
  created_by       UUID        REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, name)
);

ALTER TABLE platform_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_member" ON platform_tags
  FOR ALL
  USING (is_org_member(organization_id));


-- 5. entity_tags
CREATE TABLE entity_tags (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tag_id           UUID        NOT NULL REFERENCES platform_tags(id) ON DELETE CASCADE,
  entity_type      TEXT        NOT NULL,
  entity_id        UUID        NOT NULL,
  tagged_by        UUID        REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tag_id, entity_type, entity_id)
);

ALTER TABLE entity_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_member" ON entity_tags
  FOR ALL
  USING (is_org_member(organization_id));

CREATE INDEX idx_entity_tags_entity
  ON entity_tags (organization_id, entity_type, entity_id);

CREATE INDEX idx_entity_tags_tag
  ON entity_tags (tag_id);


-- 6. notification_channels
CREATE TABLE notification_channels (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel_type     TEXT        NOT NULL CHECK (channel_type IN ('slack','teams','webhook','pagerduty')),
  name             TEXT        NOT NULL,
  config           JSONB       NOT NULL DEFAULT '{}',
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_by       UUID        REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_member" ON notification_channels
  FOR ALL
  USING (is_org_member(organization_id));


-- 7. notification_subscriptions
CREATE TABLE notification_subscriptions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id),
  event_type       TEXT        NOT NULL,
  channel          TEXT        NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app','email','slack','teams','webhook')),
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id, event_type, channel)
);

ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_member" ON notification_subscriptions
  FOR ALL
  USING (is_org_member(organization_id));
