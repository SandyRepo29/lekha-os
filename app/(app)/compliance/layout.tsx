"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/compliance",             label: "Dashboard",            active: true  },
  { href: "/compliance/evidence",    label: "Evidence",             active: true  },
  { href: "/compliance/frameworks",  label: "Frameworks",           active: true  },
  { href: "/compliance/controls",    label: "Controls",             active: true  },
  { href: "/compliance/policies",    label: "Policies",             active: true  },
  { href: "/compliance/gaps",        label: "Gaps",                 active: true  },
  { href: "/compliance/reports",     label: "Reports",              active: true  },
  { href: "/compliance/ai",          label: "Compliance Copilot™", active: true  },
];

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Sub-nav */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] border-b-[var(--color-line-strong)] bg-white p-1">
        {NAV.map(({ href, label, active }) => {
          const exact = href === "/compliance";
          const isCurrent = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");

          if (!active) {
            return (
              <span
                key={href}
                className="flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-[var(--color-ink-faint)] opacity-50"
              >
                {label}
                <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[10px]">Soon</span>
              </span>
            );
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

      {children}
    </div>
  );
}
