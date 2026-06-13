export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { generateAuditReadinessSummary, analyzeEvidenceGaps } from "@/lib/services/auditor-collaboration/ai-auditor-service";
import { chatAction, generateFindingDraftAction } from "@/lib/auditor-collaboration/actions";
import { Brain, Sparkles, AlertTriangle, FileCheck, MessageSquare } from "lucide-react";
import AuditorAiChat from "@/components/auditor-collaboration/auditor-ai-chat";

const SEV_COLORS: Record<string, string> = {
  low: "text-emerald-400", medium: "text-yellow-400", high: "text-orange-400", critical: "text-red-400",
};

export default async function AuditAssistantPage() {
  const session = await requireUser();
  const oid = session.org?.id ?? "";

  const [summary, gaps] = await Promise.all([
    generateAuditReadinessSummary(oid).catch(() => null),
    analyzeEvidenceGaps(oid).catch(() => null),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-[var(--color-blue)]" /> AI Audit Assistant™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            AI-powered audit readiness scoring, evidence gap analysis, and governance intelligence.
          </p>
        </div>
      </div>

      {/* Readiness Summary */}
      {summary && (
        <div className="rounded-xl border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.04] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-[var(--color-blue)]" /> Audit Readiness Summary
            </h2>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-[var(--color-blue)]">{summary.readinessScore}</div>
              <div className="text-xs text-[var(--color-ink-dim)]">/ 100</div>
            </div>
          </div>

          <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{summary.summary}</p>

          {summary.keyRisks.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-[var(--color-ink-dim)] mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-orange-400" /> Key Risks
              </div>
              <ul className="space-y-1">
                {summary.keyRisks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.recommendations.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-[var(--color-ink-dim)] mb-2">Recommendations</div>
              <ul className="space-y-1">
                {summary.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-blue)]" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Evidence Gap Analysis */}
      {gaps && gaps.gaps.length > 0 && (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <FileCheck className="h-4 w-4 text-yellow-400" /> AI Evidence Gap Analysis™
          </h2>
          <div className="space-y-2">
            {gaps.gaps.map((g, i) => (
              <div key={i} className="rounded-lg border border-[var(--color-line)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm">{g.title}</div>
                  <span className={`text-xs font-semibold shrink-0 ${SEV_COLORS[g.severity] ?? "text-slate-400"}`}>{g.severity}</span>
                </div>
                <p className="mt-1 text-xs text-sky-300">{g.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Chat */}
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5">
        <h2 className="font-semibold flex items-center gap-2 text-sm mb-4">
          <MessageSquare className="h-4 w-4 text-[var(--color-blue)]" /> Governance Copilot™
        </h2>
        <AuditorAiChat />
      </div>
    </div>
  );
}
