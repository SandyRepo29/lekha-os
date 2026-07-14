import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import * as timelineRepo from "@/backend/src/modules/vendor-hub/vendor-timeline-repo";

export type OffboardingStep =
  | "access_disabled"
  | "contracts_closed"
  | "documents_archived"
  | "final_assessment_done"
  | "evidence_verified"
  | "open_tasks_closed"
  | "lessons_captured"
  | "archive_package_generated"
  | "lifecycle_updated";

export const OFFBOARDING_STEP_LABELS: Record<OffboardingStep, string> = {
  access_disabled:            "Disable vendor portal access",
  contracts_closed:           "Close all active contracts",
  documents_archived:         "Archive vendor documents",
  final_assessment_done:      "Complete final security assessment",
  evidence_verified:          "Verify and archive evidence",
  open_tasks_closed:          "Close all open tasks and issues",
  lessons_captured:           "Capture lessons learned",
  archive_package_generated:  "Generate archive package",
  lifecycle_updated:          "Update lifecycle to Offboarded",
};

export const OFFBOARDING_STEP_DESCRIPTIONS: Record<OffboardingStep, string> = {
  access_disabled:            "Revoke vendor portal tokens and disable self-service access",
  contracts_closed:           "Formally terminate or expire all active vendor contracts",
  documents_archived:         "Move all vendor documents to the archive storage bucket",
  final_assessment_done:      "Conduct a final security and compliance assessment",
  evidence_verified:          "Verify all evidence is current and archived for future audits",
  open_tasks_closed:          "Resolve or cancel any open tasks, CAPAs, or issues",
  lessons_captured:           "Document what worked well and what should improve",
  archive_package_generated:  "Generate a complete vendor record export (PDF + CSV)",
  lifecycle_updated:          "Transition vendor lifecycle state to Offboarded",
};

export type OffboardingChecklist = {
  id: string;
  organization_id: string;
  vendor_id: string;
  initiated_by: string | null;
  initiated_at: Date;
  reason: string | null;
  target_date: Date | null;
  access_disabled: boolean;
  access_disabled_at: Date | null;
  contracts_closed: boolean;
  contracts_closed_at: Date | null;
  documents_archived: boolean;
  documents_archived_at: Date | null;
  final_assessment_done: boolean;
  final_assessment_at: Date | null;
  evidence_verified: boolean;
  evidence_verified_at: Date | null;
  open_tasks_closed: boolean;
  open_tasks_closed_at: Date | null;
  lessons_captured: boolean;
  lessons_captured_at: Date | null;
  archive_package_generated: boolean;
  archive_package_at: Date | null;
  lifecycle_updated: boolean;
  lifecycle_updated_at: Date | null;
  lessons_learned: string | null;
  completed_at: Date | null;
};

export const OFFBOARDING_STEPS_ORDER: OffboardingStep[] = [
  "access_disabled",
  "contracts_closed",
  "documents_archived",
  "final_assessment_done",
  "evidence_verified",
  "open_tasks_closed",
  "lessons_captured",
  "archive_package_generated",
  "lifecycle_updated",
];

export async function initiateOffboarding(params: {
  orgId: string;
  vendorId: string;
  actorId: string;
  actorName?: string;
  reason?: string;
  targetDate?: Date;
}): Promise<OffboardingChecklist> {
  // Upsert — idempotent
  const rows = await db.execute<OffboardingChecklist>(
    sql`INSERT INTO vendor_offboarding_checklists
          (organization_id, vendor_id, initiated_by, reason, target_date)
        VALUES
          (${params.orgId}, ${params.vendorId}, ${params.actorId},
           ${params.reason ?? null},
           ${params.targetDate?.toISOString().split("T")[0] ?? null})
        ON CONFLICT (vendor_id) DO UPDATE SET
          initiated_by = EXCLUDED.initiated_by,
          reason = EXCLUDED.reason,
          target_date = EXCLUDED.target_date
        RETURNING *`
  );

  await timelineRepo.insertTimelineEvent({
    orgId:      params.orgId,
    vendorId:   params.vendorId,
    eventType:  "offboarding_started",
    title:      "Offboarding process initiated",
    description: params.reason,
    actorId:    params.actorId,
    actorName:  params.actorName,
    severity:   "warn",
  });

  return rows[0]!;
}

export async function getOffboardingChecklist(
  orgId: string,
  vendorId: string
): Promise<OffboardingChecklist | null> {
  const rows = await db.execute<OffboardingChecklist>(
    sql`SELECT * FROM vendor_offboarding_checklists
        WHERE organization_id = ${orgId} AND vendor_id = ${vendorId}
        LIMIT 1`
  );
  return rows[0] ?? null;
}

export async function completeStep(params: {
  orgId: string;
  vendorId: string;
  step: OffboardingStep;
  actorId: string;
  actorName?: string;
  notes?: string;
}): Promise<void> {
  const col = params.step;
  // NOTE: two _at columns are named inconsistently in the schema, so map explicitly
  // rather than assume `${step}_at` (which is wrong for final_assessment_done / archive_package_generated).
  const AT_COLUMN: Record<OffboardingStep, string> = {
    access_disabled:           "access_disabled_at",
    contracts_closed:          "contracts_closed_at",
    documents_archived:        "documents_archived_at",
    final_assessment_done:     "final_assessment_at",
    evidence_verified:         "evidence_verified_at",
    open_tasks_closed:         "open_tasks_closed_at",
    lessons_captured:          "lessons_captured_at",
    archive_package_generated: "archive_package_at",
    lifecycle_updated:         "lifecycle_updated_at",
  };
  const colAt = AT_COLUMN[params.step];

  await db.execute(
    sql`UPDATE vendor_offboarding_checklists
        SET ${sql.raw(`"${col}" = true, "${colAt}" = NOW()`)},
            lessons_learned = COALESCE(${params.notes ?? null}::text, lessons_learned)
        WHERE organization_id = ${params.orgId} AND vendor_id = ${params.vendorId}`
  );

  // Check if all steps complete
  const checklist = await getOffboardingChecklist(params.orgId, params.vendorId);
  const allDone = checklist && OFFBOARDING_STEPS_ORDER.every(
    (s) => s === "lifecycle_updated" || (checklist as Record<string, unknown>)[s] === true
  );

  if (allDone && checklist && !checklist.completed_at) {
    await db.execute(
      sql`UPDATE vendor_offboarding_checklists
          SET completed_at = NOW()
          WHERE organization_id = ${params.orgId} AND vendor_id = ${params.vendorId}`
    );
    await timelineRepo.insertTimelineEvent({
      orgId:      params.orgId,
      vendorId:   params.vendorId,
      eventType:  "offboarding_completed",
      title:      "Offboarding checklist complete",
      actorId:    params.actorId,
      actorName:  params.actorName,
      severity:   "success",
    });
  } else {
    await timelineRepo.insertTimelineEvent({
      orgId:      params.orgId,
      vendorId:   params.vendorId,
      eventType:  "offboarding_step_completed",
      title:      `Offboarding step complete: ${OFFBOARDING_STEP_LABELS[params.step]}`,
      actorId:    params.actorId,
      actorName:  params.actorName,
      severity:   "info",
    });
  }
}

export function getCompletionPct(checklist: OffboardingChecklist): number {
  const total = OFFBOARDING_STEPS_ORDER.length;
  const done = OFFBOARDING_STEPS_ORDER.filter(
    (s) => (checklist as Record<string, unknown>)[s] === true
  ).length;
  return Math.round((done / total) * 100);
}
