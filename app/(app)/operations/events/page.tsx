export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getOrgEventsAction, getEventTypesAction } from "@/lib/toe/actions";
import { ToeSubNav, EventSeverityBadge, fmtDt } from "@/components/toe/toe-ui";
import { Activity } from "lucide-react";

export default async function EventsPage() {
  await requireUser();

  const [eventsResult, typesResult] = await Promise.all([
    getOrgEventsAction({ limit: 100 }),
    getEventTypesAction(),
  ]);

  const events = ((eventsResult as { data?: unknown[] } | null)?.data ?? []) as Array<{
    id: string; event_type: string; entity_type: string | null; entity_id: string | null;
    actor_id: string | null; payload: Record<string, unknown>; published_at: string;
  }>;

  const typeCatalogue = ((typesResult as { data?: unknown[] } | null)?.data ?? []) as Array<{
    name: string; label: string; description: string | null; module: string; severity: string;
  }>;

  const typeMap: Record<string, { label: string; severity: string; module: string }> = {};
  for (const t of typeCatalogue) typeMap[t.name] = { label: t.label, severity: t.severity, module: t.module };

  const moduleGroups = typeCatalogue.reduce<Record<string, typeof typeCatalogue>>((acc, t) => {
    if (!acc[t.module]) acc[t.module] = [];
    acc[t.module].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      <ToeSubNav />

      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Event Log</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
          Every significant governance action published to the platform event stream.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Event stream */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--color-blue)]" />
            <span className="text-sm font-semibold">Event Stream</span>
            <span className="ml-auto rounded-full bg-[var(--color-blue)]/10 px-2 py-0.5 text-[11px] text-[var(--color-blue)]">{events.length} events</span>
          </div>
          {events.length === 0
            ? (
              <div className="py-12 text-center">
                <Activity className="mx-auto mb-3 h-8 w-8 text-[var(--color-ink-dim)]" />
                <p className="text-sm text-[var(--color-ink-dim)]">No events yet.</p>
                <p className="mt-1 text-xs text-[var(--color-ink-dim)]">Events are published automatically as governance actions occur across all modules.</p>
              </div>
            )
            : (
              <div className="divide-y divide-[var(--color-line)]">
                {events.map(ev => {
                  const meta = typeMap[ev.event_type];
                  return (
                    <div key={ev.id} className="flex items-start gap-3 py-3">
                      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-blue)]" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium">{meta?.label ?? ev.event_type}</span>
                          {meta?.severity && <EventSeverityBadge severity={meta.severity} />}
                          {ev.entity_type && (
                            <span className="text-[11px] text-[var(--color-ink-dim)]">{ev.entity_type}</span>
                          )}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-[var(--color-ink-dim)]">{ev.event_type}</div>
                      </div>
                      <span className="shrink-0 text-[11px] text-[var(--color-ink-dim)]">{fmtDt(ev.published_at)}</span>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>

        {/* Event Catalogue */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-4">
            <div className="mb-3 text-sm font-semibold">Event Catalogue</div>
            <p className="text-xs text-[var(--color-ink-dim)] leading-relaxed">
              {typeCatalogue.length} built-in event types across all governance modules. Subscribe to events to trigger automations.
            </p>
          </div>

          {Object.entries(moduleGroups).map(([mod, types]) => (
            <div key={mod} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-dim)]">{mod.replace(/_/g, " ")}</div>
              <div className="space-y-1.5">
                {types.map(t => (
                  <div key={t.name} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[var(--color-ink-dim)]">{t.label}</span>
                    <EventSeverityBadge severity={t.severity} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
