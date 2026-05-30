import { eq } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { profiles, organizations, memberships } from "@/lib/db/schema";

export async function findProfile(userId: string) {
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return row ?? null;
}

export async function updateProfile(
  userId: string,
  values: { fullName?: string | null },
  exec: Executor = db
): Promise<void> {
  await exec.update(profiles).set(values).where(eq(profiles.id, userId));
}

export async function updateOrganization(
  orgId: string,
  values: { name?: string },
  exec: Executor = db
): Promise<void> {
  await exec
    .update(organizations)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(organizations.id, orgId));
}

export type OrgWithRole = {
  id: string; name: string; slug: string; role: string; memberCount: number;
};

export async function getOrgWithMemberCount(orgId: string): Promise<OrgWithRole | null> {
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  if (!org) return null;

  const members = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.organizationId, orgId));

  const [me] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(eq(memberships.organizationId, orgId))
    .limit(1);

  return { id: org.id, name: org.name, slug: org.slug, role: me?.role ?? "member", memberCount: members.length };
}
