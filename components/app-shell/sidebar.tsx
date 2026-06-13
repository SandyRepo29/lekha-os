"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  ClipboardCheck,
  AlertTriangle,
  Lock,
  Gavel,
  Sparkles,
  Settings,
  Users,
  Bell,
  Database,
  Shield,
  Brain,
  FileText,
  FileSignature,
  Target,
  GitBranch,
  Globe,
  BarChart3,
  Plug,
  Network,
  LineChart,
  Bot,
  Users2,
  Zap,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  soon?: boolean;
};

const items: Item[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendors", label: "Vendors", icon: Building2 },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/audits", label: "Audits", icon: ClipboardCheck },
  { href: "/risks", label: "Risks", icon: AlertTriangle },
  { href: "/controls", label: "Control Center", icon: Shield },
  { href: "/policy-governance", label: "Policy Governance", icon: FileText },
  { href: "/dpdp-privacy", label: "DPDP Privacy", icon: Lock },
  { href: "/contract-governance", label: "Contract Governance", icon: FileSignature },
  { href: "/issue-hub", label: "Issue & Remediation Hub", icon: Target },
  { href: "/workflow-studio", label: "Workflow Studio", icon: GitBranch },
  { href: "/trust-exchange", label: "Trust Exchange™", icon: Globe },
  { href: "/trust-network", label: "Trust Network™", icon: Network },
  { href: "/benchmarking", label: "Governance Benchmarking™", icon: BarChart3 },
  { href: "/integration-hub", label: "Integration Hub™", icon: Plug },
  { href: "/trust-intelligence", label: "Trust Intelligence", icon: Brain },
  { href: "/executive-reporting", label: "Executive Reporting™", icon: LineChart },
  { href: "/ai-governance", label: "AI Governance™", icon: Bot },
  { href: "/auditor-collaboration", label: "Auditor Collaboration™", icon: Users2 },
  { href: "/trust-api", label: "Trust API Platform™", icon: Zap },
  { href: "/trust-verification", label: "Trust Verification Authority™", icon: BadgeCheck },
  { href: "/governance", label: "Board Governance", icon: Gavel, soon: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-4 md:flex">
      <Link href="/dashboard" className="mb-7 flex items-center gap-2.5 px-2 pt-1">
        <span className="grid h-8 w-8 place-items-center rounded-[9px] grad-brand shadow-[0_6px_18px_-6px_rgba(99,102,241,.8)]">
          <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_12px_#fff]" />
        </span>
        <span className="font-[family-name:var(--font-display)] text-base font-extrabold tracking-wide">
          AU<span className="text-[var(--color-blue)]">DT</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ href, label, icon: Icon, soon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={soon ? "#" : href}
              aria-disabled={soon}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/[0.06] text-[var(--color-ink)]"
                  : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]",
                soon && "cursor-not-allowed opacity-60 hover:bg-transparent"
              )}
              onClick={soon ? (e) => e.preventDefault() : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{label}</span>
              {soon && (
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--color-ink-faint)]">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings + Team links */}
      <Link
        href="/settings"
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors mt-1",
          pathname === "/settings"
            ? "bg-white/[0.06] text-[var(--color-ink)]"
            : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
        )}
      >
        <Settings className="h-[18px] w-[18px]" />
        <span className="flex-1">Settings</span>
      </Link>
      <Link
        href="/settings/team"
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          pathname === "/settings/team"
            ? "bg-white/[0.06] text-[var(--color-ink)]"
            : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
        )}
      >
        <Users className="h-[18px] w-[18px]" />
        <span className="flex-1">Team</span>
      </Link>
      <Link
        href="/settings/notifications"
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          pathname === "/settings/notifications"
            ? "bg-white/[0.06] text-[var(--color-ink)]"
            : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
        )}
      >
        <Bell className="h-[18px] w-[18px]" />
        <span className="flex-1">Notifications</span>
      </Link>
      <Link
        href="/settings/data-governance"
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          pathname === "/settings/data-governance"
            ? "bg-white/[0.06] text-[var(--color-ink)]"
            : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
        )}
      >
        <Database className="h-[18px] w-[18px]" />
        <span className="flex-1">Data Governance</span>
      </Link>

      <div className="mt-3 rounded-xl border border-[var(--color-blue)]/25 bg-[var(--color-blue)]/[0.06] p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-blue)]">
          <Sparkles className="h-4 w-4" /> Governance Copilot™
        </div>
        <p className="mt-1 text-xs text-[var(--color-ink-dim)]">
          Ask about vendors, risks or audit readiness.
        </p>
      </div>
    </aside>
  );
}
