"use server";

import { requireUser } from "@/lib/auth/session";
import * as svc from "@/lib/services/executive-reporting/executive-reporting-service";
import * as ai from "@/lib/services/executive-reporting/ai-executive-reporting-service";
import { revalidatePath } from "next/cache";

function getOrgId(session: Awaited<ReturnType<typeof requireUser>>) {
  return session.org?.id ?? "";
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardDataAction(dashboardType: string) {
  const session = await requireUser();
  return svc.getDashboardData(getOrgId(session), dashboardType);
}

export async function computeKpisAction() {
  const session = await requireUser();
  const kpis = await svc.computeKpis(getOrgId(session));
  revalidatePath("/executive-reporting");
  return kpis;
}

// ── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalyticsOverviewAction() {
  const session = await requireUser();
  return svc.getAnalyticsOverview(getOrgId(session));
}

// ── Reports ──────────────────────────────────────────────────────────────────

export async function getReportsAction() {
  const session = await requireUser();
  return svc.getReports(getOrgId(session));
}

export async function generateReportAction(reportType: string, format = "pdf") {
  const session = await requireUser();
  await svc.generateReport(getOrgId(session), session.id, reportType, format);
  revalidatePath("/executive-reporting/board-reports");
}

// ── Schedules ────────────────────────────────────────────────────────────────

export async function getSchedulesAction() {
  const session = await requireUser();
  return svc.getSchedules(getOrgId(session));
}

export async function createScheduleAction(data: {
  name: string;
  reportType: string;
  frequency: string;
  deliveryMethod: string;
  recipients: string[];
}) {
  const session = await requireUser();
  const schedule = await svc.createSchedule(getOrgId(session), session.id, data);
  revalidatePath("/executive-reporting/scheduled");
  return schedule;
}

export async function toggleScheduleAction(scheduleId: string, isActive: boolean) {
  const session = await requireUser();
  await svc.toggleSchedule(getOrgId(session), scheduleId, isActive);
  revalidatePath("/executive-reporting/scheduled");
}

// ── Forecasts ────────────────────────────────────────────────────────────────

export async function generateForecastsAction() {
  const session = await requireUser();
  await svc.generateForecasts(getOrgId(session));
  revalidatePath("/executive-reporting/forecasts");
}

// ── Snapshots ────────────────────────────────────────────────────────────────

export async function takeSnapshotAction() {
  const session = await requireUser();
  await svc.takeSnapshot(getOrgId(session));
  revalidatePath("/executive-reporting");
}

// ── AI ───────────────────────────────────────────────────────────────────────

export async function generateExecutiveSummaryAction() {
  const session = await requireUser();
  const kpis = await svc.computeKpis(getOrgId(session));
  const kpiMap = Object.fromEntries(kpis.map((k) => [k.kpiKey, Number(k.currentValue ?? 0)]));
  return ai.generateExecutiveSummary(getOrgId(session), kpiMap);
}

export async function generateBoardReportAction(reportType: string) {
  const session = await requireUser();
  const kpis = await svc.computeKpis(getOrgId(session));
  const kpiMap = Object.fromEntries(kpis.map((k) => [k.kpiKey, Number(k.currentValue ?? 0)]));
  return ai.generateBoardReport(getOrgId(session), reportType, kpiMap);
}

export async function chatAction(messages: { role: string; content: string }[]) {
  const session = await requireUser();
  const kpis = await svc.computeKpis(getOrgId(session));
  const kpiMap = Object.fromEntries(kpis.map((k) => [k.kpiKey, Number(k.currentValue ?? 0)]));
  return ai.chat(getOrgId(session), messages, kpiMap);
}

export async function generateTrendAnalysisAction() {
  const session = await requireUser();
  const kpis = await svc.computeKpis(getOrgId(session));
  const kpiMap = Object.fromEntries(kpis.map((k) => [k.kpiKey, Number(k.currentValue ?? 0)]));
  return ai.generateTrendAnalysis(getOrgId(session), kpiMap);
}
