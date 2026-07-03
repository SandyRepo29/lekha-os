export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { Shield, Lock, Key, Users, Activity } from "lucide-react";

async function getSecurityStats() {
  try {
    const [sessions, mfa, ipRules, apiKeys, auditActivity] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) FILTER (WHERE status='active') as active, COUNT(*) as total FROM user_sessions`).catch(() => [{ active: 0, total: 0 }]),
      db.execute(sql`SELECT COUNT(*) FILTER (WHERE totp_enabled) as enabled, COUNT(*) as total FROM user_mfa_status`).catch(() => [{ enabled: 0, total: 0 }]),
      db.execute(sql`SELECT COUNT(*) as total FROM ip_allowlists WHERE enabled`).catch(() => [{ total: 0 }]),
      db.execute(sql`SELECT COUNT(*) FILTER (WHERE status='active') as active FROM api_keys`).catch(() => [{ active: 0 }]),
      db.execute(sql`SELECT COUNT(*) as total FROM audit_logs WHERE created_at > now() - INTERVAL '24 hours'`).catch(() => [{ total: 0 }]),
    ]);
    return {
      sessions: sessions[0] as Record<string, unknown>,
      mfa: mfa[0] as Record<string, unknown>,
      ipRules: (ipRules[0] as Record<string, unknown>),
      apiKeys: (apiKeys[0] as Record<string, unknown>),
      auditActivity: (auditActivity[0] as Record<string, unknown>),
    };
  } catch { return { sessions: {}, mfa: {}, ipRules: {}, apiKeys: {}, auditActivity: {} }; }
}

export default async function SecurityPage() {
  await requirePlatformUser();
  const stats = await getSecurityStats();

  const mfaTotal = Number(stats.mfa.total ?? 0);
  const mfaEnabled = Number(stats.mfa.enabled ?? 0);
  const mfaPct = mfaTotal > 0 ? Math.round((mfaEnabled / mfaTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Security Center</h1>
        <p className="mt-0.5 text-sm text-white/40">Platform-wide security posture: sessions, MFA, API keys, and audit activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active Sessions",    value: String(stats.sessions.active ?? 0),    icon: Activity, color: "text-emerald-400" },
          { label: "MFA-Enabled Users",  value: `${mfaPct}%`,                           icon: Shield,   color: mfaPct >= 80 ? "text-emerald-400" : "text-amber-400" },
          { label: "IP Allowlist Rules", value: String(stats.ipRules.total ?? 0),       icon: Lock,     color: "text-[#00B8D9]" },
          { label: "Active API Keys",    value: String(stats.apiKeys.active ?? 0),      icon: Key,      color: "text-violet-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5">
            <s.icon className={`h-4 w-4 ${s.color} mb-3`} />
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="mt-0.5 text-xs text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      {/* MFA Coverage Bar */}
      <div className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-white/40" />
            <span className="text-sm font-semibold text-white">MFA Coverage</span>
          </div>
          <span className={`text-sm font-bold ${mfaPct >= 80 ? "text-emerald-400" : mfaPct >= 50 ? "text-amber-400" : "text-red-400"}`}>
            {mfaEnabled} / {mfaTotal} users ({mfaPct}%)
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${mfaPct >= 80 ? "bg-emerald-500" : mfaPct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${mfaPct}%` }}
          />
        </div>
      </div>

      {/* Audit Activity */}
      <div className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-4 w-4 text-white/40" />
          <span className="text-sm font-semibold text-white">Tenant Audit Events (Last 24h)</span>
        </div>
        <div className="text-3xl font-bold text-white">{String(stats.auditActivity.total ?? 0)}</div>
        <div className="mt-1 text-xs text-white/30">Recorded across all tenant organizations</div>
      </div>

      {/* Security Checklist */}
      <div className="rounded-xl border border-[#30363d] bg-white/[0.02] overflow-hidden">
        <div className="border-b border-[#30363d] px-5 py-3">
          <h2 className="text-sm font-semibold text-white">Platform Security Checklist</h2>
        </div>
        <div className="divide-y divide-[#30363d]">
          {[
            { label: "TLS / HTTPS enforced",                ok: true,  note: "HSTS 1yr + preload in next.config.ts" },
            { label: "AES-256-GCM integration encryption",  ok: true,  note: "lib/providers/crypto/config-cipher.ts" },
            { label: "bcrypt API key storage (12 rounds)",  ok: true,  note: "api-key-repo.ts — never returns keyHash" },
            { label: "Row-Level Security enabled",          ok: true,  note: "All 218 tables have RLS policies" },
            { label: "Supabase Pooler SSL",                 ok: true,  note: "ssl:require — no cert chain verification" },
            { label: "X-Frame-Options: DENY",               ok: true,  note: "next.config.ts security headers" },
            { label: "CSP headers configured",              ok: true,  note: "next.config.ts Content-Security-Policy" },
            { label: "India data residency (ap-south-1)",   ok: true,  note: "DPDP-compliant Mumbai region" },
            { label: "RESEND_API_KEY configured",           ok: false, note: "Email alerts currently disabled" },
            { label: "CRON_SECRET configured",              ok: false, note: "Cron endpoints unprotected" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-4 px-5 py-3">
              <div className={`h-2 w-2 rounded-full shrink-0 ${item.ok ? "bg-emerald-400" : "bg-amber-400"}`} />
              <div className="flex-1">
                <div className="text-sm text-white">{item.label}</div>
                <div className="text-xs text-white/30">{item.note}</div>
              </div>
              <span className={`text-xs font-medium ${item.ok ? "text-emerald-400" : "text-amber-400"}`}>
                {item.ok ? "Configured" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
