"use client";

import Link from "next/link";

export type ActivityRow = {
  id: string;
  entity_type: string;
  entity_name: string | null;
  event_type: string;
  actor_name: string | null;
  title: string;
  severity: string;
  created_at: Date | string;
};

interface Props {
  activities: ActivityRow[];
  limit?: number;
  title?: string;
  showAll?: boolean;
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return "Yesterday";
  }

  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const SEVERITY_DOT: Record<string, string> = {
  info: "bg-indigo-500",
  success: "bg-emerald-500",
  warn: "bg-amber-400",
  warning: "bg-amber-400",
  error: "bg-red-500",
  critical: "bg-red-600",
};

const SEVERITY_TEXT: Record<string, string> = {
  info: "text-indigo-400",
  success: "text-emerald-400",
  warn: "text-amber-400",
  warning: "text-amber-400",
  error: "text-red-400",
  critical: "text-red-400",
};

export function PlatformActivityWidget({
  activities,
  limit = 5,
  title = "Recent Activity",
  showAll = false,
}: Props) {
  const visible = activities.slice(0, limit);

  return (
    <div
      className="rounded-2xl border border-[var(--color-line)] bg-white p-4 flex flex-col gap-3"
    >
      <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>

      {visible.length === 0 ? (
        <p className="text-xs text-[var(--color-ink-dim)] py-2">No recent activity.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((row) => {
            const sev = (row.severity ?? "info").toLowerCase();
            const dot = SEVERITY_DOT[sev] ?? SEVERITY_DOT.info;
            const textColor = SEVERITY_TEXT[sev] ?? SEVERITY_TEXT.info;
            const label = row.actor_name ? `${row.actor_name} ${row.title}` : row.title;

            return (
              <li key={row.id} className="flex items-start gap-2.5">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs leading-snug truncate ${textColor}`}>{label}</p>
                  <p className="text-[11px] text-[var(--color-ink-dim)] mt-0.5">
                    {formatRelativeTime(row.created_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showAll && (
        <Link
          href="/platform/activity"
          className="text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors mt-1 self-end"
        >
          View all activity &#8594;
        </Link>
      )}
    </div>
  );
}
