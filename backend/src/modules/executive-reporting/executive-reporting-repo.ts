import { db } from "@/lib/db";
import {
  analyticsDashboards,
  analyticsWidgets,
  analyticsReports,
  analyticsSchedules,
  analyticsSnapshots,
  analyticsKpis,
  analyticsForecasts,
  analyticsExports,
  type AnalyticsDashboard,
  type AnalyticsReport,
  type AnalyticsSchedule,
  type AnalyticsSnapshot,
  type AnalyticsKpi,
  type AnalyticsForecast,
} from "@/lib/db/schema";
import { eq, and, desc, asc, lte, gte, sql } from "drizzle-orm";

// ── Dashboards ──────────────────────────────────────────────────────────────

export async function getDashboards(orgId: string): Promise<AnalyticsDashboard[]> {
  return db
    .select()
    .from(analyticsDashboards)
    .where(eq(analyticsDashboards.organizationId, orgId))
    .orderBy(asc(analyticsDashboards.dashboardType));
}

export async function getDashboard(orgId: string, dashboardType: string) {
  const rows = await db
    .select()
    .from(analyticsDashboards)
    .where(and(eq(analyticsDashboards.organizationId, orgId), eq(analyticsDashboards.dashboardType, dashboardType)))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertDashboard(
  orgId: string,
  dashboardType: string,
  name: string,
  createdBy: string
) {
  const rows = await db
    .insert(analyticsDashboards)
    .values({ organizationId: orgId, dashboardType, name, createdBy, isDefault: true })
    .onConflictDoNothing()
    .returning();
  return rows[0] ?? null;
}

// ── Reports ──────────────────────────────────────────────────────────────────

export async function getReports(orgId: string, limit = 20): Promise<AnalyticsReport[]> {
  return db
    .select()
    .from(analyticsReports)
    .where(eq(analyticsReports.organizationId, orgId))
    .orderBy(desc(analyticsReports.createdAt))
    .limit(limit);
}

export async function getReport(orgId: string, reportId: string) {
  const rows = await db
    .select()
    .from(analyticsReports)
    .where(and(eq(analyticsReports.organizationId, orgId), eq(analyticsReports.id, reportId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createReport(data: {
  orgId: string;
  name: string;
  reportType: string;
  format: string;
  generatedBy: string;
  contentSnapshot?: Record<string, unknown>;
}): Promise<AnalyticsReport> {
  const rows = await db
    .insert(analyticsReports)
    .values({
      organizationId: data.orgId,
      name: data.name,
      reportType: data.reportType,
      format: data.format,
      generatedBy: data.generatedBy,
      status: "ready",
      generatedAt: new Date(),
      contentSnapshot: data.contentSnapshot ?? {},
    })
    .returning();
  return rows[0];
}

export async function countReportsByType(orgId: string) {
  const rows = await db
    .select({ reportType: analyticsReports.reportType, count: sql<number>`count(*)::int` })
    .from(analyticsReports)
    .where(eq(analyticsReports.organizationId, orgId))
    .groupBy(analyticsReports.reportType);
  return rows;
}

// ── Schedules ────────────────────────────────────────────────────────────────

export async function getSchedules(orgId: string): Promise<AnalyticsSchedule[]> {
  return db
    .select()
    .from(analyticsSchedules)
    .where(eq(analyticsSchedules.organizationId, orgId))
    .orderBy(desc(analyticsSchedules.createdAt));
}

export async function createSchedule(data: {
  orgId: string;
  name: string;
  reportType: string;
  frequency: string;
  deliveryMethod: string;
  recipients: string[];
  createdBy: string;
}): Promise<AnalyticsSchedule> {
  const rows = await db
    .insert(analyticsSchedules)
    .values({
      organizationId: data.orgId,
      name: data.name,
      reportType: data.reportType,
      frequency: data.frequency,
      deliveryMethod: data.deliveryMethod,
      recipients: data.recipients,
      createdBy: data.createdBy,
    })
    .returning();
  return rows[0];
}

export async function toggleSchedule(orgId: string, scheduleId: string, isActive: boolean) {
  await db
    .update(analyticsSchedules)
    .set({ isActive })
    .where(and(eq(analyticsSchedules.organizationId, orgId), eq(analyticsSchedules.id, scheduleId)));
}

// ── Snapshots ────────────────────────────────────────────────────────────────

export async function getLatestSnapshot(orgId: string): Promise<AnalyticsSnapshot | null> {
  const rows = await db
    .select()
    .from(analyticsSnapshots)
    .where(eq(analyticsSnapshots.organizationId, orgId))
    .orderBy(desc(analyticsSnapshots.snapshotDate))
    .limit(1);
  return rows[0] ?? null;
}

export async function getSnapshotHistory(orgId: string, days = 90): Promise<AnalyticsSnapshot[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return db
    .select()
    .from(analyticsSnapshots)
    .where(and(eq(analyticsSnapshots.organizationId, orgId), gte(analyticsSnapshots.snapshotDate, since.toISOString().split("T")[0])))
    .orderBy(asc(analyticsSnapshots.snapshotDate));
}

export async function upsertSnapshot(data: {
  orgId: string;
  snapshotDate: string;
  kpiData: Record<string, unknown>;
  trendData: Record<string, unknown>;
  benchmarkData: Record<string, unknown>;
  forecastData: Record<string, unknown>;
}) {
  await db
    .insert(analyticsSnapshots)
    .values({
      organizationId: data.orgId,
      snapshotDate: data.snapshotDate,
      kpiData: data.kpiData,
      trendData: data.trendData,
      benchmarkData: data.benchmarkData,
      forecastData: data.forecastData,
    })
    .onConflictDoUpdate({
      target: [analyticsSnapshots.organizationId, analyticsSnapshots.snapshotDate],
      set: {
        kpiData: data.kpiData,
        trendData: data.trendData,
        benchmarkData: data.benchmarkData,
        forecastData: data.forecastData,
      },
    });
}

// ── KPIs ─────────────────────────────────────────────────────────────────────

export async function getKpis(orgId: string): Promise<AnalyticsKpi[]> {
  return db
    .select()
    .from(analyticsKpis)
    .where(eq(analyticsKpis.organizationId, orgId))
    .orderBy(asc(analyticsKpis.kpiKey));
}

export async function upsertKpi(data: {
  orgId: string;
  kpiKey: string;
  kpiName: string;
  currentValue: number;
  previousValue?: number;
  targetValue?: number;
  unit?: string;
  trend?: string;
  period?: string;
}) {
  const vals = {
    organizationId: data.orgId,
    kpiKey: data.kpiKey,
    kpiName: data.kpiName,
    currentValue: String(data.currentValue),
    previousValue: data.previousValue != null ? String(data.previousValue) : undefined,
    targetValue: data.targetValue != null ? String(data.targetValue) : undefined,
    unit: data.unit,
    trend: data.trend,
    period: data.period,
  };
  await db
    .insert(analyticsKpis)
    .values(vals)
    .onConflictDoUpdate({
      target: [analyticsKpis.organizationId, analyticsKpis.kpiKey],
      set: {
        currentValue: String(data.currentValue),
        previousValue: data.previousValue != null ? String(data.previousValue) : undefined,
        trend: data.trend,
        period: data.period,
      },
    });
}

// ── Forecasts ────────────────────────────────────────────────────────────────

export async function getForecasts(orgId: string): Promise<AnalyticsForecast[]> {
  return db
    .select()
    .from(analyticsForecasts)
    .where(eq(analyticsForecasts.organizationId, orgId))
    .orderBy(asc(analyticsForecasts.metricName));
}

export async function upsertForecast(data: {
  orgId: string;
  metricName: string;
  horizonDays: number;
  currentValue: number;
  forecastValue: number;
  confidenceScore: number;
  forecastData: unknown[];
}) {
  const expires = new Date();
  expires.setDate(expires.getDate() + 1);
  await db
    .insert(analyticsForecasts)
    .values({
      organizationId: data.orgId,
      metricName: data.metricName,
      horizonDays: data.horizonDays,
      currentValue: String(data.currentValue),
      forecastValue: String(data.forecastValue),
      confidenceScore: String(data.confidenceScore),
      forecastData: data.forecastData,
      expiresAt: expires,
    })
    .onConflictDoNothing();
}
