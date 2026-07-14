import {
  fetchGraphSourceData,
  upsertGraphNode,
  upsertGraphEdge,
  clearGraphForOrg,
  type GraphEntityType,
  type GraphRelationshipType,
} from "@/backend/src/modules/trust-graph/trust-graph-repo";

/** Build or rebuild the full governance knowledge graph for an org. */
export async function buildGraph(orgId: string): Promise<{ nodeCount: number; edgeCount: number }> {
  const data = await fetchGraphSourceData(orgId);

  // Clear existing graph for clean rebuild
  await clearGraphForOrg(orgId);

  // ── 1. Create nodes ──────────────────────────────────────────────────────
  const nodeIdMap = new Map<string, string>(); // `${type}:${entityId}` → dbNodeId

  const upsert = async (type: GraphEntityType, entityId: string, name: string, meta: Record<string, unknown>) => {
    const dbId = await upsertGraphNode(orgId, { entityType: type, entityId, name, metadata: meta });
    nodeIdMap.set(`${type}:${entityId}`, dbId);
    return dbId;
  };

  for (const v of data.vendorRows) {
    await upsert("vendor", v.id, v.name, { trustScore: v.trustScore, riskLevel: v.riskLevel, status: v.status });
  }
  for (const e of data.evidenceRows) {
    await upsert("evidence", e.id, e.name, { status: e.status });
  }
  for (const c of data.controlRows) {
    await upsert("control", c.id, c.name, { status: c.status, healthScore: c.healthScore });
  }
  for (const r of data.riskRows) {
    await upsert("risk", r.id, r.title, { status: r.status, score: r.residualScore, category: r.category });
  }
  for (const a of data.auditRows) {
    await upsert("audit", a.id, a.name, { status: a.status, type: a.type });
  }
  for (const f of data.findingRows) {
    await upsert("finding", f.id, f.title, { status: f.status, severity: f.severity });
  }
  for (const p of data.policyRows) {
    await upsert("policy", p.id, p.name, { status: p.status });
  }
  for (const fw of data.frameworkRows) {
    await upsert("framework", fw.id, fw.name, { status: fw.status });
  }

  // ── 2. Create edges ──────────────────────────────────────────────────────
  let edgeCount = 0;

  const addEdge = async (
    srcType: GraphEntityType, srcId: string,
    tgtType: GraphEntityType, tgtId: string,
    rel: GraphRelationshipType,
    strength: number
  ) => {
    const srcNodeId = nodeIdMap.get(`${srcType}:${srcId}`);
    const tgtNodeId = nodeIdMap.get(`${tgtType}:${tgtId}`);
    if (!srcNodeId || !tgtNodeId) return;
    await upsertGraphEdge(orgId, srcNodeId, tgtNodeId, rel, strength);
    edgeCount++;
  };

  // Vendor → Evidence (via vendor_documents)
  for (const doc of data.vendorDocRows) {
    if (doc.vendorId) {
      await addEdge("vendor", doc.vendorId, "evidence", doc.id, "vendor_provides_evidence", 70);
    }
  }

  // Vendor → Risk
  for (const rv of data.riskVendorRows) {
    await addEdge("vendor", rv.vendorId, "risk", rv.riskId, "vendor_has_risk", 80);
  }

  // Vendor → Control
  for (const cv of data.ctrlVendorRows) {
    await addEdge("vendor", cv.vendorId, "control", cv.controlId, "vendor_linked_control", 60);
  }

  // Evidence → Control (via control_evidence_mappings)
  for (const cem of data.ctrlEvidenceRows) {
    await addEdge("evidence", cem.evidenceId, "control", cem.controlId, "evidence_supports_control", 75);
  }

  // Evidence → Framework (via control_evidence_mappings → controls with frameworks)
  for (const cem of data.ctrlEvidenceRows) {
    const ctrl = data.controlRows.find(c => c.id === cem.controlId);
    if (ctrl?.frameworkId) {
      await addEdge("evidence", cem.evidenceId, "framework", ctrl.frameworkId, "evidence_in_framework", 65);
    }
  }

  // Control → Risk
  for (const rc of data.riskControlRows) {
    await addEdge("control", rc.controlId, "risk", rc.riskId, "control_reduces_risk", 85);
  }

  // Control → Audit (via audit_programs)
  for (const ap of data.auditProgramRows) {
    if (ap.controlId) {
      await addEdge("control", ap.controlId, "audit", ap.auditId, "control_in_audit", 60);
    }
  }

  // Control → Framework (primary + junction)
  for (const c of data.controlRows) {
    if (c.frameworkId) {
      await addEdge("control", c.id, "framework", c.frameworkId, "control_in_framework", 80);
    }
  }
  for (const cf of data.ctrlFrameworkRows) {
    await addEdge("control", cf.controlId, "framework", cf.frameworkId, "control_in_framework", 80);
  }

  // Policy → Risk (via risk_policies junction)
  for (const rp of data.riskPolicyRows) {
    await addEdge("policy", rp.policyId, "risk", rp.riskId, "control_supported_by_policy", 55);
  }

  // Policy → Control (via policy_controls junction)
  for (const pc of data.policyControlRows) {
    await addEdge("policy", pc.policyId, "control", pc.controlId, "control_supported_by_policy", 70);
  }

  // Policy → Framework (via policy_frameworks junction)
  for (const pf of data.policyFrameworkRows) {
    await addEdge("policy", pf.policyId, "framework", pf.frameworkId, "policy_in_framework", 75);
  }

  // Audit → Finding
  for (const f of data.findingRows) {
    if (f.auditId) {
      await addEdge("audit", f.auditId, "finding", f.id, "audit_has_finding", 90);
    }
  }

  // Finding → Risk
  for (const rf of data.riskFindingRows) {
    await addEdge("finding", rf.findingId, "risk", rf.riskId, "finding_creates_risk", 85);
  }

  // Risk → Framework
  for (const rfr of data.riskFrameworkRows) {
    await addEdge("risk", rfr.riskId, "framework", rfr.frameworkId, "risk_affects_trust_score", 70);
  }

  // Contract nodes
  for (const c of data.contractRows) {
    await upsert("contract", c.id, c.title, { status: c.status, contractType: c.contractType });
  }

  // Contract → Vendor
  for (const c of data.contractRows) {
    if (c.vendorId) {
      await addEdge("contract", c.id, "vendor", c.vendorId, "contract_with_vendor", 80);
    }
  }

  // Contract → Risk
  for (const cr of data.contractRiskRows) {
    await addEdge("contract", cr.contractId, "risk", cr.riskId, "contract_linked_risk", 75);
  }

  // Contract → Policy
  for (const cp of data.contractPolicyRows) {
    await addEdge("contract", cp.contractId, "policy", cp.policyId, "contract_linked_policy", 70);
  }

  // Contract → Control
  for (const cc of data.contractControlRows) {
    await addEdge("contract", cc.contractId, "control", cc.controlId, "contract_linked_control", 65);
  }

  return { nodeCount: nodeIdMap.size, edgeCount };
}

/** Incremental update — rebuild without clearing (upsert-only). */
export async function updateGraph(orgId: string): Promise<{ nodeCount: number; edgeCount: number }> {
  return buildGraph(orgId);
}
