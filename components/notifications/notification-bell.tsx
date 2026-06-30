"use client";

import { Bell } from "lucide-react";

type Props = {
  open: boolean;
  onOpen: () => void;
  unreadCount: number;
};

export function NotificationBell({ open: _open, onOpen, unreadCount }: Props) {
  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <button
      onClick={onOpen}
      className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[var(--color-ink-dim)] transition-colors hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]"
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
    >
      <Bell size={18} strokeWidth={1.75} />
      {unreadCount > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
          {badgeLabel}
        </span>
      )}
    </button>
  );
}
