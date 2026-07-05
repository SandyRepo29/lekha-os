import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { generateText } from "@/lib/providers/ai";
import * as timelineRepo from "@/lib/repositories/vendor-timeline-repo";

export type RenewalRecommendation = "renew" | "renew_with_conditions" | "renegotiate" | "suspend" | "offboard";

export const RENEWAL_RECOMMENDATION_LABELS: Record<RenewalRecommendation, string> = {
  renew:                "Renew",
  renew_with_conditions: "Renew with Conditions",
  renegotiate:          "Renegotiate",
  suspend:              "Suspend",
  offboard:             "Offboard",
};

export const RENEWAL_RECOMMENDATION_COLORS: Record<RenewalRecommendation, string> = {
  renew:                "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  renew_with_conditions: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  renegotiate:          "text-amber-400 bg-amber-500/10 border-amber-500/20",
  suspend:              "text-orange-400 bg-orange-500/10 border-orange-500/20",
  offboard:             "text-red-400 bg-red-500/10 border-red-500/20",
};

export type RenewalInputs = {
  trustScore: number | null;
  complianceScore: number;
  openRisks: number;
  criticalRisks: number;
  openFindings: number;
  openCapas: number;
  contractHealth: number | null;
  vendorName: string;
};

export type RenewalAssessmentRow = {
  id: string;
  organization_id: string;
  vendor_id: string;
  assessment_date: Date;
  trust_score: number | null;
  compliance_score: number | null;
  open_risks: number;
  critical_risks: number;
  open_findings: number;
  open_capas: number;
  contract_health: number | null;
  recommendation: RenewalRecommendation | null;
  confidence_pct: number | null;
  conditions: string[] | null;
  notes: string | null;
  decided_by: string | null;
  decided_at: Date | null;
  ai_analysis: string | null;
  created_by: string | null;
  created_at: Date;
};

/** Pure function — compute renewal recommendation from inputs */
export function computeRenewalRecommendation(inputs: RenewalInputs): {
  recommendation: RenewalRecommendation;
  confidence: number;
  conditions: string[];
  rationale: string[];
} {
  const conditions: string[] = [];
  const rationale: string[] = [];
  let score = 100;

  // Trust score (−20 per tier below threshold)
  if (inputs.trustScore !== null) {
    if (inputs.trustScore < 50) { score -= 40; rationale.push("Critical trust score below 50"); }
    else if (inputs.trustScore < 65) { score -= 25; rationale.push("Low trust score"); }
    else if (inputs.trustScore < 80) { score -= 10; rationale.push("Moderate trust score"); }
    else rationale.push("Strong trust score");
  }

  // Critical risks
  if (inputs.criticalRisks > 0) {
    score -= inputs.criticalRisks * 20;
    conditions.push(`${inputs.criticalRisks} critical risk(s) must be closed before renewal`);
    rationale.push(`${inputs.criticalRisks} open critical risks`);
  }
  if (inputs.openRisks > 5) {
    score -= 10;
    conditions.push("Reduce open risk count below 5");
    rationale.push(`${inputs.openRisks} open risks`);
  }

  // Findings
  if (inputs.openFindings > 3) {
    score -= 15;
    conditions.push("Close outstanding audit findings");
    rationale.push(`${inputs.openFindings} open findings`);
  }

  // CAPAs
  if (inputs.openCapas > 2) {
    score -= 10;
    conditions.push("Complete overdue CAPAs");
    rationale.push(`${inputs.openCapas} open CAPAs`);
  }

  // Contract health
  if (inputs.contractHealth !== null && inputs.contractHealth < 50) {
    score -= 15;
    conditions.push("Renegotiate contract terms before renewal");
    rationale.push("Poor contract health");
  }

  // Compliance
  if (inputs.complianceScore < 60) {
    score -= 20;
    conditions.push("Address compliance gaps before renewal");
    rationale.push("Compliance score below threshold");
  }

  const recommendation: RenewalRecommendation =
    score >= 85 ? "renew" :
    score >= 70 ? "renew_with_conditions" :
    score >= 50 ? "renegotiate" :
    score >= 30 ? "suspend" :
    "offboard";

  return { recommendation, confidence: Math.max(0, Math.min(100, score)), conditions, rationale };
}

export async function createRenewalAssessment(params: {
  orgId: string;
  vendorId: string;
  actorId: string;
  actorName?: string;
  inputs: RenewalInputs;
  notes?: string;
  aiEnabled?: boolean;
}): Promise<RenewalAssessmentRow> {
  const { recommendation, confidence, conditions } = computeRenewalRecommendation(params.inputs);

  let aiAnalysis: string | null = null;
  if (params.aiEnabled) {
    try {
      const prompt = `You are a Vendor Governance advisor generating a renewal recommendation summary.

Vendor: ${params.inputs.vendorName}
Trust Score: ${params.inputs.trustScore ?? "N/A"}/100
Compliance Score: ${params.inputs.complianceScore}/100
Open Risks: ${params.inputs.openRisks} (Critical: ${params.inputs.criticalRisks})
Open Findings: ${params.inputs.openFindings}
Open CAPAs: ${params.inputs.openCapas}
Contract Health: ${params.inputs.contractHealth ?? "N/A"}/100

Recommendation: ${RENEWAL_RECOMMENDATION_LABELS[recommendation]} (Confidence: ${confidence}%)
Conditions: ${conditions.length > 0 ? conditions.join("; ") : "None"}

Write a concise 2-3 sentence board-ready renewal recommendation summary. Focus on the most important factors driving this recommendation.`;
      aiAnalysis = await generateText(prompt);
    } catch {
      // AI failure is non-critical
    }
  }

  // Postgres text[] literal uses {…}, not JSON's [ … ]; build it explicitly.
  const conditionsLiteral = `{${conditions.map((c) => `"${String(c).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}`;

  const rows = await db.execute<RenewalAssessmentRow>(
    sql`INSERT INTO vendor_renewal_assessments
          (organization_id, vendor_id, trust_score, compliance_score, open_risks, critical_risks,
           open_findings, open_capas, contract_health, recommendation, confidence_pct, conditions,
           notes, ai_analysis, created_by)
        VALUES
          (${params.orgId}, ${params.vendorId}, ${params.inputs.trustScore ?? null},
           ${params.inputs.complianceScore}, ${params.inputs.openRisks}, ${params.inputs.criticalRisks},
           ${params.inputs.openFindings}, ${params.inputs.openCapas}, ${params.inputs.contractHealth ?? null},
           ${recommendation}, ${confidence}, ${conditionsLiteral}::text[],
           ${params.notes ?? null}, ${aiAnalysis}, ${params.actorId})
        RETURNING *`
  );

  await timelineRepo.insertTimelineEvent({
    orgId:      params.orgId,
    vendorId:   params.vendorId,
    eventType:  "renewal_started",
    title:      `Renewal assessment: ${RENEWAL_RECOMMENDATION_LABELS[recommendation]}`,
    description: `Confidence: ${confidence}%`,
    actorId:    params.actorId,
    actorName:  params.actorName,
    severity:   recommendation === "renew" ? "success" : recommendation === "offboard" ? "danger" : "warn",
  });

  return rows[0]!;
}

export async function getLatestRenewalAssessment(orgId: string, vendorId: string): Promise<RenewalAssessmentRow | null> {
  const rows = await db.execute<RenewalAssessmentRow>(
    sql`SELECT * FROM vendor_renewal_assessments
        WHERE organization_id = ${orgId} AND vendor_id = ${vendorId}
        ORDER BY created_at DESC LIMIT 1`
  );
  return rows[0] ?? null;
}

export async function getRenewalAssessments(orgId: string, vendorId: string): Promise<any[]> {
  const rows = await db.execute(
    sql`SELECT vra.*, p.full_name AS conducted_by
        FROM vendor_renewal_assessments vra
        LEFT JOIN profiles p ON p.id = vra.created_by
        WHERE vra.organization_id = ${orgId} AND vra.vendor_id = ${vendorId}
        ORDER BY vra.created_at DESC
        LIMIT 20`
  );
  return rows.map((r: any) => ({
    id:               r.id,
    assessment_date:  r.assessment_date ?? r.created_at,
    recommendation:   r.recommendation,
    confidence_score: r.confidence_pct,
    notes:            r.notes,
    ai_rationale:     r.ai_analysis,
    conditions:       r.conditions,
    rationale:        null,
    conducted_by:     r.conducted_by,
    status:           r.decided_at ? "completed" : "pending",
  }));
}
