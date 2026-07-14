export const dynamic = "force-dynamic";

import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/backend/src/modules/benchmarking/benchmarking-service";
import { generateBenchmarkReport, generateIndustryInsights, generateImprovementPlan } from "@/backend/src/modules/benchmarking/ai-benchmarking-service";
import { BenchmarkAiChat } from "@/components/benchmarking/benchmark-ai-chat";
import { Bot, Sparkles, TrendingUp, Zap } from "lucide-react";
import {
  BENCHMARK_CATEGORY_LABELS,
  BENCHMARK_MATURITY_LABELS,
  type BenchmarkCategory,
} from "@/backend/src/modules/benchmarking/benchmarking-score";

export default async function BenchmarkAiPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const orgId = session.org.id;

  const { snapshot, scores } = await getDashboardData(orgId);

  const [report, insights, plan] = await Promise.all([
    snapshot ? generateBenchmarkReport(orgId, snapshot, scores).catch(() => "") : Promise.resolve(""),
    snapshot ? generateIndustryInsights(orgId, snapshot.industry ?? "all", scores).catch(() => "") : Promise.resolve(""),
    snapshot ? generateImprovementPlan(orgId, scores).catch(() => []) : Promise.resolve([]),
  ]);

  const chatContext = {
    overallScore: snapshot?.overallScore ?? null,
    overallPercentile: snapshot?.overallPercentile ?? null,
    maturityLevel: snapshot ? BENCHMARK_MATURITY_LABELS[snapshot.maturityLevel] : "Unknown",
    industry: snapshot?.industry ?? null,
    topCategories: scores
      .filter((s) => s.deltaVsIndustry !== null && s.deltaVsIndustry > 0)
      .sort((a, b) => (b.deltaVsIndustry ?? 0) - (a.deltaVsIndustry ?? 0))
      .slice(0, 3)
      .map((s) => BENCHMARK_CATEGORY_LABELS[s.category as BenchmarkCategory] ?? s.category),
    weakCategories: scores
      .filter((s) => s.deltaVsIndustry !== null && s.deltaVsIndustry < 0)
      .sort((a, b) => (a.deltaVsIndustry ?? 0) - (b.deltaVsIndustry ?? 0))
      .slice(0, 3)
      .map((s) => BENCHMARK_CATEGORY_LABELS[s.category as BenchmarkCategory] ?? s.category),
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-[var(--color-blue)]" /> AI Benchmark Analyst™
        </h2>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          AI-powered insights on your governance position, industry comparison, and improvement priorities.
        </p>
      </div>

      {!snapshot ? (
        <Card className="p-8 text-center">
          <p className="text-[var(--color-ink-dim)]">Run a benchmark first to unlock AI analysis.</p>
        </Card>
      ) : (
        <>
          {/* Executive Benchmark Report */}
          {report && (
            <Card className="p-5 border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.04]">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-[var(--color-blue)]" />
                <p className="text-sm font-semibold text-[var(--color-blue)]">AI Benchmark Report™</p>
              </div>
              <p className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-line">{report}</p>
            </Card>
          )}

          {/* Industry Insights */}
          {insights && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-700" />
                <p className="text-sm font-semibold">AI Industry Insights™</p>
              </div>
              <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed whitespace-pre-line">{insights}</p>
            </Card>
          )}

          {/* Improvement Planner */}
          {plan.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-4 w-4 text-orange-700" />
                <p className="text-sm font-semibold">AI Improvement Planner™</p>
              </div>
              <div className="space-y-3">
                {plan.map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-white border border-[var(--color-line)]">
                    <div className="flex-shrink-0 text-sm font-bold text-[var(--color-ink-faint)] w-5">{i + 1}.</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--color-blue)] font-semibold mb-1">
                        {BENCHMARK_CATEGORY_LABELS[item.category as BenchmarkCategory] ?? item.category}
                      </p>
                      <p className="text-sm text-[var(--color-ink)]">{item.action}</p>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0 text-right">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.impact === "high" ? "bg-green-100 text-green-700" : item.impact === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-[var(--color-ink-dim)]"}`}>
                        {item.impact} impact
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.effort === "low" ? "bg-green-100 text-green-700" : item.effort === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                        {item.effort} effort
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* AI Chat */}
          <BenchmarkAiChat context={chatContext} />
        </>
      )}
    </div>
  );
}
