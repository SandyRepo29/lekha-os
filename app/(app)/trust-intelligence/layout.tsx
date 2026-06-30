"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/trust-intelligence",              label: "Overview" },
  { href: "/trust-intelligence/vendors",      label: "Vendor Trust" },
  { href: "/trust-intelligence/risks",        label: "Risk Insights" },
  { href: "/trust-intelligence/controls",     label: "Control Health" },
  { href: "/trust-intelligence/compliance",   label: "Compliance" },
  { href: "/trust-intelligence/recommendations", label: "Recommendations" },
  { href: "/trust-intelligence/executive",         label: "Executive View" },
  { href: "/trust-intelligence/trends",            label: "Trends" },
  { href: "/trust-intelligence/monitoring",        label: "Monitoring" },
  { href: "/trust-intelligence/trust-graph",       label: "Trust Graph" },
];

export default function TrustIntelligenceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white p-1 border-b border-b-[var(--color-line)]">
        {NAV.map(({ href, label }) => {
          const exact = href === "/trust-intelligence";
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
                  ? "bg-[#EEF2F7] text-[var(--color-ink)]"
                  : "text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
