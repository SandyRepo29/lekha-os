"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Sparkles, CircleHelp } from "lucide-react";
import { useState } from "react";
import { HelpPanel } from "@/components/help/help-panel";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { NotificationPanel } from "@/components/notifications/notification-panel";
import { useNotifications } from "@/hooks/use-notifications";

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
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, markRead, markAllRead } = useNotifications();

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
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-[#E4E8EF] bg-white px-5 shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
      <div className={`flex flex-1 max-w-sm items-center gap-2 rounded-full border bg-[#F8F9FB] px-3 py-1.5 text-sm transition-colors focus-within:border-[#007A94]/60 ${looksNL ? "border-[#007A94]/40" : "border-[#E4E8EF]"}`}>
        {looksNL
          ? <Sparkles className="h-4 w-4 shrink-0 text-[#007A94] animate-pulse" />
          : <Search className="h-4 w-4 shrink-0 text-[#94A3B8]" />}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search vendors or ask in plain English…"
          className="flex-1 bg-transparent text-sm text-[#1E293B] outline-none placeholder:text-[#94A3B8]"
        />
        {query && (
          <span className={`text-xs ${looksNL ? "text-[#007A94]" : "text-[#94A3B8]"}`}>
            {looksNL ? "✦ AI" : "↵"}
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <div className="text-sm font-semibold text-[#1E293B]">{orgName}</div>
          <div className="text-xs text-[#94A3B8]">{email}</div>
        </div>
        <NotificationBell open={notifOpen} onOpen={() => setNotifOpen(true)} unreadCount={notifications.filter(n => !n.read).length} />
        <button
          onClick={() => setHelpOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-full border border-[#E4E8EF] bg-[#F8F9FB] text-[#64748B] transition-all hover:border-[#007A94]/40 hover:bg-[#EEF2F7] hover:text-[#1E293B]"
          title="Help & docs"
          aria-label="Open help panel"
        >
          <CircleHelp className="h-4 w-4" />
        </button>
        <Link
          href="/settings"
          className="grid h-9 w-9 place-items-center rounded-full grad-brand text-sm font-bold text-white ring-2 ring-transparent transition-all hover:ring-[#007A94]/30"
          title="Settings & profile"
          aria-label="Open settings and profile"
        >
          {initial}
        </Link>
      </div>
    </header>
    <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
    <NotificationPanel
      open={notifOpen}
      onClose={() => setNotifOpen(false)}
      notifications={notifications}
      onMarkRead={markRead}
      onMarkAllRead={() => { markAllRead(); setNotifOpen(false); }}
    />
    </>
  );
}
