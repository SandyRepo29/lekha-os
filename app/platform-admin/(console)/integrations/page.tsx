export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { Plug } from "lucide-react";

async function getIntegrationStats() {
  try {
    const [counts, recent] = await Promise.all([
      db.execute(sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'error')  as error,
          COUNT(DISTINCT provider) as providers
        FROM integrations
      `),
      db.execute(sql`
        SELECT i.provider, i.status, o.name as org_name, i.created_at
        FROM integrations i
        JOIN organizations o ON o.id = i.organization_id
        ORDER BY i.created_at DESC
        LIMIT 20
      `),
    ]);
    return {
      stats: counts[0] as Record<string, unknown>,
      recent: recent as Array<Record<string, unknown>>,
    };
  } catch { return { stats: {}, recent: [] }; }
}

const STATUS_STYLE: Record<string, string> = {
  active:       "bg-emerald-500/20 text-emerald-300",
  error:        "bg-red-500/20 text-red-300",
  disconnected: "bg-white/10 text-white/40",
  pending:      "bg-amber-500/20 text-amber-300",
};

const PROVIDER_CATALOG = [
  { name: "Slack",           category: "Communication",  icon: "💬" },
  { name: "Google Workspace",category: "Identity",       icon: "🔐" },
  { name: "Microsoft Entra ID", category: "Identity",   icon: "🔑" },
  { name: "Okta",            category: "Identity",       icon: "🛡" },
  { name: "AWS",             category: "Cloud",          icon: "☁️" },
  { name: "GitHub",          category: "Source Control", icon: "🐙" },
  { name: "Jira",            category: "Project Mgmt",   icon: "📋" },
  { name: "CrowdStrike",     category: "Security",       icon: "🦅" },
  { name: "Microsoft Defender", category: "Security",   icon: "🛡" },
  { name: "Resend",          category: "Email",          icon: "📧" },
];

export default async function IntegrationsPage() {
  await requirePlatformUser();
  const { stats, recent } = await getIntegrationStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Integration Provider Catalog</h1>
        <p className="mt-0.5 text-sm text-white/40">Platform-wide integration health and connected system overview.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Connections", value: String(stats.total ?? 0),     color: "text-white" },
          { label: "Active",            value: String(stats.active ?? 0),    color: "text-emerald-400" },
          { label: "Errors",            value: String(stats.error ?? 0),     color: "text-red-400" },
          { label: "Unique Providers",  value: String(stats.providers ?? 0), color: "text-[#00B8D9]" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="mt-0.5 text-xs text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Built-in Provider Catalog</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {PROVIDER_CATALOG.map((p) => (
            <div key={p.name} className="rounded-xl border border-[#30363d] bg-white/[0.02] p-4">
              <div className="text-2xl mb-2">{p.icon}</div>
              <div className="text-sm font-medium text-white">{p.name}</div>
              <div className="mt-0.5 text-[11px] text-white/30">{p.category}</div>
            </div>
          ))}
        </div>
      </div>

      {recent.length > 0 && (
        <div className="rounded-xl border border-[#30363d] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#30363d] px-5 py-3 bg-white/[0.02]">
            <Plug className="h-4 w-4 text-white/40" />
            <h2 className="text-sm font-semibold text-white">Recent Connections</h2>
          </div>
          <div className="divide-y divide-[#30363d]">
            {recent.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm text-white">{r.provider as string}</div>
                  <div className="text-xs text-white/40">{r.org_name as string}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[r.status as string] ?? "bg-white/5 text-white/40"}`}>
                    {r.status as string}
                  </span>
                  <span className="text-xs text-white/25">{new Date(r.created_at as string).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
