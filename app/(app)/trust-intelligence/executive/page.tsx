export const dynamic = "force-dynamic";

import Link from "next/link";
import { Sparkles, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getTrustIntelligenceOverview, generateRecommendations } from "@/lib/services/trust-intelligence/trust-intelligence-service";
import { getCachedSummary, generateExecutiveSummary } from "@/lib/services/trust-intelligence/ai-trust-intelligence-service";
import { getVendorTrustMetrics } from "@/lib/repositories/trust-intelligence-repo";
import { OrgTrustScoreRing, OrgTrustBadge } from "@/components/trust-intelligence/org-trust-badge";
import { ComponentBar, PriorityChip, CategoryChip, TrustStat } from "@/components/trust-intelligence/trust-intelligence-ui";
import { ORG_TRUST_COMPONENT_LABELS, ORG_TRUST_COMPONENT_WEIGHTS } from "@/lib/services/org-trust-score";
import { TrustAIChat } from "@/components/trust-intelligence/trust-ai-chat";

export default async function ExecutiveViewPage() {
  const session = await requireUser();
  if (!session.org) return null;

  const [overview, recs, metrics] = await Promise.all([
    getTrustIntelligenceOverview(session.org.id),
    generateRecommendations(session.org.id),
    getVendorTrustMetrics(session.org.id).catch(() => ({
      bottom10: [] as { id: string; name: string; trustScore: number }[],
      top10: [] as { id: string; name: string; trustScore: number }[],
      allScored: [] as { id: string; name: string; trustScore: number }[],
      total: 0,
      scoredCount: 0,
      avgScore: 0,
    })),
  ]);

  // Try cached summary first; generate if missing
  let summary: string | null = null;
  try {
    summary = await getCachedSummary(session.org.id);
    if (!summary) {
      summary = await generateExecutiveSummary(session.org.id);
    }
  } catch {
    summary = null;
  }

  const { orgTrustScore: score } = overview;
  const highRecs = recs.filter((r) => r.priority === "high");

  const components = [
    { key: "vendorTrust", value: score.vendorTrust },
    { key: "riskPosture", value: score.riskPosture },
    { key: "controlHealth", value: score.controlHealth },
    { key: "auditReadiness", value: score.auditReadiness },
    { key: "complianceCoverage", value: score.complianceCoverage },
  ] as const;

  // --- Phase 9: Trust Decision Intelligence™ answers ---
  const q1Answer =
    score.detractors.length > 0
      ? score.detractors[0]
      : "Governance posture is stable";

  const q2Answer =
    metrics.bottom10.length > 0
      ? `${metrics.bottom10.slice(0, 3).map((v) => v.name).join(", ")} have low trust scores`
      : "All vendors have acceptable trust scores";

  const q3Answer = `${overview.risks.criticalCount} critical risk${overview.risks.criticalCount !== 1 ? "s" : ""} require immediate treatment`;

  const q4Answer =
    highRecs.length > 0
      ? highRecs[0].action
      : "Governance posture is healthy &#8212; maintain current controls";

  const keyQuestions = [
    {
      question: "Why is trust changing?",
      answer: q1Answer,
      href: "/trust-intelligence",
    },
    {
      question: "Which vendors need attention?",
      answer: q2Answer,
      href: "/trust-intelligence/vendors",
    },
    {
      question: "What are the critical risks?",
      answer: q3Answer,
      href: "/risks",
    },
    {
      question: "What should we do now?",
      answer: q4Answer,
      href: "/trust-intelligence/recommendations",
    },
    {
      question: "What will happen next?",
      answer: "See Governance Trends for 90-day forecast",
      href: "/trust-intelligence/trends",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--color-blue)]" />
            Executive View
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)]">Board-ready governance summary</p>
        </div>
      </div>

      {/* Org Trust + AI Summary */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="p-6 flex flex-col items-center justify-center gap-3 lg:col-span-1">
          <OrgTrustScoreRing score={score.overall} size={120} />
          <OrgTrustBadge score={score.overall} />
          <p className="text-[10px] text-[var(--color-ink-faint)] text-center">Organizational Trust Score&#8482;</p>
        </Card>

        <Card className="p-6 lg:col-span-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-[var(--color-blue)]" />
            <span className="text-sm font-semibold">AI Governance Summary</span>
          </div>
          {summary ? (
            <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{summary}</p>
          ) : (
            <p className="text-sm text-[var(--color-ink-faint)]">AI summary unavailable &#8212; configure GEMINI_API_KEY to enable.</p>
          )}
        </Card>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <TrustStat label="Vendors" value={overview.vendors.total} sub={`Avg trust ${overview.vendors.avgScore}`} accent="neutral" />
        <TrustStat label="Critical Risks" value={overview.risks.criticalCount} sub={`${overview.risks.activeCount} total active`} accent={overview.risks.criticalCount > 0 ? "danger" : "neutral"} />
        <TrustStat label="Weak Controls" value={overview.controls.weakCount} sub={`${overview.controls.totalCount} total`} accent={overview.controls.weakCount > 0 ? "danger" : "good"} />
        <TrustStat label="Open Findings" value={overview.audits.totalOpenFindings} sub={`${overview.audits.openCriticalFindings} critical`} accent={overview.audits.openCriticalFindings > 0 ? "danger" : "warn"} />
        <TrustStat label="Compliance" value={`${overview.compliance.avgReadiness}%`} sub={`${overview.compliance.frameworkCount} frameworks`} accent={overview.compliance.avgReadiness >= 75 ? "good" : "warn"} />
      </div>

      {/* Component scores */}
      <Card className="p-6 space-y-4">
        <p className="text-sm font-semibold">Trust Score Breakdown</p>
        {components.map(({ key, value }) => (
          <ComponentBar
            key={key}
            label={ORG_TRUST_COMPONENT_LABELS[key]}
            score={value}
            weight={ORG_TRUST_COMPONENT_WEIGHTS[key]}
          />
        ))}
      </Card>

      {/* Drivers / Detractors */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold text-emerald-400 mb-3">Trust Drivers&#8482;</p>
          {score.drivers.length === 0
            ? <p className="text-xs text-[var(--color-ink-faint)]">No positive drivers detected.</p>
            : <ul className="space-y-1.5">{score.drivers.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />{d}
                </li>
              ))}</ul>
          }
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-red-400 mb-3">Trust Detractors&#8482;</p>
          {score.detractors.length === 0
            ? <p className="text-xs text-[var(--color-ink-faint)]">No detractors detected.</p>
            : <ul className="space-y-1.5">{score.detractors.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />{d}
                </li>
              ))}</ul>
          }
        </Card>
      </div>

      {/* High priority recommendations */}
      {highRecs.length > 0 && (
        <Card className="p-5">
          <p className="text-sm font-semibold mb-4">Open Actions</p>
          <div className="space-y-3">
            {highRecs.slice(0, 5).map((rec) => (
              <div key={rec.id} className="flex items-start gap-3">
                <PriorityChip priority={rec.priority} />
                <div>
                  <p className="text-sm font-medium text-[var(--color-ink)]">{rec.title}</p>
                  <p className="text-xs text-[var(--color-ink-dim)]">{rec.action}</p>
                </div>
                <CategoryChip category={rec.category} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Phase 9 — Trust Decision Intelligence™ */}
      <Card className="p-5 rounded-2xl border-[var(--color-line)] bg-[var(--color-bg-2)]/60">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-4 w-4 text-[var(--color-blue)]" />
          <p className="text-sm font-semibold">Trust Decision Intelligence&#8482;</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {keyQuestions.map((q) => (
            <Link key={q.question} href={q.href}>
              <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors h-full">
                <p className="text-xs font-semibold text-[var(--color-ink)] mb-1">{q.question}</p>
                <p className="text-xs text-[var(--color-ink-dim)] leading-relaxed">{q.answer}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* AI Copilot */}
      <TrustAIChat />
    </div>
  );
}
