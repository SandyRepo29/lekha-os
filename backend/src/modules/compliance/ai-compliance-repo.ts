import { and, eq } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import type { AiComplianceInsight } from "@/lib/db/schema";

export async function findInsight(
  orgId: string,
  insightType: string,
  targetId: string
): Promise<AiComplianceInsight | null> {
  const [row] = await db
    .select()
    .from(aiComplianceInsights)
    .where(
      and(
        eq(aiComplianceInsights.organizationId, orgId),
        eq(aiComplianceInsights.insightType, insightType),
        eq(aiComplianceInsights.targetId, targetId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function upsertInsight(
  values: {
    organizationId: string;
    insightType: string;
    targetId: string;
    content: string;
  },
  exec: Executor = db
): Promise<void> {
  await exec
    .insert(aiComplianceInsights)
    .values({ ...values, generatedAt: new Date() })
    .onConflictDoUpdate({
      target: [
        aiComplianceInsights.organizationId,
        aiComplianceInsights.insightType,
        aiComplianceInsights.targetId,
      ],
      set: { content: values.content, generatedAt: new Date() },
    });
}

export async function findAllByOrg(orgId: string): Promise<AiComplianceInsight[]> {
  return db
    .select()
    .from(aiComplianceInsights)
    .where(eq(aiComplianceInsights.organizationId, orgId));
}
