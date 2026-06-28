"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, CheckCircle2, Lightbulb, ExternalLink, BookOpen } from "lucide-react";
import { HELP_CONTENT, ModuleHelp } from "./help-content";

// Group order matches sidebar
const GROUP_ORDER = [
  "",
  "Trust Operations",
  "Vendor Governance",
  "Risk & Compliance",
  "Trust Intelligence",
  "Trust Network",
  "Administration",
];

const GROUP_LABELS: Record<string, string> = {
  "": "Platform",
  "Trust Operations": "Trust Operations",
  "Vendor Governance": "Vendor Governance",
  "Risk & Compliance": "Risk & Compliance",
  "Trust Intelligence": "Trust Intelligence",
  "Trust Network": "Trust Network",
  "Administration": "Administration",
};

function groupModules(entries: [string, ModuleHelp][]) {
  const grouped: Record<string, [string, ModuleHelp][]> = {};
  for (const g of GROUP_ORDER) grouped[g] = [];
  for (const entry of entries) {
    const g = entry[1].group;
    if (grouped[g] !== undefined) grouped[g].push(entry);
    else grouped[""] = [...(grouped[""] ?? []), entry];
  }
  return grouped;
}

export function HelpDocsClient() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);

  const allEntries = useMemo(() => Object.entries(HELP_CONTENT), []);

  const filtered = useMemo(() => {
    if (!query.trim()) return allEntries;
    const q = query.toLowerCase();
    return allEntries.filter(([route, m]) =>
      m.title.toLowerCase().includes(q) ||
      m.overview.toLowerCase().includes(q) ||
      m.features.some((f) => f.toLowerCase().includes(q)) ||
      m.tips.some((t) => t.toLowerCase().includes(q)) ||
      m.group.toLowerCase().includes(q)
    );
  }, [query, allEntries]);

  const grouped = useMemo(() => groupModules(filtered), [filtered]);

  const totalModules = allEntries.length;

  // Scroll to anchor
  function scrollTo(route: string) {
    const id = route.replace(/^\//, "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(route);
  }

  return (
    <div className="flex h-full min-h-screen">
      {/* Left sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col gap-0 border-r border-[var(--color-line)] bg-[var(--color-bg-2)]/60 md:flex sticky top-0 h-screen overflow-y-auto">
        <div className="p-3 pt-4">
          {GROUP_ORDER.map((group) => {
            const items = grouped[group];
            if (!items || items.length === 0) return null;
            return (
              <div key={group} className="mb-4">
                <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
                  {GROUP_LABELS[group]}
                </div>
                <div className="flex flex-col gap-0.5">
                  {items.map(([route, m]) => (
                    <button
                      key={route}
                      onClick={() => scrollTo(route)}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-medium transition-colors ${
                        active === route
                          ? "bg-[var(--color-blue)]/10 text-[var(--color-ink)]"
                          : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
                      }`}
                    >
                      <span className="truncate">{m.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Hero */}
        <div className="mb-8 rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl grad-brand shadow-[0_4px_14px_-4px_rgba(99,102,241,.8)]">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
                AUDT Documentation
              </h1>
              <p className="text-sm text-[var(--color-ink-faint)]">
                Governance Built on Proof · {totalModules} modules
              </p>
            </div>
          </div>
          <p className="text-sm text-[var(--color-ink-dim)] max-w-2xl">
            AUDT is the AI-Native Trust, Risk &amp; Compliance Platform — the Governance OS for modern organisations.
            Use this reference to understand each module, its features, and power-user tips.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2.5 focus-within:border-[var(--color-blue)]/60 transition-colors">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-ink-faint)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules, features, or tips…"
            className="flex-1 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
          />
          {query && (
            <span className="text-xs text-[var(--color-ink-faint)]">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-[var(--color-ink-dim)]">
            <Search className="mx-auto mb-3 h-8 w-8 opacity-30" />
            <p className="text-sm">No modules match &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {/* Module groups */}
        <div className="space-y-10">
          {GROUP_ORDER.map((group) => {
            const items = grouped[group];
            if (!items || items.length === 0) return null;
            return (
              <section key={group}>
                {group && (
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
                      {GROUP_LABELS[group]}
                    </span>
                    <div className="flex-1 border-t border-[var(--color-line)]" />
                  </div>
                )}
                <div className="space-y-4">
                  {items.map(([route, m]) => {
                    const anchorId = route.replace(/^\//, "");
                    return (
                      <article
                        key={route}
                        id={anchorId}
                        className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5 scroll-mt-6"
                      >
                        {/* Module header */}
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)] truncate">
                              {m.title}
                            </h2>
                            {m.group && (
                              <span className="shrink-0 rounded-full bg-[var(--color-blue)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-blue)]">
                                {m.group}
                              </span>
                            )}
                          </div>
                          <Link
                            href={route}
                            className="shrink-0 flex items-center gap-1 rounded-lg border border-[var(--color-line)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-ink-dim)] transition-colors hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open
                          </Link>
                        </div>

                        {/* Overview */}
                        <p className="mb-4 text-sm text-[var(--color-ink-dim)] leading-relaxed">
                          {m.overview}
                        </p>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {/* Features */}
                          <div>
                            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
                              Features
                            </h3>
                            <ul className="space-y-1.5">
                              {m.features.map((feat, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-blue)]" />
                                  <span className="text-[12px] leading-snug text-[var(--color-ink-dim)]">
                                    {feat}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Tips */}
                          <div>
                            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
                              Tips
                            </h3>
                            <ul className="space-y-2">
                              {m.tips.map((tip, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 rounded-lg border border-[var(--color-line)] bg-white/[0.02] px-3 py-2"
                                >
                                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                                  <span className="text-[12px] leading-snug text-[var(--color-ink-dim)]">
                                    {tip}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
