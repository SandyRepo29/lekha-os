-- Module 9: Trust Graph™
-- Governance knowledge graph — nodes and edges for entity relationships

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE graph_entity_type AS ENUM (
  'vendor', 'evidence', 'control', 'risk', 'audit',
  'finding', 'policy', 'framework', 'trust_score', 'org_trust'
);

CREATE TYPE graph_relationship_type AS ENUM (
  'vendor_provides_evidence',
  'vendor_has_risk',
  'vendor_linked_control',
  'vendor_has_audit',
  'evidence_supports_control',
  'evidence_in_framework',
  'control_reduces_risk',
  'control_in_audit',
  'control_supported_by_policy',
  'control_in_framework',
  'audit_has_finding',
  'finding_creates_risk',
  'policy_in_framework',
  'risk_affects_trust_score',
  'trust_score_affects_org_trust'
);

-- ─── Graph Nodes ─────────────────────────────────────────────────────────────

CREATE TABLE graph_nodes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type      graph_entity_type NOT NULL,
  entity_id        UUID NOT NULL,
  name             TEXT NOT NULL,
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX graph_nodes_org_idx ON graph_nodes(organization_id);
CREATE INDEX graph_nodes_entity_idx ON graph_nodes(organization_id, entity_type);
CREATE UNIQUE INDEX graph_nodes_entity_uniq ON graph_nodes(organization_id, entity_type, entity_id);

-- ─── Graph Edges ─────────────────────────────────────────────────────────────

CREATE TABLE graph_edges (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_node_id    UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
  target_node_id    UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
  relationship_type graph_relationship_type NOT NULL,
  strength          INTEGER NOT NULL DEFAULT 50 CHECK (strength >= 1 AND strength <= 100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX graph_edges_org_idx ON graph_edges(organization_id);
CREATE INDEX graph_edges_source_idx ON graph_edges(source_node_id);
CREATE INDEX graph_edges_target_idx ON graph_edges(target_node_id);
CREATE UNIQUE INDEX graph_edges_uniq ON graph_edges(organization_id, source_node_id, target_node_id, relationship_type);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read graph nodes"
  ON graph_nodes FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "org members can manage graph nodes"
  ON graph_nodes FOR ALL
  USING (is_org_member(organization_id));

CREATE POLICY "org members can read graph edges"
  ON graph_edges FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "org members can manage graph edges"
  ON graph_edges FOR ALL
  USING (is_org_member(organization_id));
