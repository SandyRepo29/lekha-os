"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, CreditCard, Layers, Flag,
  FileText, Brain, Plug, ShieldAlert, Activity, Bell,
  ClipboardList, Settings, HelpCircle, LogOut, Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/platform-admin/actions";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavSection = { label: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    label: "Overview",
    items: [
      { href: "/platform-admin",             label: "Dashboard",          icon: LayoutDashboard },
      { href: "/platform-admin/health",      label: "System Health",      icon: Activity },
      { href: "/platform-admin/monitoring",  label: "Monitoring",         icon: Cpu },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/platform-admin/orgs",         label: "Organizations",      icon: Building2 },
      { href: "/platform-admin/users",         label: "All Users",          icon: Users },
      { href: "/platform-admin/subscriptions", label: "Subscriptions",      icon: CreditCard },
      { href: "/platform-admin/billing",       label: "Billing & Invoices", icon: CreditCard },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/platform-admin/flags",       label: "Feature Flags",      icon: Flag },
      { href: "/platform-admin/modules",     label: "Module Registry",    icon: Layers },
      { href: "/platform-admin/templates",   label: "System Templates",   icon: FileText },
      { href: "/platform-admin/integrations",label: "Integrations",       icon: Plug },
      { href: "/platform-admin/ai",          label: "AI Center",          icon: Brain },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/platform-admin/staff",       label: "Platform Users",     icon: Users },
      { href: "/platform-admin/security",    label: "Security Center",    icon: ShieldAlert },
      { href: "/platform-admin/audit-logs",  label: "Audit Logs",         icon: ClipboardList },
      { href: "/platform-admin/notifications",label: "Notifications",     icon: Bell },
      { href: "/platform-admin/support",     label: "Support Console",    icon: HelpCircle },
      { href: "/platform-admin/settings",    label: "Platform Settings",  icon: Settings },
    ],
  },
];

export function PaSidebar({ userName, userRole }: { userName: string; userRole: string }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/platform-admin"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-white/[0.06] bg-[#0D1117] md:flex">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/[0.06] px-5">
        <div className="grid h-7 w-7 place-items-center rounded-[8px] bg-[#007A94] shadow-[0_4px_14px_-4px_rgba(0,122,148,.7)]">
          <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_8px_#fff]" />
        </div>
        <div>
          <div className="font-bold text-[14px] tracking-wide text-white">
            AU<span className="text-[#00B8D9]">DT</span>
          </div>
          <div className="text-[10px] text-white/35 font-medium tracking-widest uppercase">Platform Admin</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-3">
        {NAV.map((section) => (
          <div key={section.label} className="mt-4 first:mt-0">
            <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">
              {section.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-all",
                      active
                        ? "bg-[#00B8D9]/[0.12] text-white"
                        : "text-white/50 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active ? "text-[#00B8D9]" : "text-white/30 group-hover:text-white/60"
                      )}
                    />
                    <span className="flex-1 truncate">{label}</span>
                    {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#00B8D9]" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/[0.06] px-3 py-3">
        <div className="mb-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
          <div className="text-[12px] font-medium text-white/70 truncate">{userName}</div>
          <div className="text-[10px] text-white/30 uppercase tracking-widest">{userRole.replace(/_/g, " ")}</div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium text-white/40 transition-colors hover:bg-white/[0.06] hover:text-red-400"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
