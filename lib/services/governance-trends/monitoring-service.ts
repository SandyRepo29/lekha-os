import { db } from "@/lib/db";
import { evidence, controls, risks, auditFindings, correctiveActions, policies, vendors, policyAttestations, consentRecords, privacyRequests, dataAssets, dataTransfers, privacyTrustScores, contracts, contractObligations } from "@/lib/db/schema";
import { eq, and, lt, lte, sql, desc } from "drizzle-orm";
import {
  insertAlert,
  findExistingAlert,
  resolveAlertsByType,
} from "@/lib/repositories/governance-alerts-repo";

type AlertInput = {
  organizationId: string;
  type: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  entityType?: "vendor" | "risk" | "control" | "audit" | "evidence" | "policy" | "framework" | "organization";
  entityId?: string;
};

async function maybeInsert(alert: AlertInput) {
  const exists = await findExistingAlert(alert.organizationId, alert.type, alert.entityId);
  if (exists) return;
  await insertAlert(alert);
}

export async function runMonitoringRules(orgId: string): Promise<{ created: number }> {
  let created = 0;
  const today = new Date();
  const in30Days = new Date(today);
  in30Days.setDate(in30Days.getDate() + 30);
  const todayStr = today.toISOString().split("T")[0];
  const in30Str = in30Days.toISOString().split("T")[0];

  // ── 1. Expired evidence ───────────────────────────────────────────────────
  const expiredEvidence = await db
    .select({ id: evidence.id, title: evidence.title })
    .from(evidence)
    .where(
      and(
        eq(evidence.organizationId, orgId),
        sql`${evidence.status} IN ('approved', 'pending_review')`,
        sql`${evidence.expiresOn} IS NOT NULL`,
        sql`${evidence.expiresOn} < ${todayStr}`
      )
    );

  for (const ev of expiredEvidence) {
    const exists = await findExistingAlert(orgId, "evidence_expired", ev.id);
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "evidence_expired",
        severity: "high",
        title: `Evidence expired: ${ev.title}`,
        description: `Evidence item "${ev.title}" has expired and may no longer satisfy its mapped controls.`,
        entityType: "evidence",
        entityId: ev.id,
      });
      created++;
    }
  }

  // ── 2. Evidence expiring within 30 days ──────────────────────────────────
  const expiringEvidence = await db
    .select({ id: evidence.id, title: evidence.title, expiresOn: evidence.expiresOn })
    .from(evidence)
    .where(
      and(
        eq(evidence.organizationId, orgId),
        sql`${evidence.status} IN ('approved', 'pending_review')`,
        sql`${evidence.expiresOn} >= ${todayStr}`,
        sql`${evidence.expiresOn} <= ${in30Str}`
      )
    );

  for (const ev of expiringEvidence) {
    const exists = await findExistingAlert(orgId, "evidence_expiring_soon", ev.id);
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "evidence_expiring_soon",
        severity: "medium",
        title: `Evidence expiring soon: ${ev.title}`,
        description: `Evidence item "${ev.title}" will expire on ${ev.expiresOn}.`,
        entityType: "evidence",
        entityId: ev.id,
      });
      created++;
    }
  }

  // ── 3. Critical control health drop ──────────────────────────────────────
  const criticalControls = await db
    .select({ id: controls.id, name: controls.name, healthScore: controls.healthScore })
    .from(controls)
    .where(
      and(
        eq(controls.organizationId, orgId),
        sql`${controls.healthScore} IS NOT NULL`,
        sql`${controls.healthScore} < 40`
      )
    );

  for (const ctrl of criticalControls) {
    const exists = await findExistingAlert(orgId, "control_critical_health", ctrl.id);
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "control_critical_health",
        severity: "critical",
        title: `Critical control health: ${ctrl.name}`,
        description: `Control "${ctrl.name}" has a health score of ${ctrl.healthScore}/100 (critical). Immediate attention required.`,
        entityType: "control",
        entityId: ctrl.id,
      });
      created++;
    }
  }

  // ── 4. New critical risks ────────────────────────────────────────────────
  const criticalRisks = await db
    .select({ id: risks.id, title: risks.title, inherentScore: risks.inherentScore })
    .from(risks)
    .where(
      and(
        eq(risks.organizationId, orgId),
        sql`${risks.inherentScore} >= 20`,
        sql`${risks.status} NOT IN ('closed', 'archived', 'accepted', 'transferred')`
      )
    );

  for (const risk of criticalRisks) {
    const exists = await findExistingAlert(orgId, "critical_risk_open", risk.id);
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "critical_risk_open",
        severity: "critical",
        title: `Critical risk open: ${risk.title}`,
        description: `Risk "${risk.title}" has a score of ${risk.inherentScore}/25 and is not yet mitigated.`,
        entityType: "risk",
        entityId: risk.id,
      });
      created++;
    }
  }

  // ── 5. Open critical audit findings ─────────────────────────────────────
  const criticalFindings = await db
    .select({ id: auditFindings.id, title: auditFindings.title })
    .from(auditFindings)
    .where(
      and(
        eq(auditFindings.organizationId, orgId),
        eq(auditFindings.severity, "critical"),
        sql`${auditFindings.status} NOT IN ('closed', 'accepted')`
      )
    );

  for (const finding of criticalFindings) {
    const exists = await findExistingAlert(orgId, "critical_finding_open", finding.id);
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "critical_finding_open",
        severity: "high",
        title: `Critical finding unresolved: ${finding.title}`,
        description: `Audit finding "${finding.title}" is critical severity and remains open.`,
        entityType: "audit",
        entityId: finding.id,
      });
      created++;
    }
  }

  // ── 6. Overdue CAPAs ─────────────────────────────────────────────────────
  const overdueCAPAs = await db
    .select({ id: correctiveActions.id, title: correctiveActions.title })
    .from(correctiveActions)
    .where(
      and(
        eq(correctiveActions.organizationId, orgId),
        sql`${correctiveActions.status} IN ('open', 'in_progress')`,
        sql`${correctiveActions.dueDate} < ${todayStr}`
      )
    );

  if (overdueCAPAs.length > 0) {
    const exists = await findExistingAlert(orgId, "capas_overdue");
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "capas_overdue",
        severity: "medium",
        title: `${overdueCAPAs.length} overdue corrective action${overdueCAPAs.length > 1 ? "s" : ""}`,
        description: `${overdueCAPAs.length} corrective action(s) have passed their due date without completion.`,
        entityType: "audit",
      });
      created++;
    }
  }

  // ── 7. Vendors with critically low trust score ────────────────────────────
  const lowTrustVendors = await db
    .select({ id: vendors.id, name: vendors.name, trustScore: vendors.trustScore })
    .from(vendors)
    .where(
      and(
        eq(vendors.organizationId, orgId),
        eq(vendors.status, "active"),
        sql`${vendors.trustScore} IS NOT NULL`,
        sql`${vendors.trustScore} < 40`
      )
    );

  for (const v of lowTrustVendors) {
    const exists = await findExistingAlert(orgId, "vendor_trust_critical", v.id);
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "vendor_trust_critical",
        severity: "high",
        title: `Vendor trust critically low: ${v.name}`,
        description: `"${v.name}" has a Trust Score™ of ${v.trustScore}/100. Reassessment recommended.`,
        entityType: "vendor",
        entityId: v.id,
      });
      created++;
    }
  }

  // ── 8. Expired policies ──────────────────────────────────────────────────
  const expiredPolicies = await db
    .select({ id: policies.id, name: policies.name })
    .from(policies)
    .where(
      and(
        eq(policies.organizationId, orgId),
        sql`${policies.status} = 'expired'`
      )
    );

  for (const p of expiredPolicies) {
    const exists = await findExistingAlert(orgId, "policy_expired", p.id);
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "policy_expired",
        severity: "high",
        title: `Policy expired: ${p.name}`,
        description: `Policy "${p.name}" has expired and may not be in compliance. Review or retire it.`,
        entityType: "policy",
        entityId: p.id,
      });
      created++;
    }
  }

  // ── 9. Policies with overdue reviews ─────────────────────────────────────
  const overdueReviewPolicies = await db
    .select({ id: policies.id, name: policies.name, nextReviewDate: policies.nextReviewDate })
    .from(policies)
    .where(
      and(
        eq(policies.organizationId, orgId),
        sql`${policies.nextReviewDate} IS NOT NULL`,
        sql`${policies.nextReviewDate} < ${todayStr}`,
        sql`${policies.status} NOT IN ('retired', 'archived', 'expired')`
      )
    );

  for (const p of overdueReviewPolicies) {
    const exists = await findExistingAlert(orgId, "policy_review_overdue", p.id);
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "policy_review_overdue",
        severity: "medium",
        title: `Policy review overdue: ${p.name}`,
        description: `Policy "${p.name}" was due for review on ${p.nextReviewDate} but has not been reviewed.`,
        entityType: "policy",
        entityId: p.id,
      });
      created++;
    }
  }

  // ── 10. Low attestation rate on required policies ─────────────────────────
  const requiredPolicies = await db
    .select({ id: policies.id, name: policies.name })
    .from(policies)
    .where(
      and(
        eq(policies.organizationId, orgId),
        sql`${policies.attestationRequired} = true`,
        sql`${policies.status} IN ('published', 'approved')`
      )
    );

  for (const p of requiredPolicies) {
    const attestations = await db
      .select({ status: policyAttestations.status })
      .from(policyAttestations)
      .where(
        and(
          eq(policyAttestations.policyId, p.id),
          eq(policyAttestations.organizationId, orgId)
        )
      );

    if (attestations.length > 0) {
      const ackCount = attestations.filter((a) => a.status === "acknowledged").length;
      const rate = ackCount / attestations.length;
      if (rate < 0.5) {
        const exists = await findExistingAlert(orgId, "policy_attestation_low", p.id);
        if (!exists) {
          await insertAlert({
            organizationId: orgId,
            type: "policy_attestation_low",
            severity: "medium",
            title: `Low attestation rate: ${p.name}`,
            description: `Policy "${p.name}" requires attestation but only ${Math.round(rate * 100)}% of assigned users have acknowledged it.`,
            entityType: "policy",
            entityId: p.id,
          });
          created++;
        }
      }
    }
  }

  // ── 11. Expired consent records ──────────────────────────────────────────────
  const expiredConsents = await db
    .select({ id: consentRecords.id, subjectId: consentRecords.subjectId, purpose: consentRecords.purpose })
    .from(consentRecords)
    .where(
      and(
        eq(consentRecords.organizationId, orgId),
        sql`${consentRecords.consentStatus} = 'expired'`
      )
    );

  if (expiredConsents.length > 0) {
    const exists = await findExistingAlert(orgId, "consent_expired_bulk");
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "consent_expired_bulk",
        severity: "medium",
        title: `${expiredConsents.length} consent record${expiredConsents.length > 1 ? "s" : ""} expired`,
        description: `${expiredConsents.length} data subject consent records have expired and may require renewal under DPDP Act 2023.`,
        entityType: "organization",
      });
      created++;
    }
  }

  // ── 12. Overdue DSR requests ──────────────────────────────────────────────
  const overdueDsrs = await db
    .select({ id: privacyRequests.id, subjectName: privacyRequests.subjectName })
    .from(privacyRequests)
    .where(
      and(
        eq(privacyRequests.organizationId, orgId),
        sql`${privacyRequests.dueDate} IS NOT NULL`,
        sql`${privacyRequests.dueDate} < ${todayStr}`,
        sql`${privacyRequests.status} NOT IN ('completed', 'closed')`
      )
    );

  for (const dsr of overdueDsrs) {
    const exists = await findExistingAlert(orgId, "dsr_overdue", dsr.id);
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "dsr_overdue",
        severity: "high",
        title: `DSR overdue: ${dsr.subjectName}`,
        description: `Data subject request from "${dsr.subjectName}" has passed the 30-day DPDP Act 2023 SLA deadline.`,
        entityType: "organization",
        entityId: dsr.id,
      });
      created++;
    }
  }

  // ── 13. Sensitive assets without owner ────────────────────────────────────
  const unownedSensitiveAssets = await db
    .select({ id: dataAssets.id, name: dataAssets.name })
    .from(dataAssets)
    .where(
      and(
        eq(dataAssets.organizationId, orgId),
        sql`${dataAssets.sensitivity} = 'medium'`,
        sql`${dataAssets.ownerId} IS NULL`,
        sql`${dataAssets.status} = 'active'`
      )
    );

  if (unownedSensitiveAssets.length > 0) {
    const exists = await findExistingAlert(orgId, "sensitive_asset_unclassified");
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "sensitive_asset_unclassified",
        severity: "medium",
        title: `${unownedSensitiveAssets.length} sensitive asset${unownedSensitiveAssets.length > 1 ? "s" : ""} without owner`,
        description: `${unownedSensitiveAssets.length} medium-sensitivity data assets have no designated owner. Assign data owners to meet DPDP accountability requirements.`,
        entityType: "organization",
      });
      created++;
    }
  }

  // ── 14. Cross-border transfers pending approval > 7 days ─────────────────
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  const stalePendingTransfers = await db
    .select({ id: dataTransfers.id, recipientName: dataTransfers.recipientName, destinationCountry: dataTransfers.destinationCountry })
    .from(dataTransfers)
    .where(
      and(
        eq(dataTransfers.organizationId, orgId),
        sql`${dataTransfers.status} = 'pending_approval'`,
        sql`${dataTransfers.createdAt}::date < ${sevenDaysAgoStr}`
      )
    );

  for (const transfer of stalePendingTransfers) {
    const exists = await findExistingAlert(orgId, "cross_border_unapproved", transfer.id);
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "cross_border_unapproved",
        severity: "high",
        title: `Cross-border transfer pending: ${transfer.recipientName} (${transfer.destinationCountry})`,
        description: `Data transfer to "${transfer.recipientName}" in ${transfer.destinationCountry} has been awaiting approval for more than 7 days.`,
        entityType: "organization",
        entityId: transfer.id,
      });
      created++;
    }
  }

  // ── 15. Privacy Trust Score critical ────────────────────────────────────
  const latestPrivacyScore = await db
    .select({ score: privacyTrustScores.score })
    .from(privacyTrustScores)
    .where(eq(privacyTrustScores.organizationId, orgId))
    .orderBy(desc(privacyTrustScores.computedAt))
    .limit(1);

  if (latestPrivacyScore.length > 0 && latestPrivacyScore[0].score < 60) {
    const exists = await findExistingAlert(orgId, "privacy_score_critical");
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "privacy_score_critical",
        severity: "critical",
        title: `Privacy Trust Score critical: ${latestPrivacyScore[0].score}/100`,
        description: `Your organisation's Privacy Trust Score™ is ${latestPrivacyScore[0].score}/100 (critical). Immediate action required on consent, DSR, and retention compliance.`,
        entityType: "organization",
      });
      created++;
    }
  }

  // ── 16. Contracts expiring within 30 days ────────────────────────────────
  const expiringContracts = await db
    .select({ id: contracts.id, title: contracts.title, expiryDate: contracts.expiryDate })
    .from(contracts)
    .where(
      and(
        eq(contracts.organizationId, orgId),
        sql`${contracts.expiryDate} IS NOT NULL`,
        sql`${contracts.expiryDate} >= ${todayStr}`,
        sql`${contracts.expiryDate} <= ${in30Str}`,
        sql`${contracts.status} NOT IN ('expired', 'terminated', 'archived')`
      )
    );

  for (const c of expiringContracts) {
    const exists = await findExistingAlert(orgId, "contract_expiring", c.id);
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "contract_expiring",
        severity: "high",
        title: `Contract expiring soon: ${c.title}`,
        description: `Contract "${c.title}" expires on ${c.expiryDate}. Review renewal or termination options before the notice period deadline.`,
        entityType: "vendor",
        entityId: c.id,
      });
      created++;
    }
  }

  // ── 17. Contract renewal date within 30 days ─────────────────────────────
  const renewalDueContracts = await db
    .select({ id: contracts.id, title: contracts.title, renewalDate: contracts.renewalDate })
    .from(contracts)
    .where(
      and(
        eq(contracts.organizationId, orgId),
        sql`${contracts.renewalDate} IS NOT NULL`,
        sql`${contracts.renewalDate} >= ${todayStr}`,
        sql`${contracts.renewalDate} <= ${in30Str}`,
        sql`${contracts.status} NOT IN ('terminated', 'archived')`
      )
    );

  for (const c of renewalDueContracts) {
    const exists = await findExistingAlert(orgId, "contract_renewal_due", c.id);
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "contract_renewal_due",
        severity: "medium",
        title: `Contract renewal due: ${c.title}`,
        description: `Contract "${c.title}" has a renewal date of ${c.renewalDate}. Initiate renewal negotiations promptly.`,
        entityType: "vendor",
        entityId: c.id,
      });
      created++;
    }
  }

  // ── 18. Overdue contract obligations ─────────────────────────────────────
  const overdueObligations = await db
    .select({ id: contractObligations.id, title: contractObligations.title })
    .from(contractObligations)
    .where(
      and(
        eq(contractObligations.organizationId, orgId),
        sql`${contractObligations.status} IN ('open', 'in_progress')`,
        sql`${contractObligations.dueDate} IS NOT NULL`,
        sql`${contractObligations.dueDate} < ${todayStr}`
      )
    );

  if (overdueObligations.length > 0) {
    const exists = await findExistingAlert(orgId, "contract_obligations_overdue");
    if (!exists) {
      await insertAlert({
        organizationId: orgId,
        type: "contract_obligations_overdue",
        severity: overdueObligations.length >= 5 ? "high" : "medium",
        title: `${overdueObligations.length} overdue contract obligation${overdueObligations.length > 1 ? "s" : ""}`,
        description: `${overdueObligations.length} contractual obligation(s) have passed their due date without completion. Review and act to avoid breach.`,
        entityType: "organization",
      });
      created++;
    }
  }

  return { created };
}
