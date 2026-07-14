export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/backend/src/modules/trust-verification/trust-verification-service";
import { generatePlatformSummary } from "@/backend/src/modules/trust-verification/ai-trust-verification-service";
import { Bot, Sparkles, ShieldCheck, FileSearch, ClipboardCheck, RefreshCw } from "lucide-react";
import TrustVerificationChat from "./chat";

export default async function TrustVerificationAiPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const data = await getDashboardData(orgId).catch(() => null);
  const m = data?.metrics;

  const summary = await generatePlatformSummary(orgId, {
    totalVerifications: m?.total ?? 0,
    approved: m?.approved ?? 0,
    pending: m?.pending ?? 0,
    activeCerts: (data?.certs ?? []).filter((c: any) => c.status === "active").length,
    activeBadges: (data?.badges ?? []).filter((b: any) => b.status === "active").length,
    expiringSoon: m?.expiringSoon ?? 0,
  }).catch(() => null);

  const capabilities = [
    { icon: ShieldCheck, label: "Eligibility Analysis™",     desc: "Check if your org is ready to apply for a specific program" },
    { icon: FileSearch,  label: "Evidence Review™",          desc: "Analyze evidence quality, coverage, and freshness" },
    { icon: ClipboardCheck, label: "AI Trust Assessor™",    desc: "Generate a formal verification assessment report" },
    { icon: RefreshCw,   label: "Renewal Advisor™",          desc: "Predict renewal success and required pre-actions" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">AI Verification Advisor™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Eligibility analysis, evidence review, trust assessment, and renewal planning — powered by AI.</p>
      </div>

      {/* Summary */}
      {summary && (
        <div className="rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.05] p-5">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-[var(--color-blue)] uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> AI Platform Summary
          </div>
          <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed whitespace-pre-wrap">{summary}</p>
        </div>
      )}

      {/* Capabilities */}
      <div className="grid gap-4 sm:grid-cols-2">
        {capabilities.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F8F9FB]">
                <Icon className="h-4 w-4 text-[var(--color-blue)]" />
              </span>
              <div>
                <div className="font-semibold text-sm">{label}</div>
                <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-5 w-5 text-[var(--color-blue)]" />
          <h3 className="font-semibold text-sm">Trust Verification Copilot™</h3>
        </div>
        <TrustVerificationChat context={{
          totalVerifications: m?.total ?? 0,
          approved: m?.approved ?? 0,
          activeCerts: (data?.certs ?? []).filter((c: any) => c.status === "active").length,
          activeBadges: (data?.badges ?? []).filter((b: any) => b.status === "active").length,
        }} />
      </div>
    </div>
  );
}
