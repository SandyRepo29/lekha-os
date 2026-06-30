export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getRegulations } from "@/lib/services/regulatory-intelligence/regulatory-service";
import { generateComplianceHorizon } from "@/lib/services/regulatory-intelligence/ai-regulatory-service";
import { RegSubNav, RegStat, CategoryBadge } from "@/components/regulatory-intelligence/reg-ui";
import { TrendingUp, Bot, Calendar, AlertCircle, Lightbulb, Globe } from "lucide-react";

export default async function ComplianceHorizonPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const regs = await getRegulations(orgId).catch(() => []);
  const horizon = await generateComplianceHorizon(
    orgId,
    regs.slice(0, 10).map(r => ({
      name: r.shortName ?? r.name,
      category: r.category,
      country: r.country ?? "Global",
    }))
  ).catch(() => null);

  return (
    <div className="space-y-6 p-6">
      <RegSubNav />

      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Compliance Horizon™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">AI-powered regulatory forecast — upcoming regulations, deadlines, trends, and emerging risks.</p>
        </div>
        <Link
          href="/regulatory-intelligence/ai"
          className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          <Bot className="h-4 w-4" /> AI Advisor™
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RegStat label="Regulations Tracked" value={regs.length} accent="neutral" />
        <RegStat label="Emerging Risks" value={horizon?.emerging.length ?? 0} accent="danger" />
        <RegStat label="Upcoming Deadlines" value={horizon?.deadlines.length ?? 0} accent="warn" />
        <RegStat label="AI Recommendations" value={horizon?.recommendations.length ?? 0} accent="good" />
      </div>

      {/* Applicable Regulations */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h3 className="mb-3 font-semibold text-sm">Your Regulatory Landscape</h3>
        <div className="flex flex-wrap gap-2">
          {regs.slice(0, 12).map(r => (
            <div key={r.id} className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white px-2.5 py-1">
              <Globe className="h-3 w-3 text-[var(--color-ink-faint)]" />
              <span className="text-xs font-medium">{r.shortName ?? r.name}</span>
              <CategoryBadge category={r.category} />
            </div>
          ))}
          {regs.length > 12 && (
            <div className="flex items-center rounded-full border border-[var(--color-line)] bg-white px-2.5 py-1">
              <span className="text-xs text-[var(--color-ink-dim)]">+{regs.length - 12} more</span>
            </div>
          )}
        </div>
      </div>

      {horizon ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Emerging Regulations */}
          <div className="rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.04] p-5">
            <h3 className="mb-4 font-semibold text-sm flex items-center gap-2 text-[var(--color-blue)]">
              <TrendingUp className="h-4 w-4" /> Emerging Regulations
            </h3>
            {horizon.emerging.length > 0 ? (
              <ul className="space-y-2">
                {horizon.emerging.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-blue)]" />
                    <span className="text-[var(--color-ink-dim)]">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--color-ink-faint)]">No emerging regulations detected.</p>
            )}
          </div>

          {/* Upcoming Deadlines */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
            <h3 className="mb-4 font-semibold text-sm flex items-center gap-2 text-amber-300">
              <Calendar className="h-4 w-4" /> Upcoming Deadlines
            </h3>
            {horizon.deadlines.length > 0 ? (
              <ul className="space-y-2">
                {horizon.deadlines.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <span className="text-[var(--color-ink-dim)]">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--color-ink-faint)]">No immediate deadlines detected.</p>
            )}
          </div>

          {/* Trends */}
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-5">
            <h3 className="mb-4 font-semibold text-sm flex items-center gap-2 text-violet-300">
              <AlertCircle className="h-4 w-4" /> Regulatory Trends
            </h3>
            {horizon.trends.length > 0 ? (
              <ul className="space-y-2">
                {horizon.trends.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                    <span className="text-[var(--color-ink-dim)]">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--color-ink-faint)]">No trend data available.</p>
            )}
          </div>

          {/* AI Recommendations */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
            <h3 className="mb-4 font-semibold text-sm flex items-center gap-2 text-emerald-300">
              <Lightbulb className="h-4 w-4" /> AI Recommendations
            </h3>
            {horizon.recommendations.length > 0 ? (
              <ul className="space-y-2">
                {horizon.recommendations.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span className="text-[var(--color-ink-dim)]">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--color-ink-faint)]">No recommendations generated.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg-2)]/40 py-16">
          <TrendingUp className="h-10 w-10 text-[var(--color-blue)] opacity-40" />
          <div className="text-center">
            <p className="font-semibold text-sm">Compliance horizon not available</p>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)]">Add applicable regulations and configure your AI Advisor™ to generate forecasts.</p>
          </div>
        </div>
      )}
    </div>
  );
}
