import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-blue)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "grad-brand text-white shadow-[0_8px_30px_-8px_rgba(99,102,241,0.7)] hover:-translate-y-0.5 hover:shadow-[0_16px_44px_-10px_rgba(99,102,241,0.85)]",
        ghost:
          "border border-[var(--color-line-strong)] bg-white/[0.04] text-[var(--color-ink)] hover:bg-white/[0.09] hover:-translate-y-0.5",
        outline:
          "border border-[var(--color-line-strong)] text-[var(--color-ink)] hover:bg-white/[0.05]",
        subtle:
          "bg-white/[0.04] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-white/[0.08]",
        danger:
          "bg-red-500/90 text-white hover:bg-red-500",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-[15px]",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { buttonVariants };
