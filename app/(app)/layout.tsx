export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/app-shell/sidebar";
import { Topbar } from "@/components/app-shell/topbar";
import { requireUser } from "@/lib/auth/session";
import { findProfile } from "@/lib/services/settings-service";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = !user.demo ? await findProfile(user.id) : null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={user.email} orgName={user.orgName} fullName={profile?.fullName} />
        {user.demo && (
          <div className="border-b border-amber-500/20 bg-amber-500/[0.06] px-5 py-2 text-center text-xs text-amber-300/90">
            Demo mode — connect Supabase (see <code>.env.example</code>) to use live data and auth.
          </div>
        )}
        <main className="scroll-thin flex-1 overflow-y-auto p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
