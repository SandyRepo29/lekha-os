import { getSnapshotHistory, getLatestSnapshot, upsertSnapshot } from "@/backend/src/modules/trust-intelligence/trust-intelligence-repo";
import { getTrustIntelligenceOverview } from "@/backend/src/modules/trust-intelligence/trust-intelligence-service";
import type { GovernanceSnapshot } from "@/lib/db/schema";

export type TrendPoint = {
  date: string;
  orgTrust: number;
  vendorTrust: number;
  riskPosture: number;
  controlHealth: number;
  auditReadiness: number;
  compliance: number;
  evidenceCoverage: number;
};

export type MetricTrend = {
  current: number;
  previous: number;
  change: number;       // absolute points difference
  changePct: number;    // % change
  direction: "up" | "down" | "stable";
};

export type TrendsOverview = {
  period: 30 | 90 | 180 | 365;
  points: TrendPoint[];
  metrics: {
    orgTrust: MetricTrend;
    vendorTrust: MetricTrend;
    riskPosture: MetricTrend;
    controlHealth: MetricTrend;
    auditReadiness: MetricTrend;
    compliance: MetricTrend;
  };
};

function calcTrend(current: number, previous: number): MetricTrend {
  const change = current - previous;
  const changePct = previous > 0 ? Math.round((change / previous) * 100) : 0;
  const direction: MetricTrend["direction"] =
    Math.abs(changePct) < 2 ? "stable" : change > 0 ? "up" : "down";
  return { current, previous, change, changePct, direction };
}

export async function getTrends(orgId: string, days: 30 | 90 | 180 | 365 = 90): Promise<TrendsOverview> {
  const snapshots = await getSnapshotHistory(orgId, days);

  const points: TrendPoint[] = snapshots.map((s) => ({
    date: s.snapshotDate,
    orgTrust: s.orgTrustScore,
    vendorTrust: s.vendorTrustScore,
    riskPosture: s.riskPostureScore,
    controlHealth: s.controlHealthScore,
    auditReadiness: s.auditReadinessScore,
    compliance: s.complianceCoverageScore,
    evidenceCoverage: (s as any).evidenceCoverageScore ?? 0,
  }));

  const latest = points[points.length - 1];
  const earliest = points[0];

  const zero = { orgTrust: 0, vendorTrust: 0, riskPosture: 0, controlHealth: 0, auditReadiness: 0, compliance: 0 };
  const cur = latest ?? zero;
  const prev = earliest ?? zero;

  return {
    period: days,
    points,
    metrics: {
      orgTrust:       calcTrend(cur.orgTrust,       prev.orgTrust),
      vendorTrust:    calcTrend(cur.vendorTrust,    prev.vendorTrust),
      riskPosture:    calcTrend(cur.riskPosture,    prev.riskPosture),
      controlHealth:  calcTrend(cur.controlHealth,  prev.controlHealth),
      auditReadiness: calcTrend(cur.auditReadiness, prev.auditReadiness),
      compliance:     calcTrend(cur.compliance,     prev.compliance),
    },
  };
}

export async function ensureDailySnapshot(orgId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const latest = await getLatestSnapshot(orgId);
  if (latest?.snapshotDate === today) return; // already done today

  const overview = await getTrustIntelligenceOverview(orgId);

  // Compute evidence coverage (evidenced controls / total controls, as a proxy)
  const evidenceCoverage = overview.controls.totalCount > 0
    ? Math.round(((overview.controls.totalCount - overview.controls.weakCount) / overview.controls.totalCount) * 100)
    : 0;

  await upsertSnapshot({
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
