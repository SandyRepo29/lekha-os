export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/backend/src/modules/continuous-compliance/continuous-compliance-service";
import { generateComplianceSummary } from "@/backend/src/modules/continuous-compliance/ai-continuous-compliance-service";
import { Bot, Sparkles } from "lucide-react";
import { CcAiChat } from "@/components/continuous-compliance/cc-ai-chat";
import { CcSubNav } from "@/components/continuous-compliance/cc-ui";

export default async function AiCompliancePage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const data = await getDashboardData(orgId).catch(() => null);
  const m = data?.metrics;

  const summary = await generateComplianceSummary(orgId, {
    totalChecks: m?.totalChecks ?? 0,
    passingChecks: m?.passingChecks ?? 0,
    failingChecks: m?.failingChecks ?? 0,
    checkPassRate: m?.checkPassRate ?? 0,
    openSignals: m?.openSignals ?? 0,
    healthScore: data?.healthScore?.score,
  }).catch(() => null);

  return (
    <div className="space-y-6 p-6">
      <CcSubNav />

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Compliance Copilot™</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">AI-powered continuous compliance analysis, drift detection, and executive reporting</p>
      </div>

      {summary && (
        <div className="rounded-2xl border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.05] p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-blue)]" />
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-blue)]">Executive Summary</div>
              <p className="text-sm leading-relaxed text-[var(--color-ink-dim)] whitespace-pre-wrap">{summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Context cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Checks",  value: m?.totalChecks ?? 0 },
          { label: "Pass Rate",     value: `${m?.checkPassRate ?? 0}%` },
          { label: "Open Signals",  value: m?.openSignals ?? 0 },
          { label: "Health Score",  value: data?.healthScore?.score ?? "—" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-3 text-center">
            <div className="text-xl font-bold text-[var(--color-blue)]">{s.value}</div>
            <div className="mt-0.5 text-[11px] text-[var(--color-ink-faint)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* AI Chat */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Bot className="h-5 w-5 text-[var(--color-blue)]" />
          <h3 className="font-semibold text-sm">AI Compliance Officer™ — Chat</h3>
        </div>
        <CcAiChat />
      </div>
    </div>
  );
}
