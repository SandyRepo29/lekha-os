import { eq } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { organizations, memberships } from "@/lib/db/schema";

export type ActiveOrg = { id: string; name: string; slug: string; role: string };

type IndustryType = "saas" | "it_services" | "fintech" | "healthcare" | "manufacturing" | "government" | "education" | "other";
type CompanySizeRange = "1_10" | "11_50" | "51_200" | "201_500" | "501_1000" | "1000_plus";

export async function insertOrganization(
  values: { name: string; slug: string; industry?: string; companySize?: string },
  exec: Executor = db
): Promise<{ id: string }> {
  const [org] = await exec
    .insert(organizations)
    .values({
      name: values.name,
      slug: values.slug,
      ...(values.industry ? { industry: values.industry as IndustryType } : {}),
      ...(values.companySize ? { companySize: values.companySize as CompanySizeRange } : {}),
    })
    .returning({ id: organizations.id });
  return org;
}

export async function insertMembership(
  values: { organizationId: string; userId: string; role: "owner" | "admin" | "member" | "viewer" },
  exec: Executor = db
): Promise<void> {
  await exec.insert(memberships).values(values);
}

/** The user's first organization + their role, or null if they have none. */
export async function findActiveOrgByUser(userId: string): Promise<ActiveOrg | null> {
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .where(eq(memberships.userId, userId))
    .limit(1);

  return rows[0] ?? null;
}
