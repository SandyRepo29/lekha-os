import * as repo from "@/lib/repositories/trust-intelligence-repo";
import { computeOrgTrustScore, type OrgTrustBreakdown, type OrgTrustInputs } from "@/lib/services/org-trust-score";

export type { OrgTrustBreakdown };

export type TrustIntelligenceOverview = {
  orgTrustScore: OrgTrustBreakdown;
  vendors: Awaited<ReturnType<typeof repo.getVendorTrustMetrics>>;
  risks: Awaited<ReturnType<typeof repo.getRiskMetrics>>;
  controls: Awaited<ReturnType<typeof repo.getControlMetrics>>;
  audits: Awaited<ReturnType<typeof repo.getAuditReadinessMetrics>>;
  compliance: Awaited<ReturnType<typeof repo.getComplianceMetrics>>;
};

export type Recommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  category: "vendor" | "risk" | "control" | "audit" | "compliance";
  title: string;
  description: string;
  action: string;
  href?: string;
  impact: number; // 1-10
  effort: number; // 1-10
};

/** Gather all data and compute Organizational Trust Score™. */
export async function getTrustIntelligenceOverview(orgId: string): Promise<TrustIntelligenceOverview> {
  const [vendors, risks, controls, audits, compliance] = await Promise.all([
    repo.getVendorTrustMetrics(orgId),
    repo.getRiskMetrics(orgId),
    repo.getControlMetrics(orgId),
    repo.getAuditReadinessMetrics(orgId),
    repo.getComplianceMetrics(orgId),
  ]);

  const inputs: OrgTrustInputs = {
    avgVendorTrustScore: vendors.avgScore,
    scoredVendorCount: vendors.scoredCount,
    criticalRisks: risks.criticalCount,
    highRisks: risks.highCount,
    mediumRisks: risks.mediumCount,
    activeRiskCount: risks.activeCount,
    totalRiskCount: risks.total,
    avgControlHealth: controls.avgHealth,
    controlCount: controls.totalCount,
    weakControlCount: controls.weakCount,
    completedAudits: audits.completedAudits,
    totalAudits: audits.totalAudits,
    openCriticalFindings: audits.openCriticalFindings,
    openHighFindings: audits.openHighFindings,
    avgFrameworkReadiness: compliance.avgReadiness,
    frameworkCount: compliance.frameworkCount,
  };

  const orgTrustScore = computeOrgTrustScore(inputs);

  return { orgTrustScore, vendors, risks, controls, audits, compliance };
}

/** Save today's governance snapshot. */
export async function snapshotGovernance(orgId: string): Promise<void> {
  const overview = await getTrustIntelligenceOverview(orgId);
  const today = new Date().toISOString().split("T")[0];

  await repo.upsertSnapshot({
    organizationId: orgId,
    snapshotDate: today,
    orgTrustScore: overview.orgTrustScore.overall,
    vendorTrustScore: overview.orgTrustScore.vendorTrust,
    riskPostureScore: overview.orgTrustScore.riskPosture,
    controlHealthScore: overview.orgTrustScore.controlHealth,
    auditReadinessScore: overview.orgTrustScore.auditReadiness,
    complianceCoverageScore: overview.orgTrustScore.complianceCoverage,
    totalVendors: overview.vendors.total,
    scoredVendors: overview.vendors.scoredCount,
    activeRisks: overview.risks.activeCount,
    criticalRisks: overview.risks.criticalCount,
    openFindings: overview.audits.totalOpenFindings,
    avgControlHealth: overview.controls.avgHealth,
    avgFrameworkReadiness: overview.compliance.avgReadiness,
  });
}

/** Generate prioritized recommendations from live governance data. */
export async function generateRecommendations(orgId: string): Promise<Recommendation[]> {
  const data = await repo.getRecommendationData(orgId);
  const recs: Recommendation[] = [];

  // Critical risks → High priority
  for (const risk of data.criticalRisks.slice(0, 3)) {
    recs.push({
      id: `risk-critical-${risk.id}`,
      priority: "high",
      category: "risk",
      title: `Mitigate critical risk: ${risk.title}`,
      description: `This risk has a score of ${risk.inherentScore}/25 (critical). Immediate action required.`,
      action: "Review risk and assign treatment",
      href: `/risks/${risk.id}`,
      impact: 10,
      effort: 7,
    });
  }

  // Open critical findings → High priority
  for (const finding of data.openCriticalFindings.slice(0, 3)) {
    recs.push({
      id: `finding-critical-${finding.id}`,
      priority: "high",
      category: "audit",
      title: `Close critical finding: ${finding.title}`,
      description: "Critical audit finding remains open. Resolve or accept to improve audit readiness.",
      action: "Create corrective action or close finding",
      href: `/audits/findings`,
      impact: 9,
      effort: 6,
    });
  }

  // Weak controls → High/Medium priority
  for (const ctrl of data.weakControls.slice(0, 3)) {
    recs.push({
      id: `control-weak-${ctrl.id}`,
      priority: ctrl.healthScore < 40 ? "high" : "medium",
      category: "control",
      title: `Improve control health: ${ctrl.name}`,
      description: `Control health is ${ctrl.healthScore}/100. Add evidence, complete testing, or link to policies.`,
      action: "Add test or evidence to this control",
      href: `/controls/${ctrl.id}`,
      impact: 8,
      effort: 5,
    });
  }

  // Low trust vendors → Medium priority
  for (const vendor of data.lowTrustVendors.slice(0, 3)) {
    recs.push({
      id: `vendor-low-${vendor.id}`,
      priority: "medium",
      category: "vendor",
      title: `Review vendor trust: ${vendor.name}`,
      description: `Trust Score is ${vendor.trustScore}/100. Upload missing documents or complete assessment.`,
      action: "Upload documents or schedule review",
      href: `/vendors/${vendor.id}`,
      impact: 6,
      effort: 4,
    });
  }

  // High risks → Medium priority
  for (const risk of data.highRisks.slice(0, 2)) {
    recs.push({
      id: `risk-high-${risk.id}`,
      priority: "medium",
      category: "risk",
      title: `Address high risk: ${risk.title}`,
      description: `Risk score ${risk.inherentScore}/25 (high). Create treatment plan.`,
      action: "Add risk treatment",
      href: `/risks/${risk.id}`,
      impact: 7,
      effort: 6,
    });
  }

  // Sort by priority then impact
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recs
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || b.impact - a.impact)
    .slice(0, 12);
}

/** Get 30/90/365 day trend snapshots. */
export async function getTrends(orgId: string, days: 30 | 90 | 365 = 90) {
  return repo.getSnapshotHistory(orgId, days);
}

/** Get latest snapshot (or null if never snapshotted). */
export async function getLatestSnapshot(orgId: string) {
  return repo.getLatestSnapshot(orgId);
}

/** Get governance timeline events. */
export async function getGovernanceTimeline(orgId: string, limit = 30) {
  return repo.getGovernanceTimeline(orgId, limit);
}
