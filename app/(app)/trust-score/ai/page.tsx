export const dynamic = "force-dynamic";

import { Bot, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { generateExecutiveSummary, chat } from "@/lib/services/trust-intelligence/ai-trust-intelligence-service";
import { getLatestSnapshot } from "@/lib/repositories/trust-intelligence-repo";
import { getOrgTrustMetrics } from "@/lib/repositories/trust-score-repo";

const CAPABILITIES = [
  { title: "Explain Trust Score",       desc: "Break down why your score is what it is and which factors drive it most." },
  { title: "Predict Trust Changes",     desc: "Forecast how upcoming events (audits, renewals, reviews) will impact trust." },
  { title: "Identify Trust Risks",      desc: "Surface the highest-risk governance gaps before they become incidents." },
  { title: "Recommend Improvements",    desc: "Get a prioritized improvement plan ranked by trust impact per effort." },
  { title: "Generate Board Summaries",  desc: "Produce board-ready trust narratives in seconds." },
  { title: "Prioritize Remediation",    desc: "Rank open findings, expired evidence, and weak controls by trust impact." },
];

const SUGGESTED_QUESTIONS = [
  "Why did trust decrease?",
  "Which vendor impacts trust most?",
  "How can we improve trust by 10 points?",
  "What is driving trust risk?",
  "Show trust trend for last quarter.",
  "Generate a board governance summary.",
  "Which controls are weakest?",
  "What evidence is expiring soon?",
];

export default async function TrustAiPage({
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

  const orgScore    = snap?.orgTrustScore ?? 80;
  const vendorScore = snap?.vendorTrustScore ?? (vendorM?.avgScore ?? 72);
  const ctrlScore   = snap?.avgControlHealth ?? 74;

  const [summary] = await Promise.all([
    generateExecutiveSummary(orgId).catch(() => null),
  ]);
  const execReport: string | null = null;

  let chatResponse: string | null = null;
  if (sp.q) {
    chatResponse = await chat(orgId, sp.q, []).catch(() => null);
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-indigo-400" />
          Trust Copilot&#8482;
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          AI Trust Advisor&#8482; &#8212; explain scores, predict changes, identify risks, and generate board summaries.
        </p>
      </div>

      {/* Capabilities */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CAPABILITIES.map((c) => (
          <div key={c.title} className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-3">
            <p className="text-xs font-semibold mb-1">{c.title}</p>
            <p className="text-[11px] text-[var(--color-ink-faint)] leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      <Card className="p-6 border-indigo-500/20">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          AI Trust Summary
        </h2>
        {summary ? (
          <>
            <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{summary}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="text-lg font-bold">{orgScore}</p>
                <p className="text-xs text-[var(--color-ink-dim)]">Trust Score&#8482;</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="text-lg font-bold">{vendorScore}</p>
                <p className="text-xs text-[var(--color-ink-dim)]">Vendor Trust</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="text-lg font-bold">{ctrlScore}</p>
                <p className="text-xs text-[var(--color-ink-dim)]">Control Health</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--color-ink-dim)]">GEMINI_API_KEY not configured &#8212; AI unavailable.</p>
        )}
      </Card>

      {/* Executive Report */}
      {execReport && (
        <Card className="p-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Board Governance Summary
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed whitespace-pre-wrap">{execReport}</p>
        </Card>
      )}

      {/* Chat */}
      <Card className="p-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Bot className="h-4 w-4 text-blue-400" />
          Trust Copilot&#8482; Chat
        </h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <a key={q} href={`?q=${encodeURIComponent(q)}`}
              className="rounded-full border border-[var(--color-line)] bg-white/[0.03] px-3 py-1 text-xs text-[var(--color-ink-dim)] hover:bg-white/[0.07] hover:text-[var(--color-ink)] transition-colors">
              {q}
            </a>
          ))}
        </div>
        <form className="flex gap-2">
          <input name="q" defaultValue={sp.q}
            placeholder="Why did trust decrease? How do we reach Trusted status?"
            className="flex-1 rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-indigo-500/50" />
          <Button type="submit" size="sm"><Bot className="h-4 w-4" /> Ask</Button>
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
