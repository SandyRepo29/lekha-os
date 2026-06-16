"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Sparkles, CircleHelp } from "lucide-react";
import { useState } from "react";
import { HelpPanel } from "@/components/help/help-panel";

const NL_TRIGGERS = ["with","without","missing","expired","expiring","risk","score",
  "below","above","less than","more than","show","find","vendors","who","high risk",
  "low risk","critical","pending","inactive","insurance","certificate","dpa","iso",
  "soc","owner","department","payment","saas","cloud","staffing","it services"];

function isNL(q: string) {
  if (q.length < 15) return false;
  const lower = q.toLowerCase();
  return NL_TRIGGERS.some((t) => lower.includes(t));
}

export function Topbar({ email, orgName, fullName }: {
  email: string; orgName: string; fullName?: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const display = fullName || email;
  const initial = (display?.[0] ?? "?").toUpperCase();
  const looksNL = isNL(query);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query.trim()) {
      const q = query.trim();
      // Route NL queries to ?nlq= param, simple text to ?q=
      if (isNL(q)) {
        router.push(`/vendors?nlq=${encodeURIComponent(q)}`);
      } else {
        router.push(`/vendors?q=${encodeURIComponent(q)}`);
      }
      setQuery("");
    }
    if (e.key === "Escape") setQuery("");
  }

  return (
    <>
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-[var(--color-line)] bg-[var(--color-bg)]/80 px-5 backdrop-blur-md">
      <div className={`flex flex-1 max-w-sm items-center gap-2 rounded-full border bg-white/[0.03] px-3 py-1.5 text-sm transition-colors focus-within:border-[var(--color-blue)]/60 ${looksNL ? "border-[var(--color-blue)]/40" : "border-[var(--color-line)]"}`}>
        {looksNL
          ? <Sparkles className="h-4 w-4 shrink-0 text-[var(--color-blue)] animate-pulse" />
          : <Search className="h-4 w-4 shrink-0 text-[var(--color-ink-faint)]" />}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search vendors or ask in plain English…"
          className="flex-1 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
        />
        {query && (
          <span className={`text-xs ${looksNL ? "text-[var(--color-blue)]" : "text-[var(--color-ink-faint)]"}`}>
            {looksNL ? "✦ AI" : "↵"}
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <div className="text-sm font-semibold text-[var(--color-ink)]">{orgName}</div>
          <div className="text-xs text-[var(--color-ink-faint)]">{email}</div>
        </div>
        <button
          onClick={() => setHelpOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-full border border-[var(--color-line)] bg-white/[0.03] text-[var(--color-ink-faint)] transition-all hover:bg-white/[0.06] hover:text-[var(--color-ink)]"
          title="Help & docs"
          aria-label="Open help panel"
        >
          <CircleHelp className="h-4 w-4" />
        </button>
        <Link
          href="/settings"
          className="grid h-9 w-9 place-items-center rounded-full grad-brand text-sm font-bold text-white ring-2 ring-transparent transition-all hover:ring-white/30"
          title="Settings & profile"
        >
          {initial}
        </Link>
      </div>
    </header>
    <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
