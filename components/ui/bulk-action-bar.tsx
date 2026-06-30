"use client";

import React from "react";

interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
  className?: string;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  actions,
  className = "",
}: BulkActionBarProps) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        selectedCount > 0 ? "translate-y-0" : "translate-y-full"
      } ${className}`}
    >
      <div className="border-t border-[var(--color-line)] bg-[#0f1117]/95 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--color-ink)]">
              {selectedCount} selected
            </span>
            <button
              onClick={onClearSelection}
              className="text-sm text-[var(--color-ink-dim)] underline underline-offset-2 hover:text-[var(--color-ink)] transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-40 ${
                  action.danger
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                    : "bg-[#EEF2F7] text-[var(--color-ink)] hover:bg-[#EEF2F7] border border-[var(--color-line)]"
                }`}
              >
                {action.icon && <span className="shrink-0">{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
