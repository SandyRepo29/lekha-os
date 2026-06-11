import Link from "next/link";
import { ReactNode } from "react";

const tabs = [
  { href: "/benchmarking",             label: "Dashboard" },
  { href: "/benchmarking/vendors",     label: "Vendor Trust" },
  { href: "/benchmarking/risks",       label: "Risk & Controls" },
  { href: "/benchmarking/compliance",  label: "Compliance" },
  { href: "/benchmarking/rankings",    label: "Rankings" },
  { href: "/benchmarking/ai",          label: "AI Analyst" },
];

export default function BenchmarkingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <nav className="flex gap-1 border-b border-[var(--color-line)] -mb-px overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="whitespace-nowrap px-4 py-2.5 text-sm font-medium text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] border-b-2 border-transparent hover:border-[var(--color-blue)]/40 transition-colors"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
