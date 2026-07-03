import { loginAction } from "@/lib/platform-admin/actions";
import { getPlatformSession } from "@/lib/platform-admin/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/platform-admin/login-form";

export const metadata = { title: "Platform Admin — AUDT" };

export default async function PlatformAdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getPlatformSession();
  if (session) redirect("/platform-admin");

  const sp = await searchParams;

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#007A94] shadow-[0_4px_20px_-4px_rgba(0,122,148,.8)]">
            <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_8px_#fff]" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-wide text-white">
              AU<span className="text-[#00B8D9]">DT</span>
            </div>
            <div className="text-[11px] text-white/40 font-medium tracking-wider uppercase">Platform Admin</div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8">
          <h1 className="mb-1 text-lg font-bold text-white">Internal Access Only</h1>
          <p className="mb-6 text-sm text-white/50">
            This console is restricted to AUDT platform staff.
          </p>

          {sp.error === "session_expired" && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
              Your session has expired. Please sign in again.
            </div>
          )}
          {sp.error === "unauthorized" && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              Access denied.
            </div>
          )}

          <LoginForm action={loginAction} />
        </div>

        <p className="mt-6 text-center text-[11px] text-white/25">
          Unauthorized access attempts are logged and audited.
        </p>
      </div>
    </div>
  );
}
