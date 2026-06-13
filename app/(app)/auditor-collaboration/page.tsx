export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/auditor-collaboration/auditor-collaboration-service";
import Link from "next/link";
import {
  Users, DoorOpen, FileCheck, AlertTriangle, Brain,
  ClipboardList, Shield, ArrowUpRight, Building2, CheckCircle2,
} from "lucide-react";

const NAV = [
  { href: "/auditor-collaboration/rooms",       icon: DoorOpen,       label: "Audit Rooms™",         desc: "Dedicated workspaces per engagement" },
  { href: "/auditor-collaboration/evidence",    icon: FileCheck,      label: "Evidence Requests™",   desc: "Request and track evidence" },
  { href: "/auditor-collaboration/findings",    icon: AlertTriangle,  label: "Shared Findings™",     desc: "Auditor-raised findings" },
  { href: "/auditor-collaboration/assessments", icon: ClipboardList,  label: "Assessment Projects™", desc: "ISO, SOC 2, DPDP and custom" },
  { href: "/auditor-collaboration/users",       icon: Users,          label: "External Users™",      desc: "Auditors, assessors, consultants" },
  { href: "/auditor-collaboration/ai",          icon: Brain,          label: "AI Audit Assistant™",  desc: "Readiness scores & AI insights" },
];

const STATUS_COLORS: Record<string, string> = {
  planning: "text-slate-400", active: "text-emerald-400", under_review: "text-yellow-400",
  completed: "text-blue-400", archived: "text-slate-500", cancelled: "text-red-400",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "text-emerald-400", medium: "text-yellow-400", high: "text-orange-400", critical: "text-red-400",
};

export default async function AuditorCollaborationPage() {
  const session = await requireUser();
  const oid = session.org?.id ?? "";
  const dash = await getDashboardData(oid).catch(() => null);
  const m = dash?.metrics;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-[var(--color-blue)]" /> Auditor Collaboration™
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Centralize all external governance activities — auditors, assessors, evidence, findings, and CAPAs.
          </p>
        </div>
        <Link href="/auditor-collaboration/ai"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Brain className="h-4 w-4" /> AI Audit Assistant™
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Audit Rooms",       value: m?.totalRooms ?? 0,            icon: DoorOpen,      color: "text-[var(--color-blue)]" },
          { label: "Active Rooms",      value: m?.activeRooms ?? 0,           icon: CheckCircle2,  color: "text-emerald-400" },
          { label: "Pending Evidence",  value: m?.openEvidenceRequests ?? 0,  icon: FileCheck,     color: "text-yellow-400" },
          { label: "Open Findings",     value: m?.openFindings ?? 0,          icon: AlertTriangle, color: "text-orange-400" },
          { label: "External Users",    value: m?.totalUsers ?? 0,            icon: Users,         color: "text-purple-400" },
          { label: "Assessments",       value: m?.totalAssessments ?? 0,      icon: ClipboardList, color: "text-sky-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4">
            <div className="flex items-center gap-2 text-xs text-[var(--color-ink-dim)]">
              <Icon className={`h-4 w-4 ${color}`} /> {label}
            </div>
            <div className="mt-2 text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      {/* Module Nav */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {NAV.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}
            className="group flex items-center gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5 transition-colors hover:border-[var(--color-blue)]/40 hover:bg-white/[0.02]">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-blue)]/10">
              <Icon className="h-5 w-5 text-[var(--color-blue)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{label}</div>
              <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">{desc}</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-[var(--color-ink-faint)] group-hover:text-[var(--color-blue)] transition-colors" />
          </Link>
        ))}
      </div>

      {/* Two-column: Recent Rooms + Recent Findings */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Rooms */}
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <DoorOpen className="h-4 w-4 text-[var(--color-blue)]" /> Recent Audit Rooms
            </h2>
            <Link href="/auditor-collaboration/rooms" className="text-xs text-[var(--color-blue)] hover:underline">View all</Link>
          </div>
          {!m?.recentRooms?.length ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No audit rooms yet. Create one to start an engagement.</p>
          ) : (
            <div className="space-y-3">
              {m.recentRooms.map((room) => (
                <Link key={room.id} href={`/auditor-collaboration/rooms/${room.id}`}
                  className="block rounded-lg border border-[var(--color-line)] p-3 hover:border-[var(--color-blue)]/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm truncate">{room.name}</div>
                    <span className={`text-xs font-medium shrink-0 ${STATUS_COLORS[room.status] ?? "text-slate-400"}`}>
                      {room.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-ink-dim)]">
                    {room.framework ?? room.roomType} · {room.completionPct}% complete
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Findings */}
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-orange-400" /> Recent Findings
            </h2>
            <Link href="/auditor-collaboration/findings" className="text-xs text-[var(--color-blue)] hover:underline">View all</Link>
          </div>
          {!m?.recentFindings?.length ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No findings raised yet.</p>
          ) : (
            <div className="space-y-3">
              {m.recentFindings.map((f) => (
                <div key={f.id} className="rounded-lg border border-[var(--color-line)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm truncate">{f.title}</div>
                    <span className={`text-xs font-semibold shrink-0 ${SEVERITY_COLORS[f.severity] ?? "text-slate-400"}`}>
                      {f.severity}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-ink-dim)]">
                    {f.framework ?? f.findingType?.replace("_", " ")} · {f.status.replace("_", " ")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
