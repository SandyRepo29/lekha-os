import Link from "next/link";
import { headers } from "next/headers";

const tabs = [
  { href: "/policy-governance", label: "Overview" },
  { href: "/policy-governance/library", label: "Library" },
  { href: "/policy-governance/reviews", label: "Reviews" },
  { href: "/policy-governance/attestations", label: "Attestations" },
  { href: "/policy-governance/ai", label: "AI Advisor" },
];

export default async function PolicyGovernanceLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? "";

  return (
    <div className="space-y-6">
      {/* Sub-nav */}
      <nav className="flex gap-1 overflow-x-auto border-b border-[var(--color-line)] pb-0">
        {tabs.map((tab) => {
          const active =
            tab.href === "/policy-governance"
              ? pathname === "/policy-governance" || pathname === "/policy-governance/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-b-2 border-indigo-500 text-[var(--color-ink)]"
                  : "text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
