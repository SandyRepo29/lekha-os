export const dynamic = "force-dynamic";

import { Webhook, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getWebhooks } from "@/lib/services/integration-hub/integration-service";
import { CreateWebhookButton } from "@/components/integration-hub/create-webhook-button";
import { DeleteWebhookButton } from "@/components/integration-hub/delete-webhook-button";
import { ToggleWebhookButton } from "@/components/integration-hub/toggle-webhook-button";
import { IntegrationStat, WebhookStatusBadge } from "@/components/integration-hub/integration-ui";

const EVENT_LABELS: Record<string, string> = {
  user_created: "User Created",
  user_deleted: "User Deleted",
  control_failed: "Control Failed",
  risk_created: "Risk Created",
  evidence_updated: "Evidence Updated",
  workflow_triggered: "Workflow Triggered",
  contract_updated: "Contract Updated",
  vendor_updated: "Vendor Updated",
  misconfiguration_detected: "Misconfiguration Detected",
  credential_expiring: "Credential Expiring",
  sync_completed: "Sync Completed",
  sync_failed: "Sync Failed",
};

export default async function WebhooksPage() {
  const session = await requireUser();
  if (!session.org) return null;

  const webhooks = await getWebhooks(session.org.id);
  const inbound = webhooks.filter((w) => w.direction === "inbound");
  const outbound = webhooks.filter((w) => w.direction === "outbound");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Webhook Engine™</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">
            Configure inbound webhooks to receive events from external systems and outbound webhooks to push governance alerts.
          </p>
        </div>
        <CreateWebhookButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <IntegrationStat label="Total Webhooks" value={webhooks.length} accent="neutral" />
        <IntegrationStat label="Inbound" value={inbound.length} accent={inbound.length > 0 ? "good" : "neutral"} />
        <IntegrationStat label="Outbound" value={outbound.length} accent={outbound.length > 0 ? "good" : "neutral"} />
      </div>

      {webhooks.length === 0 ? (
        <Card className="p-12 text-center">
          <Webhook className="h-10 w-10 text-[var(--color-ink-faint)] mx-auto mb-3" />
          <p className="font-semibold">No webhooks configured</p>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">
            Create inbound webhooks to receive events, or outbound webhooks to push governance alerts to your tools.
          </p>
          <CreateWebhookButton className="mt-4 mx-auto" />
        </Card>
      ) : (
        <div className="space-y-6">
          {[{ label: "Inbound Webhooks", items: inbound, icon: ArrowDownToLine }, { label: "Outbound Webhooks", items: outbound, icon: ArrowUpFromLine }].map(
            ({ label, items, icon: Icon }) =>
              items.length > 0 && (
                <div key={label}>
                  <h2 className="text-sm font-semibold text-[var(--color-ink-dim)] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Icon className="h-4 w-4" /> {label}
                  </h2>
                  <div className="space-y-2">
                    {items.map((wh) => (
                      <Card key={wh.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">{wh.name}</p>
                              <WebhookStatusBadge isActive={wh.isActive} />
                            </div>
                            {wh.url && <p className="text-xs text-[var(--color-ink-faint)] font-mono truncate mb-2">{wh.url}</p>}
                            <div className="flex flex-wrap gap-1">
                              {wh.eventTypes.map((et) => (
                                <span key={et} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--color-ink-faint)]">
                                  {EVENT_LABELS[et] ?? et}
                                </span>
                              ))}
                            </div>
                            <p className="text-[10px] text-[var(--color-ink-faint)] mt-1.5">
                              Total calls: {wh.totalCalls} · Created {new Date(wh.createdAt).toLocaleDateString()}
                              {wh.lastTriggered && ` · Last triggered ${new Date(wh.lastTriggered).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <ToggleWebhookButton webhookId={wh.id} isActive={wh.isActive} />
                            <DeleteWebhookButton webhookId={wh.id} name={wh.name} />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      )}

      {/* Reference */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-3">Available Event Types</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(EVENT_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-blue)]/60" />
              <span className="text-xs text-[var(--color-ink-dim)]">{label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
