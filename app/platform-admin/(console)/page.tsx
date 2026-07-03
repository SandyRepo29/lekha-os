export const dynamic = "force-dynamic";

import Link from "next/link";
import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { getPlatformDashboardData } from "@/lib/platform-admin/actions";
import {
  Building2, Users, Package, Activity, TrendingUp, Database,
  Flag, ClipboardList, ArrowRight, CheckCircle,
} from "lucide-react";

function PaStat({
  label, value, icon: Icon, accent = "neutral", href,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "neutral" | "blue" | "good" | "warn";
  href?: string;
}) {
  const accentBorder = {
    neutral: "border-[#30363d]",
    blue:    "border-[#00B8D9]",
    good:    "border-emerald-500",
    warn:    "border-amber-500",
  }[accent];
  const accentText = {
    neutral: "text-white",
    blue:    "text-[#00B8D9]",
    good:    "text-emerald-400",
    warn:    "text-amber-400",
  }[accent];

  const content = (
    <div className={`rounded-xl border border-l-2 ${accentBorder} border-[#30363d] bg-white/[0.03] p-4`}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accentText}`} />
        <span className="text-[12px] text-white/40">{label}</span>
      </div>
      <div className={`text-2xl font-extrabold ${accentText}`}>{value}</div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default async function PlatformAdminDashboard() {
  const session = await requirePlatformUser();
  const result = await getPlatformDashboardData();
  const d = result.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-bold text-xl text-white">Platform Dashboard</h1>
        <p className="mt-1 text-sm text-white/40">
          Welcome back, {session.name}. Here is the current state of the AUDT platform.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PaStat label="Total Organizations" value={d?.totalOrgs ?? 0}     icon={Building2} accent="blue"    href="/platform-admin/orgs" />
        <PaStat label="Total Users"          value={d?.totalUsers ?? 0}    icon={Users}     accent="neutral" href="/platform-admin/users" />
        <PaStat label="Total Vendors"        value={d?.totalVendors ?? 0}  icon={Package}   accent="neutral" />
        <PaStat label="Active Orgs (30d)"    value={d?.activeOrgs30d ?? 0} icon={TrendingUp} accent="good" />
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/platform-admin/orgs",       icon: Building2,   label: "Organizations",   desc: "View and manage all customer orgs" },
          { href: "/platform-admin/flags",       icon: Flag,        label: "Feature Flags",   desc: "Toggle platform-wide features" },
          { href: "/platform-admin/staff",       icon: Users,       label: "Platform Users",  desc: "Manage internal staff accounts" },
          { href: "/platform-admin/audit-logs",  icon: ClipboardList, label: "Audit Logs",   desc: "All platform admin actions" },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-[#30363d] bg-white/[0.02] p-4 transition-colors hover:border-[#00B8D9]/30 hover:bg-[#00B8D9]/[0.03]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00B8D9]/10">
                <Icon className="h-4 w-4 text-[#00B8D9]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-[11px] text-white/35 truncate">{desc}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent signups */}
        <div className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#00B8D9]" /> Recent Signups
            </h2>
            <Link href="/platform-admin/orgs" className="text-xs text-[#00B8D9] hover:underline">View all</Link>
          </div>
          {(d?.recentSignups ?? []).length === 0 ? (
            <p className="text-sm text-white/30 italic">No organizations yet.</p>
          ) : (
            <div className="space-y-2">
              {(d?.recentSignups ?? []).map((org) => (
                <div key={org.id as string} className="flex items-center justify-between gap-2 border-b border-[#30363d] py-2 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-white">{org.name as string}</div>
                    <div className="text-[11px] text-white/35">{org.industry as string}</div>
                  </div>
                  <div className="shrink-0 text-[11px] text-white/30">{fmtDate(org.created_at as string)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent audit logs */}
        <div className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#00B8D9]" /> Recent Admin Actions
            </h2>
            <Link href="/platform-admin/audit-logs" className="text-xs text-[#00B8D9] hover:underline">View all</Link>
          </div>
          {(d?.recentAuditLogs ?? []).length === 0 ? (
            <p className="text-sm text-white/30 italic">No audit actions yet.</p>
          ) : (
            <div className="space-y-2">
              {(d?.recentAuditLogs ?? []).map((log, i) => (
                <div key={i} className="flex items-center justify-between gap-2 border-b border-[#30363d] py-2 last:border-0">
                  <div>
                    <div className="text-xs font-medium text-white/70">{log.platform_user_email as string}</div>
                    <div className="text-[11px] text-[#00B8D9]/80 font-mono">{log.action as string}</div>
                  </div>
                  <div className="shrink-0 text-[11px] text-white/25">{fmtDate(log.created_at as string)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System info strip */}
      <div className="rounded-xl border border-[#30363d] bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-center gap-6 text-[12px] text-white/35">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span>Database: Connected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-[#00B8D9]" />
            <span>Region: ap-south-1 (Mumbai)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            <span>Status: Operational</span>
          </div>
          <div className="ml-auto text-white/20">
            AUDT Platform Owner Console &mdash; Internal Use Only
          </div>
        </div>
      </div>
    </div>
  );
}
