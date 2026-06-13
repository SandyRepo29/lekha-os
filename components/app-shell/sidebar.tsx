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
  Sparkles,
  Settings,
  Shield,
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
  Brain,
  ChevronRight,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  soon?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    label: "",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Core Governance",
    items: [
      { href: "/vendors",           label: "Vendor Hub™",         icon: Building2 },
      { href: "/compliance",        label: "Evidence Vault™",     icon: ShieldCheck },
      { href: "/audits",            label: "Audit Management",    icon: ClipboardCheck },
      { href: "/risks",             label: "Risk Lens™",          icon: AlertTriangle },
      { href: "/controls",         label: "Control Center™",     icon: Shield },
      { href: "/policy-governance", label: "Policy Governance™",  icon: FileText },
    ],
  },
  {
    label: "Extended Platform",
    items: [
      { href: "/dpdp-privacy",       label: "DPDP Privacy™",         icon: Lock },
      { href: "/contract-governance",label: "Contract Governance™",  icon: FileSignature },
      { href: "/issue-hub",          label: "Issue Hub™",            icon: Target },
      { href: "/workflow-studio",    label: "Workflow Studio™",      icon: GitBranch },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/trust-intelligence",   label: "Trust Intelligence™",  icon: Brain },
      { href: "/benchmarking",         label: "Benchmarking™",        icon: BarChart3 },
      { href: "/executive-reporting",  label: "Executive Reporting™", icon: LineChart },
    ],
  },
  {
    label: "Trust Infrastructure",
    items: [
      { href: "/trust-exchange",          label: "Trust Exchange™",          icon: Globe },
      { href: "/trust-network",           label: "Trust Network™",           icon: Network },
      { href: "/integration-hub",         label: "Integration Hub™",         icon: Plug },
      { href: "/ai-governance",           label: "AI Governance™",           icon: Bot },
      { href: "/auditor-collaboration",   label: "Auditor Collab™",          icon: Users2 },
      { href: "/trust-api",               label: "Trust API Platform™",      icon: Zap },
      { href: "/trust-verification",         label: "Trust Verification™",      icon: BadgeCheck },
      { href: "/continuous-compliance",      label: "Continuous Compliance™",    icon: Cpu },
      { href: "/agents",                      label: "Governance Agents™",        icon: Brain },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-line)] bg-[var(--color-bg-2)]/60 md:flex">

      {/* Logo */}
      <Link href="/dashboard"
        className="flex h-14 shrink-0 items-center gap-2.5 border-b border-[var(--color-line)] px-5">
        <span className="grid h-7 w-7 place-items-center rounded-[8px] grad-brand shadow-[0_4px_14px_-4px_rgba(99,102,241,.8)]">
          <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_8px_#fff]" />
        </span>
        <span className="font-[family-name:var(--font-display)] text-[15px] font-extrabold tracking-wide">
          AU<span className="text-[var(--color-blue)]">DT</span>
        </span>
      </Link>

      {/* Scrollable nav */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-3 scrollbar-thin">
        {groups.map((group) => (
          <div key={group.label} className={group.label ? "mt-4 first:mt-0" : ""}>
            {group.label && (
              <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
                {group.label}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ href, label, icon: Icon, soon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={soon ? "#" : href}
                    aria-disabled={soon}
                    onClick={soon ? (e) => e.preventDefault() : undefined}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all",
                      active
                        ? "bg-[var(--color-blue)]/10 text-[var(--color-ink)]"
                        : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]",
                      soon && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-[var(--color-ink-dim)]"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-[var(--color-blue)]" : "text-[var(--color-ink-faint)] group-hover:text-[var(--color-ink-dim)]"
                    )} />
                    <span className="flex-1 truncate">{label}</span>
                    {active && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-blue)]" />
                    )}
                    {soon && (
                      <span className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-[var(--color-ink-faint)]">
                        Soon
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-[var(--color-line)] px-3 py-3 space-y-0.5">
        {/* Copilot CTA */}
        <Link href="/trust-intelligence/executive"
          className="flex items-center gap-2.5 rounded-lg border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.06] px-2.5 py-2.5 mb-2 hover:bg-[var(--color-blue)]/[0.10] transition-colors">
          <Sparkles className="h-4 w-4 shrink-0 text-[var(--color-blue)]" />
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-semibold text-[var(--color-blue)]">Governance Copilot™</div>
            <div className="text-[11px] text-[var(--color-ink-faint)] truncate">Ask about your posture</div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-faint)]" />
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-[var(--color-blue)]/10 text-[var(--color-ink)]"
              : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
          )}
        >
          <Settings className={cn(
            "h-4 w-4 shrink-0",
            pathname.startsWith("/settings") ? "text-[var(--color-blue)]" : "text-[var(--color-ink-faint)]"
          )} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
