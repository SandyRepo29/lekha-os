"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, X, FileText, CalendarClock, ShieldAlert, Sparkles } from "lucide-react";
import type { VendorRow } from "@/lib/services/vendor-service";
import type { NLSearchFilters } from "@/lib/services/nl-search-service";
import { Badge } from "@/components/ui/badge";
import { riskTone, statusTone } from "@/lib/ui-maps";
import { scoreBarGradient, scoreTextColor } from "@/lib/ui/colors";

const ALL = "all";

interface Props {
  vendors: VendorRow[];
  nlFilters?: NLSearchFilters | null;
  rawNlQuery?: string;
}

export function VendorFilters({ vendors, nlFilters, rawNlQuery }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialise from URL params or NL-parsed filters
  const [query,       setQuery]       = useState(nlFilters?.query ?? searchParams.get("q") ?? "");
  const [risk,        setRisk]        = useState(nlFilters?.risk?.[0] ?? searchParams.get("risk") ?? ALL);
  const [status,      setStatus]      = useState(nlFilters?.status?.[0] ?? ALL);
  const [expiringOnly,setExpiringOnly]= useState(nlFilters?.hasExpiring ?? searchParams.get("expiring") === "1");
  const [expiredOnly, setExpiredOnly] = useState(nlFilters?.hasExpired ?? false);
  const [minScore,    setMinScore]    = useState<number | "">(nlFilters?.minScore ?? "");
  const [maxScore,    setMaxScore]    = useState<number | "">(nlFilters?.maxScore ?? "");
  const [ownerSearch, setOwnerSearch] = useState(nlFilters?.ownerSearch ?? "");
  const [categoryFilter, setCategoryFilter] = useState(nlFilters?.category ?? "");
  const [nlActive,    setNlActive]    = useState(!!nlFilters);

  // Re-sync when URL search params change (dashboard card links)
  useEffect(() => {
    if (!nlFilters) {
      setQuery(searchParams.get("q") ?? "");
      setRisk(searchParams.get("risk") ?? ALL);
      setExpiringOnly(searchParams.get("expiring") === "1");
    }
  }, [searchParams, nlFilters]);

  // Apply filtering
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const catQ = categoryFilter.toLowerCase();
    const ownerQ = ownerSearch.toLowerCase();
    return vendors.filter((v) => {
      if (q && !v.name.toLowerCase().includes(q) && !(v.category ?? "").toLowerCase().includes(q)) return false;
      if (catQ && !(v.category ?? "").toLowerCase().includes(catQ)) return false;
      if (risk !== ALL && v.risk !== risk) return false;
      if (status !== ALL && v.status !== status) return false;
      if (expiringOnly && v.expiring === 0) return false;
      if (expiredOnly && (v as any).expired === 0) return false;
      if (minScore !== "" && v.score < minScore) return false;
      if (maxScore !== "" && v.score > maxScore) return false;
      if (ownerQ && !(v.ownerName ?? "").toLowerCase().includes(ownerQ) && !(v.ownerDepartment ?? "").toLowerCase().includes(ownerQ)) return false;
      return true;
    });
  }, [vendors, query, risk, status, expiringOnly, expiredOnly, minScore, maxScore, ownerSearch, categoryFilter]);

  const active = nlActive || query || risk !== ALL || status !== ALL || expiringOnly || expiredOnly || minScore !== "" || maxScore !== "" || ownerSearch || categoryFilter;

  function clearAll() {
    setQuery(""); setRisk(ALL); setStatus(ALL);
    setExpiringOnly(false); setExpiredOnly(false);
    setMinScore(""); setMaxScore(""); setOwnerSearch(""); setCategoryFilter("");
    setNlActive(false);
    // Clear NL param from URL
    if (rawNlQuery) router.push("/vendors");
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
            {rawNlQuery && (
              <span className="ml-2 text-xs text-[var(--color-ink-faint)]">· "{rawNlQuery}"</span>
            )}
          </div>
          <button onClick={clearAll} className="shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-xl border border-[var(--color-line-strong)] bg-white/[0.03] px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-ink-faint)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or category…"
            className="flex-1 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
          />
          {query && <button onClick={() => setQuery("")} className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"><X className="h-3.5 w-3.5" /></button>}
        </div>

        <FilterChip label="Risk"   value={risk}   options={[ALL,"low","medium","high","critical"]} labels={{ all: "All risks" }}   onChange={setRisk} />
        <FilterChip label="Status" value={status} options={[ALL,"active","pending","inactive"]}   labels={{ all: "All status" }} onChange={setStatus} />

        <button
          onClick={() => setExpiringOnly(!expiringOnly)}
          className={`flex h-[38px] items-center gap-1.5 rounded-xl border px-3 text-sm transition-colors ${expiringOnly ? "border-amber-500/60 bg-amber-500/10 text-amber-400" : "border-[var(--color-line-strong)] bg-[#0d0f1a] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"}`}
        >
          <CalendarClock className="h-3.5 w-3.5" /> Expiring
        </button>

        <button
          onClick={() => setExpiredOnly(!expiredOnly)}
          className={`flex h-[38px] items-center gap-1.5 rounded-xl border px-3 text-sm transition-colors ${expiredOnly ? "border-red-500/60 bg-red-500/10 text-red-400" : "border-[var(--color-line-strong)] bg-[#0d0f1a] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"}`}
        >
          <ShieldAlert className="h-3.5 w-3.5" /> Expired
        </button>

        {active && (
          <button onClick={clearAll} className="flex items-center gap-1 rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Results count when filtering */}
      {active && (
        <p className="text-xs text-[var(--color-ink-faint)]">
          {filtered.length} of {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} shown
        </p>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white/[0.035]">
        <div className="hidden grid-cols-[minmax(0,2fr)_100px_100px_120px_140px] items-center gap-4 border-b border-[var(--color-line)] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)] md:grid">
          <span>Vendor</span><span>Status</span><span>Risk</span><span>Documents</span><span className="text-right">Compliance</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--color-ink-dim)]">
            {nlActive ? "No vendors match the AI-interpreted filters. Try refining your search." : "No vendors match your filters."}
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {filtered.map((v) => (
              <Link key={v.id} href={`/vendors/${v.id}`}
                className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-white/[0.025] md:grid-cols-[minmax(0,2fr)_100px_100px_120px_140px] md:items-center md:gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-ink-dim)]">
                    {v.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--color-ink)]">{v.name}</div>
                    <div className="text-xs text-[var(--color-ink-faint)]">
                      {v.category ?? "—"}
                      {v.ownerName && <span className="ml-2 text-[var(--color-ink-faint)]/70">· {v.ownerName}</span>}
                    </div>
                  </div>
                </div>
                <div><Badge tone={statusTone(v.status)}>{v.status}</Badge></div>
                <div><Badge tone={riskTone(v.risk)}>{v.risk}</Badge></div>
                <div className="flex items-center gap-3 text-sm text-[var(--color-ink-dim)]">
                  <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />{v.docs}</span>
                  {v.expiring > 0 && <span className="flex items-center gap-1 text-amber-400"><CalendarClock className="h-3.5 w-3.5" />{v.expiring}</span>}
                  {(v as any).expired > 0 && <span className="flex items-center gap-1 text-red-400"><ShieldAlert className="h-3.5 w-3.5" />{(v as any).expired}</span>}
                </div>
                <div className="flex items-center justify-end gap-3">
                  <div className="hidden flex-1 md:block">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${v.score}%`, background: scoreBarGradient(v.score) }} />
                    </div>
                  </div>
                  <span className={`w-8 shrink-0 text-right font-[family-name:var(--font-display)] text-sm font-bold ${scoreTextColor(v.score)}`}>{v.score}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

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
          {o === ALL ? (labels?.all ?? `All ${label.toLowerCase()}s`) : o.charAt(0).toUpperCase() + o.slice(1)}
        </option>
      ))}
    </select>
  );
}

