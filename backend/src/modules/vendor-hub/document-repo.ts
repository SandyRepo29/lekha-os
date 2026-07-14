import { and, eq, desc, count } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { vendorDocuments } from "@/lib/db/schema";
import type { VendorDocument } from "@/lib/db/schema";

export type NewDocument = {
  organizationId: string;
  vendorId: string;
  documentType: string;
  storagePath: string;
  status: "valid" | "expiring" | "expired" | "missing";
};

export async function insertDocument(
  values: NewDocument,
  exec: Executor = db
): Promise<{ id: string }> {
  const [doc] = await exec
    .insert(vendorDocuments)
    .values(values)
    .returning({ id: vendorDocuments.id });
  return doc;
}

export async function listByVendor(orgId: string, vendorId: string): Promise<VendorDocument[]> {
  return db
    .select()
    .from(vendorDocuments)
    .where(
      and(
        eq(vendorDocuments.organizationId, orgId),
        eq(vendorDocuments.vendorId, vendorId)
      )
    )
    .orderBy(desc(vendorDocuments.createdAt));
}

export async function getById(orgId: string, id: string): Promise<VendorDocument | null> {
  const [doc] = await db
    .select()
    .from(vendorDocuments)
    .where(and(eq(vendorDocuments.organizationId, orgId), eq(vendorDocuments.id, id)))
    .limit(1);
  return doc ?? null;
}

export async function updateExtraction(
  id: string,
  values: {
    status?: "valid" | "expiring" | "expired" | "missing";
    documentType?: string;
    category?: "security" | "privacy" | "legal" | "financial" | "quality" | "operational" | "other" | null;
    issuedOn?: string | null;
    expiresOn?: string | null;
    extracted?: Record<string, unknown> | null;
  },
  exec: Executor = db
): Promise<void> {
  await exec
    .update(vendorDocuments)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(vendorDocuments.id, id));
}

export async function updateDocumentFields(
  orgId: string,
  id: string,
  values: { documentType?: string; issuedOn?: string | null; expiresOn?: string | null; status?: "valid" | "expiring" | "expired" | "missing" },
  exec: Executor = db
): Promise<void> {
  await exec.update(vendorDocuments)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(vendorDocuments.organizationId, orgId), eq(vendorDocuments.id, id)));
}

export async function deleteById(orgId: string, id: string, exec: Executor = db): Promise<void> {
  await exec
    .delete(vendorDocuments)
    .where(and(eq(vendorDocuments.organizationId, orgId), eq(vendorDocuments.id, id)));
}

/** Raw per-vendor, per-status counts for an org (used to derive UI counts). */
export async function statusCountsByVendor(
  orgId: string
): Promise<{ vendorId: string; status: string; n: number }[]> {
  const rows = await db
    .select({
      vendorId: vendorDocuments.vendorId,
      status: vendorDocuments.status,
      n: count(),
    })
    .from(vendorDocuments)
    .where(eq(vendorDocuments.organizationId, orgId))
    .groupBy(vendorDocuments.vendorId, vendorDocuments.status);
  return rows.map((r) => ({ vendorId: r.vendorId, status: r.status, n: Number(r.n) }));
}
