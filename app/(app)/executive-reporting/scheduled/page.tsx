export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getSchedules } from "@/lib/services/executive-reporting/executive-reporting-service";
import Link from "next/link";
import { ArrowLeft, Clock, Mail, CheckCircle, XCircle } from "lucide-react";
import { CreateScheduleButton } from "./create-schedule-button";
import { ExecStat } from "@/components/executive-reporting/executive-ui";

const FREQUENCY_LABELS: Record<string, string> = {
  daily:     "Daily",
  weekly:    "Weekly",
  monthly:   "Monthly",
  quarterly: "Quarterly",
  annually:  "Annually",
};

const DELIVERY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  pdf:   Clock,
  link:  Clock,
};

export default async function ScheduledPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const schedules = await getSchedules(orgId).catch(() => []);
  const active = schedules.filter((s) => s.isActive).length;
  const paused = schedules.filter((s) => !s.isActive).length;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/executive-reporting" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
            <ArrowLeft className="h-3.5 w-3.5" />
            Executive Reporting™
          </Link>
          <h1 className="text-2xl font-bold">Scheduled Reports™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Automate report delivery to executives, board members, and committees.
          </p>
        </div>
        <CreateScheduleButton />
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        <ExecStat label="Total Schedules" value={schedules.length} accent="neutral" />
        <ExecStat label="Active"          value={active}           accent={active > 0 ? "good" : "neutral"} />
        <ExecStat label="Paused"          value={paused}           accent={paused > 0 ? "warn" : "neutral"} />
      </div>

      {/* Schedules list */}
      {schedules.length > 0 ? (
        <div className="space-y-3">
          {schedules.map((s) => {
            const recipients = Array.isArray(s.recipients) ? s.recipients : [];
            return (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`grid h-9 w-9 place-items-center rounded-lg ${s.isActive ? "bg-emerald-500/10" : "bg-[var(--color-line)]"}`}>
                    <Clock className={`h-4 w-4 ${s.isActive ? "text-emerald-400" : "text-[var(--color-ink-dim)]"}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">
                      {FREQUENCY_LABELS[s.frequency] ?? s.frequency} · {s.deliveryMethod} · {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {s.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                      <CheckCircle className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-line)] px-2 py-0.5 text-xs font-medium text-[var(--color-ink-dim)]">
                      <XCircle className="h-3 w-3" /> Paused
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--color-line)] p-10 text-center">
          <Clock className="mx-auto h-10 w-10 text-[var(--color-ink-dim)] mb-3" />
          <p className="font-medium">No schedules yet</p>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Create your first scheduled report to automate executive delivery.</p>
        </div>
      )}
    </div>
  );
}
