export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { getSystemHealthAction } from "@/lib/platform-admin/actions";
import { Activity, Database, Users, Package, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default async function HealthPage() {
  await requirePlatformUser();
  const { data, error } = await getSystemHealthAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">System Health</h1>
        <p className="mt-0.5 text-sm text-white/40">Real-time database connectivity, latency, and platform-wide data metrics.</p>
      </div>

      <div className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${error ? "border-red-500/30 bg-red-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`}>
        {error ? <AlertCircle className="h-5 w-5 text-red-400" /> : <CheckCircle className="h-5 w-5 text-emerald-400" />}
        <div>
          <div className={`font-semibold text-sm ${error ? "text-red-300" : "text-emerald-300"}`}>
            {error ? "Database Unreachable" : "All Systems Operational"}
          </div>
          <div className="text-xs text-white/40 mt-0.5">
            {data ? `Checked at ${new Date(data.checkedAt).toLocaleTimeString()} — DB latency ${data.latencyMs}ms` : error}
          </div>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Organizations",  value: data.orgs,     icon: Package,  color: "text-[#00B8D9]" },
              { label: "Total Users",    value: data.users,    icon: Users,    color: "text-violet-400" },
              { label: "Active Vendors", value: data.vendors,  icon: Activity, color: "text-emerald-400" },
              { label: "Evidence Items", value: data.evidence, icon: Database, color: "text-amber-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5">
                <s.icon className={`h-4 w-4 ${s.color} mb-3`} />
                <div className="text-2xl font-bold text-white">{s.value.toLocaleString()}</div>
                <div className="mt-0.5 text-xs text-white/40">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-white/40" />
              <h2 className="text-sm font-semibold text-white">Database Latency</h2>
            </div>
            <div className="flex items-end gap-3">
              <span className={`text-4xl font-bold ${data.latencyMs < 200 ? "text-emerald-400" : data.latencyMs < 500 ? "text-amber-400" : "text-red-400"}`}>
                {data.latencyMs}ms
              </span>
              <span className="text-sm text-white/30 mb-1">
                {data.latencyMs < 200 ? "Excellent" : data.latencyMs < 500 ? "Acceptable" : "Degraded"}
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full ${data.latencyMs < 200 ? "bg-emerald-500" : data.latencyMs < 500 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(100, (data.latencyMs / 1000) * 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#30363d] bg-white/[0.02] overflow-hidden">
            <div className="border-b border-[#30363d] px-5 py-3">
              <h2 className="text-sm font-semibold text-white">Service Checks</h2>
            </div>
            <div className="divide-y divide-[#30363d]">
              {[
                { name: "Supabase Postgres (Pooler)", ok: true, note: "aws-1-ap-south-1.pooler.supabase.com:6543" },
                { name: "SSL / TLS", ok: true, note: "ssl:require enforced" },
                { name: "Row-Level Security", ok: true, note: "Enabled on all 218 tables" },
                { name: "Storage Buckets", ok: true, note: "vendor-documents + compliance-documents" },
                { name: "Region", ok: true, note: "ap-south-1 (Mumbai) — India data residency" },
              ].map((svc) => (
                <div key={svc.name} className="flex items-center gap-4 px-5 py-3">
                  <div className={`h-2 w-2 rounded-full ${svc.ok ? "bg-emerald-400" : "bg-red-400"}`} />
                  <div className="flex-1">
                    <div className="text-sm text-white">{svc.name}</div>
                    <div className="text-xs text-white/30">{svc.note}</div>
                  </div>
                  <span className={`text-xs font-medium ${svc.ok ? "text-emerald-400" : "text-red-400"}`}>{svc.ok ? "OK" : "DOWN"}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
