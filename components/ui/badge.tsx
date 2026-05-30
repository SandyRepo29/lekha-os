import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
  {
    variants: {
      tone: {
        neutral: "bg-white/5 text-[var(--color-ink-dim)] border border-[var(--color-line)]",
        live: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
        info: "bg-[var(--color-blue)]/10 text-[var(--color-blue)] border border-[var(--color-blue)]/30",
        warn: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
        danger: "bg-red-500/10 text-red-400 border border-red-500/30",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
