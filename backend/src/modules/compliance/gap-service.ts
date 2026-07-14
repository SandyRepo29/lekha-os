import { db } from "@/lib/db";
import { DomainError } from "@/lib/services/errors";
import * as gapRepo from "@/backend/src/modules/compliance/gap-repo";
import * as controlRepo from "@/backend/src/modules/compliance/control-repo";
import * as evidenceRepo from "@/backend/src/modules/compliance/evidence-repo";
import * as policyRepo from "@/backend/src/modules/compliance/policy-repo";
import * as frameworkRepo from "@/backend/src/modules/compliance/framework-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";
import type { GapAnalysisRow } from "@/lib/db/schema";
import type { NewGap } from "@/backend/src/modules/compliance/gap-repo";

export type GapSummary = {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: Record<string, number>;
};

// ---- Queries -------------------------------------------------

export async function listGaps(
  orgId: string,
  frameworkId?: string,
  includeResolved = false
): Promise<GapAnalysisRow[]> {
  if (frameworkId) {
    return gapRepo.findByFramework(orgId, frameworkId, includeResolved);
  }
  return gapRepo.findByOrg(orgId, includeResolved);
}

export async function getGapSummary(
  orgId: string,
  frameworkId?: string
): Promise<GapSummary> {
  const [gaps, counts] = await Promise.all([
    frameworkId
      ? gapRepo.findByFramework(orgId, frameworkId, false)
      : gapRepo.findByOrg(orgId, false),
    gapRepo.countBySeverity(orgId, frameworkId),
  ]);

  const bySeverity = new Map(counts.map((c) => [c.severity, c.n]));
  const byType: Record<string, number> = {};
  for (const g of gaps) {
    byType[g.gapType] = (byType[g.gapType] ?? 0) + 1;
  }

  return {
    total: gaps.length,
    critical: bySeverity.get("critical") ?? 0,
    high: bySeverity.get("high") ?? 0,
    medium: bySeverity.get("medium") ?? 0,
    low: bySeverity.get("low") ?? 0,
    byType,
  };
}

// ---- Gap detection -------------------------------------------

/**
 * Run rule-based gap analysis for a framework.
 * Clears all unresolved gaps then re-detects:
 *   - unmapped_control   — controls with zero evidence mappings
 *   - missing_evidence   — controls mapped to evidence but none approved
 *   - expired_evidence   — controls whose only mapped evidence is expired
 *   - expired_policy     — org policies that are expired or past review date
 *   - not_implemented    — controls still at "not_implemented" status
 *
 * Returns the newly detected gaps.
 */
export async function runGapAnalysis(params: {
  orgId: string;
  actorId: string;
  frameworkId: string;
}): Promise<{ gaps: GapAnalysisRow[]; detected: number }> {
  const fw = await frameworkRepo.findById(params.orgId, params.frameworkId);
  if (!fw) throw new DomainError("Framework not found.");

  const controls = await controlRepo.findByFramework(
    params.orgId,
    params.frameworkId
  );

  const newGaps: NewGap[] = [];

  for (const control of controls) {
    if (control.status === "not_applicable") continue;

    const mappings = await evidenceRepo.findMappingsByControl(control.id);

    // 1. Not implemented at all
    if (control.status === "not_implemented") {
      newGaps.push({
        organizationId: params.orgId,
        frameworkId: params.frameworkId,
        gapType: "not_implemented",
        controlId: control.id,
        description: `Control ${control.controlRef} (${control.name}) is not implemented.`,
        severity: severityForPriority(control.priority),
      });
    }

    // 2. No evidence mapped
    if (mappings.length === 0) {
      newGaps.push({
        organizationId: params.orgId,
        frameworkId: params.frameworkId,
        gapType: "unmapped_control",
        controlId: control.id,
        description: `Control ${control.controlRef} (${control.name}) has no evidence mapped.`,
        severity: severityForPriority(control.priority),
      });
    } else {
      // 3. Mapped evidence but none approved
      const evidenceItems = await Promise.all(
        mappings.map((m) => evidenceRepo.findById(params.orgId, m.evidenceId))
      );
      const approved = evidenceItems.filter((e) => e?.status === "approved");
      const expired = evidenceItems.filter((e) => e?.status === "expired");

      if (approved.length === 0 && expired.length > 0) {
        newGaps.push({
          organizationId: params.orgId,
          frameworkId: params.frameworkId,
          gapType: "expired_evidence",
          controlId: control.id,
          evidenceId: expired[0]!.id,
          description: `Control ${control.controlRef} (${control.name}) has only expired evidence.`,
          severity: severityForPriority(control.priority),
        });
      } else if (approved.length === 0) {
        newGaps.push({
          organizationId: params.orgId,
          frameworkId: params.frameworkId,
          gapType: "missing_evidence",
          controlId: control.id,
          description: `Control ${control.controlRef} (${control.name}) has no approved evidence.`,
          severity: severityForPriority(control.priority),
        });
      }
    }
  }

  // 4. Expired or overdue policies
  const policies = await policyRepo.findByOrg(params.orgId);
  const today = new Date().toISOString().split("T")[0];
  for (const p of policies) {
    if (p.status === "expired") {
      newGaps.push({
        organizationId: params.orgId,
        frameworkId: params.frameworkId,
        gapType: "expired_policy",
        description: `Policy "${p.name}" is expired.`,
        severity: "high",
      });
    } else if (p.reviewDate && p.reviewDate < today && p.status !== "archived") {
      newGaps.push({
        organizationId: params.orgId,
        frameworkId: params.frameworkId,
        gapType: "expired_policy",
        description: `Policy "${p.name}" is overdue for review (was due ${p.reviewDate}).`,
        severity: "medium",
      });
    }
  }

  // Atomically replace unresolved gaps and log
  let created: GapAnalysisRow[] = [];
  await db.transaction(async (tx) => {
    await gapRepo.deleteUnresolvedByFramework(params.orgId, params.frameworkId, tx);
    if (newGaps.length > 0) {
      await gapRepo.bulkInsertGaps(newGaps, tx);
    }
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.gap_analysis_run",
        entityType: "framework",
        entityId: params.frameworkId,
        metadata: { detected: newGaps.length },
      },
      tx
    );
  });

  created = await gapRepo.findByFramework(params.orgId, params.frameworkId, false);
  return { gaps: created, detected: newGaps.length };
}

// ---- Resolve -------------------------------------------------

export async function resolveGap(params: {
  orgId: string;
  actorId: string;
  gapId: string;
}): Promise<void> {
  await db.transaction(async (tx) => {
    await gapRepo.resolveGap(params.orgId, params.gapId, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.gap_resolved",
        entityType: "gap_analysis",
        entityId: params.gapId,
      },
      tx
    );
  });
}

// ---- Helpers -------------------------------------------------

function severityForPriority(
  priority: "low" | "medium" | "high" | "critical"
): string {
  // Priority maps directly to severity
  return priority;
}
