"use client";

import { useState } from "react";
import Link from "next/link";

export function TrialBanner({ daysLeft, periodEnd }: { daysLeft: number; periodEnd: Date | null }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const urgent = daysLeft <= 3;
  const expired = daysLeft <= 0;
  const expireStr = periodEnd
    ? new Date(periodEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className={`rounded-xl border px-5 py-3 flex items-center justify-between gap-4 ${
      urgent
        ? "bg-red-500/10 border-red-500/30 text-red-300"
        : "bg-amber-500/10 border-amber-500/30 text-amber-300"
    }`}>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-lg">{urgent ? "🚨" : "⏳"}</span>
        <span>
          {expired
            ? "Your trial has expired. Upgrade to regain full access."
            : `Your free trial ${expireStr ? `ends ${expireStr}` : `ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}. Upgrade to keep your governance program running.`}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/settings/billing"
          className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          Upgrade now
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
