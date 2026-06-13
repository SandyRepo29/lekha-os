"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/issue-hub", label: "Dashboard" },
  { href: "/issue-hub/list", label: "Issue Registry™" },
  { href: "/issue-hub/tasks", label: "Tasks" },
  { href: "/issue-hub/exceptions", label: "Exceptions™" },
  { href: "/issue-hub/reports", label: "Reports" },
  { href: "/issue-hub/ai", label: "AI Advisor™" },
];

export default function IssueHubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-1 border-b-[var(--color-line)]">
        {NAV.map(({ href, label }) => {
          const exact = href === "/issue-hub";
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
      {children}
    </div>
  );
}
