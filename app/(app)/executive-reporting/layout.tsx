"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/executive-reporting",            label: "Hub" },
  { href: "/executive-reporting/analytics",  label: "Analytics" },
  { href: "/executive-reporting/dashboard/ceo", label: "Dashboard" },
  { href: "/executive-reporting/board-reports", label: "Board Reports" },
  { href: "/executive-reporting/scheduled",  label: "Scheduled" },
  { href: "/executive-reporting/forecasts",  label: "Forecasts" },
  { href: "/executive-reporting/scorecards", label: "Scorecards" },
  { href: "/executive-reporting/ai",         label: "AI Analyst" },
];

export default function ExecutiveReportingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--color-line)]">
        <div className="flex gap-1 overflow-x-auto pb-0">
          {NAV.map(({ href, label }) => {
            // Hub is active only on exact match
            const isHub = href === "/executive-reporting";
            // Dashboard tab: active for any /executive-reporting/dashboard/* route
            const isDashboard = href.startsWith("/executive-reporting/dashboard/");
            let isCurrent: boolean;
            if (isHub) {
              isCurrent = pathname === href;
            } else if (isDashboard) {
              isCurrent = pathname.startsWith("/executive-reporting/dashboard");
            } else {
              isCurrent = pathname === href || pathname.startsWith(href + "/");
            }

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  isCurrent
                    ? "border-[var(--color-blue)] text-[var(--color-ink)]"
                    : "border-transparent text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"
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
