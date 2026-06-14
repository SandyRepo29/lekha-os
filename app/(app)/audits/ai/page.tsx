export const dynamic = "force-dynamic";

import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { getDashboardMetrics } from "@/lib/services/audit/audit-service";
import { AuditAiChat } from "@/components/audit/audit-ai-chat";

export default async function AiAuditorPage() {
  const session = await requireUser();
  const aiEnabled = isGeminiConfigured();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={Sparkles}
          title="AI Auditor"
          description="Connect Supabase to use the AI Auditor."
        />
      </Card>
    );
  }

  const metrics = await getDashboardMetrics(session.org.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-blue)]/10">
          <Sparkles className="h-5 w-5 text-[var(--color-blue)]" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            AI Auditor Assistant
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            {aiEnabled
              ? `${metrics.total} audits · ${metrics.openFindings} open findings · ${metrics.capasDueSoon} CAPAs due soon`
              : "Add GEMINI_API_KEY to .env.local to enable AI features."}
          </p>
        </div>
      </div>

      <Card>
        <AuditAiChat aiEnabled={aiEnabled} />
      </Card>
    </div>
  );
}
