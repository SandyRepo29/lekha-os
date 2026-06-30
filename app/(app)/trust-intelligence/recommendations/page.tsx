export const dynamic = "force-dynamic";

import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { generateRecommendations } from "@/lib/services/trust-intelligence/trust-intelligence-service";
import { PriorityChip, CategoryChip, TrustStat } from "@/components/trust-intelligence/trust-intelligence-ui";

export default async function RecommendationsPage() {
  const session = await requireUser();
  if (!session.org) return null;

  const recs = await generateRecommendations(session.org.id);

  const highCount = recs.filter((r) => r.priority === "high").length;
  const mediumCount = recs.filter((r) => r.priority === "medium").length;
  const lowCount = recs.filter((r) => r.priority === "low").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold flex items-center gap-2">
          <Zap className="h-5 w-5 text-[var(--color-blue)]" />
          Decision Recommendations&#8482;
        </h2>
        <p className="text-sm text-[var(--color-ink-dim)]">
          Prioritized governance actions &#8212; {recs.length} recommendation{recs.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TrustStat label="High Priority" value={highCount} sub="Immediate action" accent={highCount > 0 ? "danger" : "neutral"} />
        <TrustStat label="Medium Priority" value={mediumCount} sub="Plan this week" accent={mediumCount > 0 ? "warn" : "neutral"} />
        <TrustStat label="Low Priority" value={lowCount} sub="When capacity allows" accent="neutral" />
      </div>

      {recs.length === 0 ? (
        <Card className="p-8 text-center">
          <Zap className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
          <p className="font-semibold text-[var(--color-ink)]">All clear!</p>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">No governance actions required at this time.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {recs.map((rec) => {
            const reasons = rec.description
              .split(/[.·]/)
              .filter((s) => s.trim().length > 10)
              .slice(0, 3);

            const trustImpactPts = rec.impact * 2;

            return (
              <Card key={rec.id} className="p-5 rounded-2xl border-[var(--color-line)] bg-[var(--color-bg-2)]/60 hover:bg-white transition-colors">
                {/* Header row */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <PriorityChip priority={rec.priority} />
                    <CategoryChip category={rec.category} />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 shrink-0">
                    Trust Impact: +{trustImpactPts} pts
                  </span>
                </div>

                {/* Title */}
                <p className="text-sm font-semibold text-[var(--color-ink)] mb-2">{rec.title}</p>

                {/* Reasons */}
                {reasons.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-[var(--color-ink-faint)] mb-1">Reasons:</p>
                    <ul className="space-y-1">
                      {reasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--color-ink-dim)]">
                          <span className="mt-1 h-1 w-1 rounded-full bg-[var(--color-ink-faint)] shrink-0" />
                          {reason.trim()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendation */}
                <p className="text-xs text-[var(--color-blue)] font-medium mb-3">
                  Recommendation: {rec.action}
                </p>

                {/* Footer row */}
                <div className="flex items-center justify-between">
                  {rec.href ? (
                    <Link
                      href={rec.href}
                      className="inline-flex items-center gap-1 text-xs text-[var(--color-blue)] hover:underline font-medium"
                    >
                      Go <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-3 text-xs text-[var(--color-ink-faint)]">
                    <span>Impact {rec.impact}/10</span>
                    <span>Effort {rec.effort}/10</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
