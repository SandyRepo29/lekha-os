import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Trust Center &#8212; AUDT",
  description: "Security, compliance, and data protection at AUDT.",
};

export default function TrustLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)" }}>
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-line)] bg-[var(--color-bg)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--color-blue)]" />
            <span className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight text-[var(--color-ink)]">
              AUDT
            </span>
            <span className="ml-2 text-xs text-[var(--color-ink-dim)]">Trust Center</span>
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink-dim)] transition hover:bg-[#F0F4F9] hover:text-[var(--color-ink)]"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-line)] py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 text-center text-sm text-[var(--color-ink-dim)] sm:flex-row sm:justify-between sm:text-left">
          <span>&#169; 2026 AUDT. Governance Built on Proof.</span>
          <div className="flex items-center gap-4">
            <Link href="/trust/terms" className="hover:text-[var(--color-ink)] transition">Terms</Link>
            <span className="opacity-30">&#183;</span>
            <Link href="/trust/dpa" className="hover:text-[var(--color-ink)] transition">DPA</Link>
            <span className="opacity-30">&#183;</span>
            <Link href="/trust/privacy" className="hover:text-[var(--color-ink)] transition">Privacy</Link>
            <span className="opacity-30">&#183;</span>
            <Link href="/trust" className="hover:text-[var(--color-ink)] transition">Trust Center</Link>
            <span className="opacity-30">&#183;</span>
            <a href="mailto:security@audt.tech" className="hover:text-[var(--color-ink)] transition">security@audt.tech</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
