export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { Bot } from "lucide-react";
import { AgentSubNav } from "@/components/agents/agent-ui";
import { CopilotChat } from "@/components/agents/copilot-chat";

const EXAMPLE_PROMPTS = [
  "Show me critical governance risks",
  "Which vendors need review?",
  "What should I fix this week?",
  "What is our ISO 27001 readiness?",
  "Summarize our compliance posture",
  "List overdue CAPAs",
];

export default async function CopilotPage() {
  await requireUser();

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <AgentSubNav />

      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl grad-brand shadow">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Governance Copilot™</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">Ask anything about your governance posture in plain English.</p>
        </div>
      </div>

      {/* Capabilities strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: "🔍", title: "Risk Analysis",    desc: "Identify and prioritize governance risks across all modules" },
          { icon: "📋", title: "Action Planning",  desc: "Get a prioritized list of what to fix this week" },
          { icon: "📊", title: "Posture Summary",  desc: "Understand compliance, vendor trust, and control health at a glance" },
        ].map(c => (
          <div key={c.title} className="flex items-start gap-3 rounded-xl border border-[var(--color-line)] bg-white/[0.03] p-3">
            <span className="text-base leading-none mt-0.5">{c.icon}</span>
            <div>
              <div className="text-xs font-semibold">{c.title}</div>
              <p className="mt-0.5 text-[11px] text-[var(--color-ink-dim)]">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chat — flex-1 so it fills remaining height */}
      <div className="flex-1 min-h-0">
        <CopilotChat examplePrompts={EXAMPLE_PROMPTS} />
      </div>
    </div>
  );
}
