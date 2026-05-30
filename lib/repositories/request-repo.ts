import { eq, and, desc } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { documentRequests } from "@/lib/db/schema";
import type { DocumentRequest } from "@/lib/db/schema";

export type NewRequest = {
  organizationId: string;
  vendorId: string;
  documentType: string;
  message: string | null;
  dueDate: string | null;
  priority: string;
  requestedBy: string;
};

export async function insertRequest(values: NewRequest, exec: Executor = db): Promise<{ id: string }> {
  const [row] = await exec.insert(documentRequests).values(values).returning({ id: documentRequests.id });
  return row;
}

export async function listByVendor(orgId: string, vendorId: string): Promise<DocumentRequest[]> {
  return db.select().from(documentRequests)
    .where(and(eq(documentRequests.organizationId, orgId), eq(documentRequests.vendorId, vendorId)))
    .orderBy(desc(documentRequests.createdAt));
}

export async function getById(orgId: string, id: string): Promise<DocumentRequest | null> {
  const [row] = await db.select().from(documentRequests)
    .where(and(eq(documentRequests.organizationId, orgId), eq(documentRequests.id, id)))
    .limit(1);
  return row ?? null;
}

export async function updateStatus(
  id: string,
  status: "requested" | "submitted" | "approved" | "rejected" | "expired",
  exec: Executor = db
): Promise<void> {
  await exec.update(documentRequests).set({ status, updatedAt: new Date() }).where(eq(documentRequests.id, id));
}

export async function linkDocument(id: string, documentId: string, exec: Executor = db): Promise<void> {
  await exec.update(documentRequests)
    .set({ completedDocumentId: documentId, status: "submitted", updatedAt: new Date() })
    .where(eq(documentRequests.id, id));
}
