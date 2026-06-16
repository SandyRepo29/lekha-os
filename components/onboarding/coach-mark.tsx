"use client";

import { useState, useEffect } from "react";

interface CoachMarkProps {
  id: string;
  title: string;
  body: string;
  position?: "top" | "bottom" | "left" | "right";
  disabled?: boolean;
  children: React.ReactNode;
}

/**
 * First-visit coach mark. Wraps a target element with a pulsing beacon + tooltip.
 * Persists dismissal in localStorage as `audt_cm_${id}`.
 * Pass `disabled` to skip the mark entirely (renders children as-is).
 */
export function CoachMark({
  id,
  title,
  body,
  position = "bottom",
  disabled = false,
  children,
}: CoachMarkProps) {
  const storageKey = `audt_cm_${id}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (disabled) return;
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) setVisible(true);
  }, [storageKey, disabled]);

  if (disabled || !visible) {
    return <>{children}</>;
  }

  function dismiss() {
    localStorage.setItem(storageKey, "1");
    setVisible(false);
  }

  const tooltipPosition: Record<string, string> = {
    bottom: "top-full mt-2 left-0",
    top: "bottom-full mb-2 left-0",
    right: "left-full ml-2 top-0",
    left: "right-full mr-2 top-0",
  };

  return (
    <div className="relative inline-block" onClick={dismiss}>
      {/* Pulsing beacon */}
      <span className="pointer-events-none absolute -top-1 -right-1 z-50 h-3 w-3 rounded-full bg-[var(--color-blue)] animate-ping" />
      <span className="pointer-events-none absolute -top-1 -right-1 z-50 h-3 w-3 rounded-full bg-[var(--color-blue)]" />

      {/* Tooltip */}
      <div
        className={`absolute z-50 w-56 rounded-xl border border-[var(--color-blue)]/30 bg-[#0f0f1a] p-3 shadow-2xl ${tooltipPosition[position] ?? tooltipPosition.bottom}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold text-[var(--color-blue)]">{title}</p>
          <button
            onClick={dismiss}
            className="shrink-0 text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors leading-none mt-0.5"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
        <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{body}</p>
      </div>

      {children}
    </div>
  );
}
