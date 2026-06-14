export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import * as repo from "@/lib/repositories/continuous-compliance-repo";
import { CheckCircle } from "lucide-react";
import { HealthBar, HealthLevelBadge, CcStat, CcSubNav } from "@/components/continuous-compliance/cc-ui";

const FRAMEWORKS = ["SOC 2", "ISO 27001", "DPDP", "NIST", "HIPAA", "PCI DSS", "ISO 42001"];

function getTrendIcon(trend: string) {
  if (trend === "improving") return { icon: "↑", cls: "text-emerald-400" };
  if (trend === "declining") return { icon: "↓", cls: "text-red-400" };
  return { icon: "→", cls: "text-[var(--color-ink-faint)]" };
}

export default async function ReadinessPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const snapshots = await repo.getLatestReadiness(orgId).catch(() => []);

  const latestByFramework = new Map<string, typeof snapshots[0]>();
  for (const s of snapshots) {
    const existing = latestByFramework.get(s.frameworkName);
    if (!existing || s.snapshotAt > existing.snapshotAt) {
      latestByFramework.set(s.frameworkName, s);
    }
  }
  const frameworkData = Array.from(latestByFramework.values());
  const avgReadiness = frameworkData.length > 0
    ? Math.round(frameworkData.reduce((s, f) => s + f.readinessScore, 0) / frameworkData.length)
    : 0;

  return (
    <div className="space-y-6 p-6">
      <CcSubNav />

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Continuous Readiness™</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Real-time framework readiness — always-on, not point-in-time</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <CcStat label="Frameworks"    value={frameworkData.length || FRAMEWORKS.length} accent="neutral" />
        <CcStat label="Avg Readiness" value={`${avgReadiness}%`} accent={avgReadiness >= 80 ? "good" : avgReadiness >= 60 ? "warn" : "danger"} />
        <CcStat label="Snapshots"     value={snapshots.length}   accent="neutral" />
      </div>

      {/* Framework readiness grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(frameworkData.length > 0 ? frameworkData : FRAMEWORKS.map(name => ({
          id: name, frameworkName: name, readinessScore: 0,
          passingChecks: 0, totalChecks: 0, passingControls: 0,
          totalControls: 0, evidenceCoverage: 0, trend: "stable" as const,
          snapshotAt: new Date(), organizationId: orgId,
          frameworkId: null, createdAt: new Date(),
        }))).map(f => {
          const t = getTrendIcon(f.trend);
          return (
            <div key={f.id} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-semibold text-sm">{f.frameworkName}</div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className={`text-sm font-bold ${t.cls}`}>{t.icon}</span>
                    <span className="text-[11px] text-[var(--color-ink-faint)] capitalize">{f.trend}</span>
                  </div>
                </div>
                <span className="text-2xl font-bold text-[var(--color-blue)]">{f.readinessScore}%</span>
              </div>
              <HealthBar score={f.readinessScore} />
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="rounded-lg bg-white/[0.04] py-1.5">
                  <div className="font-semibold text-xs">{f.passingChecks}/{f.totalChecks}</div>
                  <div className="text-[var(--color-ink-faint)]">Checks</div>
                </div>
                <div className="rounded-lg bg-white/[0.04] py-1.5">
                  <div className="font-semibold text-xs">{f.passingControls}/{f.totalControls}</div>
                  <div className="text-[var(--color-ink-faint)]">Controls</div>
                </div>
                <div className="rounded-lg bg-white/[0.04] py-1.5">
                  <div className="font-semibold text-xs">{f.evidenceCoverage}%</div>
                  <div className="text-[var(--color-ink-faint)]">Evidence</div>
                </div>
              </div>
              {f.snapshotAt && (
                <div className="mt-2 text-[10px] text-[var(--color-ink-faint)]">
                  Snapshot: {new Date(f.snapshotAt).toLocaleString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {frameworkData.length === 0 && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-8 text-center">
          <CheckCircle className="mx-auto mb-3 h-8 w-8 text-[var(--color-ink-faint)] opacity-40" />
          <p className="text-sm text-[var(--color-ink-dim)]">No readiness snapshots yet.</p>
          <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
            Run compliance checks to auto-populate readiness scores.
          </p>
          <Link href="/continuous-compliance/checks"
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium hover:bg-white/[0.04]">
            Go to Checks →
          </Link>
        </div>
      )}
    </div>
  );
}
