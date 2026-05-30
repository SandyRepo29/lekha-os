import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-[var(--color-line-strong)] bg-white/[0.03] px-4 text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] transition-colors focus:border-[var(--color-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/30",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-[var(--color-ink-dim)]", className)}
      {...props}
    />
  );
}
