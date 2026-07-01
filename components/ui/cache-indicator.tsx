"use client";

import { RefreshCw } from "lucide-react";

interface CacheIndicatorProps {
  generatedAt: Date | string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

function getRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

export function CacheIndicator({
  generatedAt,
  onRefresh,
  isRefreshing = false,
  className = "",
}: CacheIndicatorProps) {
  return (
    <span className={`flex items-center gap-1.5 text-xs text-[var(--color-ink-dim)] ${className}`}>
      <span>AI analysis</span>
      <span className="opacity-40">·</span>
      {generatedAt === null ? (
        <span>Generating&#8230;</span>
      ) : (
        <span>Updated {getRelativeTime(generatedAt)}</span>
      )}
      {onRefresh && (
        <>
          <span className="opacity-40">·</span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 text-[var(--color-blue)] hover:opacity-75 disabled:opacity-50 transition-opacity"
          >
            <RefreshCw
              size={11}
              className={isRefreshing ? "animate-spin" : ""}
            />
            <span>Refresh</span>
          </button>
        </>
      )}
    </span>
  );
}
