import { eq, or, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { vendorTypes, vendorTypeDocuments } from "@/lib/db/schema";
import type { VendorType, VendorTypeDocument } from "@/lib/db/schema";

export async function listTemplates(orgId: string): Promise<VendorType[]> {
  return db.select().from(vendorTypes)
    .where(or(isNull(vendorTypes.organizationId), eq(vendorTypes.organizationId, orgId)))
    .orderBy(vendorTypes.name);
}

export async function getTemplateWithDocs(
  templateId: string
): Promise<{ template: VendorType; docs: VendorTypeDocument[] } | null> {
  const [template] = await db.select().from(vendorTypes).where(eq(vendorTypes.id, templateId)).limit(1);
  if (!template) return null;
  const docs = await db.select().from(vendorTypeDocuments)
    .where(eq(vendorTypeDocuments.vendorTypeId, templateId))
    .orderBy(vendorTypeDocuments.sortOrder);
  return { template, docs };
}

export async function seedDefaultTemplates(): Promise<void> {
  const { DEFAULT_TEMPLATES } = await import("@/lib/constants/vendor-templates");
  for (const t of DEFAULT_TEMPLATES) {
    await db.insert(vendorTypes)
      .values({ id: t.id, organizationId: null, name: t.name, description: t.description, isDefault: true })
      .onConflictDoNothing();

    const existing = await db.select().from(vendorTypeDocuments).where(eq(vendorTypeDocuments.vendorTypeId, t.id));
    if (existing.length === 0) {
      let i = 0;
      for (const doc of t.requiredDocs) {
        await db.insert(vendorTypeDocuments).values({ vendorTypeId: t.id, documentType: doc, isRequired: true, sortOrder: i++ });
      }
      for (const doc of t.optionalDocs) {
        await db.insert(vendorTypeDocuments).values({ vendorTypeId: t.id, documentType: doc, isRequired: false, sortOrder: i++ });
      }
    }
  }
}
