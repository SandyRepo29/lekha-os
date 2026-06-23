"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, X, FileText, CalendarClock, ShieldAlert, Sparkles,
  ChevronDown, CheckSquare2, Square, TrendingUp, TrendingDown,
  Minus, Eye, BarChart2, ExternalLink, MoreHorizontal,
  UserCheck, ClipboardCheck, AlertOctagon, Download, Archive,
  ArrowRight,
} from "lucide-react";
import type { VendorRow } from "@/lib/services/vendor-service";
import type { NLSearchFilters } from "@/lib/services/nl-search-service";
import { Badge } from "@/components/ui/badge";
import { riskTone, statusTone } from "@/lib/ui-maps";
import { scoreTextColor } from "@/lib/ui/colors";

const ALL = "all";

// ── Lifecycle config ──────────────────────────────────────────────────────────

const LIFECYCLE_COLORS: Record<string, string> = {
  discover:  "border-slate-500/30 bg-slate-500/10 text-slate-400",
  inventory: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  classify:  "border-violet-500/30 bg-violet-500/10 text-violet-400",
  assess:    "border-purple-500/30 bg-purple-500/10 text-purple-400",
  risk:      "border-orange-500/30 bg-orange-500/10 text-orange-400",
  comply:    "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  monitor:   "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  audit:     "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  renew:     "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
  offboard:  "border-red-500/30 bg-red-500/10 text-red-400",
};

const LIFECYCLE_LABELS: Record<string, string> = {
  discover: "Discover", inventory: "Inventory", classify: "Classify",
  assess: "Assess", risk: "Risk Review", comply: "Comply",
  monitor: "Monitor", audit: "Audit", renew: "Renew", offboard: "Offboard",
};

function LifecycleBadge({ stage }: { stage: string }) {
  const cls = LIFECYCLE_COLORS[stage] ?? "border-[var(--color-line)] bg-white/5 text-[var(--color-ink-faint)]";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {LIFECYCLE_LABELS[stage] ?? stage}
    </span>
  );
}

// ── Health Status ─────────────────────────────────────────────────────────────

type HealthLevel = "Excellent" | "Good" | "Monitor" | "At Risk" | "Critical";

function getHealth(v: VendorRow): { label: HealthLevel; cls: string } {
  if (v.risk === "critical" || v.score < 35)
    return { label: "Critical",  cls: "text-red-400 border-red-500/30 bg-red-500/10" };
  if (v.risk === "high" || v.score < 50 || v.expired > 1)
    return { label: "At Risk",   cls: "text-orange-400 border-orange-500/30 bg-orange-500/10" };
  if (v.score < 65 || v.expired > 0 || v.expiring > 1)
    return { label: "Monitor",   cls: "text-amber-400 border-amber-500/30 bg-amber-500/10" };
  if (v.score >= 80 && v.expired === 0 && v.risk === "low")
    return { label: "Excellent", cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" };
  return { label: "Good",      cls: "text-green-400 border-green-500/30 bg-green-500/10" };
}

// ── Trust Trend ───────────────────────────────────────────────────────────────

type TrendDir = "up" | "down" | "stable";

function getTrend(v: VendorRow): TrendDir {
  if (v.risk === "critical" || v.expired > 0) return "down";
  if (v.score >= 75 && v.expiring === 0 && (v.risk === "low" || v.risk === "medium")) return "up";
  return "stable";
}

function TrendBadge({ dir }: { dir: TrendDir }) {
  if (dir === "up")
    return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-400"><TrendingUp className="h-3 w-3" />Up</span>;
  if (dir === "down")
    return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-red-400"><TrendingDown className="h-3 w-3" />Down</span>;
  return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[var(--color-ink-faint)]"><Minus className="h-3 w-3" />Stable</span>;
}

// ── Next Action ───────────────────────────────────────────────────────────────

type ActionPriority = "high" | "medium" | "low";

function getNextAction(v: VendorRow): { label: string; href: string; priority: ActionPriority } {
  if (!v.ownerName)
    return { label: "Assign Owner",    href: `/vendors/${v.id}/edit`,      priority: "medium" };
  if (v.expired > 0)
    return { label: "Upload Evidence", href: `/vendors/${v.id}`,           priority: "high" };
  if (v.risk === "critical")
    return { label: "Review Risk",     href: `/risks/list`,                priority: "high" };
  if (v.lifecycleStage === "assess")
    return { label: "Run Assessment",  href: `/vendors/${v.id}/assessment`, priority: "medium" };
  if (v.lifecycleStage === "renew")
    return { label: "Renew Contract",  href: `/vendors/${v.id}`,            priority: "high" };
  if (v.lifecycleStage === "audit")
    return { label: "Schedule Audit",  href: `/audits/new`,                 priority: "medium" };
  if (v.expiring > 0)
    return { label: "Renew Docs",      href: `/vendors/${v.id}`,            priority: "medium" };
  return { label: "No Action",         href: `/vendors/${v.id}`,            priority: "low" };
}

const ACTION_PRIORITY_CLS: Record<ActionPriority, string> = {
  high:   "text-red-400",
  medium: "text-amber-400",
  low:    "text-[var(--color-ink-faint)]",
};

// ── Filter chip ───────────────────────────────────────────────────────────────

function FilterChip({ label, value, options, labels, onChange }: {
  label: string; value: string; options: string[]; labels?: Record<string,string>; onChange: (v: string) => void;
}) {
  const isActive = value !== ALL;
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className={`h-[38px] appearance-none rounded-xl border px-3 pr-7 text-sm cursor-pointer bg-[#0d0f1a] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/30 ${isActive ? "border-[var(--color-blue)]/60 text-[var(--color-ink)]" : "border-[var(--color-line-strong)] text-[var(--color-ink-dim)]"}`}
    >
      {options.map((o) => (
        <option key={o} value={o} style={{ background: "#0d0f1a", color: "#e8eaf2" }}>
          {o === ALL ? (labels?.all ?? `All ${label.toLowerCase()}s`) : (labels?.[o] ?? o.charAt(0).toUpperCase() + o.slice(1))}
        </option>
      ))}
    </select>
  );
}

// ── Bulk toolbar ──────────────────────────────────────────────────────────────

function BulkToolbar({ count, onClear }: { count: number; onClear: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.06] px-4 py-2.5">
      <span className="text-sm font-semibold text-[var(--color-blue)]">{count} selected</span>
      <div className="h-4 w-px bg-[var(--color-line)]" />
      <div className="flex items-center gap-1">
        <BulkAction icon={UserCheck} label="Assign Owner" onClick={() => alert(`Assign owner to ${count} vendor(s) — configure in each vendor's edit page.`)} />
        <BulkAction icon={ClipboardCheck} label="Request Assessment" onClick={() => alert(`Assessment request queued for ${count} vendor(s).`)} />
        <BulkAction icon={AlertOctagon} label="Flag Risk" onClick={() => alert(`Risk flag applied to ${count} vendor(s).`)} />
        <BulkAction icon={Download} label="Export" onClick={() => alert(`Exporting ${count} vendor(s) to CSV...`)} />
        <BulkAction icon={Archive} label="Archive" onClick={() => alert(`Archive ${count} vendor(s)? Use individual edit pages for bulk changes.`)} />
      </div>
      <div className="ml-auto">
        <button onClick={onClear} className="flex items-center gap-1 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      </div>
    </div>
  );
}

function BulkAction({ icon: Icon, label, onClick }: { icon: React.ComponentType<{className?: string}>; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-ink-dim)] hover:bg-white/[0.06] hover:text-[var(--color-ink)] transition-colors">
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  vendors: VendorRow[];
  nlFilters?: NLSearchFilters | null;
  rawNlQuery?: string;
}

// ── Main component ────────────────────────────────────────────────────────────

export function VendorFilters({ vendors, nlFilters, rawNlQuery }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query,        setQuery]        = useState(nlFilters?.query ?? searchParams.get("q") ?? "");
  const [risk,         setRisk]         = useState(nlFilters?.risk?.[0] ?? searchParams.get("risk") ?? ALL);
  const [status,       setStatus]       = useState(nlFilters?.status?.[0] ?? ALL);
  const [lifecycle,    setLifecycle]    = useState(ALL);
  const [expiringOnly, setExpiringOnly] = useState(nlFilters?.hasExpiring ?? searchParams.get("expiring") === "1");
  const [expiredOnly,  setExpiredOnly]  = useState(nlFilters?.hasExpired ?? false);
  const [minScore,     setMinScore]     = useState<number | "">(nlFilters?.minScore ?? "");
  const [ownerSearch,  setOwnerSearch]  = useState(nlFilters?.ownerSearch ?? "");
  const [categoryFilter, setCategoryFilter] = useState(nlFilters?.category ?? "");
  const [nlActive,     setNlActive]     = useState(!!nlFilters);
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [openAction,   setOpenAction]   = useState<string | null>(null);

  useEffect(() => {
    if (!nlFilters) {
      setQuery(searchParams.get("q") ?? "");
      setRisk(searchParams.get("risk") ?? ALL);
      setExpiringOnly(searchParams.get("expiring") === "1");
    }
  }, [searchParams, nlFilters]);

  const filtered = useMemo(() => {
    const q  = query.toLowerCase();
    const oq = ownerSearch.toLowerCase();
    const cq = categoryFilter.toLowerCase();
    return vendors.filter((v) => {
      if (q && !v.name.toLowerCase().includes(q) && !(v.category ?? "").toLowerCase().includes(q)) return false;
      if (cq && !(v.category ?? "").toLowerCase().includes(cq)) return false;
      if (risk !== ALL && v.risk !== risk) return false;
      if (status !== ALL && v.status !== status) return false;
      if (lifecycle !== ALL && v.lifecycleStage !== lifecycle) return false;
      if (expiringOnly && v.expiring === 0) return false;
      if (expiredOnly && v.expired === 0) return false;
      if (minScore !== "" && v.score < minScore) return false;
      if (oq && !(v.ownerName ?? "").toLowerCase().includes(oq) && !(v.ownerDepartment ?? "").toLowerCase().includes(oq)) return false;
      return true;
    });
  }, [vendors, query, risk, status, lifecycle, expiringOnly, expiredOnly, minScore, ownerSearch, categoryFilter]);

  const active = nlActive || query || risk !== ALL || status !== ALL || lifecycle !== ALL
    || expiringOnly || expiredOnly || minScore !== "" || ownerSearch || categoryFilter;

  function clearAll() {
    setQuery(""); setRisk(ALL); setStatus(ALL); setLifecycle(ALL);
    setExpiringOnly(false); setExpiredOnly(false);
    setMinScore(""); setOwnerSearch(""); setCategoryFilter("");
    setNlActive(false);
    if (rawNlQuery) router.push("/vendors");
  }

  // Bulk selection
  const allFilteredIds = filtered.map((v) => v.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selected.has(id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allFilteredIds));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <>
      {/* AI Natural Language Result Banner */}
      {nlActive && nlFilters && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.06] px-4 py-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-[var(--color-blue)]" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-[var(--color-blue)]">AI Search: </span>
            <span className="text-xs text-[var(--color-ink-dim)]">{nlFilters.summary}</span>
            {rawNlQuery && <span className="ml-2 text-xs text-[var(--color-ink-faint)]">- "{rawNlQuery}"</span>}
          </div>
          <button onClick={clearAll} className="shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-xl border border-[var(--color-line-strong)] bg-white/[0.03] px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-ink-faint)]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vendors..."
            className="flex-1 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]" />
          {query && <button onClick={() => setQuery("")} className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"><X className="h-3.5 w-3.5" /></button>}
        </div>

        <FilterChip label="Risk"      value={risk}      options={[ALL,"low","medium","high","critical"]} labels={{ all: "All risks" }}  onChange={setRisk} />
        <FilterChip label="Status"    value={status}    options={[ALL,"active","pending","inactive"]}   labels={{ all: "All status" }} onChange={setStatus} />
        <FilterChip label="Lifecycle" value={lifecycle} options={[ALL,"discover","inventory","classify","assess","risk","comply","monitor","audit","renew","offboard"]}
          labels={{ all: "All stages", risk: "Risk Review" }} onChange={setLifecycle} />

        {/* Owner filter */}
        <div className="flex h-[38px] items-center gap-2 rounded-xl border border-[var(--color-line-strong)] bg-[#0d0f1a] px-3">
          <input value={ownerSearch} onChange={(e) => setOwnerSearch(e.target.value)}
            placeholder="Owner..."
            className="w-20 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]" />
        </div>

        <button onClick={() => setExpiringOnly(!expiringOnly)}
          className={`flex h-[38px] items-center gap-1.5 rounded-xl border px-3 text-sm transition-colors ${expiringOnly ? "border-amber-500/60 bg-amber-500/10 text-amber-400" : "border-[var(--color-line-strong)] bg-[#0d0f1a] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"}`}>
          <CalendarClock className="h-3.5 w-3.5" /> Expiring
        </button>

        <button onClick={() => setExpiredOnly(!expiredOnly)}
          className={`flex h-[38px] items-center gap-1.5 rounded-xl border px-3 text-sm transition-colors ${expiredOnly ? "border-red-500/60 bg-red-500/10 text-red-400" : "border-[var(--color-line-strong)] bg-[#0d0f1a] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"}`}>
          <ShieldAlert className="h-3.5 w-3.5" /> Expired
        </button>

        {active && (
          <button onClick={clearAll} className="flex items-center gap-1 rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Results count */}
      {active && (
        <p className="text-xs text-[var(--color-ink-faint)]">
          {filtered.length} of {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} shown
        </p>
      )}

      {/* Bulk toolbar */}
      {selected.size > 0 && (
        <BulkToolbar count={selected.size} onClear={() => setSelected(new Set())} />
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white/[0.035]">
        {/* Header */}
        <div className="hidden grid-cols-[40px_minmax(0,2.5fr)_130px_110px_90px_80px_100px_minmax(0,1.2fr)_96px] items-center gap-3 border-b border-[var(--color-line)] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)] lg:grid">
          {/* Checkbox all */}
          <button onClick={toggleAll} className="grid place-items-center text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors">
            {allSelected ? <CheckSquare2 className="h-4 w-4 text-[var(--color-blue)]" /> : <Square className="h-4 w-4" />}
          </button>
          <span>Vendor</span>
          <span>Owner</span>
          <span>Stage</span>
          <span>Trust</span>
          <span>Risk</span>
          <span>Health</span>
          <span>Next Action</span>
          <span className="text-right">Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--color-ink-dim)]">
            {nlActive ? "No vendors match the AI-interpreted filters." : "No vendors match your filters."}
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {filtered.map((v) => {
              const health = getHealth(v);
              const trend = getTrend(v);
              const action = getNextAction(v);
              const isSel = selected.has(v.id);
              return (
                <div key={v.id}
                  className={`grid grid-cols-1 gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.025] lg:grid-cols-[40px_minmax(0,2.5fr)_130px_110px_90px_80px_100px_minmax(0,1.2fr)_96px] lg:items-center lg:gap-3 ${isSel ? "bg-[var(--color-blue)]/[0.04]" : ""}`}>

                  {/* Checkbox */}
                  <button onClick={() => toggleOne(v.id)} className="hidden lg:grid place-items-center text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors">
                    {isSel ? <CheckSquare2 className="h-4 w-4 text-[var(--color-blue)]" /> : <Square className="h-4 w-4" />}
                  </button>

                  {/* Vendor name */}
                  <Link href={`/vendors/${v.id}`} className="flex items-center gap-3 min-w-0">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-ink-dim)]">
                      {v.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-blue)] transition-colors">{v.name}</div>
                      <div className="truncate text-[11px] text-[var(--color-ink-faint)]">{v.category ?? "Uncategorized"}</div>
                    </div>
                  </Link>

                  {/* Owner */}
                  <div className="hidden lg:block min-w-0">
                    {v.ownerName ? (
                      <div>
                        <div className="truncate text-xs font-medium text-[var(--color-ink-dim)]">{v.ownerName}</div>
                        {v.ownerDepartment && <div className="truncate text-[11px] text-[var(--color-ink-faint)]">{v.ownerDepartment}</div>}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[var(--color-ink-faint)] italic">Unassigned</span>
                    )}
                  </div>

                  {/* Lifecycle */}
                  <div className="hidden lg:block">
                    <LifecycleBadge stage={v.lifecycleStage ?? "inventory"} />
                  </div>

                  {/* Trust score + trend */}
                  <div className="hidden lg:flex items-center gap-1.5">
                    <span className={`font-[family-name:var(--font-display)] text-sm font-bold ${scoreTextColor(v.score)}`}>{v.score}</span>
                    <TrendBadge dir={trend} />
                  </div>

                  {/* Risk */}
                  <div className="hidden lg:block">
                    <Badge tone={riskTone(v.risk)}>{v.risk}</Badge>
                  </div>

                  {/* Health */}
                  <div className="hidden lg:block">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${health.cls}`}>
                      {health.label}
                    </span>
                  </div>

                  {/* Next Action */}
                  <div className="hidden lg:block min-w-0">
                    {action.priority === "low" ? (
                      <span className="text-[11px] text-[var(--color-ink-faint)]">No Action</span>
                    ) : (
                      <Link href={action.href}
                        className={`inline-flex items-center gap-1 text-[11px] font-medium hover:underline transition-colors ${ACTION_PRIORITY_CLS[action.priority]}`}>
                        {action.label} <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>

                  {/* Quick actions */}
                  <div className="hidden lg:flex items-center justify-end gap-0.5">
                    <Link href={`/vendors/${v.id}`} title="View"
                      className="rounded-lg p-1.5 text-[var(--color-ink-faint)] hover:bg-white/[0.06] hover:text-[var(--color-ink)] transition-colors">
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                    <Link href={`/risks/list?vendorId=${v.id}`} title="Risks"
                      className="rounded-lg p-1.5 text-[var(--color-ink-faint)] hover:bg-white/[0.06] hover:text-[var(--color-ink)] transition-colors">
                      <BarChart2 className="h-3.5 w-3.5" />
                    </Link>
                    <a href={`/vendors/${v.id}/executive-report`} target="_blank" rel="noopener noreferrer" title="Executive Report"
                      className="rounded-lg p-1.5 text-[var(--color-ink-faint)] hover:bg-white/[0.06] hover:text-[var(--color-ink)] transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  {/* Mobile row summary */}
                  <div className="flex items-center justify-between lg:hidden">
                    <div className="flex items-center gap-2">
                      <Badge tone={riskTone(v.risk)}>{v.risk}</Badge>
                      <LifecycleBadge stage={v.lifecycleStage ?? "inventory"} />
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${health.cls}`}>{health.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-ink-faint)]">
                      <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{v.docs}</span>
                      {v.expiring > 0 && <span className="text-amber-400">{v.expiring} exp</span>}
                      <Link href={`/vendors/${v.id}`} className="ml-1 text-[var(--color-blue)]">View</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
