import { and, eq } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import {
  riskVendors, riskControls, riskFindings, riskPolicies, riskFrameworks, riskEvidence,
} from "@/lib/db/schema";

// ---- Vendors ----
export async function linkVendor(riskId: string, vendorId: string, exec: Executor = db) {
  await exec.insert(riskVendors).values({ riskId, vendorId }).onConflictDoNothing();
}
export async function unlinkVendor(riskId: string, vendorId: string, exec: Executor = db) {
  await exec.delete(riskVendors).where(and(eq(riskVendors.riskId, riskId), eq(riskVendors.vendorId, vendorId)));
}
export async function getLinkedVendorIds(riskId: string): Promise<string[]> {
  const rows = await db.select({ id: riskVendors.vendorId }).from(riskVendors).where(eq(riskVendors.riskId, riskId));
  return rows.map((r) => r.id);
}

// ---- Controls ----
export async function linkControl(riskId: string, controlId: string, exec: Executor = db) {
  await exec.insert(riskControls).values({ riskId, controlId }).onConflictDoNothing();
}
export async function unlinkControl(riskId: string, controlId: string, exec: Executor = db) {
  await exec.delete(riskControls).where(and(eq(riskControls.riskId, riskId), eq(riskControls.controlId, controlId)));
}
export async function getLinkedControlIds(riskId: string): Promise<string[]> {
  const rows = await db.select({ id: riskControls.controlId }).from(riskControls).where(eq(riskControls.riskId, riskId));
  return rows.map((r) => r.id);
}

// ---- Findings ----
export async function linkFinding(riskId: string, findingId: string, exec: Executor = db) {
  await exec.insert(riskFindings).values({ riskId, findingId }).onConflictDoNothing();
}
export async function unlinkFinding(riskId: string, findingId: string, exec: Executor = db) {
  await exec.delete(riskFindings).where(and(eq(riskFindings.riskId, riskId), eq(riskFindings.findingId, findingId)));
}
export async function getLinkedFindingIds(riskId: string): Promise<string[]> {
  const rows = await db.select({ id: riskFindings.findingId }).from(riskFindings).where(eq(riskFindings.riskId, riskId));
  return rows.map((r) => r.id);
}

// ---- Policies ----
export async function linkPolicy(riskId: string, policyId: string, exec: Executor = db) {
  await exec.insert(riskPolicies).values({ riskId, policyId }).onConflictDoNothing();
}
export async function unlinkPolicy(riskId: string, policyId: string, exec: Executor = db) {
  await exec.delete(riskPolicies).where(and(eq(riskPolicies.riskId, riskId), eq(riskPolicies.policyId, policyId)));
}

// ---- Frameworks ----
export async function linkFramework(riskId: string, frameworkId: string, exec: Executor = db) {
  await exec.insert(riskFrameworks).values({ riskId, frameworkId }).onConflictDoNothing();
}
export async function unlinkFramework(riskId: string, frameworkId: string, exec: Executor = db) {
  await exec.delete(riskFrameworks).where(and(eq(riskFrameworks.riskId, riskId), eq(riskFrameworks.frameworkId, frameworkId)));
}

// ---- Evidence ----
export async function linkEvidence(riskId: string, evidenceId: string, exec: Executor = db) {
  await exec.insert(riskEvidence).values({ riskId, evidenceId }).onConflictDoNothing();
}
export async function unlinkEvidence(riskId: string, evidenceId: string, exec: Executor = db) {
  await exec.delete(riskEvidence).where(and(eq(riskEvidence.riskId, riskId), eq(riskEvidence.evidenceId, evidenceId)));
}
