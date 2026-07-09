"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

/**
 * Styled select that matches the AUDT light design system.
 * The native <select> uses OS chrome; this wrapper overrides it fully.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-11 w-full appearance-none rounded-xl border border-[var(--color-line-strong)]",
          "bg-white px-4 pr-10 text-[15px] text-[var(--color-ink)]",
          "transition-colors focus:border-[var(--color-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/30",
          "cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-faint)]" />
    </div>
  )
);
Select.displayName = "Select";

/** An option group for visual grouping in a Select */
export function SelectGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return <optgroup label={label} style={{ background: "#ffffff", color: "#64748b" }}>{children}</optgroup>;
}

/** A single option, styled for the light background */
export function SelectOption({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <option value={value} style={{ background: "#ffffff", color: "#0f172a" }}>
      {children}
    </option>
  );
}
