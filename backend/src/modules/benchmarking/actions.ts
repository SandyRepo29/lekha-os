"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import * as svc from "@/backend/src/modules/benchmarking/benchmarking-service";
import * as aiSvc from "@/backend/src/modules/benchmarking/ai-benchmarking-service";

const PATH = "/benchmarking";

function getOrgId(session: Awaited<ReturnType<typeof requireUser>>) {
  if (!session.org) throw new Error("No org");
  return session.org.id;
}

export async function getDashboardAction() {
  const session = await requireUser();
  return svc.getDashboardData(getOrgId(session));
}

export async function computeBenchmarkAction() {
  const session = await requireUser();
  const orgId = getOrgId(session);
  try {
    const result = await svc.computeAndSaveBenchmark(orgId, session.id);
    revalidatePath(PATH);
    return { ok: true, result };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function generateReportAction() {
  const session = await requireUser();
  const orgId = getOrgId(session);
  const { snapshot, scores } = await svc.getDashboardData(orgId);
  return aiSvc.generateBenchmarkReport(orgId, snapshot, scores);
}

export async function generateInsightsAction() {
  const session = await requireUser();
  const orgId = getOrgId(session);
  const { snapshot, scores } = await svc.getDashboardData(orgId);
  return aiSvc.generateIndustryInsights(orgId, snapshot?.industry ?? "all", scores);
}

export async function generateImprovementPlanAction() {
  const session = await requireUser();
  const orgId = getOrgId(session);
  const { scores } = await svc.getDashboardData(orgId);
  return aiSvc.generateImprovementPlan(orgId, scores);
}

export async function chatAction(
  context: Parameters<typeof aiSvc.chat>[1],
  messages: Parameters<typeof aiSvc.chat>[2]
) {
  const session = await requireUser();
  return aiSvc.chat(getOrgId(session), context, messages);
}
