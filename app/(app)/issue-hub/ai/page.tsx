export const dynamic = "force-dynamic";

import { Sparkles, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/lib/services/issue-hub/issue-service";
import {
  generateExecutiveSummary,
  generateIssueFromObservation,
  chat,
} from "@/lib/services/issue-hub/ai-issue-service";

export default async function IssueAiPage({
  searchParams,
}: {
  searchParams: Promise<{ observation?: string; q?: string }>;
}) {
  const session = await requireUser();
  const sp = await searchParams;

  if (session.demo || !session.org) {
    return (
      <Card className="p-8 text-center">
        <Sparkles className="h-10 w-10 mx-auto mb-3 text-indigo-400" />
        <p className="text-sm text-[var(--color-ink-dim)]">Connect Supabase to use Findings Copilot&#8482;.</p>
      </Card>
    );
  }

  const metrics = await getDashboardMetrics(session.org.id);
  const executiveSummary = await generateExecutiveSummary(session.org.id, metrics).catch(() => null);

  let generatedIssue = null;
  if (sp.observation) {
    generatedIssue = await generateIssueFromObservation(sp.observation).catch(() => null);
  }

  let chatResponse = null;
  if (sp.q) {
    chatResponse = await chat(session.org.id, sp.q, {
      total: metrics.total,
      open: metrics.open,
      critical: metrics.critical,
      overdue: metrics.overdue,
    }).catch(() => null);
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-400" />
          Findings Copilot&#8482;
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          AI-powered governance findings analysis, remediation guidance, and root cause insights
        </p>
      </div>

      {/* Executive Summary */}
      <Card className="p-6 border-indigo-500/20">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          Executive Summary
        </h2>
        {executiveSummary ? (
          <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{executiveSummary}</p>
        ) : (
          <div className="flex items-center gap-2 text-sm text-[var(--color-ink-dim)]">
            <AlertCircle className="h-4 w-4" />
            AI unavailable — GEMINI_API_KEY not configured.
          </div>
        )}
        <div className="mt-4 grid grid-cols-4 gap-3 text-center">
          <div className="rounded-xl bg-white p-3">
            <p className="text-xl font-bold">{metrics.total}</p>
            <p className="text-xs text-[var(--color-ink-dim)]">Total</p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-xl font-bold text-yellow-400">{metrics.open}</p>
            <p className="text-xs text-[var(--color-ink-dim)]">Open</p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-xl font-bold text-red-400">{metrics.critical}</p>
            <p className="text-xs text-[var(--color-ink-dim)]">Critical</p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-xl font-bold">{metrics.slaCompliance}%</p>
            <p className="text-xs text-[var(--color-ink-dim)]">SLA</p>
          </div>
        </div>
      </Card>

      {/* Issue Generator */}
      <Card className="p-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400" />
          AI Issue Generator™
        </h2>
        <p className="text-sm text-[var(--color-ink-dim)] mb-4">
          Describe an observation and AI will generate a structured governance issue.
        </p>
        <form className="space-y-3">
          <textarea
            name="observation"
            rows={3}
            defaultValue={sp.observation}
            placeholder="E.g. We noticed that our encryption keys have not been rotated in 18 months and there is no documented rotation policy..."
            className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500/50 resize-none"
          />
          <Button type="submit" size="sm">
            <Sparkles className="h-4 w-4" /> Generate Issue
          </Button>
        </form>

        {generatedIssue && (
          <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-300">Generated Issue</span>
            </div>
            <p className="font-semibold">{generatedIssue.title}</p>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                {generatedIssue.severity}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                {generatedIssue.priority}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                {generatedIssue.issueType.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-sm text-[var(--color-ink-dim)]">{generatedIssue.description}</p>
            {generatedIssue.recommendedActions.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1">Recommended Actions:</p>
                <ul className="space-y-1">
                  {generatedIssue.recommendedActions.map((action, i) => (
                    <li key={i} className="text-xs text-[var(--color-ink-dim)] flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">→</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <form action="/issue-hub/new" method="get">
              <input type="hidden" name="title" value={generatedIssue.title} />
              <input type="hidden" name="severity" value={generatedIssue.severity} />
              <input type="hidden" name="issueType" value={generatedIssue.issueType} />
              <a
                href={`/issue-hub/new`}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                Create this issue →
              </a>
            </form>
          </div>
        )}
      </Card>

      {/* AI Chat */}
      <Card className="p-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-400" />
          Findings Copilot&#8482; Chat
        </h2>
        <p className="text-sm text-[var(--color-ink-dim)] mb-4">
          Ask questions about your issue posture, SLA compliance, or remediation priorities.
        </p>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={sp.q}
            placeholder="Which issues are overdue? What is our SLA compliance rate?"
            className="flex-1 rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
          />
          <Button type="submit" size="sm">
            <Sparkles className="h-4 w-4" /> Ask
          </Button>
        </form>

        {chatResponse && (
          <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-xs font-medium text-blue-300 mb-1">AI Response</p>
            <p className="text-sm text-[var(--color-ink-dim)]">{chatResponse}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
