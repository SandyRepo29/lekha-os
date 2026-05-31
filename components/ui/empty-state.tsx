import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** Consistent empty state used across all list/card components. */
export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-[var(--color-ink-faint)]">
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)]">{title}</p>
        {description && (
          <p className="mt-1 max-w-xs text-sm text-[var(--color-ink-dim)]">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
