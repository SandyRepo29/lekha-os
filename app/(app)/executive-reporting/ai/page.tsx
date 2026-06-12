export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { computeKpis } from "@/lib/services/executive-reporting/executive-reporting-service";
import { generateExecutiveSummary } from "@/lib/services/executive-reporting/ai-executive-reporting-service";
import Link from "next/link";
import { ArrowLeft, Brain, Sparkles, TrendingUp, FileText } from "lucide-react";
import { ExecutiveReportingAiChat } from "@/components/executive-reporting/executive-reporting-ai-chat";

export default async function AiPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const kpis = await computeKpis(orgId).catch(() => []);
  const kpiMap = Object.fromEntries(kpis.map((k) => [k.kpiKey, Number(k.currentValue ?? 0)]));

  const summary = await generateExecutiveSummary(orgId, kpiMap).catch(
    () => "AI Executive Summary unavailable. Ensure GEMINI_API_KEY is configured."
  );

  return (
    <div className="space-y-8">
      <div>
        <Link href="/executive-reporting" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Executive Reporting™
        </Link>
        <h1 className="text-2xl font-bold">AI Executive Analyst™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
          AI-powered governance intelligence — executive summaries, board reports, trend analysis, and live Q&A.
        </p>
      </div>

      {/* AI Executive Summary */}
      <div className="rounded-xl border border-[var(--color-blue)]/30 bg-gradient-to-br from-[var(--color-blue)]/5 to-transparent p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-blue)]/10">
            <Sparkles className="h-5 w-5 text-[var(--color-blue)]" />
          </div>
          <div>
            <h2 className="font-semibold">AI Executive Summary™</h2>
            <p className="text-xs text-[var(--color-ink-dim)]">Cached · updated every 24 hours</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[var(--color-ink)]">{summary}</p>
      </div>

      {/* Quick KPI snapshot */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {kpis.slice(0, 5).map((kpi) => (
          <div key={kpi.kpiKey} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4 text-center">
            <div className="text-2xl font-bold">{Number(kpi.currentValue ?? 0).toFixed(0)}</div>
            <div className="text-xs text-[var(--color-ink-dim)] mt-1 truncate">{kpi.kpiName}</div>
          </div>
        ))}
      </div>

      {/* Feature cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/executive-reporting/board-reports" className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5 hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/5 transition-all">
          <FileText className="h-6 w-6 text-[var(--color-blue)] mb-3" />
          <h3 className="font-semibold text-sm">AI Board Report Generator™</h3>
          <p className="text-xs text-[var(--color-ink-dim)] mt-1">Generate board-ready reports with AI narrative and recommendations.</p>
        </Link>
        <Link href="/executive-reporting/forecasts" className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5 hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/5 transition-all">
          <TrendingUp className="h-6 w-6 text-emerald-400 mb-3" />
          <h3 className="font-semibold text-sm">AI Forecast Engine™</h3>
          <p className="text-xs text-[var(--color-ink-dim)] mt-1">Predict future trust score, risk levels, and control deterioration.</p>
        </Link>
        <Link href="/executive-reporting/analytics" className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5 hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/5 transition-all">
          <Brain className="h-6 w-6 text-purple-400 mb-3" />
          <h3 className="font-semibold text-sm">AI Trend Analyst™</h3>
          <p className="text-xs text-[var(--color-ink-dim)] mt-1">Analyze cross-module governance trends and emerging patterns.</p>
        </Link>
      </div>

      {/* Live chat */}
      <div>
        <h2 className="mb-4 text-base font-semibold">Governance Copilot™ Chat</h2>
        <ExecutiveReportingAiChat />
      </div>
    </div>
  );
}
