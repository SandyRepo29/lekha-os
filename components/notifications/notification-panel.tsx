"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  X,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle2,
  CheckCheck,
} from "lucide-react";
import type { NotificationItem, NotificationType } from "./notification-types";

type Props = {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
};

function typeIcon(type: NotificationType) {
  switch (type) {
    case "alert":
      return <AlertCircle size={16} className="text-red-400 shrink-0" />;
    case "warning":
      return <AlertTriangle size={16} className="text-amber-400 shrink-0" />;
    case "success":
      return <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />;
    case "info":
    default:
      return <Info size={16} className="text-[var(--color-blue)] shrink-0" />;
  }
}

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function dayLabel(date: Date | string): "today" | "yesterday" | "older" {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  if (d >= startOfToday) return "today";
  if (d >= startOfYesterday) return "yesterday";
  return "older";
}

function groupNotifications(notifications: NotificationItem[]) {
  const today: NotificationItem[] = [];
  const yesterday: NotificationItem[] = [];
  const older: NotificationItem[] = [];
  for (const n of notifications) {
    const label = dayLabel(n.createdAt);
    if (label === "today") today.push(n);
    else if (label === "yesterday") yesterday.push(n);
    else older.push(n);
  }
  return { today, yesterday, older };
}

function NotificationRow({
  item,
  onMarkRead,
  onClose,
}: {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}) {
  const content = (
    <div
      className={`group flex gap-3 rounded-xl p-3 transition-colors ${
        item.read ? "bg-transparent" : "bg-[#F8F9FB]"
      } hover:bg-[#F8F9FB]`}
    >
      <div className="mt-0.5">{typeIcon(item.type)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`truncate text-sm ${
              item.read
                ? "text-[var(--color-ink-dim)]"
                : "font-semibold text-[var(--color-ink)]"
            }`}
          >
            {item.title}
          </p>
          <span className="shrink-0 text-xs text-[var(--color-ink-dim)]" suppressHydrationWarning>
            {timeAgo(item.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-ink-dim)]">
          {item.body}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="rounded-md border border-[var(--color-line)] bg-[#F8F9FB] px-2 py-0.5 text-[10px] font-medium text-[var(--color-ink-dim)]">
            {item.module}
          </span>
          {!item.read && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMarkRead(item.id);
              }}
              className="text-[10px] text-[var(--color-blue)] opacity-0 transition-opacity group-hover:opacity-100 hover:underline"
            >
              Mark read
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (item.href) {
    return (
      <Link href={item.href} onClick={onClose} className="block">
        {content}
      </Link>
    );
  }
  return <div>{content}</div>;
}

function GroupSection({
  label,
  items,
  onMarkRead,
  onClose,
}: {
  label: string;
  items: NotificationItem[];
  onMarkRead: (id: string) => void;
  onClose: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-dim)]">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NotificationRow
            key={item.id}
            item={item}
            onMarkRead={onMarkRead}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  );
}

export function NotificationPanel({
  open,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  const { today, yesterday, older } = groupNotifications(notifications);
  const hasAny = notifications.length > 0;
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
      )}

      <div
        ref={panelRef}
        className={`fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-[var(--color-line)] bg-[#0e0f1a] shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
          <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">
            Notifications
          </h2>
          <div className="flex items-center gap-2">
            {hasUnread && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--color-ink-dim)] transition-colors hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-dim)] transition-colors hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]"
              aria-label="Close notifications"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {!hasAny ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-line)] bg-white">
                <Bell size={24} className="text-[var(--color-ink-dim)]" />
              </div>
              <p className="text-sm font-medium text-[var(--color-ink)]">
                No notifications
              </p>
              <p className="text-xs text-[var(--color-ink-dim)]">
                Governance alerts and updates will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <GroupSection
                label="Today"
                items={today}
                onMarkRead={onMarkRead}
                onClose={onClose}
              />
              <GroupSection
                label="Yesterday"
                items={yesterday}
                onMarkRead={onMarkRead}
                onClose={onClose}
              />
              <GroupSection
                label="Older"
                items={older}
                onMarkRead={onMarkRead}
                onClose={onClose}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
