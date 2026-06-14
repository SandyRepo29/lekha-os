import { generateText, isAIConfigured } from "@/lib/providers/ai";
import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function getCached(orgId: string, key: string) {
  const [row] = await db.select().from(aiComplianceInsights)
    .where(and(
      eq(aiComplianceInsights.organizationId, orgId),
      eq(aiComplianceInsights.insightType, "asset_intelligence"),
      eq(aiComplianceInsights.targetId, key),
    ))
    .orderBy(desc(aiComplianceInsights.generatedAt))
    .limit(1);
  if (!row) return null;
  const age = Date.now() - new Date(row.generatedAt).getTime();
  return age < CACHE_TTL_MS ? row.content : null;
}

async function saveCache(orgId: string, key: string, content: string) {
  await db.insert(aiComplianceInsights).values({
    organizationId: orgId,
    insightType:    "asset_intelligence",
    targetId:       key,
    content,
  }).onConflictDoNothing();
}

// ─── Asset Intelligence Advisory Summary ─────────────────────────────────────

export async function generateAdvisorySummary(
  orgId: string,
  context: {
    totalAssets: number;
    criticalAssets: number;
    openAlerts: number;
    assetsWithPii: number;
    topTypes: string[];
  }
): Promise<string> {
  const cached = await getCached(orgId, `advisory_${orgId}`);
  if (cached) return cached;

  if (!isAIConfigured()) {
    return "AI advisory is not configured. Please add your Gemini API key to enable AI-powered asset intelligence.";
  }

  const prompt = `You are the AUDT Asset Intelligence™ Advisor.

Organization asset overview:
- Total assets: ${context.totalAssets}
- Critical assets: ${context.criticalAssets}
- Open alerts: ${context.openAlerts}
- Assets containing PII: ${context.assetsWithPii}
- Top asset types: ${context.topTypes.join(", ")}

Write a 3-paragraph executive advisory summary (max 200 words):
1. Current asset posture and key risks
2. Critical areas needing immediate attention
3. Strategic recommendations for improving asset governance

Be specific, actionable, and use governance language.`;

  const text = await generateText(prompt);
  await saveCache(orgId, `advisory_${orgId}`, text);
  return text;
}

// ─── AI Impact Analyzer ───────────────────────────────────────────────────────

export async function analyzeImpact(
  orgId: string,
  context: {
    assetName: string;
    assetType: string;
    criticality: string;
    linkedRisks: number;
    linkedControls: number;
    linkedVendors: number;
    dependencyCount: number;
  }
): Promise<string> {
  if (!isAIConfigured()) {
    return "AI analysis requires a configured Gemini API key.";
  }

  const prompt = `You are the AUDT Asset Impact Analyzer™.

Analyze the governance impact for this asset:
- Name: ${context.assetName}
- Type: ${context.assetType}
- Criticality: ${context.criticality}
- Linked risks: ${context.linkedRisks}
- Controls applied: ${context.linkedControls}
- Vendor dependencies: ${context.linkedVendors}
- Asset dependencies: ${context.dependencyCount}

Provide a concise impact analysis (max 150 words) covering:
1. Risk exposure from this asset
2. Potential blast radius if compromised
3. Control gaps to address

Be specific and use governance-appropriate language.`;

  return generateText(prompt);
}

// ─── AI Dependency Analyzer ───────────────────────────────────────────────────

export async function analyzeDependencyChain(
  orgId: string,
  assetName: string,
  dependencyNames: string[]
): Promise<string> {
  if (!isAIConfigured()) return "AI analysis requires a configured Gemini API key.";

  const prompt = `You are the AUDT Dependency Analyzer™.

Asset: "${assetName}"
Dependencies: ${dependencyNames.length > 0 ? dependencyNames.join(" → ") : "No direct dependencies recorded"}

Analyze:
1. Single points of failure in this dependency chain
2. Vendor concentration risks
3. Regulatory implications (DPDP, GDPR, etc.)
4. Recommended resilience improvements

Keep the analysis under 150 words, governance-focused.`;

  return generateText(prompt);
}

// ─── AI Asset Chat ────────────────────────────────────────────────────────────

export async function chat(
  orgId: string,
  messages: Array<{ role: "user" | "model"; content: string }>,
  context: {
    totalAssets: number;
    criticalAssets: number;
    openAlerts: number;
    assetsWithPii: number;
  }
): Promise<string> {
  if (!isAIConfigured()) return "AI chat requires a configured Gemini API key.";

  const systemContext = `You are the AUDT AI Asset Advisor™ — an expert in enterprise asset governance, dependency mapping, and trust scoring.

Current asset posture:
- Total assets: ${context.totalAssets}
- Critical assets: ${context.criticalAssets}
- Open alerts: ${context.openAlerts}
- Assets with PII: ${context.assetsWithPii}

Answer questions about asset governance, criticality, dependencies, regulatory mapping, and trust scoring. Be concise and actionable.`;

  const history = messages.slice(-8).map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
  const lastUser = messages.at(-1)?.content ?? "";

  const prompt = `${systemContext}\n\nConversation:\n${history}\n\nRespond to the last user message in 2-4 sentences.`;
  return generateText(prompt);
}
