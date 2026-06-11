export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plug, CheckCircle2, AlertTriangle, RefreshCw, Shield, FileCheck, Zap, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/integration-hub/integration-service";
import { ConnectorStatusBadge } from "@/components/integration-hub/connector-status-badge";
import { TriggerSyncButton } from "@/components/integration-hub/trigger-sync-button";
import { ResolveEventButton } from "@/components/integration-hub/resolve-event-button";

const CATEGORY_LABELS: Record<string, string> = {
  identity: "Identity & Access",
  cloud: "Cloud Infrastructure",
  source_control: "Source Control",
  project_management: "Project Management",
  itsm: "ITSM",
  endpoint: "Endpoint",
  security: "Security",
  communication: "Communication",
  storage: "Storage",
  hr: "HR",
  custom: "Custom",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-green-400",
};

export default async function IntegrationHubDashboard() {
  const session = await requireUser();
  if (!session.org) return null;
  const orgId = session.org.id;

  const { metrics, connections, recentSyncs, openEvents } = await getDashboardData(orgId);

  const phase1Slugs = ["microsoft-entra-id", "okta", "google-workspace", "aws", "github", "jira", "slack", "crowdstrike", "microsoft-defender"];
  const connectedSlugs = connections.map((c) => c.connector.slug);
  const phase1Pending = phase1Slugs.filter((s) => !connectedSlugs.includes(s));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Integration Hub™</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">
            Connect your technology ecosystem and automate governance evidence collection.
          </p>
        </div>
        <Link href="/integration-hub/marketplace" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-blue)] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plug className="h-4 w-4" /> Add Connector
        </Link>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs text-[var(--color-ink-dim)] mb-1">Connected Systems</p>
          <p className="text-3xl font-bold">{metrics.connected}</p>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">of {metrics.total} configured</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-[var(--color-ink-dim)] mb-1">Evidence Collected</p>
          <p className="text-3xl font-bold">{metrics.totalEvidence}</p>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">automated evidence items</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-[var(--color-ink-dim)] mb-1">Risks Generated</p>
          <p className="text-3xl font-bold">{metrics.totalRisks}</p>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">from integration signals</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-[var(--color-ink-dim)] mb-1">Open Events</p>
          <p className={`text-3xl font-bold ${metrics.criticalEvents > 0 ? "text-red-400" : ""}`}>{metrics.openEvents}</p>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">{metrics.criticalEvents} critical</p>
        </Card>
      </div>

      {/* Getting Started / Phase 1 */}
      {phase1Pending.length > 0 && metrics.connected === 0 && (
        <Card className="p-6 border-[var(--color-blue)]/25 bg-[var(--color-blue)]/[0.04]">
          <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-[var(--color-blue)]" /> Getting Started — Connect Phase 1 Systems
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)] mb-4">
            Connect these 8 systems to achieve ~80% governance automation coverage for your organization.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {phase1Pending.slice(0, 8).map((slug) => (
              <Link
                key={slug}
                href={`/integration-hub/marketplace`}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs hover:bg-white/[0.04] transition-colors"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--color-blue)]/40" />
                {slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Connected integrations */}
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" /> Connected Systems™
          </h2>
          {connections.length === 0 ? (
            <Card className="p-8 text-center">
              <Plug className="h-8 w-8 text-[var(--color-ink-faint)] mx-auto mb-2" />
              <p className="text-sm text-[var(--color-ink-dim)]">No integrations connected yet.</p>
              <Link href="/integration-hub/marketplace" className="mt-3 inline-flex text-sm text-[var(--color-blue)] hover:underline">
                Browse Connector Marketplace →
              </Link>
            </Card>
          ) : (
            <div className="space-y-2">
              {connections.map(({ instance, connector }) => (
                <Card key={instance.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-white/[0.08] flex items-center justify-center text-xs font-bold text-[var(--color-blue)] shrink-0">
                      {connector.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{connector.name}</p>
                      <p className="text-xs text-[var(--color-ink-faint)]">
                        {CATEGORY_LABELS[connector.category]} · {instance.lastSyncAt ? `Last sync ${new Date(instance.lastSyncAt).toLocaleDateString()}` : "Never synced"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ConnectorStatusBadge status={instance.status} />
                    <TriggerSyncButton instanceId={instance.id} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Open Events */}
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" /> Open Governance Events
          </h2>
          {openEvents.length === 0 ? (
            <Card className="p-8 text-center">
              <Shield className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-[var(--color-ink-dim)]">No open governance events. All clear.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {openEvents.map(({ event, connectorName }) => (
                <Card key={event.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold mb-0.5 ${SEVERITY_COLORS[event.severity] ?? "text-[var(--color-ink-dim)]"}`}>
                        {event.severity.toUpperCase()} · {connectorName}
                      </p>
                      <p className="text-sm font-medium leading-snug">{event.title}</p>
                      {event.description && (
                        <p className="text-xs text-[var(--color-ink-dim)] mt-1 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                    <ResolveEventButton eventId={event.id} />
                  </div>
                </Card>
              ))}
              <Link href="/integration-hub/connections" className="text-xs text-[var(--color-blue)] hover:underline">
                View all events →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent syncs */}
      {recentSyncs.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-[var(--color-ink-dim)]" /> Recent Syncs
          </h2>
          <Card className="divide-y divide-[var(--color-line)]">
            {recentSyncs.map(({ sync, connectorName }) => (
              <div key={sync.id} className="flex items-center justify-between px-4 py-3 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Activity className="h-4 w-4 text-[var(--color-ink-faint)] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{connectorName}</p>
                    <p className="text-xs text-[var(--color-ink-faint)]">
                      {new Date(sync.startedAt).toLocaleString()} · {sync.syncType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-xs">
                  <span className="text-[var(--color-ink-dim)]">{sync.recordsFetched} records</span>
                  <span className={sync.status === "completed" ? "text-green-400 font-semibold" : sync.status === "failed" ? "text-red-400 font-semibold" : "text-[var(--color-ink-dim)]"}>
                    {sync.status}
                  </span>
                </div>
              </div>
            ))}
          </Card>
          <Link href="/integration-hub/syncs" className="text-xs text-[var(--color-blue)] hover:underline mt-2 inline-block">
            View full sync history →
          </Link>
        </div>
      )}

      {/* Automation coverage summary */}
      <Card className="p-5 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold">{metrics.totalSyncs}</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Total Sync Runs</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{metrics.totalSyncs > 0 ? Math.round(((metrics.totalSyncs - metrics.failedSyncs) / metrics.totalSyncs) * 100) : 0}%</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Sync Success Rate</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{metrics.connected > 0 ? Math.min(Math.round((metrics.connected / 8) * 100), 100) : 0}%</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Phase 1 Coverage</p>
        </div>
      </Card>
    </div>
  );
}
