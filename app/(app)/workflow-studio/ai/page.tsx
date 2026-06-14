export const dynamic = "force-dynamic";

import { Sparkles, AlertCircle, GitBranch, TrendingUp, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/lib/services/workflow-studio/workflow-service";
import {
  generateExecutiveSummary,
  generateWorkflowFromPrompt,
  analyzeWorkflowBottlenecks,
  chat,
} from "@/lib/services/workflow-studio/ai-workflow-service";

export default async function WorkflowAIPage({
  searchParams,
}: {
  searchParams: Promise<{
    generatePrompt?: string;
    question?: string;
  }>;
}) {
  const session = await requireUser();
  const sp = await searchParams;

  if (session.demo || !session.org) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
        <p className="font-semibold">Not available in demo mode.</p>
      </Card>
    );
  }

  const metrics = await getDashboardMetrics(session.org.id);
  const [summary, bottlenecks, generated, chatResponse] = await Promise.all([
    generateExecutiveSummary(session.org.id, metrics),
    analyzeWorkflowBottlenecks(session.org.id, metrics),
    sp.generatePrompt ? generateWorkflowFromPrompt(sp.generatePrompt) : Promise.resolve(null),
    sp.question ? chat(session.org.id, sp.question, metrics) : Promise.resolve(null),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-[var(--color-blue)]" /> AI Workflow Advisor™
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          AI-powered governance automation insights — generate workflows, detect bottlenecks, chat
        </p>
      </div>

      {/* Executive Summary */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--color-blue)]" /> Executive Summary
        </h2>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Workflows", value: metrics.total },
            { label: "Runs", value: metrics.totalRuns },
            { label: "Approvals", value: metrics.pendingApprovals },
            { label: "Automation Rate", value: `${metrics.automationRate}%` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-white/[0.04] p-3 text-center">
              <p className="text-lg font-bold">{value}</p>
              <p className="text-xs text-[var(--color-ink-dim)]">{label}</p>
            </div>
          ))}
        </div>
        {summary ? (
          <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{summary}</p>
        ) : (
          <p className="text-sm text-[var(--color-ink-dim)] italic">Set GEMINI_API_KEY to enable AI summaries.</p>
        )}
      </Card>

      {/* Bottleneck Analysis */}
      {bottlenecks && (
        <Card className="p-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-400" /> Bottleneck Analysis
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{bottlenecks}</p>
        </Card>
      )}

      {/* AI Workflow Generator */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-indigo-400" /> AI Workflow Generator™
        </h2>
        <p className="text-xs text-[var(--color-ink-dim)] mb-4">
          Describe a governance process and AI will generate a workflow definition.
        </p>
        <form method="GET" className="space-y-3">
          <textarea
            name="generatePrompt"
            rows={3}
            defaultValue={sp.generatePrompt ?? ""}
            placeholder='e.g. "Create a vendor onboarding workflow requiring Legal, Security and Privacy approval"'
            className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
          />
          <Button type="submit" size="sm"><Sparkles className="h-4 w-4" /> Generate Workflow</Button>
        </form>

        {generated && (
          <div className="mt-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">{generated.name}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 capitalize">
                {generated.module.replace(/_/g, " ")}
              </span>
            </div>
            {generated.description && <p className="text-xs text-[var(--color-ink-dim)] mb-3">{generated.description}</p>}
            <div className="flex flex-wrap gap-1 mb-4">
              {generated.nodes.map((node, i) => (
                <span key={i} className="text-xs bg-white/5 px-2 py-0.5 rounded-full">
                  {node.label}
                </span>
              ))}
            </div>
            <a href={`/workflow-studio/new?name=${encodeURIComponent(generated.name)}&module=${generated.module}&trigger=${generated.triggerType}&description=${encodeURIComponent(generated.description ?? "")}`}>
              <Button size="sm" variant="outline"><GitBranch className="h-4 w-4" /> Create This Workflow</Button>
            </a>
          </div>
        )}
      </Card>

      {/* Governance Copilot Chat */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[var(--color-blue)]" /> Governance Automation Copilot™
        </h2>
        <form method="GET" className="flex gap-2 mb-4">
          <input
            name="question"
            defaultValue={sp.question ?? ""}
            placeholder="Ask about your workflows: Which fail most? How can we improve throughput?"
            className="flex-1 rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <Button type="submit" size="sm"><Sparkles className="h-4 w-4" /> Ask</Button>
        </form>
        {chatResponse && (
          <div className="rounded-xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/5 p-4">
            <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{chatResponse}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
