"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, X, FileText, CalendarClock, ShieldAlert } from "lucide-react";
import type { VendorRow } from "@/lib/services/vendor-service";
import { Badge } from "@/components/ui/badge";
import { riskTone, statusTone } from "@/lib/ui-maps";

const ALL = "all";

export function VendorFilters({ vendors }: { vendors: VendorRow[] }) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [risk, setRisk] = useState(searchParams.get("risk") ?? ALL);
  const [status, setStatus] = useState(ALL);
  const [expiringOnly, setExpiringOnly] = useState(searchParams.get("expiring") === "1");

  // Sync with URL changes (e.g. topbar search or dashboard card link)
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setRisk(searchParams.get("risk") ?? ALL);
    setExpiringOnly(searchParams.get("expiring") === "1");
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return vendors.filter((v) => {
      if (q && !v.name.toLowerCase().includes(q) && !(v.category ?? "").toLowerCase().includes(q)) return false;
      if (risk !== ALL && v.risk !== risk) return false;
      if (status !== ALL && v.status !== status) return false;
      if (expiringOnly && v.expiring === 0) return false;
      return true;
    });
  }, [vendors, query, risk, status, expiringOnly]);

  const active = query || risk !== ALL || status !== ALL || expiringOnly;

  function clear() { setQuery(""); setRisk(ALL); setStatus(ALL); setExpiringOnly(false); }

  return (
    <>
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

        <FilterChip label="Risk" value={risk} options={[ALL, "low", "medium", "high", "critical"]} labels={{ all: "All risks" }} onChange={setRisk} />
        <FilterChip label="Status" value={status} options={[ALL, "active", "pending", "inactive"]} labels={{ all: "All status" }} onChange={setStatus} />
        <button
          onClick={() => setExpiringOnly(!expiringOnly)}
          className={`h-[38px] rounded-xl border px-3 text-sm transition-colors ${expiringOnly ? "border-amber-500/60 bg-amber-500/10 text-amber-400" : "border-[var(--color-line-strong)] bg-[#0d0f1a] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"}`}
        >
          ⏰ Expiring
        </button>

        {active && (
          <button onClick={clear} className="flex items-center gap-1 rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
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
            No vendors match your filters.
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
                    <div className="text-xs text-[var(--color-ink-faint)]">{v.category ?? "—"}</div>
                  </div>
                </div>
                <div><Badge tone={statusTone(v.status)}>{v.status}</Badge></div>
                <div><Badge tone={riskTone(v.risk)}>{v.risk}</Badge></div>
                <div className="flex items-center gap-3 text-sm text-[var(--color-ink-dim)]">
                  <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />{v.docs}</span>
                  {v.expiring > 0 && <span className="flex items-center gap-1 text-amber-400"><CalendarClock className="h-3.5 w-3.5" />{v.expiring}</span>}
                  {(v.risk === "high" || v.risk === "critical") && v.docs === 0 && <span className="text-red-400"><ShieldAlert className="h-3.5 w-3.5" /></span>}
                </div>
                <div className="flex items-center justify-end gap-3">
                  <div className="hidden flex-1 md:block">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${v.score}%`, background: scoreBarColor(v.score) }} />
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
  label: string; value: string; options: string[];
  labels?: Record<string, string>; onChange: (v: string) => void;
}) {
  const isActive = value !== ALL;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
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

function scoreBarColor(score: number) {
  if (score >= 80) return "linear-gradient(90deg, #10b981, #34d058)";
  if (score >= 60) return "linear-gradient(90deg, #6366f1, #8b5cf6)";
  if (score >= 40) return "linear-gradient(90deg, #f59e0b, #fbbf24)";
  return "linear-gradient(90deg, #ef4444, #f87171)";
}
function scoreTextColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-[var(--color-blue)]";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}
