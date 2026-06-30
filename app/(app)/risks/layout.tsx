"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/risks",            label: "Dashboard" },
  { href: "/risks/list",       label: "Risk Register" },
  { href: "/risks/treatments", label: "Treatments" },
  { href: "/risks/reports",    label: "Reports" },
  { href: "/risks/ai",         label: "AI Risk Officer" },
];

export default function RisksLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--color-line)] pb-1">
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white p-1">
          {NAV.map(({ href, label }) => {
            const exact = href === "/risks";
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
      </div>
      {children}
    </div>
  );
}
