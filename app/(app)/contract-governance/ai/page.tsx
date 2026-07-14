export const dynamic = "force-dynamic";

import { Sparkles, FileSignature, TrendingUp, AlertTriangle, RefreshCw, BarChart2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { ContractAiChat } from "@/components/contract-governance/contract-ai-chat";
import { generateExecutiveSummary } from "@/backend/src/modules/contract-governance/ai-contract-service";
import { getDashboardMetrics, listContracts } from "@/backend/src/modules/contract-governance/contract-service";
import { computeContractHealth, CONTRACT_HEALTH_BG, CONTRACT_HEALTH_LABELS } from "@/backend/src/modules/contract-governance/contract-health";

import { daysUntil } from "@/backend/src/modules/contract-governance/date-utils";

export default async function ContractIntelligencePage() {
  const session = await requireUser();

  if (!session.org) {
    return (
      <Card>
        <EmptyState icon={Sparkles} title="Contract Intelligence™" description="Connect Supabase to use AI features." />
      </Card>
    );
  }

  const [summary, metrics, allContracts] = await Promise.all([
    generateExecutiveSummary(session.org.id).catch(() => null),
    getDashboardMetrics(session.org.id),
    listContracts(session.org.id),
  ]);

  // Compute Contract Health for each contract (simplified — no obligations data here)
  const contractsWithHealth = allContracts
    .filter((c) => !["archived", "terminated"].includes(c.status))
    .slice(0, 8)
    .map((c) => {
      const days = daysUntil(c.expiryDate);
      const health = computeContractHealth({
        isActive: c.status === "active",
        daysUntilExpiry: days,
        openObligations: 0,
        overdueObligations: 0,
        totalObligations: 0,
        legalExceptions: 0,
        complianceScore: 70,
        vendorRisk: "medium",
      });
      return { ...c, health };
    })
    .sort((a, b) => a.health.overall - b.health.overall); // worst first

  const atRisk = contractsWithHealth.filter((c) => c.health.overall < 55).length;
  const renewalDue = allContracts.filter((c) => {
    const d = daysUntil(c.expiryDate);
    return d !== null && d >= 0 && d <= 30;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-700" />
          Contract Intelligence™
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          AI-powered contract analysis, renewal recommendations, and governance insights
        </p>
      </div>

      {/* Portfolio snapshot */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Contracts", value: metrics.total, icon: FileSignature, color: "text-indigo-700" },
          { label: "Active", value: metrics.active, icon: BarChart2, color: "text-green-700" },
          { label: "Renewals Due (30d)", value: renewalDue, icon: RefreshCw, color: renewalDue > 0 ? "text-red-700" : "text-emerald-700" },
          { label: "At Risk", value: atRisk, icon: AlertTriangle, color: atRisk > 0 ? "text-orange-700" : "text-emerald-700" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--color-ink-faint)]">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Contract Health Analysis */}
      {contractsWithHealth.length > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-700" />
            Contract Health Analysis
          </h2>
          <p className="text-xs text-[var(--color-ink-faint)] mb-4">Contracts ranked by health — lowest first</p>
          <div className="space-y-2">
            {contractsWithHealth.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-[var(--color-ink)]">{c.title}</span>
                    <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${CONTRACT_HEALTH_BG[c.health.level]}`}>
                      {c.health.overall} &middot; {CONTRACT_HEALTH_LABELS[c.health.level]}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#F8F9FB]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        c.health.overall >= 70 ? "bg-emerald-500" :
                        c.health.overall >= 55 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${c.health.overall}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Renewal Risk Analysis */}
      <Card className="p-6">
        <h2 className="font-semibold mb-1 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-amber-700" />
          Renewal Risk Summary
        </h2>
        <p className="text-xs text-[var(--color-ink-faint)] mb-4">Contracts requiring renewal attention in the next 90 days</p>
        {allContracts.filter((c) => { const d = daysUntil(c.expiryDate); return d !== null && d <= 90; }).length === 0 ? (
          <p className="text-sm text-[var(--color-ink-dim)]">No contracts expiring within 90 days. Portfolio is in good standing.</p>
        ) : (
          <div className="space-y-2">
            {allContracts
              .filter((c) => { const d = daysUntil(c.expiryDate); return d !== null && d <= 90; })
              .sort((a, b) => (daysUntil(a.expiryDate) ?? 999) - (daysUntil(b.expiryDate) ?? 999))
              .map((c) => {
                const days = daysUntil(c.expiryDate);
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-white px-4 py-2.5">
                    <span className="text-sm text-[var(--color-ink)]">{c.title}</span>
                    <span className={`text-xs font-medium ${days !== null && days < 0 ? "text-red-700" : days !== null && days <= 30 ? "text-red-700" : "text-amber-700"}`}>
                      {days !== null && days < 0 ? `${Math.abs(days)}d expired` : `${days}d remaining`}
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      {/* Executive Summary */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-indigo-700" />
          AI Executive Summary
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

      {/* Chat */}
      <ContractAiChat />
    </div>
  );
}
