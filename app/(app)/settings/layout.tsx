"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/settings",                   label: "Profile",          active: true },
  { href: "/settings/organization",      label: "Organization",     active: true },
  { href: "/settings/team",              label: "Team",             active: true },
  { href: "/settings/security",          label: "Security",         active: true },
  { href: "/settings/audit-logs",        label: "Audit Logs",       active: true },
  { href: "/settings/billing",           label: "Billing",          active: true },
  { href: "/settings/api-keys",          label: "API Keys",         active: true },
  { href: "/settings/integrations",      label: "Integrations",     active: true },
  { href: "/settings/data-governance",   label: "Data Governance",  active: true },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Sub-nav */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white p-1">
        {NAV.map(({ href, label, active }) => {
          const exact = href === "/settings";
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
