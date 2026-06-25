"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationPanel } from "./notification-panel";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, markRead, markAllRead } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[var(--color-ink-dim)] transition-colors hover:bg-white/[0.06] hover:text-[var(--color-ink)]"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        <Bell size={18} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
            {badgeLabel}
          </span>
        )}
      </button>

      <NotificationPanel
        open={open}
        onClose={() => setOpen(false)}
        notifications={notifications}
        onMarkRead={markRead}
        onMarkAllRead={() => {
          markAllRead();
          setOpen(false);
        }}
      />
    </>
  );
}
