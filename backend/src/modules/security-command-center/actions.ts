"use server";

import { requireUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import * as svc from "@/backend/src/modules/security-command-center/security-service";

const PATH = "/security-center";

// â”€â”€â”€ MFA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function updateMfaSettingsAction(_: unknown, formData: FormData) {
  try {
    const session = await requireUser();
    await svc.updateMfaSettings(session.org?.id ?? "", session.id, {
      enforcementMode:    formData.get("enforcementMode") as string,
      allowRememberDevice: formData.get("allowRememberDevice") === "true",
      rememberDays:       Number(formData.get("rememberDays") ?? 30),
      requireOnNewDevice: formData.get("requireOnNewDevice") === "true",
    });
    revalidatePath(`${PATH}/identity`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update MFA settings." };
  }
}

// â”€â”€â”€ SSO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createSsoProviderAction(_: unknown, formData: FormData) {
  try {
    const session = await requireUser();
    await svc.createSsoProvider(session.org?.id ?? "", session.id, {
      name:            (formData.get("name") as string) ?? "",
      providerType:    (formData.get("providerType") as string) ?? "saml2",
      samlMetadataUrl: formData.get("samlMetadataUrl") as string || undefined,
      samlEntityId:    formData.get("samlEntityId") as string || undefined,
      samlAcsUrl:      formData.get("samlAcsUrl") as string || undefined,
      oidcClientId:    formData.get("oidcClientId") as string || undefined,
      oidcIssuerUrl:   formData.get("oidcIssuerUrl") as string || undefined,
      oidcScopes:      formData.get("oidcScopes") as string || undefined,
      jitEnabled:      formData.get("jitEnabled") !== "false",
      defaultRole:     (formData.get("defaultRole") as string) ?? "member",
    });
    revalidatePath(`${PATH}/identity`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create SSO provider." };
  }
}

export async function toggleSsoAction(id: string, enabled: boolean) {
  try {
    const session = await requireUser();
    await svc.toggleSso(session.org?.id ?? "", id, enabled);
    revalidatePath(`${PATH}/identity`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function deleteSsoAction(id: string) {
  try {
    const session = await requireUser();
    await svc.deleteSso(session.org?.id ?? "", id);
    revalidatePath(`${PATH}/identity`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

// â”€â”€â”€ Sessions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function revokeSessionAction(sessionId: string) {
  try {
    const session = await requireUser();
    await svc.revokeSession(session.org?.id ?? "", sessionId, session.id);
    revalidatePath(`${PATH}/sessions`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function revokeAllSessionsAction(targetUserId: string) {
  try {
    const session = await requireUser();
    await svc.revokeAllUserSessions(session.org?.id ?? "", targetUserId, session.id);
    revalidatePath(`${PATH}/sessions`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

// â”€â”€â”€ IP Allow Lists â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function addIpRuleAction(_: unknown, formData: FormData) {
  try {
    const session = await requireUser();
    await svc.addIpRule(session.org?.id ?? "", session.id, {
      cidrRange:   (formData.get("cidrRange") as string) ?? "",
      description: (formData.get("description") as string) ?? "",
      appliesTo:   (formData.get("appliesTo") as string) ?? "all",
    });
    revalidatePath(`${PATH}/access`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add IP rule." };
  }
}

export async function deleteIpRuleAction(id: string) {
  try {
    const session = await requireUser();
    await svc.deleteIpRule(session.org?.id ?? "", id);
    revalidatePath(`${PATH}/access`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

// â”€â”€â”€ Evidence Shares â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createEvidenceShareAction(_: unknown, formData: FormData) {
  try {
    const session = await requireUser();
    await svc.createEvidenceShare(session.org?.id ?? "", session.id, {
      recipientEmail: formData.get("recipientEmail") as string || undefined,
      recipientName:  formData.get("recipientName") as string || undefined,
      accessLevel:    (formData.get("accessLevel") as string) ?? "view_only",
      watermark:      formData.get("watermark") !== "false",
      expiryDays:     Number(formData.get("expiryDays") ?? 7),
    });
    revalidatePath(`${PATH}/evidence`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create share." };
  }
}

export async function revokeShareAction(id: string) {
  try {
    const session = await requireUser();
    await svc.revokeShare(session.org?.id ?? "", id);
    revalidatePath(`${PATH}/evidence`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

// â”€â”€â”€ Encryption â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function addEncryptionProviderAction(_: unknown, formData: FormData) {
  try {
    const session = await requireUser();
    await svc.addEncryptionProvider(session.org?.id ?? "", session.id, {
      name:         (formData.get("name") as string) ?? "",
      providerType: (formData.get("providerType") as string) ?? "aws_kms",
      awsRegion:    formData.get("awsRegion") as string || undefined,
      awsKeyId:     formData.get("awsKeyId") as string || undefined,
      azureVaultUrl:formData.get("azureVaultUrl") as string || undefined,
      azureTenantId:formData.get("azureTenantId") as string || undefined,
      gcpProject:   formData.get("gcpProject") as string || undefined,
      gcpLocation:  formData.get("gcpLocation") as string || undefined,
      gcpKeyRing:   formData.get("gcpKeyRing") as string || undefined,
      gcpCryptoKey: formData.get("gcpCryptoKey") as string || undefined,
    });
    revalidatePath(`${PATH}/encryption`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function removeEncryptionProviderAction(id: string) {
  try {
    const session = await requireUser();
    await svc.removeEncryptionProvider(session.org?.id ?? "", id);
    revalidatePath(`${PATH}/encryption`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

// â”€â”€â”€ Trust Center â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function updateTrustCenterAction(_: unknown, formData: FormData) {
  try {
    const session = await requireUser();
    await svc.updateTrustCenterConfig(session.org?.id ?? "", {
      title:              formData.get("title"),
      tagline:            formData.get("tagline"),
      description:        formData.get("description"),
      securityEmail:      formData.get("securityEmail"),
      showTrustScore:     formData.get("showTrustScore") === "true",
      showCertifications: formData.get("showCertifications") === "true",
      showDocuments:      formData.get("showDocuments") === "true",
      enabled:            formData.get("enabled") === "true",
    });
    revalidatePath(`${PATH}/trust-center`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

// â”€â”€â”€ Vendor Monitoring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function addMonitoringAssetAction(_: unknown, formData: FormData) {
  try {
    const session = await requireUser();
    await svc.addMonitoringAsset(session.org?.id ?? "", session.id, {
      assetType:     (formData.get("assetType") as string) ?? "domain",
      assetValue:    (formData.get("assetValue") as string) ?? "",
      vendorId:      formData.get("vendorId") as string || undefined,
      checkInterval: (formData.get("checkInterval") as string) ?? "daily",
    });
    revalidatePath(`${PATH}/monitoring`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function acknowledgeAlertAction(id: string) {
  try {
    const session = await requireUser();
    await svc.acknowledgeAlert(session.org?.id ?? "", id, session.id);
    revalidatePath(`${PATH}/monitoring`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function resolveAlertAction(id: string) {
  try {
    const session = await requireUser();
    await svc.resolveAlert(session.org?.id ?? "", id);
    revalidatePath(`${PATH}/monitoring`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

// â”€â”€â”€ AI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function generateSecuritySummaryAction() {
  try {
    const session = await requireUser();
    const metrics = await (await import("@/backend/src/modules/security-command-center/security-service")).getDashboardData(session.org?.id ?? "");
    const m = metrics.metrics;
    const readiness = (await import("@/backend/src/modules/security-command-center/security-service")).computeSecurityReadiness(m);
    const ai = await import("@/backend/src/modules/security-command-center/ai-security-service");
    const summary = await ai.generateSecurityAdvisorySummary(session.org?.id ?? "", {
      ...m, score: readiness.score, level: readiness.level,
    });
    return { ok: true, summary };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function securityChatAction(messages: Array<{ role: string; content: string }>) {
  try {
    const session = await requireUser();
    const ai = await import("@/backend/src/modules/security-command-center/ai-security-service");
    const response = await ai.chat(session.org?.id ?? "", messages);
    return { ok: true, response };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

