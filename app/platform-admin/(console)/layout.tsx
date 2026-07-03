import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { PaSidebar } from "@/components/platform-admin/pa-sidebar";

export const dynamic = "force-dynamic";

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePlatformUser();

  return (
    <div className="flex h-screen overflow-hidden bg-[#0D1117]">
      <PaSidebar userName={session.name} userRole={session.role} />

      <main className="flex flex-1 flex-col overflow-y-auto">
        {/* Impersonation banner */}
        {session.impersonatingOrgId && (
          <div className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-6 py-2 text-center text-sm text-amber-400">
            <strong>Impersonation Active</strong> — You are viewing as org{" "}
            <code className="font-mono">{session.impersonatingOrgId}</code>
            {session.impersonationReason && (
              <span className="ml-2 text-amber-400/70">({session.impersonationReason})</span>
            )}
          </div>
        )}

        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
