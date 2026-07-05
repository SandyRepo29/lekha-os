"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/policy-governance",              label: "Overview",          exact: true },
  { href: "/policy-governance/library",      label: "Library" },
  { href: "/policy-governance/mappings",     label: "Mappings" },
  { href: "/policy-governance/reviews",      label: "Reviews" },
  { href: "/policy-governance/attestations", label: "Attestations" },
  { href: "/policy-governance/reports",      label: "Reports" },
  { href: "/policy-governance/ai",           label: "Policy Copilot™" },
];

export default function PolicyGovernanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--color-line)] pb-1">
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white p-1">
          {NAV.map(({ href, label, exact }) => {
            const isCurrent = exact
              ? pathname === href || pathname === href + "/"
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
