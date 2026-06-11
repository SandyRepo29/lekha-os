"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import * as svc from "@/lib/services/trust-network/trust-network-service";
import * as ai from "@/lib/services/trust-network/ai-trust-network-service";

function getOrgId(session: Awaited<ReturnType<typeof requireUser>>) {
  return session.org?.id ?? "";
}

export async function getNetworkDashboardAction() {
  const session = await requireUser();
  return svc.getNetworkDashboard(getOrgId(session));
}

export async function getPublicProfileAction() {
  const session = await requireUser();
  return svc.getPublicProfile(getOrgId(session));
}

export async function getNetworkDirectoryAction(filters?: { industry?: string; country?: string; minScore?: number }) {
  await requireUser();
  return svc.getNetworkDirectory(filters);
}

export async function getNetworkActivityAction() {
  const session = await requireUser();
  return svc.getNetworkActivity(getOrgId(session));
}

export async function getTrustRelationshipsAction() {
  const session = await requireUser();
  return svc.getTrustRelationships(getOrgId(session));
}

export async function followOrgAction(followingOrgId: string) {
  const session = await requireUser();
  await svc.followOrg(getOrgId(session), session.id, followingOrgId);
  revalidatePath("/trust-network");
  return { ok: true };
}

export async function unfollowOrgAction(followingOrgId: string) {
  const session = await requireUser();
  await svc.unfollowOrg(getOrgId(session), session.id, followingOrgId);
  revalidatePath("/trust-network");
  return { ok: true };
}

export async function generateNetworkSummaryAction(context: Parameters<typeof ai.generateNetworkSummary>[1]) {
  const session = await requireUser();
  return ai.generateNetworkSummary(getOrgId(session), context);
}

export async function generateNetworkRecommendationsAction(context: Parameters<typeof ai.generateNetworkRecommendations>[1]) {
  const session = await requireUser();
  return ai.generateNetworkRecommendations(getOrgId(session), context);
}

export async function chatAction(context: string, messages: { role: "user" | "assistant"; content: string }[]) {
  const session = await requireUser();
  return ai.chat(getOrgId(session), context, messages);
}
