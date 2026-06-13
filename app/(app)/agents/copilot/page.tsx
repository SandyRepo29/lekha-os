export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { Bot, Sparkles } from "lucide-react";
import { CopilotChat } from "@/components/agents/copilot-chat";

const SUB_NAV = [
  { href: "/agents", label: "Hub" },
  { href: "/agents/registry", label: "Registry" },
  { href: "/agents/studio", label: "Studio" },
  { href: "/agents/runs", label: "Runs" },
  { href: "/agents/observations", label: "Observations" },
  { href: "/agents/recommendations", label: "Recommendations" },
  { href: "/agents/actions", label: "Actions" },
  { href: "/agents/orchestration", label: "Orchestration" },
  { href: "/agents/analytics", label: "Analytics" },
  { href: "/agents/copilot", label: "Copilot™" },
];

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
    <div className="flex h-full flex-col space-y-0 p-6">
      {/* Sub-nav */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-line)] pb-0 mb-6">
        {SUB_NAV.map(n => (
          <Link key={n.href} href={n.href}
            className={`whitespace-nowrap px-3 py-2 text-xs font-medium rounded-t-lg transition-colors hover:text-[var(--color-ink)] ${
              n.href === "/agents/copilot"
                ? "border-b-2 border-[var(--color-blue)] text-[var(--color-blue)]"
                : "text-[var(--color-ink-dim)]"
            }`}>
            {n.label}
          </Link>
        ))}
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl grad-brand shadow">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Governance Copilot™</h1>
            <p className="text-sm text-[var(--color-ink-dim)]">Ask anything about your governance posture in plain English.</p>
          </div>
        </div>
      </div>

      {/* Capabilities strip */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: "🔍", title: "Risk Analysis", desc: "Identify and prioritize governance risks across all modules" },
          { icon: "📋", title: "Action Planning", desc: "Get a prioritized list of what to fix this week" },
          { icon: "📊", title: "Posture Summary", desc: "Understand compliance, vendor trust, and control health at a glance" },
        ].map(c => (
          <div key={c.title} className="rounded-xl border border-[var(--color-line)] bg-white/[0.03] p-3 flex items-start gap-3">
            <span className="text-lg">{c.icon}</span>
            <div>
              <div className="text-xs font-semibold">{c.title}</div>
              <p className="mt-0.5 text-[11px] text-[var(--color-ink-dim)]">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chat */}
      <CopilotChat examplePrompts={EXAMPLE_PROMPTS} />
    </div>
  );
}
