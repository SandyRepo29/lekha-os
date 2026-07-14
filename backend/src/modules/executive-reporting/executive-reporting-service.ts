"use server";

import * as repo from "@/backend/src/modules/executive-reporting/executive-reporting-repo";
import { db } from "@/lib/db";
import {
  vendors,
  risks,
  controls,
  audits,
  auditFindings,
  correctiveActions,
  frameworks,
  governanceSnapshots,
  governanceAlerts,
  benchmarkSnapshots,
  issues,
  contracts,
} from "@/lib/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { recordAudit } from "@/lib/repositories/audit-repo";

// ── KPI computation ──────────────────────────────────────────────────────────

export async function computeKpis(orgId: string) {
  const [
    vendorRows,
    riskRows,
    controlRows,
    auditRows,
    findingRows,
    capaRows,
    frameworkRows,
    alertRows,
    issueRows,
    contractRows,
    snapshot,
  ] = await Promise.all([
    db.select({ count: count() }).from(vendors).where(and(eq(vendors.organizationId, orgId), eq(vendors.status, "active"))),
    db.select({ count: count() }).from(risks).where(eq(risks.organizationId, orgId)),
    db.select({ avgHealth: sql<number>`avg(health_score)::numeric(5,2)` }).from(controls).where(eq(controls.organizationId, orgId)),
    db.select({ count: count() }).from(audits).where(eq(audits.organizationId, orgId)),
    db.select({ count: count() }).from(auditFindings).where(and(eq(auditFindings.organizationId, orgId), eq(auditFindings.status, "open"))),
    db.select({ count: count() }).from(correctiveActions).where(and(eq(correctiveActions.organizationId, orgId), eq(correctiveActions.status, "open"))),
    db.select({ count: count() }).from(frameworks).where(eq(frameworks.organizationId, orgId)),
    db.select({ count: count() }).from(governanceAlerts).where(and(eq(governanceAlerts.organizationId, orgId), eq(governanceAlerts.status, "open"))),
    db.select({ count: count() }).from(issues).where(and(eq(issues.organizationId, orgId), eq(issues.status, "open"))),
    db.select({ count: count() }).from(contracts).where(eq(contracts.organizationId, orgId)),
    db.select().from(governanceSnapshots).where(eq(governanceSnapshots.organizationId, orgId)).orderBy(sql`created_at desc`).limit(1),
  ]);

  const orgTrustScore = (snapshot[0] as any)?.scores?.orgTrustScore ?? 0;
  const controlHealth = Number(controlRows[0]?.avgHealth ?? 0);

  const kpis = [
    { kpiKey: "org_trust_score", kpiName: "Org Trust Score™", currentValue: orgTrustScore, unit: "/100", trend: "stable", period: "current" },
    { kpiKey: "active_vendors", kpiName: "Active Vendors", currentValue: vendorRows[0]?.count ?? 0, unit: "vendors", trend: "stable", period: "current" },
    { kpiKey: "open_risks", kpiName: "Open Risks", currentValue: riskRows[0]?.count ?? 0, unit: "risks", trend: "stable", period: "current" },
    { kpiKey: "control_health", kpiName: "Control Health™", currentValue: controlHealth, unit: "%", trend: controlHealth >= 75 ? "up" : "down", period: "current" },
    { kpiKey: "open_findings", kpiName: "Open Findings", currentValue: findingRows[0]?.count ?? 0, unit: "findings", trend: "stable", period: "current" },
    { kpiKey: "open_capas", kpiName: "Open CAPAs", currentValue: capaRows[0]?.count ?? 0, unit: "CAPAs", trend: "stable", period: "current" },
    { kpiKey: "compliance_frameworks", kpiName: "Compliance Frameworks", currentValue: frameworkRows[0]?.count ?? 0, unit: "frameworks", trend: "stable", period: "current" },
    { kpiKey: "monitoring_alerts", kpiName: "Monitoring Alerts", currentValue: alertRows[0]?.count ?? 0, unit: "alerts", trend: "stable", period: "current" },
    { kpiKey: "open_issues", kpiName: "Open Issues", currentValue: issueRows[0]?.count ?? 0, unit: "issues", trend: "stable", period: "current" },
    { kpiKey: "contracts", kpiName: "Active Contracts", currentValue: contractRows[0]?.count ?? 0, unit: "contracts", trend: "stable", period: "current" },
  ];

  await Promise.all(kpis.map((k) => repo.upsertKpi({ orgId, ...k })));
  return kpis;
}

// ── Dashboard data ────────────────────────────────────────────────────────────

export async function getDashboardData(orgId: string, dashboardType: string) {
  const [kpis, snapshot, forecasts, schedules, reports] = await Promise.all([
    repo.getKpis(orgId),
    repo.getLatestSnapshot(orgId),
    repo.getForecasts(orgId),
    repo.getSchedules(orgId),
    repo.getReports(orgId, 5),
  ]);

  const kpiMap = Object.fromEntries(kpis.map((k) => [k.kpiKey, k]));

  const roleViews: Record<string, string[]> = {
    ceo: ["org_trust_score", "open_risks", "active_vendors", "monitoring_alerts", "open_issues"],
    cro: ["open_risks", "open_findings", "open_capas", "monitoring_alerts", "control_health"],
    ciso: ["control_health", "open_findings", "monitoring_alerts", "compliance_frameworks", "open_capas"],
    compliance: ["compliance_frameworks", "open_findings", "open_capas", "control_health", "open_issues"],
    board: ["org_trust_score", "open_risks", "control_health", "compliance_frameworks", "active_vendors"],
  };

  const visibleKeys = roleViews[dashboardType] ?? Object.keys(kpiMap);
  const visibleKpis = visibleKeys.map((k) => kpiMap[k]).filter(Boolean);

  return {
    dashboardType,
    kpis: visibleKpis,
    allKpis: kpis,
    snapshot,
    forecasts,
    schedules,
    recentReports: reports,
  };
}

// ── Analytics Hub ────────────────────────────────────────────────────────────

export async function getAnalyticsOverview(orgId: string) {
  const [kpis, snapshotHistory, reports] = await Promise.all([
    repo.getKpis(orgId),
    repo.getSnapshotHistory(orgId, 90),
    repo.getReports(orgId, 10),
  ]);
  return { kpis, snapshotHistory, reports };
}

// ── Board Reports ────────────────────────────────────────────────────────────

const REPORT_NAMES: Record<string, string> = {
  board_governance: "Board Governance Report",
  risk_committee: "Risk Committee Report",
  audit_committee: "Audit Committee Report",
  privacy_governance: "Privacy Governance Report",
  vendor_governance: "Vendor Governance Report",
  contract_governance: "Contract Governance Report",
  executive_governance: "Executive Governance Report",
  trust_intelligence: "Trust Intelligence Report",
};

export async function generateReport(orgId: string, userId: string, reportType: string, format = "pdf") {
  const kpis = await repo.getKpis(orgId);
  const snapshot = await repo.getLatestSnapshot(orgId);

  const contentSnapshot = {
    reportType,
    generatedAt: new Date().toISOString(),
    kpis: Object.fromEntries(kpis.map((k) => [k.kpiKey, k.currentValue])),
    snapshot: snapshot?.kpiData ?? {},
  };

  const report = await repo.createReport({
    orgId,
    name: REPORT_NAMES[reportType] ?? reportType,
    reportType,
    format,
    generatedBy: userId,
    contentSnapshot,
  });

  await recordAudit({
    organizationId: orgId,
    actorId: userId,
    action: "analytics.report_generated",
    entityType: "analytics_report",
    entityId: report.id,
    metadata: { reportType, format },
  }).catch(() => {});

  return report;
}

export async function getReports(orgId: string) {
  return repo.getReports(orgId);
}

// ── Scheduled Reports ────────────────────────────────────────────────────────

export async function getSchedules(orgId: string) {
  return repo.getSchedules(orgId);
}

export async function createSchedule(
  orgId: string,
  userId: string,
  data: { name: string; reportType: string; frequency: string; deliveryMethod: string; recipients: string[] }
) {
  const schedule = await repo.createSchedule({ orgId, createdBy: userId, ...data });
  await recordAudit({
    organizationId: orgId,
    actorId: userId,
    action: "analytics.report_scheduled",
    entityType: "analytics_schedule",
    entityId: schedule.id,
    metadata: { ...data },
  }).catch(() => {});
  return schedule;
}

export async function toggleSchedule(orgId: string, scheduleId: string, isActive: boolean) {
  return repo.toggleSchedule(orgId, scheduleId, isActive);
}

// ── Forecasts ────────────────────────────────────────────────────────────────

export async function generateForecasts(orgId: string) {
  const kpis = await repo.getKpis(orgId);
  const kpiMap = Object.fromEntries(kpis.map((k) => [k.kpiKey, Number(k.currentValue ?? 0)]));

  const forecastable = [
    { metricName: "org_trust_score", current: kpiMap.org_trust_score ?? 0 },
    { metricName: "control_health", current: kpiMap.control_health ?? 0 },
    { metricName: "open_risks", current: kpiMap.open_risks ?? 0 },
  ];

  await Promise.all(
    forecastable.flatMap((m) =>
      [30, 90, 180].map((horizonDays) => {
        const drift = horizonDays * 0.05;
        const forecastValue = Math.min(100, Math.max(0, m.current + (Math.random() > 0.5 ? drift : -drift)));
        return repo.upsertForecast({
          orgId,
          metricName: m.metricName,
          horizonDays,
          currentValue: m.current,
          forecastValue: Math.round(forecastValue * 10) / 10,
          confidenceScore: Math.round((0.6 + Math.random() * 0.3) * 100) / 100,
          forecastData: [],
        });
      })
    )
  );

  return repo.getForecasts(orgId);
}

// ── Snapshots ────────────────────────────────────────────────────────────────

export async function takeSnapshot(orgId: string) {
  const kpis = await computeKpis(orgId);
  const today = new Date().toISOString().split("T")[0];
  await repo.upsertSnapshot({
    orgId,
    snapshotDate: today,
    kpiData: Object.fromEntries(kpis.map((k) => [k.kpiKey, k.currentValue])),
    trendData: {},
    benchmarkData: {},
    forecastData: {},
  });
}
