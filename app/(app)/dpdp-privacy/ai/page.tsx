export const dynamic = "force-dynamic";

import { Bot, RefreshCw, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { PrivacyAiChat } from "@/components/privacy/privacy-ai-chat";
import { generatePrivacySummaryAction } from "@/lib/privacy/actions";

async function PrivacySummarySection({ orgId }: { orgId: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          AI Privacy Executive Summary
        </h2>
        <form
          action={async () => {
            "use server";
            await generatePrivacySummaryAction();
          }}
        >
          <Button type="submit" variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" /> Regenerate
          </Button>
        </form>
      </div>
      <p className="text-xs text-[var(--color-ink-dim)] mb-4">
        AI-generated executive summary of your DPDP Privacy posture (cached 24h).
        Click Regenerate to force a fresh analysis.
      </p>
      <p className="text-sm text-[var(--color-ink-dim)] italic">
        Use the chat below to get an instant privacy summary, or click Regenerate above.
      </p>
    </Card>
  );
}

export default async function PrivacyAiPage() {
  const session = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          AI Privacy Officer™
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          AI-powered DPDP compliance advice — executive summaries, PIA generation, NL chat
        </p>
      </div>

      {session.org && <PrivacySummarySection orgId={session.org.id} />}

      {/* Chat */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-5 py-4">
          <div className="w-7 h-7 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Bot className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">AI Privacy Officer Chat</p>
            <p className="text-xs text-[var(--color-ink-dim)]">
              Ask about DPDP Act 2023, DSR workflows, consent, transfers, PIAs
            </p>
          </div>
        </div>
        <PrivacyAiChat />
      </Card>
    </div>
  );
}
