"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, X, CalendarClock, ShieldAlert, Sparkles,
} from "lucide-react";
import type { VendorRow } from "@/backend/src/modules/vendor-hub/vendor-service";
import type { NLSearchFilters } from "@/backend/src/modules/vendor-hub/nl-search-service";
import { VendorListTable } from "@/components/vendors/vendor-list-table";

const ALL = "all";

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

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  vendors: VendorRow[];
  nlFilters?: NLSearchFilters | null;
  rawNlQuery?: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

// ── Main component ────────────────────────────────────────────────────────────

export function VendorFilters({ vendors, nlFilters, rawNlQuery, canEdit = false, canDelete = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query,          setQuery]          = useState(nlFilters?.query ?? searchParams.get("q") ?? "");
  const [risk,           setRisk]           = useState(nlFilters?.risk?.[0] ?? searchParams.get("risk") ?? ALL);
  const [status,         setStatus]         = useState(nlFilters?.status?.[0] ?? ALL);
  const [lifecycle,      setLifecycle]      = useState(ALL);
  const [expiringOnly,   setExpiringOnly]   = useState(nlFilters?.hasExpiring ?? searchParams.get("expiring") === "1");
  const [expiredOnly,    setExpiredOnly]    = useState(nlFilters?.hasExpired ?? false);
  const [minScore,       setMinScore]       = useState<number | "">(nlFilters?.minScore ?? "");
  const [ownerSearch,    setOwnerSearch]    = useState(nlFilters?.ownerSearch ?? "");
  const [categoryFilter, setCategoryFilter] = useState(nlFilters?.category ?? "");
  const [nlActive,       setNlActive]       = useState(!!nlFilters);
  const [sortBy,         setSortBy]         = useState<string>("name");
  const [sortOrder,      setSortOrder]      = useState<"asc" | "desc">("asc");

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
    const base = vendors.filter((v) => {
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
    const RISK_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
    return [...base].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name")        cmp = a.name.localeCompare(b.name);
      else if (sortBy === "score")  cmp = a.score - b.score;
      else if (sortBy === "risk")   cmp = (RISK_ORDER[a.risk] ?? 0) - (RISK_ORDER[b.risk] ?? 0);
      else if (sortBy === "status") cmp = (a.status ?? "").localeCompare(b.status ?? "");
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [vendors, query, risk, status, lifecycle, expiringOnly, expiredOnly, minScore, ownerSearch, categoryFilter, sortBy, sortOrder]);

  const active = nlActive || query || risk !== ALL || status !== ALL || lifecycle !== ALL
    || expiringOnly || expiredOnly || minScore !== "" || ownerSearch || categoryFilter;

  function clearAll() {
    setQuery(""); setRisk(ALL); setStatus(ALL); setLifecycle(ALL);
    setExpiringOnly(false); setExpiredOnly(false);
    setMinScore(""); setOwnerSearch(""); setCategoryFilter("");
    setNlActive(false);
    if (rawNlQuery) router.push("/vendors");
  }

  return (
    <>
      {nlActive && nlFilters && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.06] px-4 py-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-[var(--color-blue)]" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-[var(--color-blue)]">AI Search: </span>
            <span className="text-xs text-[var(--color-ink-dim)]">{nlFilters.summary}</span>
            {rawNlQuery && <span className="ml-2 text-xs text-[var(--color-ink-faint)]">- "{rawNlQuery}"</span>}
          </div>
          <button onClick={clearAll} aria-label="Clear AI search" className="shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-xl border border-[var(--color-line-strong)] bg-white px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-ink-faint)]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vendors..."
            className="flex-1 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]" />
          {query && <button onClick={() => setQuery("")} aria-label="Clear search" className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"><X className="h-3.5 w-3.5" /></button>}
        </div>

        <FilterChip label="Risk"      value={risk}      options={[ALL,"low","medium","high","critical"]} labels={{ all: "All risks" }}  onChange={setRisk} />
        <FilterChip label="Status"    value={status}    options={[ALL,"active","pending","inactive"]}   labels={{ all: "All status" }} onChange={setStatus} />
        <FilterChip label="Lifecycle" value={lifecycle} options={[ALL,"discover","inventory","classify","assess","risk","comply","monitor","audit","renew","offboard"]}
          labels={{ all: "All stages", risk: "Risk Review" }} onChange={setLifecycle} />

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
          <button onClick={clearAll} className="flex items-center gap-1 rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {active && (
        <p className="text-xs text-[var(--color-ink-faint)]">
          {filtered.length} of {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} shown
        </p>
      )}

      <VendorListTable
        vendors={filtered}
        canEdit={canEdit}
        canDelete={canDelete}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={(col, order) => { setSortBy(col); setSortOrder(order); }}
        emptyMessage={nlActive ? "No vendors match the AI-interpreted filters." : "No vendors match your filters."}
      />
    </>
  );
}
