export const dynamic = "force-dynamic";

import Link from "next/link";
import { Link2, AlertTriangle, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getConnections, getEvents } from "@/lib/services/integration-hub/integration-service";
import { ConnectorStatusBadge } from "@/components/integration-hub/connector-status-badge";
import { TriggerSyncButton } from "@/components/integration-hub/trigger-sync-button";
import { DisconnectButton } from "@/components/integration-hub/disconnect-button";
import { ResolveEventButton } from "@/components/integration-hub/resolve-event-button";

const CATEGORY_LABELS: Record<string, string> = {
  identity: "Identity & Access",
  cloud: "Cloud Infrastructure",
  source_control: "Source Control",
  project_management: "Project Management",
  itsm: "ITSM",
  endpoint: "Endpoint Management",
  security: "Security",
  communication: "Communication",
  storage: "Storage",
  hr: "HR Systems",
  custom: "Custom",
};

const SYNC_FREQ_LABELS: Record<string, string> = {
  real_time: "Real-time",
  fifteen_minutes: "15 min",
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
  manual: "Manual",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-green-400",
};

export default async function ConnectionsPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const orgId = session.org.id;

  const [connections, allEvents] = await Promise.all([
    getConnections(orgId),
    getEvents(orgId, false),
  ]);

  const eventsByInstance = new Map<string, typeof allEvents>();
  for (const ev of allEvents) {
    const arr = eventsByInstance.get(ev.event.instanceId) ?? [];
    arr.push(ev);
    eventsByInstance.set(ev.event.instanceId, arr);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Integration Manager™</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">Manage connected integrations, sync health, and open events.</p>
        </div>
        <Link href="/integration-hub/marketplace" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-line)] text-sm font-medium hover:bg-[#F8F9FB] transition-colors">
          + Add Connection
        </Link>
      </div>

      {connections.length === 0 ? (
        <Card className="p-12 text-center">
          <Link2 className="h-10 w-10 text-[var(--color-ink-faint)] mx-auto mb-3" />
          <p className="font-semibold">No integrations connected</p>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">Visit the Marketplace to connect your first integration.</p>
          <Link href="/integration-hub/marketplace" className="mt-4 inline-flex px-4 py-2 rounded-xl bg-[var(--color-blue)] text-white text-sm font-semibold hover:opacity-90">
            Browse Marketplace
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {connections.map(({ instance, connector }) => {
            const events = eventsByInstance.get(instance.id) ?? [];
            const criticalEvents = events.filter((e) => e.event.severity === "critical");

            return (
              <Card key={instance.id} className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#EEF2F7] flex items-center justify-center text-base font-bold text-[var(--color-blue)] shrink-0">
                      {connector.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-base font-semibold">{connector.name}</p>
                      <p className="text-xs text-[var(--color-ink-faint)]">
                        {CATEGORY_LABELS[connector.category]} · {connector.provider}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ConnectorStatusBadge status={instance.status} />
                    <TriggerSyncButton instanceId={instance.id} />
                    <DisconnectButton instanceId={instance.id} connectorName={connector.name} />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  <div className="rounded-lg bg-[#F8F9FB] px-3 py-2 text-center">
                    <p className="text-lg font-bold">{instance.totalSynced ?? 0}</p>
                    <p className="text-[10px] text-[var(--color-ink-faint)]">Records Synced</p>
                  </div>
                  <div className="rounded-lg bg-[#F8F9FB] px-3 py-2 text-center">
                    <p className="text-lg font-bold">{instance.totalEvidence ?? 0}</p>
                    <p className="text-[10px] text-[var(--color-ink-faint)]">Evidence</p>
                  </div>
                  <div className="rounded-lg bg-[#F8F9FB] px-3 py-2 text-center">
                    <p className="text-lg font-bold">{instance.totalRisks ?? 0}</p>
                    <p className="text-[10px] text-[var(--color-ink-faint)]">Risks</p>
                  </div>
                  <div className="rounded-lg bg-[#F8F9FB] px-3 py-2 text-center">
                    <p className={`text-lg font-bold ${events.length > 0 ? "text-orange-400" : ""}`}>{events.length}</p>
                    <p className="text-[10px] text-[var(--color-ink-faint)]">Open Events</p>
                  </div>
                  <div className="rounded-lg bg-[#F8F9FB] px-3 py-2 text-center">
                    <p className="text-xs font-semibold text-[var(--color-ink-dim)]">{SYNC_FREQ_LABELS[instance.syncFrequency]}</p>
                    <p className="text-[10px] text-[var(--color-ink-faint)]">Sync Freq</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-[var(--color-ink-faint)]">
                  <span>Connected: {instance.connectedAt ? new Date(instance.connectedAt).toLocaleDateString() : "—"}</span>
                  <span>Last sync: {instance.lastSyncAt ? new Date(instance.lastSyncAt).toLocaleString() : "Never"}</span>
                </div>

                {/* Critical events inline */}
                {criticalEvents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-red-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {criticalEvents.length} critical event{criticalEvents.length > 1 ? "s" : ""}
                    </p>
                    {criticalEvents.slice(0, 2).map(({ event }) => (
                      <div key={event.id} className="flex items-start justify-between gap-2 rounded-lg bg-red-500/[0.06] border border-red-500/20 px-3 py-2">
                        <div>
                          <p className="text-xs font-medium">{event.title}</p>
                          {event.description && <p className="text-[10px] text-[var(--color-ink-dim)] mt-0.5 line-clamp-1">{event.description}</p>}
                        </div>
                        <ResolveEventButton eventId={event.id} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Non-critical events */}
                {events.filter((e) => e.event.severity !== "critical").length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {events.filter((e) => e.event.severity !== "critical").slice(0, 3).map(({ event }) => (
                      <div key={event.id} className="flex items-start justify-between gap-2 rounded-lg bg-white border border-[var(--color-line)] px-3 py-2">
                        <div>
                          <p className={`text-[10px] font-semibold mb-0.5 ${SEVERITY_COLORS[event.severity] ?? ""}`}>{event.severity.toUpperCase()}</p>
                          <p className="text-xs">{event.title}</p>
                        </div>
                        <ResolveEventButton eventId={event.id} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
