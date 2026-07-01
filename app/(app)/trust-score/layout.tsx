"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/trust-score",              label: "Overview",        exact: true },
  { href: "/trust-score/factors",      label: "Trust Factors" },
  { href: "/trust-score/trends",       label: "Trust Trends" },
  { href: "/trust-score/vendors",      label: "Vendor Trust" },
  { href: "/trust-score/insights",     label: "Trust Insights" },
  { href: "/trust-score/benchmarking", label: "Benchmarking" },
  { href: "/trust-score/reports",      label: "Reports" },
  { href: "/trust-score/ai",           label: "Trust Copilot™" },
];

export default function TrustScoreLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="space-y-6">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white p-1">
        {NAV.map((n) => {
          const active = n.exact ? path === n.href : path === n.href || path.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[#EEF2F7] text-[var(--color-ink)]"
                  : "text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]"
              )}
              dangerouslySetInnerHTML={{ __html: n.label }}
            />
          );
        })}
      </div>
      {children}
    </div>
  );
}
