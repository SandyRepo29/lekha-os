"use server";

import { requireUser } from "@/lib/auth/session";
import { recordAudit } from "@/lib/repositories/audit-repo";
import {
  getTrustIntelligenceOverview,
  generateRecommendations,
  snapshotGovernance,
  getGovernanceTimeline,
} from "@/lib/services/trust-intelligence/trust-intelligence-service";
import {
  generateExecutiveSummary,
  getCachedSummary,
  chat,
} from "@/lib/services/trust-intelligence/ai-trust-intelligence-service";
import { getTrends } from "@/lib/services/governance-trends/trends-service";
import { runMonitoringRules } from "@/lib/services/governance-trends/monitoring-service";
import {
  generateWeeklySummary,
  generateForecast,
  chatTrends,
} from "@/lib/services/governance-trends/ai-trends-service";
import {
  findAlerts,
  countAlerts,
  resolveAlert,
} from "@/lib/repositories/governance-alerts-repo";

// ── Existing actions ──────────────────────────────────────────────────────────

export async function getOverviewAction() {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const data = await getTrustIntelligenceOverview(session.org.id);
    return { data };
  } catch (e: any) {
    return { error: e.message ?? "Failed to load overview." };
  }
}

export async function getRecommendationsAction() {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const recs = await generateRecommendations(session.org.id);
    return { data: recs };
  } catch (e: any) {
    return { error: e.message ?? "Failed to generate recommendations." };
  }
}

export async function snapshotGovernanceAction() {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    await snapshotGovernance(session.org.id);
    await recordAudit({
      organizationId: session.org.id,
      actorId: session.id,
      action: "trust_intelligence.score_recalculated",
      entityType: "organization",
      entityId: session.org.id,
      metadata: {},
    });
    return { ok: true };
  } catch (e: any) {
    return { error: e.message ?? "Snapshot failed." };
  }
}

export async function getTimelineAction(limit = 30) {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const events = await getGovernanceTimeline(session.org.id, limit);
    return { data: events };
  } catch (e: any) {
    return { error: e.message ?? "Failed to load timeline." };
  }
}

export async function generateExecutiveSummaryAction() {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const summary = await generateExecutiveSummary(session.org.id);
    await recordAudit({
      organizationId: session.org.id,
      actorId: session.id,
      action: "trust_intelligence.summary_generated",
      entityType: "organization",
      entityId: session.org.id,
      metadata: {},
    });
    return { data: summary };
  } catch (e: any) {
    return { error: e.message ?? "AI generation failed." };
  }
}

export async function chatAction(
  question: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = []
) {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const reply = await chat(session.org.id, question, history);
    return { data: reply };
  } catch (e: any) {
    return { error: e.message ?? "AI chat failed." };
  }
}

// ── New Module 8 actions ──────────────────────────────────────────────────────

export async function getTrendsAction(days: 30 | 90 | 180 | 365 = 90) {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const data = await getTrends(session.org.id, days);
    return { data };
  } catch (e: any) {
    return { error: e.message ?? "Failed to load trends." };
  }
}

export async function getAlertsAction(opts: { status?: string; severity?: string } = {}) {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const [alerts, counts] = await Promise.all([
      findAlerts(session.org.id, opts),
      countAlerts(session.org.id),
    ]);
    return { data: { alerts, counts } };
  } catch (e: any) {
    return { error: e.message ?? "Failed to load alerts." };
  }
}

export async function resolveAlertAction(alertId: string) {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    await resolveAlert(alertId, session.id);
    await recordAudit({
      organizationId: session.org.id,
      actorId: session.id,
      action: "monitoring.alert_resolved",
      entityType: "organization",
      entityId: session.org.id,
      metadata: { alertId },
    });
    return { ok: true };
  } catch (e: any) {
    return { error: e.message ?? "Failed to resolve alert." };
  }
}

export async function runMonitoringAction() {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const result = await runMonitoringRules(session.org.id);
    await recordAudit({
      organizationId: session.org.id,
      actorId: session.id,
      action: "monitoring.rules_run",
      entityType: "organization",
      entityId: session.org.id,
      metadata: result,
    });
    return { data: result };
  } catch (e: any) {
    return { error: e.message ?? "Monitoring run failed." };
  }
}

export async function generateWeeklySummaryAction() {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const trends = await getTrends(session.org.id, 30);
    const summary = await generateWeeklySummary(session.org.id, trends);
    return { data: summary };
  } catch (e: any) {
    return { error: e.message ?? "AI weekly summary failed." };
  }
}

export async function generateForecastAction() {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const trends = await getTrends(session.org.id, 90);
    const forecast = await generateForecast(session.org.id, trends);
    return { data: forecast };
  } catch (e: any) {
    return { error: e.message ?? "AI forecast failed." };
  }
}

export async function chatTrendsAction(
  question: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = []
) {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const trends = await getTrends(session.org.id, 90);
    const reply = await chatTrends(session.org.id, question, trends, history);
    return { data: reply };
  } catch (e: any) {
    return { error: e.message ?? "AI chat failed." };
  }
}
