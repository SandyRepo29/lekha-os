"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/integration-hub",             label: "Dashboard",   exact: true },
  { href: "/integration-hub/marketplace", label: "Marketplace" },
  { href: "/integration-hub/connections", label: "Connections" },
  { href: "/integration-hub/syncs",       label: "Sync History" },
  { href: "/integration-hub/webhooks",    label: "Webhooks" },
  { href: "/integration-hub/ai",          label: "AI Advisor" },
];

export function IntegrationHubNav() {
  const pathname = usePathname();
  return (
    <div className="border-b border-[var(--color-line)] pb-1">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-1">
        {tabs.map(({ href, label, exact }) => {
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
    </div>
  );
}
