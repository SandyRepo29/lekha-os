"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, Layers, AlertTriangle, Shield, Building2,
  ShieldCheck, Bug, Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/ai-governance",            label: "Hub",          icon: LayoutGrid,   exact: true },
  { href: "/ai-governance/inventory",  label: "AI Inventory", icon: Layers },
  { href: "/ai-governance/risks",      label: "Risks",        icon: AlertTriangle },
  { href: "/ai-governance/controls",   label: "Controls",     icon: Shield },
  { href: "/ai-governance/vendors",    label: "Vendors",      icon: Building2 },
  { href: "/ai-governance/compliance", label: "Compliance",   icon: ShieldCheck },
  { href: "/ai-governance/incidents",  label: "Incidents",    icon: Bug },
  { href: "/ai-governance/ai",         label: "AI Copilot",   icon: Brain },
];

export default function AiGovernanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
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
      {children}
    </div>
  );
}
