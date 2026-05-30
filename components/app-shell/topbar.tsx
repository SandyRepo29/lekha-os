"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

export function Topbar({ email, orgName, fullName }: {
  email: string; orgName: string; fullName?: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const display = fullName || email;
  const initial = (display?.[0] ?? "?").toUpperCase();

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/vendors?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
    if (e.key === "Escape") setQuery("");
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-[var(--color-line)] bg-[var(--color-bg)]/80 px-5 backdrop-blur-md">
      <div className="flex flex-1 max-w-sm items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/[0.03] px-3 py-1.5 text-sm transition-colors focus-within:border-[var(--color-blue)]/60">
        <Search className="h-4 w-4 shrink-0 text-[var(--color-ink-faint)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search vendors…"
          className="flex-1 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
        />
        {query && (
          <span className="text-xs text-[var(--color-ink-faint)]">↵</span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <div className="text-sm font-semibold text-[var(--color-ink)]">{orgName}</div>
          <div className="text-xs text-[var(--color-ink-faint)]">{email}</div>
        </div>
        <Link
          href="/settings"
          className="grid h-9 w-9 place-items-center rounded-full grad-brand text-sm font-bold text-white ring-2 ring-transparent transition-all hover:ring-white/30"
          title="Settings & profile"
        >
          {initial}
        </Link>
      </div>
    </header>
  );
}
