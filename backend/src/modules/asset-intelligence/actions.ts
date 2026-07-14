"use server";

import { requireUser } from "@/lib/auth/session";
import * as svc from "@/backend/src/modules/asset-intelligence/asset-service";
import * as aiSvc from "@/backend/src/modules/asset-intelligence/ai-asset-service";
import { revalidatePath } from "next/cache";
import { checkPlanLimit } from "@/backend/src/modules/billing/billing-service";

function getOrgId(session: Awaited<ReturnType<typeof requireUser>>) {
  return session.org?.id ?? "";
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardDataAction() {
  const session = await requireUser();
  const orgId = getOrgId(session);
  return svc.getDashboardData(orgId);
}

// ─── Asset CRUD ──────────────────────────────────────────────────────────────

export async function getAssetsAction(filters?: { type?: string; criticality?: string; status?: string; environment?: string }) {
  const session = await requireUser();
  const orgId = getOrgId(session);
  return svc.getAssets(orgId, filters ?? {});
}

export async function getAssetAction(id: string) {
  const session = await requireUser();
  const orgId = getOrgId(session);
  return svc.getAsset(orgId, id);
}

export async function createAssetAction(_prev: unknown, formData: FormData) {
  const session = await requireUser();
  const orgId = getOrgId(session);

  const data = {
    name:             formData.get("name") as string,
    description:      formData.get("description") as string | undefined,
    assetType:        (formData.get("assetType") as string) || "application",
    category:         formData.get("category") as string | undefined,
    status:           (formData.get("status") as string) || "active",
    environment:      (formData.get("environment") as string) || "production",
    criticality:      (formData.get("criticality") as string) || "medium",
    dataClass:        (formData.get("dataClass") as string) || undefined,
    ownerId:          formData.get("ownerId") as string | undefined || undefined,
    businessUnit:     formData.get("businessUnit") as string | undefined,
    location:         formData.get("location") as string | undefined,
    cloudProvider:    formData.get("cloudProvider") as string | undefined,
    technologyStack:  formData.get("technologyStack") as string | undefined,
    containsPii:      formData.get("containsPii") === "true",
    containsSensitive: formData.get("containsSensitive") === "true",
    notes:            formData.get("notes") as string | undefined,
  };

  if (!data.name) return { error: "Asset name is required" };

  try {
    await checkPlanLimit(orgId, "assets");
    const asset = await svc.createAsset(orgId, session.id, data);
    revalidatePath("/asset-intelligence");
    return { data: asset };
  } catch (e: any) {
    return { error: e.message ?? "Failed to create asset" };
  }
}

export async function updateAssetAction(id: string, formData: FormData) {
  const session = await requireUser();
  const orgId = getOrgId(session);

  try {
    const asset = await svc.updateAsset(orgId, id, {
      name:           formData.get("name") as string,
      description:    formData.get("description") as string,
      status:         formData.get("status") as any,
      criticality:    formData.get("criticality") as any,
      environment:    formData.get("environment") as any,
      dataClass:      formData.get("dataClass") as any || undefined,
      businessUnit:   formData.get("businessUnit") as string,
      location:       formData.get("location") as string,
      cloudProvider:  formData.get("cloudProvider") as string,
      technologyStack: formData.get("technologyStack") as string,
      containsPii:    formData.get("containsPii") === "true",
      notes:          formData.get("notes") as string,
    });
    revalidatePath("/asset-intelligence");
    return { data: asset };
  } catch (e: any) {
    return { error: e.message ?? "Failed to update asset" };
  }
}

export async function deleteAssetAction(id: string) {
  const session = await requireUser();
  const orgId = getOrgId(session);
  try {
    await svc.deleteAsset(orgId, id);
    revalidatePath("/asset-intelligence");
    return { data: true };
  } catch (e: any) {
    return { error: e.message ?? "Failed to delete asset" };
  }
}

// ─── Relationships ────────────────────────────────────────────────────────────

export async function getRelationshipsAction() {
  const session = await requireUser();
  const orgId = getOrgId(session);
  return svc.getRelationships(orgId);
}

export async function createRelationshipAction(formData: FormData) {
  const session = await requireUser();
  const orgId = getOrgId(session);

  try {
    const rel = await svc.createRelationship(orgId, session.id, {
      sourceAssetId:    formData.get("sourceAssetId") as string,
      targetAssetId:    formData.get("targetAssetId") as string | undefined || undefined,
      targetEntityType: formData.get("targetEntityType") as string | undefined,
      relationshipType: formData.get("relationshipType") as string,
      description:      formData.get("description") as string | undefined,
      isCritical:       formData.get("isCritical") === "true",
    });
    revalidatePath("/asset-intelligence/relationships");
    return { data: rel };
  } catch (e: any) {
    return { error: e.message ?? "Failed to create relationship" };
  }
}

export async function removeRelationshipAction(id: string) {
  const session = await requireUser();
  const orgId = getOrgId(session);
  try {
    await svc.removeRelationship(orgId, id);
    revalidatePath("/asset-intelligence/relationships");
    return { data: true };
  } catch (e: any) {
    return { error: e.message ?? "Failed to remove relationship" };
  }
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function addReviewAction(assetId: string, formData: FormData) {
  const session = await requireUser();
  const orgId = getOrgId(session);
  try {
    const review = await svc.addReview(orgId, assetId, session.id, {
      outcome:         formData.get("outcome") as string,
      findings:        formData.get("findings") as string | undefined,
      recommendations: formData.get("recommendations") as string | undefined,
    });
    revalidatePath("/asset-intelligence");
    return { data: review };
  } catch (e: any) {
    return { error: e.message ?? "Failed to add review" };
  }
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export async function resolveAlertAction(id: string) {
  const session = await requireUser();
  const orgId = getOrgId(session);
  try {
    const alert = await svc.resolveAlert(orgId, id, session.id);
    revalidatePath("/asset-intelligence");
    return { data: alert };
  } catch (e: any) {
    return { error: e.message ?? "Failed to resolve alert" };
  }
}

// ─── Score ────────────────────────────────────────────────────────────────────

export async function computeScoreAction(assetId: string) {
  const session = await requireUser();
  const orgId = getOrgId(session);
  try {
    const score = await svc.computeAndSaveAssetScore(orgId, assetId);
    revalidatePath("/asset-intelligence");
    return { data: score };
  } catch (e: any) {
    return { error: e.message ?? "Failed to compute score" };
  }
}

// ─── AI Actions ───────────────────────────────────────────────────────────────

export async function generateAdvisorySummaryAction() {
  const session = await requireUser();
  const orgId = getOrgId(session);
  const { metrics, byType } = await svc.getDashboardData(orgId);
  const topTypes = byType.slice(0, 4).map((r: any) => r.type as string);
  return aiSvc.generateAdvisorySummary(orgId, {
    totalAssets:    metrics.totalAssets,
    criticalAssets: metrics.criticalAssets,
    openAlerts:     metrics.openAlerts,
    assetsWithPii:  metrics.assetsWithPii,
    topTypes,
  });
}

export async function chatAction(messages: Array<{ role: "user" | "model"; content: string }>) {
  const session = await requireUser();
  const orgId = getOrgId(session);
  const { metrics } = await svc.getDashboardData(orgId);
  return aiSvc.chat(orgId, messages, {
    totalAssets:    metrics.totalAssets,
    criticalAssets: metrics.criticalAssets,
    openAlerts:     metrics.openAlerts,
    assetsWithPii:  metrics.assetsWithPii,
  });
}
