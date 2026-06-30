"use client";

import { useState } from "react";
import {
  Activity, Filter, Calendar, User, Building2, Shield, FileText,
  AlertTriangle, CheckCircle2, Clock, ChevronRight, Search,
  Plus, Edit, RefreshCw, MessageSquare, Check, Trash2, Link, Eye,
  Upload, Download, XCircle,
} from "lucide-react";

export type ActivityRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  event_type: string;
  actor_name: string | null;
  title: string;
  description: string | null;
  severity: string;
  metadata: Record<string, unknown>;
  created_at: Date | string;
};

interface Props {
  activities: ActivityRow[];
  showFilters?: boolean;
  entityType?: string;
  title?: string;
}

const ENTITY_FILTERS = ["All", "Vendors", "Risks", "Audits", "Contracts", "Controls", "Issues"];

const ENTITY_FILTER_MAP: Record<string, string> = {
  Vendors: "vendor",
  Risks: "risk",
  Audits: "audit",
  Contracts: "contract",
  Controls: "control",
  Issues: "issue",
};

function getEventIcon(eventType: string) {
  const t = eventType.toLowerCase();
  if (t.includes("creat") || t.includes("add")) return Plus;
  if (t.includes("updat") || t.includes("edit")) return Edit;
  if (t.includes("status") || t.includes("transit")) return RefreshCw;
  if (t.includes("comment")) return MessageSquare;
  if (t.includes("approv")) return Check;
  if (t.includes("delet") || t.includes("remov")) return Trash2;
  if (t.includes("link") || t.includes("map")) return Link;
  if (t.includes("view")) return Eye;
  if (t.includes("upload")) return Upload;
  if (t.includes("export") || t.includes("download")) return Download;
  if (t.includes("reject") || t.includes("deny")) return XCircle;
  if (t.includes("complet") || t.includes("resolv") || t.includes("clos")) return CheckCircle2;
  if (t.includes("alert") || t.includes("warn")) return AlertTriangle;
  return Activity;
}

function getEntityIcon(entityType: string) {
  const t = entityType.toLowerCase();
  if (t === "vendor") return Building2;
  if (t === "risk" || t === "control") return Shield;
  if (t === "audit" || t === "finding" || t === "capa") return FileText;
  if (t === "contract") return FileText;
  if (t === "issue") return AlertTriangle;
  if (t === "user" || t === "profile") return User;
  return Activity;
}

const SEVERITY_DOT: Record<string, string> = {
  info: "bg-blue-400",
  success: "bg-emerald-400",
  warn: "bg-amber-400",
  warning: "bg-amber-400",
  error: "bg-red-400",
  critical: "bg-red-500",
};

const SEVERITY_ICON_BG: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-400",
  success: "bg-emerald-500/10 text-emerald-400",
  warn: "bg-amber-500/10 text-amber-400",
  warning: "bg-amber-500/10 text-amber-400",
  error: "bg-red-500/10 text-red-400",
  critical: "bg-red-500/10 text-red-400",
};

function formatTimestamp(dt: Date | string): string {
  const d = dt instanceof Date ? dt : new Date(dt);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function groupKey(dt: Date | string): string {
  const d = dt instanceof Date ? dt : new Date(dt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (itemDay.getTime() === today.getTime()) return "Today";
  if (itemDay.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

function groupActivities(rows: ActivityRow[]): { label: string; items: ActivityRow[] }[] {
  const map: Map<string, ActivityRow[]> = new Map();
  for (const row of rows) {
    const key = groupKey(row.created_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

function EntityBadge({ entityType }: { entityType: string }) {
  const Icon = getEntityIcon(entityType);
  const label = entityType.charAt(0).toUpperCase() + entityType.slice(1);
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium border border-[var(--color-line)] bg-[#F8F9FB] text-[var(--color-ink-dim)]">
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

function ActivityItem({ row }: { row: ActivityRow }) {
  const Icon = getEventIcon(row.event_type);
  const sev = row.severity || "info";
  const iconBg = SEVERITY_ICON_BG[sev] ?? SEVERITY_ICON_BG.info;
  const dot = SEVERITY_DOT[sev] ?? SEVERITY_DOT.info;

  return (
    <div className="flex gap-3 py-3 group">
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="mt-1 w-px flex-1 bg-[var(--color-line)] group-last:hidden" />
      </div>
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
            <p className="text-sm font-medium text-[var(--color-ink)] leading-snug">{row.title}</p>
          </div>
          <span className="shrink-0 text-xs text-[var(--color-ink-dim)] flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            {formatTimestamp(row.created_at)}
          </span>
        </div>
        {row.description && (
          <p className="mt-0.5 text-xs text-[var(--color-ink-dim)] leading-relaxed line-clamp-2">
            {row.description}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <EntityBadge entityType={row.entity_type} />
          {row.entity_name && (
            <span className="text-xs text-[var(--color-ink-dim)] flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              {row.entity_name}
            </span>
          )}
          {row.actor_name && (
            <span className="text-xs text-[var(--color-ink-dim)] flex items-center gap-1 ml-auto">
              <User className="h-3 w-3" />
              {row.actor_name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActivityFeed({ activities, showFilters = false, entityType, title }: Props) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const PAGE_SIZE = 20;

  let filtered = activities;

  if (entityType) {
    filtered = filtered.filter((a) => a.entity_type === entityType);
  } else if (showFilters && activeFilter !== "All") {
    const mapped = ENTITY_FILTER_MAP[activeFilter];
    if (mapped) filtered = filtered.filter((a) => a.entity_type === mapped);
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.actor_name ?? "").toLowerCase().includes(q) ||
        (a.entity_name ?? "").toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q)
    );
  }

  const visible = showAll ? filtered : filtered.slice(0, PAGE_SIZE);
  const groups = groupActivities(visible);
  const hasMore = filtered.length > PAGE_SIZE && !showAll;

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--color-ink-dim)]" />
          {title ?? "Activity Feed"}
        </h3>
        {showFilters && (
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-ink-dim)]">
            <Filter className="h-3.5 w-3.5" />
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {showFilters && !entityType && (
        <>
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-ink-dim)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] py-2 pl-8 pr-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:border-[var(--color-blue)] transition-colors"
            />
          </div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {ENTITY_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`rounded-xl px-3 py-1 text-xs font-medium transition-colors ${
                  activeFilter === f
                    ? "bg-[#EEF2F7] text-[var(--color-ink)]"
                    : "text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8F9FB]">
            <Calendar className="h-6 w-6 text-[var(--color-ink-dim)]" />
          </div>
          <p className="text-sm font-medium text-[var(--color-ink)]">No activity yet</p>
          <p className="mt-1 text-xs text-[var(--color-ink-dim)]">
            {search ? "No events match your search." : "Activity will appear here as governance events occur."}
          </p>
        </div>
      ) : (
        <div>
          {groups.map((group) => (
            <div key={group.label} className="mb-2">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-dim)]">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-[var(--color-line)]" />
                <span className="text-[10px] text-[var(--color-ink-dim)]">{group.items.length}</span>
              </div>
              <div>
                {group.items.map((row) => (
                  <ActivityItem key={row.id} row={row} />
                ))}
              </div>
            </div>
          ))}
          {hasMore && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-2 w-full rounded-xl border border-[var(--color-line)] bg-white py-2 text-xs font-medium text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)] transition-colors flex items-center justify-center gap-1.5"
            >
              Show {filtered.length - PAGE_SIZE} more events
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
