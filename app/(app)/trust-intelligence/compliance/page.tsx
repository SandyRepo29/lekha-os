export const dynamic = "force-dynamic";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getComplianceMetrics } from "@/lib/repositories/trust-intelligence-repo";
import { TIStat } from "@/components/trust-intelligence/trust-intelligence-ui";

export default async function ComplianceHealthPage() {
  const session = await requireUser();
  if (!session.org) return null;

  const metrics = await getComplianceMetrics(session.org.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Compliance Health</h2>
        <p className="text-sm text-[var(--color-ink-dim)]">Framework readiness from Evidence Vault™</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><TIStat label="Frameworks" value={metrics.frameworkCount} accent="blue" /></Card>
        <Card className="p-4"><TIStat label="Avg Readiness" value={`${metrics.avgReadiness}%`} accent={metrics.avgReadiness >= 75 ? "green" : "amber"} /></Card>
        <Card className="p-4">
          <TIStat
            label="Overall Status"
            value={metrics.avgReadiness >= 75 ? "On Track" : metrics.avgReadiness >= 50 ? "Moderate" : "Needs Work"}
            accent={metrics.avgReadiness >= 75 ? "green" : metrics.avgReadiness >= 50 ? "amber" : "red"}
          />
        </Card>
      </div>

      <Card className="p-5">
        <p className="text-sm font-semibold mb-4">Framework Readiness</p>
        {metrics.frameworks.length === 0 ? (
          <p className="text-xs text-[var(--color-ink-faint)]">No frameworks configured. Add frameworks in Evidence Vault™.</p>
        ) : (
          <div className="space-y-4">
            {metrics.frameworks.map((f) => (
              <div key={f.frameworkId}>
                <div className="flex items-center justify-between mb-1.5">
                  <Link href={`/compliance/frameworks/${f.frameworkId}`} className="text-sm text-[var(--color-ink)] hover:text-[var(--color-blue)] transition-colors">
                    Framework
                  </Link>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-[var(--color-ink-faint)]">Controls {f.controlCoverage}%</span>
                    <span className="text-[var(--color-ink-faint)]">Evidence {f.evidenceCoverage}%</span>
                    <span className="font-semibold text-[var(--color-ink)]">{f.overallScore}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${f.overallScore >= 75 ? "bg-emerald-500" : f.overallScore >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${f.overallScore}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <p className="text-sm font-semibold mb-2">Go Deeper</p>
        <Link href="/compliance">
          <span className="text-sm text-[var(--color-blue)] hover:underline">Open Evidence Vault™ →</span>
        </Link>
      </Card>
    </div>
  );
}
