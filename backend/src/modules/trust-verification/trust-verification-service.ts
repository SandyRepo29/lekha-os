"use server";

import * as repo from "@/backend/src/modules/trust-verification/trust-verification-repo";
import { createHash, randomBytes } from "crypto";
import { computeVerificationReadiness } from "@/backend/src/modules/trust-verification/verification-readiness";

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardData(orgId: string) {
  const [metrics, programs, badges, certs, recentEvents] = await Promise.all([
    repo.getDashboardMetrics(orgId),
    repo.findAllPrograms(orgId),
    repo.findBadgesByOrg(orgId),
    repo.findCertificatesByOrg(orgId),
    repo.findRecentEvents(orgId, 10),
  ]);
  return { metrics, programs, badges, certs, recentEvents };
}

// ── Programs ──────────────────────────────────────────────────────────────────

export async function getPrograms(orgId: string) {
  return repo.findAllPrograms(orgId);
}

export async function createProgram(orgId: string, userId: string, data: {
  name: string; description?: string; minTrustScore?: number;
  minControlHealth?: number; minEvidenceCoverage?: number;
  requirements?: Array<{ id: string; label: string }>;
  reviewFrequency?: string; validityMonths?: number;
}) {
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + randomBytes(3).toString("hex");
  const prog = await repo.insertProgram({
    organizationId: orgId,
    name: data.name,
    slug,
    description: data.description,
    programType: "custom",
    status: "active",
    minTrustScore: data.minTrustScore ?? 80,
    minControlHealth: data.minControlHealth ?? 75,
    minEvidenceCoverage: data.minEvidenceCoverage ?? 75,
    requirements: data.requirements ?? [],
    reviewFrequency: (data.reviewFrequency ?? "annual") as any,
    validityMonths: data.validityMonths ?? 12,
    createdBy: userId,
  });
  await repo.recordEvent(orgId, { eventType: "program.created", actorId: userId, details: { name: data.name } });
  return prog;
}

// ── Verifications (Applications) ─────────────────────────────────────────────

export async function getVerifications(orgId: string, status?: string) {
  return repo.findAllVerifications(orgId, status);
}

export async function getVerificationById(orgId: string, id: string) {
  const [verification, reviews, evidence, assessment, decisions] = await Promise.all([
    repo.findVerificationById(orgId, id),
    repo.findReviewsByVerification(orgId, id),
    repo.findEvidenceByVerification(orgId, id),
    repo.findAssessmentByVerification(orgId, id),
    repo.findDecisionsByVerification(orgId, id),
  ]);
  if (!verification) return null;
  return { verification, reviews, evidence, assessment, decisions };
}

export async function applyForVerification(orgId: string, userId: string, data: {
  programId: string;
  trustScore?: number;
  readinessInputs?: Parameters<typeof computeVerificationReadiness>[0];
}) {
  const program = await repo.findProgramById(data.programId);
  if (!program) throw new Error("Program not found");

  const readinessScore = data.readinessInputs
    ? computeVerificationReadiness(data.readinessInputs).score
    : data.trustScore ?? 0;

  const verification = await repo.insertVerification({
    organizationId: orgId,
    programId: data.programId,
    status: "pending",
    verificationLevel: "level_1",
    readinessScore,
    trustScoreAtApply: data.trustScore,
    applicantId: userId,
    appliedAt: new Date(),
  });

  // auto-create initial review
  await repo.insertReview({
    organizationId: orgId,
    verificationId: verification.id,
    reviewType: "initial",
    status: "pending",
    dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split("T")[0] as any,
  });

  await repo.recordEvent(orgId, { verificationId: verification.id, eventType: "verification.created", actorId: userId, details: { program: program.name } });
  return verification;
}

export async function startReview(orgId: string, userId: string, verificationId: string) {
  const v = await repo.updateVerification(orgId, verificationId, { status: "in_review", reviewStartedAt: new Date() });
  await repo.recordEvent(orgId, { verificationId, eventType: "verification.review_started", actorId: userId });
  return v;
}

export async function makeDecision(orgId: string, userId: string, verificationId: string, data: {
  decision: string; rationale?: string; conditions?: string[];
}) {
  const v = await repo.findVerificationById(orgId, verificationId);
  if (!v) throw new Error("Verification not found");
  const program = await repo.findProgramById(v.programId);

  await repo.insertDecision({
    organizationId: orgId, verificationId, decision: data.decision as any,
    decidedBy: userId, rationale: data.rationale, conditions: data.conditions ?? [],
    effectiveDate: new Date().toISOString().split("T")[0] as any,
  });

  const now = new Date();
  const expiresAt = program
    ? new Date(now.getTime() + program.validityMonths * 30 * 24 * 3600 * 1000)
    : new Date(now.getTime() + 365 * 24 * 3600 * 1000);

  await repo.updateVerification(orgId, verificationId, {
    status: data.decision as any,
    decidedAt: now,
    expiresAt: data.decision === "approved" ? expiresAt : undefined,
    decisionNotes: data.rationale,
    conditions: data.conditions ?? [],
  });

  // Issue certificate + badge if approved
  if (data.decision === "approved") {
    const cert = await issueCertificate(orgId, userId, verificationId);
    await repo.recordEvent(orgId, { verificationId, eventType: "verification.approved", actorId: userId, details: { certNumber: cert.certificateNumber } });
  } else {
    await repo.recordEvent(orgId, { verificationId, eventType: `verification.${data.decision}`, actorId: userId, details: { rationale: data.rationale } });
  }
}

// ── Certificates ──────────────────────────────────────────────────────────────

async function issueCertificate(orgId: string, userId: string, verificationId: string) {
  const v = await repo.findVerificationById(orgId, verificationId);
  const program = v ? await repo.findProgramById(v.programId) : null;

  const year = new Date().getFullYear();
  const seq = randomBytes(3).toString("hex").toUpperCase();
  const certNumber = `AUDT-${year}-${seq}`;
  const hash = createHash("sha256").update(`${certNumber}-${orgId}-${Date.now()}`).digest("hex").slice(0, 16);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://audt.tech";
  const publicUrl = `${siteUrl}/verify/${certNumber}`;

  const expiresAt = v?.expiresAt ?? new Date(Date.now() + 365 * 24 * 3600 * 1000);

  const cert = await repo.insertCertificate({
    organizationId: orgId,
    verificationId,
    programId: v!.programId,
    certificateNumber: certNumber,
    verificationLevel: v?.verificationLevel ?? "level_1",
    status: "active",
    issuedAt: new Date(),
    expiresAt,
    verificationHash: hash,
    publicUrl,
    qrData: publicUrl,
    issuedBy: userId,
    certificateData: { programName: program?.name, hash, issuedBy: userId },
  });

  // publish to registry
  await repo.upsertRegistry({
    organizationId: orgId,
    certificateId: cert.id,
    displayName: orgId,
    programName: program?.name ?? "AUDT Verified™",
    verificationLevel: cert.verificationLevel,
    badgeTypes: [program?.slug ?? "audt-verified"],
    isPublic: true,
    publishedAt: new Date(),
    expiresAt,
  });

  // issue badge
  await repo.insertBadge({
    organizationId: orgId,
    verificationId,
    programId: v!.programId,
    badgeType: "audt_verified",
    name: program?.name ?? "AUDT Verified™",
    status: "active",
    issuedAt: new Date(),
    expiresAt,
    issuedBy: userId,
  });

  // update verification with cert ref
  await repo.updateVerification(orgId, verificationId, { certificateId: cert.id });

  // schedule renewal
  const renewalDate = new Date(expiresAt.getTime() - 30 * 24 * 3600 * 1000);
  await repo.insertRenewal({
    organizationId: orgId,
    verificationId,
    certificateId: cert.id,
    status: "upcoming",
    renewalDueDate: renewalDate.toISOString().split("T")[0] as any,
  });

  return cert;
}

export async function getCertificates(orgId: string) {
  return repo.findCertificatesByOrg(orgId);
}

export async function revokeCertificate(orgId: string, userId: string, certId: string, reason: string) {
  const cert = await repo.updateCertificate(orgId, certId, { status: "revoked", revokedAt: new Date(), revocationReason: reason });
  await repo.recordEvent(orgId, { eventType: "certificate.revoked", actorId: userId, details: { certId, reason } });
  return cert;
}

// ── Evidence ──────────────────────────────────────────────────────────────────

export async function submitEvidence(orgId: string, userId: string, verificationId: string, data: {
  title: string; evidenceType?: string; description?: string; fileUrl?: string; sourceId?: string; sourceTable?: string;
}) {
  const ev = await repo.insertEvidence({
    organizationId: orgId, verificationId,
    evidenceType: (data.evidenceType ?? "policy") as any,
    title: data.title, description: data.description,
    fileUrl: data.fileUrl, sourceId: data.sourceId, sourceTable: data.sourceTable,
    status: "pending", submittedBy: userId, submittedAt: new Date(),
  });
  await repo.recordEvent(orgId, { verificationId, eventType: "evidence.submitted", actorId: userId, details: { title: data.title } });
  return ev;
}

export async function reviewEvidence(orgId: string, userId: string, evidenceId: string, status: "accepted" | "rejected" | "requires_update", notes?: string) {
  return repo.updateEvidence(orgId, evidenceId, { status, reviewerNotes: notes, reviewedBy: userId, reviewedAt: new Date() });
}

// ── Public verification lookup ────────────────────────────────────────────────

export async function lookupCertificate(certNumber: string) {
  const cert = await repo.findCertificateByNumber(certNumber);
  if (!cert) return null;
  const program = await repo.findProgramById(cert.programId);
  return { cert, program };
}

// ── Registry ──────────────────────────────────────────────────────────────────

export async function getPublicRegistry(filters?: { industry?: string; country?: string; minScore?: number }) {
  return repo.findPublicRegistry(filters);
}

export async function getOrgRegistry(orgId: string) {
  return repo.findRegistryByOrg(orgId);
}

// ── Renewals ──────────────────────────────────────────────────────────────────

export async function getRenewals(orgId: string) {
  return repo.findRenewalsByOrg(orgId);
}

export async function startRenewal(orgId: string, userId: string, renewalId: string) {
  const renewal = await repo.updateRenewal(orgId, renewalId, { status: "in_progress", startedAt: new Date() });
  await repo.recordEvent(orgId, { verificationId: renewal.verificationId, eventType: "renewal.started", actorId: userId });
  return renewal;
}

// ── Monitoring ────────────────────────────────────────────────────────────────

export async function getMonitoringData(orgId: string) {
  const [certs, badges, events] = await Promise.all([
    repo.findCertificatesByOrg(orgId),
    repo.findBadgesByOrg(orgId),
    repo.findRecentEvents(orgId, 20),
  ]);
  const active = certs.filter(c => c.status === "active").length;
  const expiringSoon = certs.filter(c => {
    if (c.status !== "active" || !c.expiresAt) return false;
    return new Date(c.expiresAt).getTime() - Date.now() < 30 * 24 * 3600 * 1000;
  }).length;
  return { certs, badges, events, active, expiringSoon };
}

// ── Trust Passport ────────────────────────────────────────────────────────────

export async function getTrustPassport(orgId: string) {
  const [certs, badges, registry, renewals] = await Promise.all([
    repo.findCertificatesByOrg(orgId),
    repo.findBadgesByOrg(orgId),
    repo.findRegistryByOrg(orgId),
    repo.findRenewalsByOrg(orgId),
  ]);
  const activeCerts = certs.filter(c => c.status === "active");
  const activeBadges = badges.filter(b => b.status === "active");
  return { activeCerts, activeBadges, registry, renewals, allCerts: certs };
}
