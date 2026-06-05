export const dynamic = "force-dynamic";

import { Link2 } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getIntegrations } from "@/lib/services/integration-service";
import { IntegrationGrid } from "@/components/settings/integration-grid";

export default async function IntegrationsPage() {
  const session = await requireUser();

  if (!session.org) {
    return <div className="text-[var(--color-ink-dim)]">No organization found.</div>;
  }

  const integrations = session.demo ? [] : await getIntegrations(session.org.id);
  const canManage = session.org.role === "owner" || session.org.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Integrations</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Connect external services to Lekha OS.</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <Link2 className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
            Connected ({integrations.filter((i) => i.status === "connected").length})
          </span>
        </div>
        {session.demo ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-300/90">
            Connect Supabase to manage integrations.
          </div>
        ) : (
          <IntegrationGrid integrations={integrations} canManage={canManage} />
        )}
      </div>
    </div>
  );
}
