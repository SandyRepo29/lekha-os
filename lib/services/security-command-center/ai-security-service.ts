import { generateText, isAIConfigured } from "@/lib/providers/ai";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

const CACHE_TABLE = "ai_compliance_insights";
const CACHE_TTL_H = 24;

async function getCached(orgId: string, type: string): Promise<string | null> {
  const rows = await db.execute(sql`
    SELECT content FROM ${sql.identifier(CACHE_TABLE)}
    WHERE organization_id = ${orgId}::uuid AND target_id = ${orgId}::uuid AND insight_type = ${type}
      AND generated_at > NOW() - INTERVAL '${sql.raw(String(CACHE_TTL_H))} hours'
    LIMIT 1
  `);
  return ((rows as unknown[])[0] as Record<string, unknown>)?.content as string ?? null;
}

async function saveCache(orgId: string, type: string, content: string) {
  await db.execute(sql`
    INSERT INTO ${sql.identifier(CACHE_TABLE)} (organization_id, target_id, insight_type, content, generated_at)
    VALUES (${orgId}::uuid, ${orgId}::uuid, ${type}, ${content}, NOW())
    ON CONFLICT (organization_id, target_id, insight_type) DO UPDATE SET content = EXCLUDED.content, generated_at = NOW()
  `);
}

// ─── Security Advisory Summary ────────────────────────────────────────────────

export async function generateSecurityAdvisorySummary(orgId: string, metrics: {
  mfaPercent: number; ssoActive: number; ipRules: number; activeSessions: number;
  sensitivePrompts: number; blockedPrompts: number; openMonAlerts: number; criticalMonAlerts: number;
  activeShares: number; score: number; level: string;
}): Promise<string> {
  const cached = await getCached(orgId, "security_advisory_summary");
  if (cached) return cached;

  if (!isAIConfigured()) return "AI is not configured. Set GEMINI_API_KEY to enable AI analysis.";

  const prompt = `You are AUDT's AI Security Advisor. Analyse this organization's security posture and write a 3-4 sentence executive summary for the CISO or security team lead.

Security metrics:
- MFA coverage: ${metrics.mfaPercent}% of users enrolled
- SSO providers active: ${metrics.ssoActive}
- IP allow-list rules: ${metrics.ipRules}
- Active sessions: ${metrics.activeSessions}
- AI prompt sensitivity events (30d): ${metrics.sensitivePrompts}
- AI prompts blocked (30d): ${metrics.blockedPrompts}
- Vendor monitoring alerts open: ${metrics.openMonAlerts} (${metrics.criticalMonAlerts} critical)
- Active evidence shares: ${metrics.activeShares}
- Security Readiness Score: ${metrics.score}/100 — ${metrics.level}

Write a concise, board-ready summary covering: overall posture, top risks, and 2-3 recommended actions. Be specific, not generic.`;

  const result = await generateText(prompt);
  await saveCache(orgId, "security_advisory_summary", result);
  return result;
}

// ─── Security Recommendations ─────────────────────────────────────────────────

export async function generateSecurityRecommendations(orgId: string, metrics: Record<string, unknown>): Promise<Array<{
  priority: string; title: string; description: string; action: string; module: string;
}>> {
  if (!isAIConfigured()) return [];

  const prompt = `You are AUDT's AI Security Advisor. Based on this security posture, generate exactly 5 prioritized security recommendations.

Metrics: ${JSON.stringify(metrics)}

Respond in JSON array format only, no markdown:
[{"priority":"high|medium|low","title":"...","description":"...","action":"...","module":"identity|access|evidence|ai|monitoring"}]`;

  try {
    const result = await generateText(prompt);
    const json = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(json);
  } catch {
    return [
      { priority: "high", title: "Enable MFA for all users", description: "MFA coverage is below 100%. Enforce MFA to protect against credential-based attacks.", action: "Go to Identity > MFA Settings", module: "identity" },
      { priority: "high", title: "Configure enterprise SSO", description: "No SSO provider is configured. SSO centralises auth management and enables rapid offboarding.", action: "Go to Identity > SSO", module: "identity" },
      { priority: "medium", title: "Add IP allow-list rules", description: "No IP restrictions are configured. Add office and VPN IP ranges to reduce attack surface.", action: "Go to Access > IP Allow Lists", module: "access" },
      { priority: "medium", title: "Review active evidence shares", description: "Audit active evidence shares and revoke any that are no longer needed.", action: "Go to Evidence Security", module: "evidence" },
      { priority: "low", title: "Configure vendor monitoring", description: "Set up domain and SSL monitoring for your critical vendors to detect issues proactively.", action: "Go to Monitoring", module: "monitoring" },
    ];
  }
}

// ─── AI Security Chat ─────────────────────────────────────────────────────────

export async function chat(orgId: string, messages: Array<{ role: string; content: string }>) {
  void orgId;
  if (!isAIConfigured()) return "AI is not configured. Set GEMINI_API_KEY to enable.";

  const systemPrompt = `You are AUDT's AI Security Advisor. You help security teams understand their Identity & Access Management posture, Evidence Protection, AI Security, Encryption, and Vendor Monitoring. Be concise and actionable. If asked about something outside security governance, politely redirect.`;

  const history = messages.slice(0, -1)
    .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");
  const last = messages[messages.length - 1];

  const fullPrompt = `${systemPrompt}\n\n${history}\nUser: ${last.content}\nAssistant:`;
  try {
    return await generateText(fullPrompt);
  } catch {
    return "The AI advisor is temporarily unavailable — please try again in a moment.";
  }
}
