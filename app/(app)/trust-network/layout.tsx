"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/trust-network",               label: "Dashboard"    },
  { href: "/trust-network/profile",       label: "Profile"      },
  { href: "/trust-network/directory",     label: "Directory"    },
  { href: "/trust-network/relationships", label: "Relationships"},
  { href: "/trust-network/activity",      label: "Activity"     },
  { href: "/trust-network/ai",            label: "AI Advisor"   },
];

export default function TrustNetworkLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white p-1 border-b border-b-[var(--color-line)]">
        {NAV.map(({ href, label }) => {
          const exact = href === "/trust-network";
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
      </nav>
      {children}
    </div>
  );
}
