"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/benchmarking",            label: "Dashboard",     exact: true },
  { href: "/benchmarking/vendors",    label: "Vendor Trust" },
  { href: "/benchmarking/risks",      label: "Risk & Controls" },
  { href: "/benchmarking/compliance", label: "Compliance" },
  { href: "/benchmarking/rankings",   label: "Rankings" },
  { href: "/benchmarking/ai",         label: "AI Analyst" },
];

export default function BenchmarkingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--color-line)] pb-1">
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-1">
          {NAV.map(({ href, label, exact }) => {
            const isCurrent = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  isCurrent
                    ? "bg-white/[0.08] text-[var(--color-ink)]"
                    : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
