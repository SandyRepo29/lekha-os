export const dynamic = "force-dynamic";

import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getMarketplace, getConnections } from "@/lib/services/integration-hub/integration-service";
import { ConnectorStatusBadge } from "@/components/integration-hub/connector-status-badge";
import { ConnectButton } from "@/components/integration-hub/connect-button";

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

const CATEGORY_ORDER = [
  "identity", "cloud", "security", "source_control", "project_management",
  "itsm", "endpoint", "communication", "hr", "storage", "custom",
];

export default async function MarketplacePage() {
  const session = await requireUser();
  if (!session.org) return null;
  const orgId = session.org.id;

  const [connectors, connections] = await Promise.all([
    getMarketplace(),
    getConnections(orgId),
  ]);

  const connectedByRegistryId = new Map(connections.map((c) => [c.instance.registryId, c.instance]));

  const byCategory = CATEGORY_ORDER.reduce<Record<string, typeof connectors>>((acc, cat) => {
    const group = connectors.filter((c) => c.category === cat);
    if (group.length > 0) acc[cat] = group;
    return acc;
  }, {});

  const phase1Count = connectors.filter((c) => c.isPhase1).length;
  const connectedPhase1 = connections.filter((c) => c.connector.isPhase1).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Connector Marketplace™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          Connect your technology stack to automate governance evidence collection and continuous monitoring.
        </p>
      </div>

      {/* Phase 1 progress */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold">Phase 1 Coverage™</p>
            <p className="text-xs text-[var(--color-ink-dim)]">Connect these {phase1Count} core systems for ~80% governance automation coverage</p>
          </div>
          <p className="text-2xl font-bold">{connectedPhase1}<span className="text-sm font-normal text-[var(--color-ink-dim)">/{phase1Count}</span></p>
        </div>
        <div className="w-full h-2 rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-[var(--color-blue)]"
            style={{ width: `${Math.round((connectedPhase1 / phase1Count) * 100)}%` }}
          />
        </div>
      </Card>

      {/* Category groups */}
      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category}>
          <h2 className="text-sm font-semibold text-[var(--color-ink-dim)] uppercase tracking-wider mb-3">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((connector) => {
              const instance = connectedByRegistryId.get(connector.id);
              const isConnected = !!instance && instance.status === "connected";
              const features = (connector.features ?? []) as string[];

              return (
                <Card key={connector.id} className={`p-4 relative ${connector.isPhase1 ? "border-[var(--color-blue)]/20" : ""}`}>
                  {connector.isPhase1 && (
                    <span className="absolute top-3 right-3 rounded-full bg-[var(--color-blue)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-blue)]">
                      Phase 1
                    </span>
                  )}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-white/[0.08] flex items-center justify-center text-base font-bold text-[var(--color-blue)] shrink-0">
                      {connector.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{connector.name}</p>
                      <p className="text-xs text-[var(--color-ink-faint)]">{connector.provider}</p>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--color-ink-dim)] mb-3 line-clamp-2">{connector.description}</p>

                  {features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {features.slice(0, 3).map((f) => (
                        <span key={f} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--color-ink-faint)]">
                          {f.replace(/_/g, " ")}
                        </span>
                      ))}
                      {features.length > 3 && (
                        <span className="text-[10px] text-[var(--color-ink-faint)]">+{features.length - 3} more</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    {instance ? (
                      <ConnectorStatusBadge status={instance.status} />
                    ) : (
                      <span className="text-[10px] text-[var(--color-ink-faint)]">{connector.authType.toUpperCase()}</span>
                    )}
                    {connector.status !== "coming_soon" && (
                      <ConnectButton
                        registryId={connector.id}
                        connectorName={connector.name}
                        authFields={(connector.authFields ?? []) as { key: string; label: string; type: string; required: boolean }[]}
                        instanceId={instance?.id}
                        isConnected={isConnected}
                      />
                    )}
                    {connector.status === "coming_soon" && (
                      <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-[var(--color-ink-faint)]">Coming Soon</span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
