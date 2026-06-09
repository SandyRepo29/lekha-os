import { getGraphForOrg, getNodeWithNeighbours, countNodesByType } from "@/lib/repositories/trust-graph-repo";
import type { GraphNode, GraphEdge } from "@/lib/db/schema";

export type EntityColor = {
  fill: string;
  stroke: string;
  text: string;
};

export const ENTITY_COLORS: Record<string, EntityColor> = {
  vendor:      { fill: "#3b82f6", stroke: "#60a5fa", text: "#dbeafe" },
  evidence:    { fill: "#8b5cf6", stroke: "#a78bfa", text: "#ede9fe" },
  control:     { fill: "#10b981", stroke: "#34d399", text: "#d1fae5" },
  risk:        { fill: "#ef4444", stroke: "#f87171", text: "#fee2e2" },
  audit:       { fill: "#f59e0b", stroke: "#fbbf24", text: "#fef3c7" },
  finding:     { fill: "#f97316", stroke: "#fb923c", text: "#ffedd5" },
  policy:      { fill: "#06b6d4", stroke: "#22d3ee", text: "#cffafe" },
  framework:   { fill: "#6366f1", stroke: "#818cf8", text: "#e0e7ff" },
  trust_score: { fill: "#ec4899", stroke: "#f472b6", text: "#fce7f3" },
  org_trust:   { fill: "#14b8a6", stroke: "#2dd4bf", text: "#ccfbf1" },
};

export const ENTITY_LABELS: Record<string, string> = {
  vendor: "Vendor", evidence: "Evidence", control: "Control",
  risk: "Risk", audit: "Audit", finding: "Finding",
  policy: "Policy", framework: "Framework",
  trust_score: "Trust Score", org_trust: "Org Trust",
};

export const RELATIONSHIP_LABELS: Record<string, string> = {
  vendor_provides_evidence: "provides evidence",
  vendor_has_risk: "has risk",
  vendor_linked_control: "linked to control",
  vendor_has_audit: "audited via",
  evidence_supports_control: "supports control",
  evidence_in_framework: "in framework",
  control_reduces_risk: "reduces risk",
  control_in_audit: "audited in",
  control_supported_by_policy: "supported by policy",
  control_in_framework: "in framework",
  audit_has_finding: "has finding",
  finding_creates_risk: "creates risk",
  policy_in_framework: "in framework",
  risk_affects_trust_score: "affects trust",
  trust_score_affects_org_trust: "affects org trust",
};

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metrics: {
    totalNodes: number;
    totalEdges: number;
    entityCounts: Record<string, number>;
    mostConnectedNode: { nodeId: string; name: string; entityType: string; connections: number } | null;
    relationshipCounts: Record<string, number>;
  };
}

export async function getGraphData(orgId: string): Promise<GraphData> {
  const { nodes, edges } = await getGraphForOrg(orgId);

  // Compute connection counts per node
  const connectionMap = new Map<string, number>();
  for (const e of edges) {
    connectionMap.set(e.sourceNodeId, (connectionMap.get(e.sourceNodeId) ?? 0) + 1);
    connectionMap.set(e.targetNodeId, (connectionMap.get(e.targetNodeId) ?? 0) + 1);
  }

  let mostConnectedNode: GraphData["metrics"]["mostConnectedNode"] = null;
  let maxConn = 0;
  for (const [nodeId, count] of connectionMap.entries()) {
    if (count > maxConn) {
      maxConn = count;
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        mostConnectedNode = { nodeId, name: node.name, entityType: node.entityType, connections: count };
      }
    }
  }

  const entityCounts: Record<string, number> = {};
  for (const n of nodes) entityCounts[n.entityType] = (entityCounts[n.entityType] ?? 0) + 1;

  const relationshipCounts: Record<string, number> = {};
  for (const e of edges) relationshipCounts[e.relationshipType] = (relationshipCounts[e.relationshipType] ?? 0) + 1;

  return {
    nodes,
    edges,
    metrics: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      entityCounts,
      mostConnectedNode,
      relationshipCounts,
    },
  };
}

export interface RootCauseResult {
  subject: string;
  causes: Array<{
    entityType: string;
    name: string;
    entityId: string;
    relationship: string;
    depth: number;
    impact: string;
  }>;
  summary: string;
}

/** Trace root causes for a given node by traversing incoming edges up to depth 3. */
export async function getRootCause(orgId: string, nodeId: string): Promise<RootCauseResult | null> {
  const result = await getNodeWithNeighbours(orgId, nodeId);
  if (!result) return null;

  const { node, edgesIn, neighbours } = result;

  const causes = edgesIn.map(e => {
    const source = neighbours.find(n => n.id === e.sourceNodeId);
    if (!source) return null;
    return {
      entityType: source.entityType,
      name: source.name,
      entityId: source.entityId,
      relationship: RELATIONSHIP_LABELS[e.relationshipType] ?? e.relationshipType,
      depth: 1,
      impact: e.strength >= 80 ? "High" : e.strength >= 60 ? "Medium" : "Low",
    };
  }).filter(Boolean) as RootCauseResult["causes"];

  const summary = causes.length === 0
    ? `No upstream causes found for ${node.name}.`
    : `${node.name} is affected by ${causes.length} upstream factor(s): ${causes.slice(0, 3).map(c => c.name).join(", ")}.`;

  return { subject: node.name, causes, summary };
}

export interface ImpactResult {
  subject: string;
  impacts: Array<{
    entityType: string;
    name: string;
    entityId: string;
    relationship: string;
    depth: number;
    severity: string;
  }>;
  summary: string;
}

/** Show what downstream entities would be impacted if this node degrades. */
export async function getImpactAnalysis(orgId: string, nodeId: string): Promise<ImpactResult | null> {
  const result = await getNodeWithNeighbours(orgId, nodeId);
  if (!result) return null;

  const { node, edgesOut, neighbours } = result;

  const impacts = edgesOut.map(e => {
    const target = neighbours.find(n => n.id === e.targetNodeId);
    if (!target) return null;
    return {
      entityType: target.entityType,
      name: target.name,
      entityId: target.entityId,
      relationship: RELATIONSHIP_LABELS[e.relationshipType] ?? e.relationshipType,
      depth: 1,
      severity: e.strength >= 80 ? "Critical" : e.strength >= 60 ? "High" : "Medium",
    };
  }).filter(Boolean) as ImpactResult["impacts"];

  const summary = impacts.length === 0
    ? `${node.name} has no tracked downstream dependencies.`
    : `If ${node.name} fails, it would affect ${impacts.length} downstream entity/entities: ${impacts.slice(0, 3).map(i => i.name).join(", ")}.`;

  return { subject: node.name, impacts, summary };
}
