"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Plug, Link2, RefreshCw, Webhook, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/integration-hub", label: "Dashboard", icon: LayoutGrid, exact: true },
  { href: "/integration-hub/marketplace", label: "Marketplace", icon: Plug },
  { href: "/integration-hub/connections", label: "Connections", icon: Link2 },
  { href: "/integration-hub/syncs", label: "Sync History", icon: RefreshCw },
  { href: "/integration-hub/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/integration-hub/ai", label: "AI Advisor", icon: Sparkles },
];

export function IntegrationHubNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-[var(--color-line)] overflow-x-auto">
      {tabs.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              active
                ? "text-[var(--color-ink)] border-[var(--color-blue)]"
                : "text-[var(--color-ink-dim)] border-transparent hover:text-[var(--color-ink)] hover:border-[var(--color-blue)]/40"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
