-- Trust Network™ — Public Trust Infrastructure Layer
-- Module 18: network_profile_views + network_followers

-- Profile view tracking (anonymous + authenticated)
CREATE TABLE IF NOT EXISTS network_profile_views (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewed_org_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  viewer_org_id   uuid REFERENCES organizations(id) ON DELETE SET NULL,
  viewed_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_npv_viewed_org   ON network_profile_views(viewed_org_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_npv_viewer_org   ON network_profile_views(viewer_org_id) WHERE viewer_org_id IS NOT NULL;

-- Network follower graph
CREATE TABLE IF NOT EXISTS network_followers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  following_org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_org_id, following_org_id)
);

CREATE INDEX IF NOT EXISTS idx_nf_follower  ON network_followers(follower_org_id);
CREATE INDEX IF NOT EXISTS idx_nf_following ON network_followers(following_org_id);

-- RLS
ALTER TABLE network_profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_followers     ENABLE ROW LEVEL SECURITY;

-- Orgs can see views of their own profile
CREATE POLICY "npv_select_own"  ON network_profile_views FOR SELECT USING (is_org_member(viewed_org_id));
CREATE POLICY "npv_insert_any"  ON network_profile_views FOR INSERT WITH CHECK (true);

-- Orgs can see their followers + who they follow
CREATE POLICY "nf_select" ON network_followers
  FOR SELECT USING (is_org_member(follower_org_id) OR is_org_member(following_org_id));
CREATE POLICY "nf_insert" ON network_followers
  FOR INSERT WITH CHECK (is_org_member(follower_org_id));
CREATE POLICY "nf_delete" ON network_followers
  FOR DELETE USING (is_org_member(follower_org_id));
