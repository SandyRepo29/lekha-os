"use client";

import { useState, useEffect } from "react";

interface ArchiveDialogProps {
  open: boolean;
  onClose: () => void;
  onArchive: () => void;
  onDelete: () => void;
  itemName: string;
  itemType: string;
}

export function ArchiveDialog({
  open,
  onClose,
  onArchive,
  onDelete,
  itemName,
  itemType,
}: ArchiveDialogProps) {
  const [mode, setMode] = useState<"archive" | "delete">("archive");
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (open) {
      setMode("archive");
      setConfirmText("");
    }
  }, [open]);

  if (!open) return null;

  const deleteEnabled = confirmText === itemName;

  function handleConfirm() {
    if (mode === "archive") {
      onArchive();
    } else if (deleteEnabled) {
      onDelete();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-5">
        <div className="space-y-1">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
            Remove {itemType}?
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)]">
            Governance data should be retained for compliance. Choose how to remove this {itemType}.
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setMode("archive")}
            className={[
              "w-full rounded-xl border p-4 text-left transition-all",
              mode === "archive"
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-[var(--color-line)] bg-white/[0.02] hover:bg-white/[0.04]",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500">
                {mode === "archive" && (
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                )}
              </span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-emerald-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-sm font-semibold text-[var(--color-ink)]">
                    Archive
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-[var(--color-ink-dim)]">
                  Hide from active views. Retrievable from Archived filter. Recommended for compliance.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode("delete")}
            className={[
              "w-full rounded-xl border p-4 text-left transition-all",
              mode === "delete"
                ? "border-red-500/50 bg-red-500/10"
                : "border-[var(--color-line)] bg-white/[0.02] hover:bg-white/[0.04]",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-red-500">
                {mode === "delete" && (
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                )}
              </span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-red-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span className="text-sm font-semibold text-[var(--color-ink)]">
                    Permanent Delete
                  </span>
                </div>
                <p className="text-xs text-[var(--color-ink-dim)]">
                  Cannot be undone. Only for duplicate or test records.
                </p>
              </div>
            </div>
          </button>
        </div>

        {mode === "delete" && (
          <div className="space-y-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
            <p className="text-xs text-red-400">
              Type <span className="font-semibold">{itemName}</span> to confirm permanent deletion
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Type ${itemName} to confirm`}
              className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-dim)] outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)] transition-colors"
          >
            Cancel
          </button>
          {mode === "archive" ? (
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-xl bg-[var(--color-blue)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Archive
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!deleteEnabled}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete Permanently
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
