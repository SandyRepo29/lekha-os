"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/audits",          label: "Dashboard",  active: true },
  { href: "/audits/list",     label: "Audits",     active: true },
  { href: "/audits/findings", label: "Findings",   active: true },
  { href: "/audits/capas",    label: "CAPAs",      active: true },
  { href: "/audits/reports",  label: "Reports",    active: true },
  { href: "/audits/ai",       label: "Audit Copilot™", active: true },
];

export default function AuditsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-1">
        {NAV.map(({ href, label, active }) => {
          const exact = href === "/audits";
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
