import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function ConfirmEmailPage() {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--color-blue)]/10 border border-[var(--color-blue)]/20">
        <Mail className="h-7 w-7 text-[var(--color-blue)]" />
      </div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        Check your email
      </h1>
      <p className="mt-3 text-sm text-[var(--color-ink-dim)]">
        We&apos;ve sent a confirmation link to your email address.
        Click it to activate your account and get started.
      </p>
      <p className="mt-2 text-xs text-[var(--color-ink-faint)]">
        Didn&apos;t receive it? Check your spam folder or{" "}
        <Link href="/signup" className="text-[var(--color-blue)] hover:underline">
          try again
        </Link>
        .
      </p>
      <div className="mt-6 border-t border-[var(--color-line)] pt-5">
        <Link
          href="/login"
          className="text-sm font-semibold text-[var(--color-blue)] hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </Card>
  );
}
