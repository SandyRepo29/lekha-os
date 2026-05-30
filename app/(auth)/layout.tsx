import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-50 blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,.5), transparent 70%)" }}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[9px] grad-brand shadow-[0_6px_18px_-6px_rgba(99,102,241,.8)]">
              <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_12px_#fff]" />
            </span>
            <span className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-wide">
              LEKHA<span className="ml-0.5 text-[var(--color-blue)]">OS</span>
            </span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
