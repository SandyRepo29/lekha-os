export const dynamic = "force-dynamic";

import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { generateRecommendations } from "@/lib/services/trust-intelligence/trust-intelligence-service";
import { PriorityChip, CategoryChip, TIStat } from "@/components/trust-intelligence/trust-intelligence-ui";

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
          Recommendations Engine™
        </h2>
        <p className="text-sm text-[var(--color-ink-dim)]">
          Prioritized governance actions — {recs.length} recommendation{recs.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className={`p-4 ${highCount > 0 ? "border-red-500/25" : ""}`}>
          <TIStat label="High Priority" value={highCount} sub="Immediate action" accent="red" />
        </Card>
        <Card className="p-4">
          <TIStat label="Medium Priority" value={mediumCount} sub="Plan this week" accent="amber" />
        </Card>
        <Card className="p-4">
          <TIStat label="Low Priority" value={lowCount} sub="When capacity allows" accent="blue" />
        </Card>
      </div>

      {recs.length === 0 ? (
        <Card className="p-8 text-center">
          <Zap className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
          <p className="font-semibold text-[var(--color-ink)]">All clear!</p>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">No governance actions required at this time.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {recs.map((rec) => (
            <Card key={rec.id} className="p-5 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-1.5 shrink-0">
                  <PriorityChip priority={rec.priority} />
                  <CategoryChip category={rec.category} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{rec.title}</p>
                  <p className="text-xs text-[var(--color-ink-dim)] mt-1">{rec.description}</p>
                  <p className="text-xs text-[var(--color-blue)] mt-1.5 font-medium">{rec.action}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1 text-xs text-[var(--color-ink-faint)]">
                  <span>Impact {rec.impact}/10</span>
                  <span>Effort {rec.effort}/10</span>
                  {rec.href && (
                    <Link href={rec.href} className="mt-1 flex items-center gap-1 text-[var(--color-blue)] hover:underline">
                      Go <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
