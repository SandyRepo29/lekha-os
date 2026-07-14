"use client";

import { useState, useEffect, useCallback, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  Clock,
  Bookmark,
  Filter,
  Building2,
  Shield,
  FileText,
  AlertTriangle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  searchAction,
  getSuggestionsAction,
  saveSearchAction,
  getRecentSearchesAction,
} from "@/backend/src/modules/platform/search-actions";

type EntityType =
  | "all"
  | "vendor"
  | "risk"
  | "control"
  | "audit"
  | "contract"
  | "policy"
  | "issue"
  | "ai_system";

interface SearchResult {
  id: string;
  entity_type: string;
  display_name: string;
  secondary_text?: string;
  url?: string;
}

interface SavedSearch {
  id: string;
  query: string;
  created_at?: string;
}

const ENTITY_FILTERS: { label: string; value: EntityType }[] = [
  { label: "All", value: "all" },
  { label: "Vendors", value: "vendor" },
  { label: "Risks", value: "risk" },
  { label: "Controls", value: "control" },
  { label: "Audits", value: "audit" },
  { label: "Contracts", value: "contract" },
  { label: "Policies", value: "policy" },
  { label: "Issues", value: "issue" },
  { label: "AI Systems", value: "ai_system" },
];

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  vendor: <Building2 size={16} />,
  risk: <AlertTriangle size={16} />,
  control: <Shield size={16} />,
  audit: <FileText size={16} />,
  contract: <FileText size={16} />,
  policy: <FileText size={16} />,
  issue: <AlertTriangle size={16} />,
  ai_system: <Shield size={16} />,
};

const ENTITY_BADGE_COLORS: Record<string, string> = {
  vendor: "bg-blue-500/20 text-blue-300",
  risk: "bg-red-500/20 text-red-300",
  control: "bg-green-500/20 text-green-300",
  audit: "bg-purple-500/20 text-purple-300",
  contract: "bg-yellow-500/20 text-yellow-300",
  policy: "bg-indigo-500/20 text-indigo-300",
  issue: "bg-orange-500/20 text-orange-300",
  ai_system: "bg-cyan-500/20 text-cyan-300",
};

function groupResultsByType(results: SearchResult[]): Record<string, SearchResult[]> {
  return results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    const type = result.entity_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(result);
    return acc;
  }, {});
}

function GlobalSearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<EntityType>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isPending, startTransition] = useTransition();
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [savingSearch, setSavingSearch] = useState(false);

  useEffect(() => {
    getRecentSearchesAction().then((data) => {
      if (data?.searches) {
        setRecentSearches((data.searches as any[]).map((s: any) => s.query ?? s));
      }
    });
  }, []);

  const runSearch = useCallback(
    (q: string, filter: EntityType) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      startTransition(async () => {
        const entityTypes = filter === "all" ? undefined : [filter];
        const data = await searchAction(q, entityTypes);
        setResults(data?.results ?? []);
      });
    },
    []
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      router.push(`/search?q=${encodeURIComponent(value)}`, { scroll: false });
      runSearch(value, activeFilter);
    }, 300);
    setDebounceTimer(timer);
  };

  const handleFilterChange = (filter: EntityType) => {
    setActiveFilter(filter);
    runSearch(query, filter);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    router.push("/search", { scroll: false });
  };

  const handleSaveSearch = async () => {
    if (!query.trim()) return;
    setSavingSearch(true);
    await saveSearchAction(query, query);
    setSavingSearch(false);
  };

  const handleRecentClick = (q: string) => {
    setQuery(q);
    router.push(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
    runSearch(q, activeFilter);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.url) router.push(result.url);
  };

  const grouped = groupResultsByType(results);
  const hasQuery = query.trim().length > 0;

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: "var(--color-bg)" }}>
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Search bar */}
        <div className="relative flex items-center gap-3">
          <div
            className="flex flex-1 items-center gap-3 rounded-2xl border px-4 py-3"
            style={{
              borderColor: "var(--color-line)",
              background: "#F8F9FB",
            }}
          >
            <Search size={20} style={{ color: "var(--color-ink-dim)" }} className="shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search across all modules..."
              className="flex-1 bg-transparent text-base outline-none"
              style={{ color: "var(--color-ink)" }}
            />
            {isPending && (
              <Loader2 size={18} className="animate-spin shrink-0" style={{ color: "var(--color-ink-dim)" }} />
            )}
            {hasQuery && !isPending && (
              <button onClick={handleClear} className="shrink-0 rounded-lg p-1 hover:bg-white/10" aria-label="Clear">
                <X size={16} style={{ color: "var(--color-ink-dim)" }} />
              </button>
            )}
          </div>
          {hasQuery && (
            <button
              onClick={handleSaveSearch}
              disabled={savingSearch}
              className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition hover:bg-[#F8F9FB]"
              style={{ borderColor: "var(--color-line)", color: "var(--color-ink-dim)" }}
            >
              <Bookmark size={15} />
              {savingSearch ? "Saving&#8230;" : "Save"}
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {ENTITY_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition"
              style={
                activeFilter === f.value
                  ? { background: "#EEF2F7", color: "var(--color-ink)" }
                  : { color: "var(--color-ink-dim)" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* No query: recent + saved */}
        {!hasQuery && (
          <div className="space-y-6">
            {recentSearches.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-ink-dim)" }}>
                  <Clock size={14} />
                  Recent Searches
                </div>
                <ul className="space-y-1">
                  {recentSearches.map((q, i) => (
                    <li key={i}>
                      <button
                        onClick={() => handleRecentClick(q)}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition hover:bg-[#F8F9FB]"
                        style={{ color: "var(--color-ink)" }}
                      >
                        <Clock size={14} style={{ color: "var(--color-ink-dim)" }} />
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {savedSearches.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-ink-dim)" }}>
                  <Bookmark size={14} />
                  Saved Searches
                </div>
                <ul className="space-y-1">
                  {savedSearches.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => handleRecentClick(s.query)}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition hover:bg-[#F8F9FB]"
                        style={{ color: "var(--color-ink)" }}
                      >
                        <Bookmark size={14} style={{ color: "var(--color-ink-dim)" }} />
                        {s.query}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {recentSearches.length === 0 && savedSearches.length === 0 && (
              <div className="py-12 text-center" style={{ color: "var(--color-ink-dim)" }}>
                <Search size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Type to search across vendors, risks, controls, audits, and more.</p>
              </div>
            )}
          </div>
        )}

        {/* Query results */}
        {hasQuery && !isPending && results.length === 0 && (
          <div className="py-12 text-center" style={{ color: "var(--color-ink-dim)" }}>
            <Search size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>No results for &#8220;{query}&#8221;</p>
            <p className="mt-1 text-sm">Try a different keyword or adjust the filter.</p>
          </div>
        )}

        {hasQuery && results.length > 0 && (
          <div className="space-y-6">
            {Object.entries(grouped).map(([type, items]) => (
              <section key={type} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-ink-dim)" }}>
                  <Filter size={12} />
                  {type.replace("_", " ")}
                  <span className="ml-1 rounded-full px-2 py-0.5 text-xs" style={{ background: "#F0F4F8" }}>
                    {items.length}
                  </span>
                </div>
                <ul
                  className="overflow-hidden rounded-2xl border"
                  style={{ borderColor: "var(--color-line)", background: "#FFFFFF" }}
                >
                  {items.map((result, idx) => (
                    <li key={result.id}>
                      <button
                        onClick={() => handleResultClick(result)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#F8F9FB]"
                        style={{
                          borderTop: idx > 0 ? "1px solid var(--color-line)" : undefined,
                        }}
                      >
                        <span className="shrink-0" style={{ color: "var(--color-ink-dim)" }}>
                          {ENTITY_ICONS[result.entity_type] ?? <FileText size={16} />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block truncate text-sm font-medium" style={{ color: "var(--color-ink)" }}>
                            {result.display_name}
                          </span>
                          {result.secondary_text && (
                            <span className="block truncate text-xs" style={{ color: "var(--color-ink-dim)" }}>
                              {result.secondary_text}
                            </span>
                          )}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ENTITY_BADGE_COLORS[result.entity_type] ?? "bg-white/10 text-white/60"}`}
                        >
                          {result.entity_type.replace("_", " ")}
                        </span>
                        <ChevronRight size={14} className="shrink-0 opacity-40" style={{ color: "var(--color-ink-dim)" }} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GlobalSearch() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-bg)" }}>
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-ink-dim)" }} />
        </div>
      }
    >
      <GlobalSearchInner />
    </Suspense>
  );
}
