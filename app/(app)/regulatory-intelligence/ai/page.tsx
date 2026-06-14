export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/regulatory-intelligence/regulatory-service";
import { generateRegulatoryAdvisorySummary } from "@/lib/services/regulatory-intelligence/ai-regulatory-service";
import { RegSubNav, RegStat } from "@/components/regulatory-intelligence/reg-ui";
import { RegAiAdvisorClient } from "@/components/regulatory-intelligence/reg-ai-chat";
import { Bot, Sparkles } from "lucide-react";

export default async function RegAiAdvisorPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const data = await getDashboardData(orgId).catch(() => null);
  const m = data?.metrics;
  const readiness = data?.readiness;

  const summary = await generateRegulatoryAdvisorySummary(orgId, {
    totalRegulations: m?.totalRegulations ?? 0,
    newChanges: m?.newChanges ?? 0,
    openAlerts: m?.openAlerts ?? 0,
    openObligations: m?.openObligations ?? 0,
    openTasks: m?.openTasks ?? 0,
    readinessScore: readiness?.score ?? 0,
  }).catch(() => "AI summary unavailable. Please check your GEMINI_API_KEY configuration.");

  return (
    <div className="space-y-6 p-6">
      <RegSubNav />

      <div className="flex items-start gap-4 pt-2">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">AI Regulatory Advisor™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Ask anything about regulations, changes, obligations, and your regulatory exposure.
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RegStat label="Regulations" value={m?.totalRegulations ?? 0} accent="neutral" />
        <RegStat label="Open Alerts" value={m?.openAlerts ?? 0} accent="danger" />
        <RegStat label="Open Obligations" value={m?.openObligations ?? 0} accent="warn" />
        <RegStat label="Readiness Score" value={`${readiness?.score ?? 0}%`} accent="good" />
      </div>

      {/* Executive Summary */}
      <div className="rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.05] p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--color-blue)]" />
          <span className="text-sm font-semibold text-[var(--color-blue)]">Regulatory Executive Summary</span>
          <span className="ml-auto text-[10px] text-[var(--color-ink-faint)] rounded-full border border-[var(--color-line)] bg-white/[0.04] px-2 py-0.5">Cached 24h</span>
        </div>
        <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{summary}</p>
      </div>

      {/* Suggested Questions */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h3 className="mb-3 text-sm font-semibold">Suggested Questions</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            "What regulations apply to our organization?",
            "What changed recently in DPDP?",
            "Which obligations are overdue or at risk?",
            "How does ISO 42001 affect our AI systems?",
            "What is our regulatory readiness score?",
            "Which controls need to be updated for DORA?",
          ].map(q => (
            <div
              key={q}
              className="cursor-pointer rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-3 py-2.5 text-xs text-[var(--color-ink-dim)] hover:border-[var(--color-blue)]/30 hover:bg-[var(--color-blue)]/[0.04] hover:text-[var(--color-ink)] transition-colors reg-ai-question"
              data-question={q}
            >
              {q}
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <RegAiAdvisorClient
        context={{
          totalRegulations: m?.totalRegulations ?? 0,
          newChanges: m?.newChanges ?? 0,
          openAlerts: m?.openAlerts ?? 0,
          openObligations: m?.openObligations ?? 0,
        }}
      />
    </div>
  );
}
