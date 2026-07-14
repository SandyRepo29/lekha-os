import { db } from "@/lib/db";
import { organizationSettings } from "@/lib/db/schema";
import type { OrganizationSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

type Executor =
  | typeof db
  | PgTransaction<PostgresJsQueryResultHKT, ExtractTablesWithRelations<typeof schema>>;

export type OrgSettingsInput = {
  primaryColor?: string;
  accentColor?: string;
  reportFooter?: string | null;
  emailSignature?: string | null;
};

export async function findByOrg(orgId: string): Promise<OrganizationSettings | null> {
  const [row] = await db
    .select()
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, orgId))
    .limit(1);
  return row ?? null;
}

export async function upsert(
  orgId: string,
  values: OrgSettingsInput,
  exec: Executor = db
): Promise<void> {
  await exec
    .insert(organizationSettings)
    .values({ organizationId: orgId, ...values, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: organizationSettings.organizationId,
      set: { ...values, updatedAt: new Date() },
    });
}
