export const dynamic = "force-dynamic";

import { Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { listTeam } from "@/lib/services/team-service";
import { InviteForm } from "@/components/team/invite-form";
import { MemberRow } from "@/components/team/member-row";

export default async function TeamPage() {
  const session = await requireUser();
  const members = session.demo || !session.org ? [] : await listTeam(session.org.id);
  const canInvite = session.org?.role === "owner" || session.org?.role === "admin";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Team</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Manage who has access to {session.orgName}.</p>
      </div>

      {/* Invite */}
      {canInvite && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <Users className="h-4 w-4 text-[var(--color-ink-faint)]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Invite member</span>
          </div>
          <Card>
            <CardHeader><CardTitle>Invite a teammate</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-[var(--color-ink-dim)]">
                They'll receive an email to join <strong>{session.orgName}</strong> on Lekha OS.
              </p>
              <InviteForm />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Members list */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <Users className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
            Members ({members.length})
          </span>
        </div>
        <Card>
          {members.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-[var(--color-ink-dim)]">
              {session.demo ? "Connect Supabase to manage team members." : "No members yet."}
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {members.map((m) => (
                <MemberRow
                  key={m.membershipId}
                  member={m}
                  currentUserId={session.id}
                  currentRole={session.org?.role ?? "viewer"}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Role descriptions */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-ink)]">Role permissions</h3>
        <div className="space-y-2 text-sm">
          {[
            { role: "Owner", desc: "Full access. Manage billing, team, org settings." },
            { role: "Admin", desc: "Manage vendors, documents, team members. Cannot change billing." },
            { role: "Member", desc: "Add and manage vendors and documents." },
            { role: "Viewer", desc: "Read-only access to all data." },
          ].map(({ role, desc }) => (
            <div key={role} className="flex gap-3">
              <span className="w-16 shrink-0 font-medium text-[var(--color-ink)]">{role}</span>
              <span className="text-[var(--color-ink-dim)]">{desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
