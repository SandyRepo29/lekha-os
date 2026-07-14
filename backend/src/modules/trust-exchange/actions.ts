"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import * as svc from "@/backend/src/modules/trust-exchange/trust-exchange-service";
import * as aiSvc from "@/backend/src/modules/trust-exchange/ai-trust-exchange-service";

const PATH = "/trust-exchange";

function getOrgId(session: Awaited<ReturnType<typeof requireUser>>) {
  if (!session.org) throw new Error("No org");
  return session.org.id;
}

export async function getProfileAction() {
  const session = await requireUser();
  return svc.getOrCreateProfile(getOrgId(session));
}

export async function updateProfileAction(_: unknown, formData: FormData) {
  const session = await requireUser();
  const orgId = getOrgId(session);
  const data = {
    displayName: formData.get("displayName") as string,
    tagline: (formData.get("tagline") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    industry: (formData.get("industry") as string) || undefined,
    companySize: (formData.get("companySize") as string) || undefined,
    country: (formData.get("country") as string) || undefined,
    website: (formData.get("website") as string) || undefined,
  };
  try {
    await svc.updateProfile(orgId, session.id, data);
    revalidatePath(PATH);
    return { ok: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function publishProfileAction() {
  const session = await requireUser();
  await svc.publishProfile(getOrgId(session), session.id);
  revalidatePath(PATH);
}

export async function unpublishProfileAction() {
  const session = await requireUser();
  await svc.unpublishProfile(getOrgId(session), session.id);
  revalidatePath(PATH);
}

export async function addDocumentAction(_: unknown, formData: FormData) {
  const session = await requireUser();
  const orgId = getOrgId(session);
  try {
    await svc.addDocument(orgId, session.id, {
      docType: (formData.get("docType") as string) || "custom",
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      fileName: (formData.get("fileName") as string) || undefined,
      issuedDate: (formData.get("issuedDate") as string) || undefined,
      expiryDate: (formData.get("expiryDate") as string) || undefined,
      issuer: (formData.get("issuer") as string) || undefined,
      visibility: (formData.get("visibility") as string) || "private",
    });
    revalidatePath(PATH);
    return { ok: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteDocumentAction(docId: string) {
  const session = await requireUser();
  await svc.deleteDocument(getOrgId(session), session.id, docId);
  revalidatePath(PATH);
}

export async function verifyDocumentAction(docId: string, notes?: string) {
  const session = await requireUser();
  try {
    await svc.verifyDocument(getOrgId(session), session.id, docId, notes);
    revalidatePath(PATH);
    return { ok: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function issueBadgeAction(_: unknown, formData: FormData) {
  const session = await requireUser();
  try {
    await svc.issueBadge(getOrgId(session), session.id, {
      badgeType: formData.get("badgeType") as string,
      label: formData.get("label") as string,
      description: (formData.get("description") as string) || undefined,
    });
    revalidatePath(PATH);
    return { ok: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function revokeBadgeAction(badgeId: string) {
  const session = await requireUser();
  await svc.revokeBadge(getOrgId(session), session.id, badgeId);
  revalidatePath(PATH);
}

export async function saveAnswersAction(_: unknown, formData: FormData) {
  const session = await requireUser();
  const orgId = getOrgId(session);
  const questionnaireId = formData.get("questionnaireId") as string;
  const visibility = (formData.get("visibility") as string) || "private";
  const answersJson = formData.get("answers") as string;
  try {
    const answers = JSON.parse(answersJson || "{}");
    await svc.saveAnswers(orgId, session.id, questionnaireId, answers, visibility);
    revalidatePath(PATH);
    return { ok: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function generateTrustSummaryAction() {
  const session = await requireUser();
  const orgId = getOrgId(session);
  const [metrics, profile] = await Promise.all([
    svc.getDashboardMetrics(orgId),
    svc.getOrCreateProfile(orgId),
  ]);
  return aiSvc.generateTrustSummary(orgId, {
    displayName: profile.displayName,
    trustScore: profile.trustScore,
    totalDocuments: metrics.totalDocuments,
    verifiedDocuments: metrics.verifiedDocuments,
    activeBadges: metrics.activeBadges,
    completedQuestionnaires: metrics.completedQuestionnaires,
    isPublished: metrics.isPublished,
    profileCompleteness: metrics.profileCompleteness,
  });
}

export async function chatAction(messages: Array<{ role: "user" | "model"; text: string }>) {
  const session = await requireUser();
  const orgId = getOrgId(session);
  const [metrics, profile] = await Promise.all([
    svc.getDashboardMetrics(orgId),
    svc.getOrCreateProfile(orgId),
  ]);
  return aiSvc.chat(
    orgId,
    {
      displayName: profile.displayName,
      trustScore: profile.trustScore,
      totalDocuments: metrics.totalDocuments,
      verifiedDocuments: metrics.verifiedDocuments,
      activeBadges: metrics.activeBadges,
      completedQuestionnaires: metrics.completedQuestionnaires,
      isPublished: metrics.isPublished,
    },
    messages
  );
}
