"use client";

import { useState } from "react";
import {
  Clock, Filter, Shield, FileText, AlertTriangle, CheckCircle2,
  UserCheck, RefreshCw, Trash2, AlertCircle, Users, Link, GitBranch,
  Package, Award, TrendingDown, TrendingUp, Zap, Eye
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { LifecycleBadge } from "./lifecycle-badge";

// Match the timeline_event_type enum from the migration
const EVENT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  vendor_created:            Package,
  lifecycle_changed:         GitBranch,
  document_uploaded:         FileText,
  document_expired:          AlertTriangle,
  assessment_completed:      Shield,
  risk_identified:           AlertCircle,
  risk_mitigated:            TrendingDown,
  risk_accepted:             CheckCircle2,
  finding_opened:            AlertTriangle,
  finding_closed:            CheckCircle2,
  capa_created:              RefreshCw,
  capa_completed:            CheckCircle2,
  contract_signed:           FileText,
  contract_expiring:         AlertTriangle,
  contract_renewed:          TrendingUp,
  compliance_score_changed:  Shield,
  trust_score_changed:       Award,
  approval_requested:        UserCheck,
  approval_granted:          CheckCircle2,
  approval_rejected:         AlertTriangle,
  onboarding_started:        Zap,
  onboarding_step_completed: CheckCircle2,
  onboarding_completed:      Award,
  renewal_started:           RefreshCw,
  renewal_completed:         CheckCircle2,
  offboarding_started:       Trash2,
  offboarding_step_completed:CheckCircle2,
  offboarding_completed:     Trash2,
  contact_added:             Users,
  contact_removed:           Users,
  note_added:                FileText,
  integration_event:         Link,
  monitoring_alert:          Eye,
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  vendor_created:            "bg-blue-500/10 text-blue-400",
  lifecycle_changed:         "bg-indigo-500/10 text-indigo-400",
  document_uploaded:         "bg-slate-500/10 text-slate-400",
  document_expired:          "bg-red-500/10 text-red-400",
  assessment_completed:      "bg-purple-500/10 text-purple-400",
  risk_identified:           "bg-orange-500/10 text-orange-400",
  risk_mitigated:            "bg-emerald-500/10 text-emerald-400",
  finding_opened:            "bg-red-500/10 text-red-400",
  finding_closed:            "bg-emerald-500/10 text-emerald-400",
  capa_completed:            "bg-emerald-500/10 text-emerald-400",
  contract_signed:           "bg-blue-500/10 text-blue-400",
  contract_expiring:         "bg-amber-500/10 text-amber-400",
  trust_score_changed:       "bg-purple-500/10 text-purple-400",
  approval_granted:          "bg-emerald-500/10 text-emerald-400",
  approval_rejected:         "bg-red-500/10 text-red-400",
  onboarding_completed:      "bg-emerald-500/10 text-emerald-400",
  renewal_completed:         "bg-emerald-500/10 text-emerald-400",
  offboarding_started:       "bg-red-500/10 text-red-400",
  monitoring_alert:          "bg-amber-500/10 text-amber-400",
};

const EVENT_SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high:     "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low:      "bg-slate-500/10 text-slate-400 border-slate-500/20",
  info:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  description?: string | null;
  severity?: string | null;
  actor_name?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, unknown> | null;
  occurred_at: string | Date;
}

const ALL_TYPES = "all";

interface Props {
  events: TimelineEvent[];
  showFilters?: boolean;
}

export function VendorTimeline({ events, showFilters = true }: Props) {
  const [filter, setFilter] = useState<string>(ALL_TYPES);

  const eventTypes = Array.from(new Set(events.map((e) => e.event_type)));

  const filtered = filter === ALL_TYPES
    ? events
    : events.filter((e) => e.event_type === filter);

  const grouped = filtered.reduce<Record<string, TimelineEvent[]>>((acc, ev) => {
    const dateKey = new Date(ev.occurred_at).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(ev);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {showFilters && eventTypes.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter(ALL_TYPES)}
            className={[
              "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
              filter === ALL_TYPES
                ? "border-[var(--color-blue)] bg-[var(--color-blue)]/10 text-[var(--color-blue)]"
                : "border-[var(--color-line)] text-[var(--color-ink-dim)] hover:bg-[#F8F9FB]",
            ].join(" ")}
          >
            All
          </button>
          {eventTypes.map((t) => {
            const label = t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                  filter === t
                    ? "border-[var(--color-blue)] bg-[var(--color-blue)]/10 text-[var(--color-blue)]"
                    : "border-[var(--color-line)] text-[var(--color-ink-dim)] hover:bg-[#F8F9FB]",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {Object.entries(grouped).length === 0 ? (
        <Card className="p-8 text-center">
          <Clock className="mx-auto mb-3 h-8 w-8 text-[var(--color-ink-faint)]" />
          <p className="text-sm text-[var(--color-ink-faint)]">No timeline events yet.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateKey, dayEvents]) => (
            <div key={dateKey}>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
                  {dateKey}
                </span>
                <div className="h-px flex-1 bg-[var(--color-line)]" />
              </div>
              <div className="space-y-2">
                {dayEvents.map((ev) => {
                  const Icon = EVENT_TYPE_ICONS[ev.event_type] ?? Clock;
                  const iconBg = EVENT_TYPE_COLORS[ev.event_type] ?? "bg-slate-500/10 text-slate-400";

                  // Extract lifecycle state info from metadata if available
                  const meta = ev.metadata ?? {};
                  const toState = meta.to_state as string | undefined;
                  const fromState = meta.from_state as string | undefined;

                  return (
                    <div key={ev.id} className="flex items-start gap-3 rounded-xl border border-[var(--color-line)] bg-white p-3.5 hover:bg-[#F8F9FB] transition-colors">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--color-ink)]">{ev.title}</span>
                          {ev.severity && (
                            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${EVENT_SEVERITY_BADGE[ev.severity] ?? EVENT_SEVERITY_BADGE.info}`}>
                              {ev.severity}
                            </span>
                          )}
                        </div>

                        {ev.description && (
                          <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">{ev.description}</p>
                        )}

                        {/* Lifecycle transition display */}
                        {fromState && toState && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <LifecycleBadge state={fromState} size="sm" />
                            <span className="text-[10px] text-[var(--color-ink-faint)]">&#8594;</span>
                            <LifecycleBadge state={toState} size="sm" />
                          </div>
                        )}

                        <p className="mt-1 text-[10px] text-[var(--color-ink-faint)]">
                          {ev.actor_name ? `${ev.actor_name} &#183; ` : ""}
                          {new Date(ev.occurred_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
