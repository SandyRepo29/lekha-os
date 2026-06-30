export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listFrameworks } from "@/lib/services/compliance/framework-service";
import { FrameworkStatusBadge } from "@/components/compliance/compliance-badges";
import { ComplianceStat } from "@/components/compliance/compliance-ui";
import { scoreTextColor } from "@/lib/ui/colors";

export default async function FrameworksPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={ShieldCheck}
          title="Frameworks"
          description="Connect Supabase to manage compliance frameworks."
        />
      </Card>
    );
  }

  const frameworks = await listFrameworks(session.org.id);

  const certified = frameworks.filter((f) => f.status === "certified").length;
  const inProgress = frameworks.filter((f) => f.status === "in_progress").length;
  const totalGaps = frameworks.reduce((n, f) => n + f.openGapCount, 0);
  const avgReadiness = frameworks.length
    ? Math.round(
        frameworks.reduce((n, f) => n + (f.readiness?.overallScore ?? 0), 0) / frameworks.length
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Frameworks</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            {frameworks.length} framework{frameworks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/compliance/frameworks/new">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" /> Add framework
          </Button>
        </Link>
      </div>

      {/* Stat strip */}
      {frameworks.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ComplianceStat label="Total"       value={frameworks.length} />
          <ComplianceStat label="Certified"   value={certified}   accent={certified > 0 ? "good" : undefined} color={certified > 0 ? "text-emerald-400" : undefined} />
          <ComplianceStat label="In Progress" value={inProgress}  color="text-[var(--color-blue)]" />
          <ComplianceStat label="Avg Readiness" value={`${avgReadiness}%`} accent={totalGaps > 0 ? "warn" : "good"} />
        </div>
      )}

      {frameworks.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title="No frameworks yet"
            description="Add ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA or a custom framework."
            action={
              <Link href="/compliance/frameworks/new">
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4" /> Add framework
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-[var(--color-line)]">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_120px_80px_80px_80px_100px_40px] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
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
                  className="grid grid-cols-[1fr_120px_80px_80px_80px_100px_40px] items-center gap-4 px-5 py-4 transition-colors hover:bg-white"
                >
                  <div>
                    <Link
                      href={`/compliance/frameworks/${fw.id}`}
                      className="text-sm font-medium transition-colors hover:text-[var(--color-blue)]"
                    >
                      {fw.name}
                    </Link>
                    {fw.version && (
                      <span className="ml-2 text-xs text-[var(--color-ink-faint)]">
                        v{fw.version}
                      </span>
                    )}
                    {fw.owner && (
                      <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">{fw.owner}</p>
                    )}
                  </div>

                  <FrameworkStatusBadge status={fw.status} />

                  <span
                    className={`text-right font-[family-name:var(--font-display)] text-sm font-bold ${scoreTextColor(score)}`}
                  >
                    {score}%
                  </span>

                  <span className="text-right text-sm text-[var(--color-ink-dim)]">
                    {fw.controlCount}
                  </span>

                  <span className="text-right text-sm text-[var(--color-ink-dim)]">
                    {fw.readiness?.evidenceCoverage ?? 0}%
                  </span>

                  <span
                    className={`text-right text-sm font-medium ${
                      fw.openGapCount > 0 ? "text-amber-400" : "text-[var(--color-ink-faint)]"
                    }`}
                  >
                    {fw.openGapCount}
                  </span>

                  <Link
                    href={`/compliance/frameworks/${fw.id}`}
                    className="text-right text-xs text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
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
