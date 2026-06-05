import { eq } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { profiles, organizations, memberships } from "@/lib/db/schema";

export async function upsertProfile(
  userId: string,
  email: string,
  exec: Executor = db
): Promise<void> {
  await exec
    .insert(profiles)
    .values({ id: userId, email })
    .onConflictDoNothing();
}

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
  values: {
    fullName?: string | null;
    jobTitle?: string | null;
    department?: string | null;
    phone?: string | null;
    timezone?: string | null;
    language?: string | null;
    avatarUrl?: string | null;
  },
  exec: Executor = db
): Promise<void> {
  await exec.update(profiles).set(values).where(eq(profiles.id, userId));
}

export async function updateOrganization(
  orgId: string,
  values: {
    name?: string;
    legalName?: string | null;
    industry?: string | null;
    companySize?: string | null;
    website?: string | null;
    country?: string | null;
    state?: string | null;
    timezone?: string | null;
    logoUrl?: string | null;
  },
  exec: Executor = db
): Promise<void> {
  await exec
    .update(organizations)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set({ ...values, updatedAt: new Date() } as any)
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
