"use server";

import { generateText, isAIConfigured } from "@/lib/providers/ai";
import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { and, eq, gte } from "drizzle-orm";
import * as repo from "@/backend/src/modules/auditor-collaboration/auditor-collaboration-repo";

const CACHE_TTL_HOURS = 24;

async function getCached(orgId: string, insightType: string): Promise<string | null> {
  const since = new Date(Date.now() - CACHE_TTL_HOURS * 3600 * 1000);
  const rows = await db.select().from(aiComplianceInsights).where(and(eq(aiComplianceInsights.organizationId, orgId), eq(aiComplianceInsights.insightType, insightType), eq(aiComplianceInsights.targetId, orgId), gte(aiComplianceInsights.generatedAt, since))).limit(1);
  return rows[0]?.content ?? null;
}

async function saveCache(orgId: string, insightType: string, content: string): Promise<void> {
  await db.insert(aiComplianceInsights).values({ organizationId: orgId, insightType, targetId: orgId, content }).onConflictDoNothing().catch(() => {});
}

function fallbackSummary(metrics: Awaited<ReturnType<typeof repo.getDashboardMetrics>>): string {
  return `Your organization has ${metrics.totalRooms} audit rooms (${metrics.activeRooms} active), ${metrics.openEvidenceRequests} pending evidence requests, ${metrics.openFindings} open findings, and ${metrics.activeUsers} active external collaborators. Configure GEMINI_API_KEY to unlock AI-powered insights.`;
}

// ── Audit Readiness Summary ───────────────────────────────────────────────────

export interface AuditReadinessSummary {
  summary: string;
  readinessScore: number;
  keyRisks: string[];
  recommendations: string[];
  generatedAt: Date;
}

export async function generateAuditReadinessSummary(orgId: string): Promise<AuditReadinessSummary> {
  const cacheKey = "audit_readiness_summary";
  const cached = await getCached(orgId, cacheKey);
  if (cached) {
    try { return { ...JSON.parse(cached), generatedAt: new Date() }; } catch {}
  }

  const metrics = await repo.getDashboardMetrics(orgId);
  const [findings, requests] = await Promise.all([
    repo.findAllExternalFindings(orgId),
    repo.findAllEvidenceRequests(orgId),
  ]);

  if (!isAIConfigured()) {
    return { summary: fallbackSummary(metrics), readinessScore: 0, keyRisks: [], recommendations: [], generatedAt: new Date() };
  }

  const criticalFindings = findings.filter(f => f.severity === "critical" || f.severity === "high").length;
  const overdueEvidence = requests.filter(r => r.status === "pending" && r.dueDate && new Date(r.dueDate) < new Date()).length;

  const prompt = `You are an expert audit readiness advisor. Analyze this governance posture and provide a structured JSON response.

Data:
- Total audit rooms: ${metrics.totalRooms} (${metrics.activeRooms} active)
- Open evidence requests: ${metrics.openEvidenceRequests} (${overdueEvidence} overdue)
- Open findings: ${metrics.openFindings} (${criticalFindings} critical/high)
- Active external collaborators: ${metrics.activeUsers}
- Total assessments: ${metrics.totalAssessments}

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Executive 2-sentence audit readiness summary",
  "readinessScore": 72,
  "keyRisks": ["Risk 1", "Risk 2", "Risk 3"],
  "recommendations": ["Action 1", "Action 2", "Action 3", "Action 4"]
}`;

  try {
    const text = await generateText(prompt);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);
    await saveCache(orgId, cacheKey, JSON.stringify(parsed));
    return { ...parsed, generatedAt: new Date() };
  } catch {
    return { summary: fallbackSummary(metrics), readinessScore: 50, keyRisks: [], recommendations: [], generatedAt: new Date() };
  }
}

// ── AI Evidence Analyzer ──────────────────────────────────────────────────────

export async function analyzeEvidenceGaps(orgId: string): Promise<{ gaps: { title: string; severity: string; action: string }[] }> {
  const requests = await repo.findAllEvidenceRequests(orgId);
  const pending = requests.filter(r => r.status === "pending");
  const rejected = requests.filter(r => r.status === "rejected");

  if (!isAIConfigured()) {
    return { gaps: pending.slice(0, 5).map(r => ({ title: r.title, severity: "medium", action: "Upload and submit the requested evidence." })) };
  }

  const prompt = `You are an audit compliance expert. Analyze these evidence gaps and provide structured remediation guidance.

Pending evidence requests (${pending.length}):
${pending.slice(0, 10).map(r => `- [${r.priority}] ${r.title}: ${r.description || "No description"}`).join("\n")}

Rejected responses (${rejected.length}):
${rejected.slice(0, 5).map(r => `- ${r.title}: ${r.rejectionReason || "No reason given"}`).join("\n")}

Respond ONLY with valid JSON:
{
  "gaps": [
    { "title": "Gap title", "severity": "high", "action": "Specific remediation step" }
  ]
}`;

  try {
    const text = await generateText(prompt);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return JSON.parse(match[0]);
  } catch {
    return { gaps: [] };
  }
}

// ── AI Finding Draft Generator ────────────────────────────────────────────────

export async function generateFindingDraft(orgId: string, observation: string): Promise<{
  title: string;
  description: string;
  severity: string;
  findingType: string;
  recommendation: string;
}> {
  if (!isAIConfigured()) {
    return { title: "Finding from observation", description: observation, severity: "medium", findingType: "observation", recommendation: "Review and remediate as appropriate." };
  }

  const prompt = `You are a senior auditor. Convert this observation into a structured audit finding.

Observation: "${observation}"

Respond ONLY with valid JSON:
{
  "title": "Concise finding title (under 80 chars)",
  "description": "Detailed finding description",
  "severity": "low|medium|high|critical",
  "findingType": "observation|non_conformance|opportunity|major_nc|minor_nc|recommendation",
  "recommendation": "Specific remediation recommendation"
}`;

  try {
    const text = await generateText(prompt);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return JSON.parse(match[0]);
  } catch {
    return { title: "Finding from observation", description: observation, severity: "medium", findingType: "observation", recommendation: "Review and remediate as appropriate." };
  }
}

// ── AI Audit Assistant Chat ───────────────────────────────────────────────────

export async function chat(orgId: string, messages: { role: string; content: string }[]): Promise<string> {
  const metrics = await repo.getDashboardMetrics(orgId);

  if (!isAIConfigured()) {
    return "AI assistant is not configured. Set GEMINI_API_KEY to enable the AI Audit Assistant™.";
  }

  const context = `You are the AUDT AI Audit Assistant™. You help governance teams manage external auditor collaboration.

Current state:
- ${metrics.totalRooms} audit rooms (${metrics.activeRooms} active)
- ${metrics.openEvidenceRequests} pending evidence requests
- ${metrics.openFindings} open audit findings
- ${metrics.activeUsers} active external auditors/assessors
- ${metrics.totalAssessments} assessment projects

Answer questions about audit readiness, evidence management, finding remediation, and auditor collaboration. Be concise and actionable.`;

  const history = messages.slice(-8).map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
  const lastUser = messages.filter(m => m.role === "user").at(-1)?.content ?? "";

  try {
    return await generateText(`${context}\n\nConversation:\n${history}\n\nRespond to the user's last message helpfully and concisely.`);
  } catch {
    return "I encountered an error processing your request. Please try again.";
  }
}
