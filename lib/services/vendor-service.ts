import { db } from "@/lib/db";
import type { Vendor, VendorDocument } from "@/lib/db/schema";
import { DomainError } from "./errors";
import * as vendorRepo from "@/lib/repositories/vendor-repo";
import * as documentRepo from "@/lib/repositories/document-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";

export type DocCounts = { total: number; valid: number; expiring: number; expired: number };

export type Risk = "low" | "medium" | "high" | "critical";

export type VendorRow = {
  id: string;
  name: string;
  category: string | null;
  status: string;
  risk: string;
  score: number;
  docs: number;
  expiring: number;
};

export type VendorMetrics = {
  totalVendors: number;
  totalDocuments: number;
  expiringSoon: number;
  highRisk: number;
  complianceScore: number;
};

export type Insight = { tone: "info" | "warn" | "danger" | "live"; text: string };

/**
 * Initial score on creation = computeScore with 0 documents, so the first
 * document upload never causes a confusing score drop.
 * Must stay in sync with the base values inside computeScore.
 */
const STARTING_SCORE: Record<Risk, number> = { low: 70, medium: 60, high: 45, critical: 30 };

function toRisk(value: string | undefined): Risk {
  return (["low", "medium", "high", "critical"] as const).includes(value as Risk)
    ? (value as Risk)
    : "medium";
}

function toRow(v: Vendor, counts?: DocCounts): VendorRow {
  return {
    id: v.id,
    name: v.name,
    category: v.category,
    status: v.status,
    risk: v.riskLevel,
    score: v.complianceScore,
    docs: counts?.total ?? 0,
    expiring: counts?.expiring ?? 0,
  };
}

/** Document status derived from its expiry date. */
export function computeDocStatus(
  expiresOn: string | null
): "valid" | "expiring" | "expired" {
  if (!expiresOn) return "valid";
  const today = new Date();
  const exp = new Date(expiresOn);
  if (exp < today) return "expired";
  if (exp < new Date(Date.now() + 30 * 86_400_000)) return "expiring";
  return "valid";
}

/**
 * Transparent compliance score: a risk-based base, raised by valid documents
 * and lowered by expiring/expired ones. (Placeholder for the Lekha AI engine.)
 */
export function computeScore(risk: Risk, c: DocCounts): number {
  const base: Record<Risk, number> = { low: 70, medium: 60, high: 45, critical: 30 };
  let score = base[risk];
  score += Math.min(c.valid * 5, 40);
  score -= c.expiring * 10;
  score -= c.expired * 20;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function getVendor(orgId: string, id: string): Promise<Vendor | null> {
  return vendorRepo.findById(orgId, id);
}

export async function updateVendorStatus(params: {
  orgId: string; actorId: string; vendorId: string; status: "active" | "pending" | "inactive";
}): Promise<void> {
  const vendor = await vendorRepo.findById(params.orgId, params.vendorId);
  if (!vendor) throw new DomainError("Vendor not found.");
  await db.transaction(async (tx) => {
    await vendorRepo.updateVendor(params.vendorId, { status: params.status }, tx);
    await recordAudit({ organizationId: params.orgId, actorId: params.actorId, action: "vendor.status_changed", entityType: "vendor", entityId: params.vendorId, metadata: { from: vendor.status, to: params.status } }, tx);
  });
}

export async function updateVendorNotes(params: {
  orgId: string; actorId: string; vendorId: string; notes: string;
}): Promise<void> {
  const vendor = await vendorRepo.findById(params.orgId, params.vendorId);
  if (!vendor) throw new DomainError("Vendor not found.");
  const notes = params.notes.trim() || null;
  await db.transaction(async (tx) => {
    await vendorRepo.updateVendor(params.vendorId, { notes }, tx);
    await recordAudit({ organizationId: params.orgId, actorId: params.actorId, action: "vendor.notes_updated", entityType: "vendor", entityId: params.vendorId, metadata: { hasNotes: !!notes } }, tx);
  });
}

export async function listVendorsPaged(
  orgId: string, page: number, pageSize: number
): Promise<{ vendors: VendorRow[]; total: number; totalPages: number }> {
  const offset = (page - 1) * pageSize;
  const [rows, counts, total] = await Promise.all([
    vendorRepo.findVendorsByOrgPaged(orgId, pageSize, offset),
    documentRepo.statusCountsByVendor(orgId),
    vendorRepo.countByOrg(orgId),
  ]);
  const byVendor = new Map<string, DocCounts>();
  for (const { vendorId, status, n } of counts) {
    const c = byVendor.get(vendorId) ?? { total: 0, valid: 0, expiring: 0, expired: 0 };
    c.total += n; if (status === "valid") c.valid += n; else if (status === "expiring") c.expiring += n; else if (status === "expired") c.expired += n;
    byVendor.set(vendorId, c);
  }
  return { vendors: rows.map((v) => toRow(v, byVendor.get(v.id))), total, totalPages: Math.ceil(total / pageSize) };
}

export async function updateVendor(params: {
  orgId: string;
  actorId: string;
  vendorId: string;
  input: { name: string; category?: string | null; contactEmail?: string | null; risk?: string };
}): Promise<void> {
  const vendor = await vendorRepo.findById(params.orgId, params.vendorId);
  if (!vendor) throw new DomainError("Vendor not found.");

  const name = (params.input.name || "").trim();
  if (name.length < 2) throw new DomainError("Vendor name is required.");
  const risk = toRisk(params.input.risk);

  await db.transaction(async (tx) => {
    await vendorRepo.updateVendor(
      params.vendorId,
      { name, category: params.input.category?.trim() || null, contactEmail: params.input.contactEmail?.trim() || null, riskLevel: risk },
      tx
    );
    await recordAudit({ organizationId: params.orgId, actorId: params.actorId, action: "vendor.updated", entityType: "vendor", entityId: params.vendorId, metadata: { name, risk } }, tx);
  });
}

export async function deleteVendor(params: {
  orgId: string;
  actorId: string;
  vendorId: string;
}): Promise<void> {
  const vendor = await vendorRepo.findById(params.orgId, params.vendorId);
  if (!vendor) throw new DomainError("Vendor not found.");

  await db.transaction(async (tx) => {
    // vendor_documents rows cascade via FK; storage objects are purged
    // separately by the caller before this runs.
    await vendorRepo.deleteById(params.orgId, params.vendorId, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "vendor.deleted",
        entityType: "vendor",
        entityId: params.vendorId,
        metadata: { name: vendor.name },
      },
      tx
    );
  });
}

function aggregate(docs: VendorDocument[]): DocCounts {
  const c: DocCounts = { total: docs.length, valid: 0, expiring: 0, expired: 0 };
  for (const d of docs) {
    if (d.status === "valid") c.valid++;
    else if (d.status === "expiring") c.expiring++;
    else if (d.status === "expired") c.expired++;
  }
  return c;
}

/** Recompute and persist a vendor's compliance score from its documents. */
export async function recomputeVendorScore(orgId: string, vendorId: string): Promise<void> {
  const vendor = await vendorRepo.findById(orgId, vendorId);
  if (!vendor) return;
  const docs = await documentRepo.listByVendor(orgId, vendorId);
  const score = computeScore(vendor.riskLevel as Risk, aggregate(docs));
  await vendorRepo.updateScore(vendorId, score);
}

export async function createVendor(params: {
  orgId: string;
  actorId: string;
  input: { name: string; category?: string | null; contactEmail?: string | null; risk?: string };
}): Promise<{ id: string }> {
  const name = (params.input.name || "").trim();
  if (name.length < 2) {
    throw new DomainError("Vendor name is required.");
  }
  const risk = toRisk(params.input.risk);

  return db.transaction(async (tx) => {
    const vendor = await vendorRepo.insertVendor(
      {
        organizationId: params.orgId,
        name,
        category: params.input.category?.trim() || null,
        contactEmail: params.input.contactEmail?.trim() || null,
        riskLevel: risk,
        status: "active",
        complianceScore: STARTING_SCORE[risk],
        createdBy: params.actorId,
      },
      tx
    );
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "vendor.created",
        entityType: "vendor",
        entityId: vendor.id,
        metadata: { name, risk },
      },
      tx
    );
    return vendor;
  });
}

export async function listVendors(orgId: string): Promise<VendorRow[]> {
  const [rows, counts] = await Promise.all([
    vendorRepo.findVendorsByOrg(orgId),
    documentRepo.statusCountsByVendor(orgId),
  ]);

  const byVendor = new Map<string, DocCounts>();
  for (const { vendorId, status, n } of counts) {
    const c = byVendor.get(vendorId) ?? { total: 0, valid: 0, expiring: 0, expired: 0 };
    c.total += n;
    if (status === "valid") c.valid += n;
    else if (status === "expiring") c.expiring += n;
    else if (status === "expired") c.expired += n;
    byVendor.set(vendorId, c);
  }

  return rows.map((v) => toRow(v, byVendor.get(v.id)));
}

export async function getMetrics(orgId: string): Promise<VendorMetrics> {
  const vs = await vendorRepo.findVendorsByOrg(orgId);
  const totalVendors = vs.length;
  const highRisk = vs.filter((v) => v.riskLevel === "high" || v.riskLevel === "critical").length;
  const complianceScore = totalVendors
    ? Math.round(vs.reduce((s, v) => s + v.complianceScore, 0) / totalVendors)
    : 0;

  const totalDocuments = await vendorRepo.countDocuments(orgId);
  const expiringSoon = await vendorRepo.countExpiringDocuments(orgId, 30);

  return { totalVendors, totalDocuments, expiringSoon, highRisk, complianceScore };
}

/** Honest, data-driven insights (placeholder for the Lekha AI engine). */
export function deriveInsights(m: VendorMetrics): Insight[] {
  if (m.totalVendors === 0) {
    return [
      { tone: "info", text: "Add your first vendor to start tracking compliance and documents." },
    ];
  }
  const out: Insight[] = [];
  if (m.highRisk > 0)
    out.push({ tone: "danger", text: `${m.highRisk} vendor(s) flagged as high or critical risk.` });
  if (m.expiringSoon > 0)
    out.push({ tone: "warn", text: `${m.expiringSoon} document(s) expire within 30 days.` });
  if (m.complianceScore >= 80)
    out.push({ tone: "live", text: `Average compliance score is healthy at ${m.complianceScore}.` });
  if (out.length === 0)
    out.push({ tone: "info", text: "Upload vendor documents to improve compliance scoring." });
  return out;
}
