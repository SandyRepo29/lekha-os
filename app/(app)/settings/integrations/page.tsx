export const dynamic = "force-dynamic";

import { Link2, Plug, ArrowRight } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getIntegrations } from "@/backend/src/modules/settings/integration-service";
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
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Integrations</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Connect external services to AUDT.</p>
      </div>

      {/* Integration Hub callout */}
      <Link href="/integration-hub" className="flex items-center gap-4 rounded-2xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.04] px-4 py-3.5 hover:bg-[var(--color-blue)]/[0.08] transition-colors">
        <Plug className="h-8 w-8 shrink-0 text-[var(--color-blue)]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Integration Hub™ — 35+ Connectors</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Full connector marketplace · Sync Engine™ · Webhook Engine™ · Connection Health™ · AI Integration Advisor™ · Evidence collection from Entra ID, Okta, AWS, GitHub, Jira, Slack &amp; more</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-ink-faint)]" />
      </Link>

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
