import { db } from "@/lib/db";
import {
  graphNodes, graphEdges,
  vendors, evidence as evidenceTable, controls, risks,
  audits, auditFindings, policies, frameworks,
  vendorDocuments, riskVendors, riskControls, riskFindings,
  riskPolicies, riskFrameworks, riskEvidence,
  controlFrameworks, controlVendors, controlEvidenceMappings,
  auditPrograms, policyControls, policyFrameworks as policyFrameworksTable,
  contracts, contractRisks, contractControls, contractPolicies,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export type GraphEntityType =
  | "vendor" | "evidence" | "control" | "risk"
  | "audit" | "finding" | "policy" | "framework"
  | "trust_score" | "org_trust" | "contract";

export type GraphRelationshipType =
  | "vendor_provides_evidence" | "vendor_has_risk" | "vendor_linked_control"
  | "vendor_has_audit" | "evidence_supports_control" | "evidence_in_framework"
  | "control_reduces_risk" | "control_in_audit" | "control_supported_by_policy"
  | "control_in_framework" | "audit_has_finding" | "finding_creates_risk"
  | "policy_in_framework" | "risk_affects_trust_score" | "trust_score_affects_org_trust"
  | "contract_with_vendor" | "contract_linked_risk" | "contract_linked_policy" | "contract_linked_control";

export interface RawNode {
  entityType: GraphEntityType;
  entityId: string;
  name: string;
  metadata: Record<string, unknown>;
}

export interface RawEdge {
  sourceEntityType: GraphEntityType;
  sourceEntityId: string;
  targetEntityType: GraphEntityType;
  targetEntityId: string;
  relationshipType: GraphRelationshipType;
  strength: number;
}

/** Fetch all raw entity data needed to build the graph for an org. */
export async function fetchGraphSourceData(orgId: string) {
  const [
    vendorRows,
    evidenceRows,
    controlRows,
    riskRows,
    auditRows,
    findingRows,
    policyRows,
    frameworkRows,
    riskVendorRows,
    riskControlRows,
    riskFindingRows,
    riskPolicyRows,
    riskFrameworkRows,
    riskEvidenceRows,
    ctrlFrameworkRows,
    ctrlVendorRows,
    ctrlEvidenceRows,
    vendorDocRows,
    auditProgramRows,
    policyControlRows,
    policyFrameworkRows,
    contractRowsFetched,
    contractRiskRowsFetched,
    contractControlRowsFetched,
    contractPolicyRowsFetched,
  ] = await Promise.all([
    db.select({ id: vendors.id, name: vendors.name, trustScore: vendors.trustScore, riskLevel: vendors.riskLevel, status: vendors.status })
      .from(vendors).where(and(eq(vendors.organizationId, orgId), eq(vendors.status, "active"))),
    db.select({ id: evidenceTable.id, name: evidenceTable.title, status: evidenceTable.status })
      .from(evidenceTable).where(eq(evidenceTable.organizationId, orgId)),
    db.select({ id: controls.id, name: controls.name, status: controls.status, frameworkId: controls.frameworkId, healthScore: controls.healthScore })
      .from(controls).where(eq(controls.organizationId, orgId)),
    db.select({ id: risks.id, title: risks.title, status: risks.status, residualScore: risks.residualScore, category: risks.category })
      .from(risks).where(eq(risks.organizationId, orgId)),
    db.select({ id: audits.id, name: audits.name, status: audits.status, type: audits.auditType })
      .from(audits).where(eq(audits.organizationId, orgId)),
    db.select({ id: auditFindings.id, title: auditFindings.title, status: auditFindings.status, severity: auditFindings.severity, auditId: auditFindings.auditId })
      .from(auditFindings).where(eq(auditFindings.organizationId, orgId)),
    db.select({ id: policies.id, name: policies.name, status: policies.status })
      .from(policies).where(eq(policies.organizationId, orgId)),
    db.select({ id: frameworks.id, name: frameworks.name, status: frameworks.status })
      .from(frameworks).where(eq(frameworks.organizationId, orgId)),
    db.select({ riskId: riskVendors.riskId, vendorId: riskVendors.vendorId }).from(riskVendors)
      .innerJoin(risks, eq(risks.id, riskVendors.riskId)).where(eq(risks.organizationId, orgId)),
    db.select({ riskId: riskControls.riskId, controlId: riskControls.controlId }).from(riskControls)
      .innerJoin(risks, eq(risks.id, riskControls.riskId)).where(eq(risks.organizationId, orgId)),
    db.select({ riskId: riskFindings.riskId, findingId: riskFindings.findingId }).from(riskFindings)
      .innerJoin(risks, eq(risks.id, riskFindings.riskId)).where(eq(risks.organizationId, orgId)),
    db.select({ riskId: riskPolicies.riskId, policyId: riskPolicies.policyId }).from(riskPolicies)
      .innerJoin(risks, eq(risks.id, riskPolicies.riskId)).where(eq(risks.organizationId, orgId)),
    db.select({ riskId: riskFrameworks.riskId, frameworkId: riskFrameworks.frameworkId }).from(riskFrameworks)
      .innerJoin(risks, eq(risks.id, riskFrameworks.riskId)).where(eq(risks.organizationId, orgId)),
    db.select({ riskId: riskEvidence.riskId, evidenceId: riskEvidence.evidenceId }).from(riskEvidence)
      .innerJoin(risks, eq(risks.id, riskEvidence.riskId)).where(eq(risks.organizationId, orgId)),
    db.select({ controlId: controlFrameworks.controlId, frameworkId: controlFrameworks.frameworkId }).from(controlFrameworks)
      .innerJoin(controls, eq(controls.id, controlFrameworks.controlId)).where(eq(controls.organizationId, orgId)),
    db.select({ controlId: controlVendors.controlId, vendorId: controlVendors.vendorId }).from(controlVendors)
      .innerJoin(controls, eq(controls.id, controlVendors.controlId)).where(eq(controls.organizationId, orgId)),
    db.select({ controlId: controlEvidenceMappings.controlId, evidenceId: controlEvidenceMappings.evidenceId }).from(controlEvidenceMappings)
      .innerJoin(controls, eq(controls.id, controlEvidenceMappings.controlId)).where(eq(controls.organizationId, orgId)),
    db.select({ id: vendorDocuments.id, name: vendorDocuments.filename, vendorId: vendorDocuments.vendorId, status: vendorDocuments.status })
      .from(vendorDocuments).where(eq(vendorDocuments.organizationId, orgId)),
    db.select({ controlId: auditPrograms.controlId, auditId: auditPrograms.auditId }).from(auditPrograms)
      .innerJoin(audits, eq(audits.id, auditPrograms.auditId)).where(and(eq(audits.organizationId, orgId), eq(auditPrograms.controlId, auditPrograms.controlId))),
    db.select({ policyId: policyControls.policyId, controlId: policyControls.controlId }).from(policyControls)
      .where(eq(policyControls.organizationId, orgId)),
    db.select({ policyId: policyFrameworksTable.policyId, frameworkId: policyFrameworksTable.frameworkId }).from(policyFrameworksTable)
      .where(eq(policyFrameworksTable.organizationId, orgId)),
    db.select({ id: contracts.id, title: contracts.title, status: contracts.status, contractType: contracts.contractType, vendorId: contracts.vendorId })
      .from(contracts).where(eq(contracts.organizationId, orgId)),
    db.select({ contractId: contractRisks.contractId, riskId: contractRisks.riskId }).from(contractRisks)
      .innerJoin(contracts, eq(contracts.id, contractRisks.contractId)).where(eq(contracts.organizationId, orgId)),
    db.select({ contractId: contractControls.contractId, controlId: contractControls.controlId }).from(contractControls)
      .innerJoin(contracts, eq(contracts.id, contractControls.contractId)).where(eq(contracts.organizationId, orgId)),
    db.select({ contractId: contractPolicies.contractId, policyId: contractPolicies.policyId }).from(contractPolicies)
      .innerJoin(contracts, eq(contracts.id, contractPolicies.contractId)).where(eq(contracts.organizationId, orgId)),
  ]);

  return {
    vendorRows, evidenceRows, controlRows, riskRows,
    auditRows, findingRows, policyRows, frameworkRows,
    riskVendorRows, riskControlRows, riskFindingRows,
    riskPolicyRows, riskFrameworkRows, riskEvidenceRows,
    ctrlFrameworkRows, ctrlVendorRows, ctrlEvidenceRows,
    vendorDocRows, auditProgramRows,
    policyControlRows, policyFrameworkRows,
    contractRows: contractRowsFetched,
    contractRiskRows: contractRiskRowsFetched,
    contractControlRows: contractControlRowsFetched,
    contractPolicyRows: contractPolicyRowsFetched,
  };
}

/** Upsert a graph node. Returns the node id. */
export async function upsertGraphNode(orgId: string, node: RawNode): Promise<string> {
  const rows = await db.insert(graphNodes).values({
    organizationId: orgId,
    entityType: node.entityType as any,
    entityId: node.entityId,
    name: node.name,
    metadata: node.metadata,
    updatedAt: new Date(),
  })
  .onConflictDoUpdate({
    target: [graphNodes.organizationId, graphNodes.entityType, graphNodes.entityId],
    set: { name: node.name, metadata: node.metadata, updatedAt: new Date() },
  })
  .returning({ id: graphNodes.id });
  return rows[0].id;
}

/** Upsert a graph edge. */
export async function upsertGraphEdge(
  orgId: string,
  sourceNodeId: string,
  targetNodeId: string,
  relType: GraphRelationshipType,
  strength: number
): Promise<void> {
  await db.insert(graphEdges).values({
    organizationId: orgId,
    sourceNodeId,
    targetNodeId,
    relationshipType: relType as any,
    strength,
    updatedAt: new Date(),
  })
  .onConflictDoUpdate({
    target: [graphEdges.organizationId, graphEdges.sourceNodeId, graphEdges.targetNodeId, graphEdges.relationshipType],
    set: { strength, updatedAt: new Date() },
  });
}

/** Load all nodes and edges for an org. */
export async function getGraphForOrg(orgId: string) {
  const [nodes, edges] = await Promise.all([
    db.select().from(graphNodes).where(eq(graphNodes.organizationId, orgId)),
    db.select().from(graphEdges).where(eq(graphEdges.organizationId, orgId)),
  ]);
  return { nodes, edges };
}

/** Get a single node with its direct neighbours. */
export async function getNodeWithNeighbours(orgId: string, nodeId: string) {
  const node = await db.select().from(graphNodes)
    .where(and(eq(graphNodes.id, nodeId), eq(graphNodes.organizationId, orgId)))
    .then(r => r[0] ?? null);
  if (!node) return null;

  const edgesOut = await db.select().from(graphEdges)
    .where(and(eq(graphEdges.sourceNodeId, nodeId), eq(graphEdges.organizationId, orgId)));
  const edgesIn = await db.select().from(graphEdges)
    .where(and(eq(graphEdges.targetNodeId, nodeId), eq(graphEdges.organizationId, orgId)));

  const neighbourIds = [
    ...edgesOut.map(e => e.targetNodeId),
    ...edgesIn.map(e => e.sourceNodeId),
  ];

  const neighbours = neighbourIds.length > 0
    ? await db.select().from(graphNodes).where(inArray(graphNodes.id, neighbourIds))
    : [];

  return { node, edgesOut, edgesIn, neighbours };
}

/** Delete all graph data for an org (for full rebuild). */
export async function clearGraphForOrg(orgId: string): Promise<void> {
  await db.delete(graphNodes).where(eq(graphNodes.organizationId, orgId));
}

/** Count nodes by entity type for an org. */
export async function countNodesByType(orgId: string) {
  const nodes = await db.select({
    entityType: graphNodes.entityType,
  }).from(graphNodes).where(eq(graphNodes.organizationId, orgId));

  const counts: Record<string, number> = {};
  for (const n of nodes) {
    counts[n.entityType] = (counts[n.entityType] ?? 0) + 1;
  }
  return counts;
}
