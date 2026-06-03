export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listFrameworks } from "@/lib/services/compliance/framework-service";
import { FrameworkStatusBadge } from "@/components/compliance/compliance-badges";
import { scoreTextColor } from "@/lib/ui/colors";

export default async function FrameworksPage() {
  const session = await requireUser();
  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={ShieldCheck} title="Frameworks" description="Connect Supabase to manage compliance frameworks." />
      </Card>
    );
  }

  const frameworks = await listFrameworks(session.org.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Frameworks</h2>
          <p className="text-sm text-[var(--color-ink-dim)]">
            {frameworks.length} framework{frameworks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/compliance/frameworks/new">
          <Button variant="primary" size="sm"><Plus className="h-4 w-4" /> Add framework</Button>
        </Link>
      </div>

      {frameworks.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title="No frameworks yet"
            description="Add ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA or a custom framework."
            action={
              <Link href="/compliance/frameworks/new">
                <Button variant="primary" size="sm"><Plus className="h-4 w-4" /> Add framework</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-[var(--color-line)]">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_120px_80px_80px_80px_100px_40px] gap-4 px-5 py-3 text-xs font-semibold text-[var(--color-ink-faint)] uppercase tracking-wide">
              <span>Framework</span>
              <span>Status</span>
              <span className="text-right">Readiness</span>
              <span className="text-right">Controls</span>
              <span className="text-right">Evidence</span>
              <span className="text-right">Open Gaps</span>
              <span />
            </div>

            {frameworks.map((fw) => {
              const score = fw.readiness?.overallScore ?? 0;
              return (
                <div
                  key={fw.id}
                  className="grid grid-cols-[1fr_120px_80px_80px_80px_100px_40px] items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div>
                    <Link
                      href={`/compliance/frameworks/${fw.id}`}
                      className="font-medium text-sm hover:text-[var(--color-blue)] transition-colors"
                    >
                      {fw.name}
                    </Link>
                    {fw.version && (
                      <span className="ml-2 text-xs text-[var(--color-ink-faint)]">v{fw.version}</span>
                    )}
                    {fw.owner && (
                      <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">{fw.owner}</p>
                    )}
                  </div>

                  <FrameworkStatusBadge status={fw.status} />

                  <span className={`text-right font-[family-name:var(--font-display)] font-bold text-sm ${scoreTextColor(score)}`}>
                    {score}%
                  </span>

                  <span className="text-right text-sm text-[var(--color-ink-dim)]">{fw.controlCount}</span>

                  <span className="text-right text-sm text-[var(--color-ink-dim)]">
                    {fw.readiness?.evidenceCoverage ?? 0}%
                  </span>

                  <span className={`text-right text-sm font-medium ${fw.openGapCount > 0 ? "text-amber-400" : "text-[var(--color-ink-faint)]"}`}>
                    {fw.openGapCount}
                  </span>

                  <Link
                    href={`/compliance/frameworks/${fw.id}`}
                    className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors text-right"
                  >
                    →
                  </Link>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
