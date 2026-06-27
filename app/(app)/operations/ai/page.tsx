export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getAiDecisionsAction, generateAdvisoryAction, generateRecommendationsAction } from "@/lib/toe/actions";
import { ToeSubNav, PriorityBadge } from "@/components/toe/toe-ui";
import { Bot, Sparkles, RefreshCw } from "lucide-react";
import { ToeAiChat } from "@/components/toe/toe-ai-chat";
import { DecisionActions, GenerateRecommendationsButton } from "@/components/toe/ai-decision-actions";

export default async function AiEnginePage() {
  await requireUser();

  const [decisionsResult, advisoryResult] = await Promise.all([
    getAiDecisionsAction(),
    generateAdvisoryAction().catch(() => null),
  ]);

  const decisions = ((decisionsResult as { data?: unknown[] } | null)?.data ?? []) as Array<{
    id: string; title: string; recommendation: string; confidence: number; priority: string;
    status: string; reasoning: string | null; actions: unknown[]; entity_type: string | null;
    created_at: string;
  }>;

  const advisory = (advisoryResult as { data?: string } | null)?.data;

  const pending = decisions.filter(d => d.status === "pending");
  const accepted = decisions.filter(d => d.status === "accepted");
  const dismissed = decisions.filter(d => d.status === "dismissed");

  return (
    <div className="space-y-6 p-6">
      <ToeSubNav />

      <div className="pt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">AI Decision Engine&#8482;</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            AI-assisted governance &#8212; recommendations, risk signals, and operational guidance embedded into your workflows.
          </p>
        </div>
        <GenerateRecommendationsButton />
      </div>

      {/* Advisory */}
      {advisory && (
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.03] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold">Operations Advisory</span>
            <span className="ml-auto text-[10px] text-[var(--color-ink-dim)]">Cached 24h</span>
          </div>
          <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed whitespace-pre-wrap">{advisory}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Decisions Panel */}
        <div className="space-y-4">
          {/* Pending */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold">Open Recommendations</span>
              <span className="ml-auto rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] text-purple-400">{pending.length}</span>
            </div>
            {pending.length === 0
              ? (
                <div className="py-8 text-center">
                  <Bot className="mx-auto mb-3 h-8 w-8 text-[var(--color-ink-dim)]" />
                  <p className="text-sm text-[var(--color-ink-dim)]">No open recommendations.</p>
                  <p className="mt-1 text-xs text-[var(--color-ink-dim)]">Click &#8220;Generate Recommendations&#8221; to get AI-powered governance guidance.</p>
                </div>
              )
              : (
                <div className="space-y-4">
                  {pending.map(dec => (
                    <div key={dec.id} className="rounded-xl border border-purple-500/20 bg-purple-500/[0.03] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <PriorityBadge priority={dec.priority} />
                            <span className="text-[11px] text-[var(--color-ink-dim)]">{dec.confidence}% confidence</span>
                            {dec.entity_type && <span className="text-[11px] text-[var(--color-ink-dim)]">{dec.entity_type}</span>}
                          </div>
                          <div className="text-sm font-semibold">{dec.title}</div>
                          <p className="mt-1 text-xs text-[var(--color-ink-dim)] leading-relaxed">{dec.recommendation}</p>
                          {dec.reasoning && (
                            <p className="mt-1.5 text-[11px] italic text-[var(--color-ink-dim)]">{dec.reasoning}</p>
                          )}
                          {(dec.actions as string[]).length > 0 && (
                            <div className="mt-2 space-y-0.5">
                              {(dec.actions as string[]).map((action, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[11px] text-[var(--color-ink-dim)]">
                                  <span className="text-[var(--color-blue)]">{i + 1}.</span> {action}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <DecisionActions decisionId={dec.id} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* Accepted/Dismissed summary */}
          {(accepted.length > 0 || dismissed.length > 0) && (
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-4">
              <div className="flex items-center gap-4 text-xs text-[var(--color-ink-dim)]">
                <span className="text-emerald-400 font-medium">{accepted.length} accepted</span>
                <span>{dismissed.length} dismissed</span>
              </div>
            </div>
          )}
        </div>

        {/* AI Chat */}
        <div>
          <div className="mb-3 text-sm font-semibold">Operations Copilot&#8482;</div>
          <ToeAiChat />
        </div>
      </div>
    </div>
  );
}
