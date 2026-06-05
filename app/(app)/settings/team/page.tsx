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
  const isOwner = session.org?.role === "owner";
  const myMembership = members.find((m) => m.userId === session.id);

  const active = members.filter((m) => m.isActive);
  const inactive = members.filter((m) => !m.isActive);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Team</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Manage who has access to {session.orgName}.</p>
      </div>

      {/* Analytics strip */}
      {members.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total members", value: members.length },
            { label: "Active", value: active.length },
            { label: "Inactive", value: inactive.length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-ink)]">{value}</div>
              <div className="mt-0.5 text-xs text-[var(--color-ink-faint)]">{label}</div>
            </div>
          ))}
        </div>
      )}

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
                They&apos;ll receive an email to join <strong>{session.orgName}</strong> on Lekha OS.
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
                  isOwner={isOwner}
                  ownerMembershipId={myMembership?.membershipId}
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
            { role: "Owner", desc: "Full access. Manage billing, team, org settings. Can transfer ownership." },
            { role: "Admin", desc: "Manage vendors, documents, team members. Cannot change billing." },
            { role: "Compliance Manager", desc: "Full access to Compliance module. Read-only for vendors." },
            { role: "Security Manager", desc: "Full access to Security settings and Audit logs." },
            { role: "Procurement Manager", desc: "Full access to Vendor Governance module." },
            { role: "Member", desc: "Add and manage vendors and documents." },
            { role: "Viewer", desc: "Read-only access to all data." },
          ].map(({ role, desc }) => (
            <div key={role} className="flex gap-3">
              <span className="w-40 shrink-0 font-medium text-[var(--color-ink)]">{role}</span>
              <span className="text-[var(--color-ink-dim)]">{desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
