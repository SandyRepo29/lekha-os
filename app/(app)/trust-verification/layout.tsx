"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/trust-verification",                label: "Hub" },
  { href: "/trust-verification/programs",       label: "Programs" },
  { href: "/trust-verification/applications",   label: "Applications" },
  { href: "/trust-verification/certificates",   label: "Certificates" },
  { href: "/trust-verification/badges",         label: "Badges" },
  { href: "/trust-verification/registry",       label: "Registry" },
  { href: "/trust-verification/passports",      label: "Passports" },
  { href: "/trust-verification/monitoring",     label: "Monitoring" },
  { href: "/trust-verification/renewals",       label: "Renewals" },
  { href: "/trust-verification/ai",             label: "AI Advisor" },
];

export default function TrustVerificationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-1">
        {NAV.map(({ href, label }) => {
          const exact = href === "/trust-verification";
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
