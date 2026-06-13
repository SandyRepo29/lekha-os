"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import * as svc from "@/lib/services/trust-verification/trust-verification-service";
import * as ai from "@/lib/services/trust-verification/ai-trust-verification-service";

// ── Programs ──────────────────────────────────────────────────────────────────

export async function createProgramAction(_: unknown, fd: FormData) {
  const session = await requireUser();
  const orgId = session.org!.id;
  try {
    await svc.createProgram(orgId, session.id, {
      name: fd.get("name") as string,
      description: fd.get("description") as string || undefined,
      minTrustScore: Number(fd.get("minTrustScore") || 80),
      minControlHealth: Number(fd.get("minControlHealth") || 75),
      minEvidenceCoverage: Number(fd.get("minEvidenceCoverage") || 75),
      validityMonths: Number(fd.get("validityMonths") || 12),
      reviewFrequency: (fd.get("reviewFrequency") as string) || "annual",
    });
    revalidatePath("/trust-verification");
    revalidatePath("/trust-verification/programs");
    return { ok: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Applications ──────────────────────────────────────────────────────────────

export async function applyForVerificationAction(_: unknown, fd: FormData) {
  const session = await requireUser();
  const orgId = session.org!.id;
  try {
    const v = await svc.applyForVerification(orgId, session.id, {
      programId: fd.get("programId") as string,
      trustScore: Number(fd.get("trustScore") || 0),
    });
    revalidatePath("/trust-verification");
    revalidatePath("/trust-verification/applications");
    return { ok: true, id: v.id };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function startReviewAction(verificationId: string) {
  const session = await requireUser();
  const orgId = session.org!.id;
  try {
    await svc.startReview(orgId, session.id, verificationId);
    revalidatePath(`/trust-verification/applications/${verificationId}`);
    return { ok: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function makeDecisionAction(_: unknown, fd: FormData) {
  const session = await requireUser();
  const orgId = session.org!.id;
  try {
    await svc.makeDecision(orgId, session.id, fd.get("verificationId") as string, {
      decision: fd.get("decision") as string,
      rationale: fd.get("rationale") as string || undefined,
    });
    revalidatePath("/trust-verification");
    revalidatePath("/trust-verification/applications");
    revalidatePath(`/trust-verification/applications/${fd.get("verificationId")}`);
    revalidatePath("/trust-verification/certificates");
    return { ok: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Evidence ──────────────────────────────────────────────────────────────────

export async function submitEvidenceAction(_: unknown, fd: FormData) {
  const session = await requireUser();
  const orgId = session.org!.id;
  const verificationId = fd.get("verificationId") as string;
  try {
    await svc.submitEvidence(orgId, session.id, verificationId, {
      title: fd.get("title") as string,
      evidenceType: (fd.get("evidenceType") as string) || "policy",
      description: fd.get("description") as string || undefined,
    });
    revalidatePath(`/trust-verification/applications/${verificationId}`);
    return { ok: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function reviewEvidenceAction(evidenceId: string, status: "accepted" | "rejected" | "requires_update", notes?: string) {
  const session = await requireUser();
  const orgId = session.org!.id;
  try {
    await svc.reviewEvidence(orgId, session.id, evidenceId, status, notes);
    revalidatePath("/trust-verification/applications");
    return { ok: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Certificates ──────────────────────────────────────────────────────────────

export async function revokeCertificateAction(certId: string, reason: string) {
  const session = await requireUser();
  const orgId = session.org!.id;
  try {
    await svc.revokeCertificate(orgId, session.id, certId, reason);
    revalidatePath("/trust-verification/certificates");
    return { ok: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Renewals ──────────────────────────────────────────────────────────────────

export async function startRenewalAction(renewalId: string) {
  const session = await requireUser();
  const orgId = session.org!.id;
  try {
    await svc.startRenewal(orgId, session.id, renewalId);
    revalidatePath("/trust-verification/renewals");
    return { ok: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── AI ────────────────────────────────────────────────────────────────────────

export async function generatePlatformSummaryAction() {
  const session = await requireUser();
  const orgId = session.org!.id;
  const data = await svc.getDashboardData(orgId);
  return ai.generatePlatformSummary(orgId, {
    totalVerifications: data.metrics.total,
    approved: data.metrics.approved,
    pending: data.metrics.pending,
    activeCerts: data.certs.filter((c: any) => c.status === "active").length,
    activeBadges: data.badges.filter((b: any) => b.status === "active").length,
    expiringSoon: data.metrics.expiringSoon,
  });
}

export async function chatAction(messages: Array<{ role: "user" | "model"; content: string }>) {
  const session = await requireUser();
  const orgId = session.org!.id;
  const data = await svc.getDashboardData(orgId);
  return ai.chat(orgId, messages, {
    totalVerifications: data.metrics.total,
    approved: data.metrics.approved,
    activeCerts: data.certs.filter((c: any) => c.status === "active").length,
    activeBadges: data.badges.filter((b: any) => b.status === "active").length,
  });
}
