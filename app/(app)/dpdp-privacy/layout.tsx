"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dpdp-privacy",             label: "Dashboard" },
  { href: "/dpdp-privacy/inventory",   label: "Data Inventory™" },
  { href: "/dpdp-privacy/consents",    label: "Consents" },
  { href: "/dpdp-privacy/requests",    label: "DSR Requests" },
  { href: "/dpdp-privacy/retention",   label: "Retention" },
  { href: "/dpdp-privacy/transfers",   label: "Transfers" },
  { href: "/dpdp-privacy/assessments", label: "Assessments" },
  { href: "/dpdp-privacy/ai",          label: "AI Officer" },
];

export default function DpdpPrivacyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white p-1 border-b border-b-[var(--color-line)]">
        {NAV.map(({ href, label }) => {
          const exact = href === "/dpdp-privacy";
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
