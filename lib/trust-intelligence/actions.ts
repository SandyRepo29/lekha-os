"use server";

import { requireUser } from "@/lib/auth/session";
import { recordAudit } from "@/lib/repositories/audit-repo";
import {
  getTrustIntelligenceOverview,
  generateRecommendations,
  snapshotGovernance,
  getTrends,
  getGovernanceTimeline,
} from "@/lib/services/trust-intelligence/trust-intelligence-service";
import {
  generateExecutiveSummary,
  getCachedSummary,
  chat,
} from "@/lib/services/trust-intelligence/ai-trust-intelligence-service";

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

export async function getTrendsAction(days: 30 | 90 | 365 = 90) {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const trends = await getTrends(session.org.id, days);
    return { data: trends };
  } catch (e: any) {
    return { error: e.message ?? "Failed to load trends." };
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

export async function chatAction(question: string, history: Array<{ role: "user" | "assistant"; content: string }> = []) {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const reply = await chat(session.org.id, question, history);
    return { data: reply };
  } catch (e: any) {
    return { error: e.message ?? "AI chat failed." };
  }
}
