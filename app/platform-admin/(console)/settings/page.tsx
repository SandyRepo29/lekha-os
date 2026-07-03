export const dynamic = "force-dynamic";

import { requirePlatformUser, isOwner } from "@/lib/platform-admin/auth";
import { Settings2 } from "lucide-react";

const CONFIG = [
  {
    group: "Platform Identity",
    items: [
      { key: "Platform Name",    value: "AUDT",                      editable: false },
      { key: "Domain",           value: "audt.tech",                 editable: false },
      { key: "Support Email",    value: "security@audt.tech",        editable: false },
      { key: "API Base URL",     value: "https://audt.tech/api/v1",  editable: false },
    ],
  },
  {
    group: "Hosting & Infrastructure",
    items: [
      { key: "Hosting Platform",  value: "Vercel (Mumbai bom1)",         editable: false },
      { key: "Database",          value: "Supabase Postgres (ap-south-1)", editable: false },
      { key: "DB Pooler",         value: "Supavisor (port 6543)",         editable: false },
      { key: "Storage",           value: "Supabase Storage",              editable: false },
      { key: "Data Residency",    value: "India (DPDP compliant)",        editable: false },
      { key: "AI Provider",       value: "Google Gemini 2.5 Flash",       editable: false },
    ],
  },
  {
    group: "Security Configuration",
    items: [
      { key: "Encryption",       value: "AES-256-GCM (integration configs)", editable: false },
      { key: "Password Hashing", value: "bcrypt (12 rounds)",                editable: false },
      { key: "Session Auth",     value: "Supabase Auth + RBAC (7 roles)",    editable: false },
      { key: "TLS",              value: "Enforced (ssl:require)",             editable: false },
      { key: "HSTS",             value: "1 year + preload",                   editable: false },
      { key: "CSP",              value: "Configured in next.config.ts",       editable: false },
    ],
  },
  {
    group: "Compliance",
    items: [
      { key: "DPDP Act 2023",    value: "India data residency, consent, DSR", editable: false },
      { key: "RLS",              value: "Row-Level Security on all 218 tables", editable: false },
      { key: "Audit Logging",    value: "All actions recorded to audit_logs",  editable: false },
      { key: "Soft Delete",      value: "7 tables with deleted_at column",     editable: false },
    ],
  },
  {
    group: "Environment Variables",
    items: [
      { key: "GEMINI_API_KEY",               value: "Set",          editable: false },
      { key: "ENCRYPTION_KEY",               value: "Set",          editable: false },
      { key: "DATABASE_URL",                 value: "Set",          editable: false },
      { key: "NEXT_PUBLIC_SUPABASE_URL",     value: "Set",          editable: false },
      { key: "RESEND_API_KEY",               value: "Not set",      editable: false },
      { key: "CRON_SECRET",                  value: "Not set",      editable: false },
      { key: "SUPABASE_SERVICE_ROLE_KEY",    value: "Placeholder",  editable: false },
    ],
  },
];

export default async function SettingsPage() {
  const session = await requirePlatformUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Platform Settings</h1>
        <p className="mt-0.5 text-sm text-white/40">Global platform configuration reference. Editable settings require platform_owner role.</p>
      </div>

      {!isOwner(session) && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-3 text-sm text-amber-300">
          Read-only view. Platform Owner role required to modify settings.
        </div>
      )}

      {CONFIG.map((group) => (
        <div key={group.group} className="rounded-xl border border-[#30363d] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#30363d] px-5 py-3 bg-white/[0.02]">
            <Settings2 className="h-4 w-4 text-white/40" />
            <h2 className="text-sm font-semibold text-white">{group.group}</h2>
          </div>
          <div className="divide-y divide-[#30363d]">
            {group.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.01]">
                <span className="text-sm text-white/60">{item.key}</span>
                <span className={`text-sm font-mono ${
                  item.value === "Set"         ? "text-emerald-400" :
                  item.value === "Not set"     ? "text-amber-400" :
                  item.value === "Placeholder" ? "text-amber-400" :
                  "text-white"
                }`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
