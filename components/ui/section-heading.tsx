import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  border?: boolean;
  className?: string;
}

/** Standard card section heading — consistent padding, typography, optional border. */
export function SectionHeading({ title, subtitle, icon: Icon, action, border = true, className }: Props) {
  return (
    <div className={cn(
      "flex items-center justify-between gap-3 px-5 py-4",
      border && "border-b border-[var(--color-line)]",
      className
    )}>
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-[var(--color-ink-faint)]" />}
        <div className="min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)] leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
