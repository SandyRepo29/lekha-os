export const dynamic = "force-dynamic";

import { Brain } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { PolicyAiChat } from "@/components/policy-governance/policy-ai-chat";
import { PolicyAiPanels } from "@/components/policy-governance/policy-ai-panels";

export default async function PolicyAiPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={Brain} title="AI Policy Advisor" description="Connect Supabase to use AI features." />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">AI Policy Advisor™</h2>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Draft policies, detect gaps, and get governance recommendations
        </p>
      </div>

      <PolicyAiPanels />

      <Card className="overflow-hidden p-0">
        <div className="p-4 border-b border-[var(--color-line)]">
          <h3 className="font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" /> Policy Governance Copilot™
          </h3>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">
            Ask anything about your policy library, gaps, or governance requirements.
          </p>
        </div>
        <PolicyAiChat />
      </Card>
    </div>
  );
}
