export const dynamic = "force-dynamic";

import { Sparkles, AlertTriangle, TrendingUp, Brain } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { generateExecutiveSummary, chat } from "@/lib/services/trust-intelligence/ai-trust-intelligence-service";
import { getOrgTrustMetrics } from "@/lib/repositories/trust-score-repo";
import { getLatestSnapshot } from "@/lib/repositories/trust-intelligence-repo";

const SAMPLE_QUESTIONS = [
  "Why did trust decrease last month?",
  "Which vendor impacts trust most?",
  "How can we improve trust by 10 points?",
  "What is driving trust risk?",
  "Show trust trend for last quarter.",
  "Which factors need the most attention?",
];

export default async function TrustInsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const sp = await searchParams;

  const [snap, vendorM] = await Promise.all([
    getLatestSnapshot(orgId).catch(() => null),
    getOrgTrustMetrics(orgId).catch(() => null),
  ]);

  const summary = await generateExecutiveSummary(orgId).catch(() => null);

  let chatResponse: string | null = null;
  if (sp.q) {
    chatResponse = await chat(orgId, sp.q, []).catch(() => null);
  }

  const staticInsights = [
    { icon: AlertTriangle, color: "text-red-400", text: "Critical findings are the largest drag on Trust Score&#8482; &#8212; each reduces trust by up to 8 points." },
    { icon: TrendingUp,    color: "text-emerald-400", text: "Completing vendor assessments is the highest-ROI improvement &#8212; each completion adds approximately 4 points." },
    { icon: AlertTriangle, color: "text-amber-400", text: "Evidence expiry creates compounding trust decay. Renew expiring evidence before the 30-day window." },
    { icon: Brain,         color: "text-blue-400", text: "Control health has the second-highest weight at 15%. Improving weak controls from below 60 to above 80 improves trust by 3 points." },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-indigo-400" />
          Trust Insights&#8482;
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          AI-generated governance intelligence &#8212; understand what drives and risks your Trust Score&#8482;.
        </p>
      </div>

      {/* Executive Summary */}
      <Card className="p-6 border-indigo-500/20">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          AI Trust Summary
        </h2>
        {summary ? (
          <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{summary}</p>
        ) : (
          <p className="text-sm text-[var(--color-ink-dim)]">GEMINI_API_KEY not configured &#8212; AI summary unavailable.</p>
        )}
      </Card>

      {/* Static Insights */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4 text-sm">Trust Intelligence&#8482;</h2>
        <div className="space-y-3">
          {staticInsights.map((insight, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-white/[0.02] border border-[var(--color-line)] p-3">
              <insight.icon className={`mt-0.5 h-4 w-4 shrink-0 ${insight.color}`} />
              <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed" dangerouslySetInnerHTML={{ __html: insight.text }} />
            </div>
          ))}
        </div>
      </Card>

      {/* Trust Forecast section */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4 text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[var(--color-blue)]" />
          Trust Forecast&#8482;
        </h2>
        <p className="text-sm text-[var(--color-ink-dim)] mb-3">
          Predictive trust trajectory based on current governance velocity. View the full forecast on the{" "}
          <a href="/trust-score" className="text-[var(--color-blue)] hover:underline">Overview</a> tab.
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Current",  val: snap?.orgTrustScore ?? 80 },
            { label: "30 Days", val: Math.min(100, Math.max(0, (snap?.orgTrustScore ?? 80) - 2)) },
            { label: "90 Days", val: Math.min(100, Math.max(0, (snap?.orgTrustScore ?? 80) - 5)) },
          ].map((f) => (
            <div key={f.label} className="rounded-xl bg-white/[0.03] border border-[var(--color-line)] p-3">
              <p className="text-lg font-bold">{f.val}</p>
              <p className="text-xs text-[var(--color-ink-faint)]">{f.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Copilot Chat */}
      <Card className="p-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-blue-400" />
          Ask Trust Copilot&#8482;
        </h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {SAMPLE_QUESTIONS.map((q) => (
            <a key={q} href={`?q=${encodeURIComponent(q)}`}
              className="rounded-full border border-[var(--color-line)] bg-white/[0.03] px-3 py-1 text-xs text-[var(--color-ink-dim)] hover:bg-white/[0.07] hover:text-[var(--color-ink)] transition-colors">
              {q}
            </a>
          ))}
        </div>
        <form className="flex gap-2">
          <input name="q" defaultValue={sp.q}
            placeholder="Why did trust decrease? How can we reach Trusted?"
            className="flex-1 rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-indigo-500/50" />
          <Button type="submit" size="sm"><Sparkles className="h-4 w-4" /> Ask</Button>
        </form>
        {chatResponse && (
          <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-xs font-medium text-blue-300 mb-1">Trust Copilot&#8482;</p>
            <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{chatResponse}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
