export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getWorkforceEvents } from "@/lib/services/continuous-compliance/continuous-compliance-service";
import { Users, UserCheck, UserX } from "lucide-react";
import { StatusBadge, CcStat, HealthBar, CcSubNav } from "@/components/continuous-compliance/cc-ui";

const EVENT_ICONS: Record<string, typeof UserCheck> = {
  onboarding: UserCheck, offboarding: UserX, role_change: Users,
  access_change: Users, security_incident: Users,
};

const EVENT_LABELS: Record<string, string> = {
  onboarding: "Onboarding", offboarding: "Offboarding",
  role_change: "Role Change", access_change: "Access Change", security_incident: "Security Incident",
};

export default async function WorkforcePage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const events = await getWorkforceEvents(orgId).catch(() => []);

  const pending   = events.filter(e => e.status === "pending").length;
  const inProg    = events.filter(e => e.status === "in_progress").length;
  const completed = events.filter(e => e.status === "completed").length;

  return (
    <div className="space-y-6 p-6">
      <CcSubNav />

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Workforce Compliance™</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Onboarding, offboarding, and employee lifecycle compliance</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <CcStat label="Pending"     value={pending}   accent={pending > 0 ? "warn" : "neutral"} />
        <CcStat label="In Progress" value={inProg}    accent="blue" />
        <CcStat label="Completed"   value={completed} accent="good" />
      </div>

      {/* Onboarding checklist info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-sm">
            <UserCheck className="h-4 w-4 text-emerald-400" /> Onboarding Checklist
          </h3>
          <div className="space-y-2">
            {["Background Verification", "Security Training", "Policy Attestation", "Role Assignment", "System Access"].map(step => (
              <div key={step} className="flex items-center gap-2 text-xs text-[var(--color-ink-dim)]">
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-blue)]" />
                {step}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-sm">
            <UserX className="h-4 w-4 text-red-400" /> Offboarding Checklist
          </h3>
          <div className="space-y-2">
            {["Access Removal", "Device Return", "Knowledge Transfer", "Vendor Access Removal", "Final Verification"].map(step => (
              <div key={step} className="flex items-center gap-2 text-xs text-[var(--color-ink-dim)]">
                <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Events list */}
      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map(ev => {
            const Icon = EVENT_ICONS[ev.eventType] ?? Users;
            const progress = ev.totalSteps > 0 ? Math.round((ev.completedSteps / ev.totalSteps) * 100) : 0;
            return (
              <div key={ev.id} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#F8F9FB]">
                      <Icon className="h-4 w-4 text-[var(--color-blue)]" />
                    </span>
                    <div>
                      <div className="font-semibold text-sm">{ev.userName ?? "Unknown User"}</div>
                      <div className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{EVENT_LABELS[ev.eventType] ?? ev.eventType}</div>
                    </div>
                  </div>
                  <StatusBadge status={ev.status} />
                </div>
                {ev.totalSteps > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-[var(--color-ink-dim)]">
                      <span>Progress</span>
                      <span>{ev.completedSteps}/{ev.totalSteps} steps ({progress}%)</span>
                    </div>
                    <HealthBar score={progress} size="sm" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-10 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-[var(--color-ink-faint)] opacity-40" />
          <p className="text-sm text-[var(--color-ink-dim)]">No workforce compliance events yet.</p>
          <p className="mt-1 text-xs text-[var(--color-ink-faint)]">Events are automatically created during onboarding and offboarding workflows.</p>
        </div>
      )}
    </div>
  );
}
