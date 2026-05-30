import { eq, and } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { memberships, profiles } from "@/lib/db/schema";

export type TeamMember = {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  joinedAt: Date;
};

export async function listMembers(orgId: string): Promise<TeamMember[]> {
  const rows = await db
    .select({
      membershipId: memberships.id,
      userId: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      role: memberships.role,
      isActive: memberships.isActive,
      joinedAt: memberships.createdAt,
    })
    .from(memberships)
    .innerJoin(profiles, eq(memberships.userId, profiles.id))
    .where(eq(memberships.organizationId, orgId))
    .orderBy(memberships.createdAt);

  return rows;
}

export async function updateMemberRole(
  membershipId: string,
  role: "owner" | "admin" | "member" | "viewer",
  exec: Executor = db
): Promise<void> {
  await exec.update(memberships).set({ role }).where(eq(memberships.id, membershipId));
}

export async function setMemberActive(
  membershipId: string,
  isActive: boolean,
  exec: Executor = db
): Promise<void> {
  await exec.update(memberships).set({ isActive }).where(eq(memberships.id, membershipId));
}

export async function findMembership(orgId: string, userId: string) {
  const [row] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.organizationId, orgId), eq(memberships.userId, userId)))
    .limit(1);
  return row ?? null;
}
