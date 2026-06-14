export const dynamic = "force-dynamic";

import { Sparkles, FileSignature } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { ContractAiChat } from "@/components/contract-governance/contract-ai-chat";
import { generateExecutiveSummary } from "@/lib/services/contract-governance/ai-contract-service";
import { getDashboardMetrics } from "@/lib/services/contract-governance/contract-service";

export default async function ContractAiPage() {
  const session = await requireUser();

  if (!session.org) {
    return (
      <Card>
        <EmptyState icon={Sparkles} title="AI Contract Advisor" description="Connect Supabase to use AI features." />
      </Card>
    );
  }

  const [summary, metrics] = await Promise.all([
    generateExecutiveSummary(session.org.id).catch(() => null),
    getDashboardMetrics(session.org.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-400" />
          AI Contract Advisor™
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Executive insights and contract intelligence powered by Gemini
        </p>
      </div>

      {/* Executive Summary */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-indigo-400" />
          Executive Summary
        </h2>
        {summary ? (
          <div className="prose prose-sm prose-invert max-w-none">
            <p className="text-sm leading-relaxed text-[var(--color-ink)] whitespace-pre-wrap">{summary}</p>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-ink-dim)]">
            AI summary not available. Ensure GEMINI_API_KEY is configured.
          </p>
        )}
      </Card>

      {/* Portfolio snapshot */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Contracts", value: metrics.total, color: "text-indigo-400" },
          { label: "Active", value: metrics.active, color: "text-green-400" },
          { label: "Expiring (90d)", value: metrics.expiring, color: "text-yellow-400" },
          { label: "Renewals Due", value: metrics.renewalsDue, color: "text-orange-400" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--color-ink-dim)]">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Chat */}
      <ContractAiChat />
    </div>
  );
}
