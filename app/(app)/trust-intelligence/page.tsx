export const dynamic = "force-dynamic";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getTrustIntelligenceOverview, getGovernanceTimeline } from "@/lib/services/trust-intelligence/trust-intelligence-service";
import { OrgTrustScoreRing, OrgTrustBadge } from "@/components/trust-intelligence/org-trust-badge";
import { ComponentBar, TrustStat } from "@/components/trust-intelligence/trust-intelligence-ui";
import { ORG_TRUST_COMPONENT_LABELS, ORG_TRUST_COMPONENT_WEIGHTS } from "@/lib/services/org-trust-score";

export default async function TrustIntelligencePage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={Sparkles}
          title="Trust Intelligence™"
          description="Connect Supabase to unlock Organizational Trust Intelligence."
        />
      </Card>
    );
  }

  const [overview, timeline] = await Promise.all([
    getTrustIntelligenceOverview(session.org.id),
    getGovernanceTimeline(session.org.id, 10),
  ]);

  const { orgTrustScore: score } = overview;

  const components = [
    { key: "vendorTrust",        value: score.vendorTrust },
    { key: "riskPosture",        value: score.riskPosture },
    { key: "controlHealth",      value: score.controlHealth },
    { key: "auditReadiness",     value: score.auditReadiness },
    { key: "complianceCoverage", value: score.complianceCoverage },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[var(--color-blue)]" />
            Trust Intelligence™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            Organizational governance command center
          </p>
        </div>
        <Link href="/trust-intelligence/executive">
          <Button variant="ghost" size="md">Executive View</Button>
        </Link>
      </div>

      {/* Org Trust Score hero */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 flex flex-col items-center justify-center gap-4 lg:col-span-1">
          <OrgTrustScoreRing score={score.overall} size={140} />
          <div className="text-center">
            <OrgTrustBadge score={score.overall} />
            <p className="mt-2 text-xs text-[var(--color-ink-faint)]">Organizational Trust Score™</p>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2 space-y-4">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Component Breakdown</p>
          <div className="space-y-3">
            {components.map(({ key, value }) => (
              <ComponentBar
                key={key}
                label={ORG_TRUST_COMPONENT_LABELS[key]}
                score={value}
                weight={ORG_TRUST_COMPONENT_WEIGHTS[key]}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Metrics row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <TrustStat
          label="Vendors"
          value={overview.vendors.total}
          sub={`${overview.vendors.scoredCount} scored · avg ${overview.vendors.avgScore}`}
          accent="neutral"
        />
        <TrustStat
          label="Active Risks"
          value={overview.risks.activeCount}
          sub={`${overview.risks.criticalCount} critical`}
          accent={overview.risks.criticalCount > 0 ? "danger" : "warn"}
        />
        <TrustStat
          label="Controls"
          value={overview.controls.totalCount}
          sub={`${overview.controls.weakCount} weak · avg ${overview.controls.avgHealth}`}
          accent="neutral"
        />
        <TrustStat
          label="Open Findings"
          value={overview.audits.totalOpenFindings}
          sub={`${overview.audits.openCriticalFindings} critical`}
          accent={overview.audits.openCriticalFindings > 0 ? "danger" : "warn"}
        />
        <TrustStat
          label="Compliance"
          value={`${overview.compliance.avgReadiness}%`}
          sub={`${overview.compliance.frameworkCount} framework${overview.compliance.frameworkCount !== 1 ? "s" : ""}`}
          accent={overview.compliance.avgReadiness >= 75 ? "good" : overview.compliance.avgReadiness >= 50 ? "warn" : "danger"}
        />
      </div>

      {/* Drivers & Detractors */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold text-emerald-400 mb-3">Trust Drivers™</p>
          {score.drivers.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-faint)]">No positive drivers detected yet.</p>
          ) : (
            <ul className="space-y-2">
              {score.drivers.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-red-400 mb-3">Trust Detractors™</p>
          {score.detractors.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-faint)]">No detractors detected.</p>
          ) : (
            <ul className="space-y-2">
              {score.detractors.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "/trust-intelligence/recommendations", label: "View Recommendations", icon: "→", accent: "var(--color-blue)" },
          { href: "/trust-intelligence/executive", label: "Executive View", icon: "→", accent: "var(--color-blue)" },
          { href: "/trust-intelligence/risks", label: "Risk Insights", icon: "→", accent: "var(--color-blue)" },
        ].map(({ href, label }) => (
          <Link key={href} href={href}>
            <Card className="p-4 hover:bg-white/[0.04] transition-colors cursor-pointer flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
              <span className="text-[var(--color-blue)] text-sm">→</span>
            </Card>
          </Link>
        ))}
      </div>

      {/* Governance Timeline */}
      <Card className="p-5">
        <p className="text-sm font-semibold mb-4">Governance Timeline</p>
        {timeline.length === 0 ? (
          <p className="text-xs text-[var(--color-ink-faint)]">No governance events yet.</p>
        ) : (
          <div className="space-y-2">
            {timeline.slice(0, 10).map((event) => (
              <div key={event.id} className="flex items-center gap-3 text-xs">
                <span className="text-[var(--color-ink-faint)] w-32 shrink-0">
                  {new Date(event.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[var(--color-ink-dim)] font-mono">
                  {event.action}
                </span>
                {event.actorName && (
                  <span className="text-[var(--color-ink-faint)]">by {event.actorName}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
