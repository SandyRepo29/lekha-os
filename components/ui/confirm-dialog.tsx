"use client";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  danger = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4">
        <div className="space-y-1">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
            {title}
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)]">{description}</p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={[
              "rounded-xl px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90",
              danger ? "bg-red-600" : "bg-[var(--color-blue)]",
            ].join(" ")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
