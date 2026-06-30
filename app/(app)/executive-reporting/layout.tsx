"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/executive-reporting",                   label: "Hub",          exact: true },
  { href: "/executive-reporting/analytics",         label: "Analytics" },
  { href: "/executive-reporting/dashboard/ceo",     label: "Dashboard",    matchPrefix: "/executive-reporting/dashboard" },
  { href: "/executive-reporting/board-reports",     label: "Board Reports" },
  { href: "/executive-reporting/scheduled",         label: "Scheduled" },
  { href: "/executive-reporting/forecasts",         label: "Forecasts" },
  { href: "/executive-reporting/scorecards",        label: "Scorecards" },
  { href: "/executive-reporting/ai",                label: "AI Analyst" },
];

export default function ExecutiveReportingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--color-line)] pb-1">
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white p-1">
          {NAV.map(({ href, label, exact, matchPrefix }) => {
            let isCurrent: boolean;
            if (exact) {
              isCurrent = pathname === href;
            } else if (matchPrefix) {
              isCurrent = pathname.startsWith(matchPrefix);
            } else {
              isCurrent = pathname === href || pathname.startsWith(href + "/");
            }
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
      </div>
      {children}
    </div>
  );
}
