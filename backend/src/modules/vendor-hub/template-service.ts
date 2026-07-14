import * as templateRepo from "@/backend/src/modules/vendor-hub/template-repo";
import * as vendorRepo from "@/backend/src/modules/vendor-hub/vendor-repo";
import * as documentRepo from "@/backend/src/modules/vendor-hub/document-repo";

export type ChecklistItem = {
  documentType: string;
  isRequired: boolean;
  uploaded: boolean;
  status: "valid" | "expiring" | "expired" | "missing";
};

export type ChecklistResult = {
  templateName: string;
  items: ChecklistItem[];
  requiredTotal: number;
  requiredDone: number;
  completionScore: number;
};

export async function listTemplates(orgId: string) {
  return templateRepo.listTemplates(orgId);
}

export async function getChecklistForVendor(
  orgId: string,
  vendorId: string
): Promise<ChecklistResult | null> {
  const vendor = await vendorRepo.findById(orgId, vendorId);
  if (!vendor?.vendorTypeId) return null;

  const result = await templateRepo.getTemplateWithDocs(vendor.vendorTypeId);
  if (!result) return null;

  const docs = await documentRepo.listByVendor(orgId, vendorId);
  const uploadedMap = new Map(docs.map((d) => [d.documentType.toLowerCase(), d]));

  const items: ChecklistItem[] = result.docs.map((td) => {
    const uploaded = uploadedMap.get(td.documentType.toLowerCase());
    return {
      documentType: td.documentType,
      isRequired: td.isRequired,
      uploaded: !!uploaded,
      status: uploaded ? (uploaded.status as "valid" | "expiring" | "expired" | "missing") : "missing",
    };
  });

  const requiredItems = items.filter((i) => i.isRequired);
  const requiredDone = requiredItems.filter((i) => i.uploaded && i.status !== "expired").length;
  const completionScore = requiredItems.length > 0
    ? Math.round((requiredDone / requiredItems.length) * 100)
    : 100;

  return {
    templateName: result.template.name,
    items,
    requiredTotal: requiredItems.length,
    requiredDone,
    completionScore,
  };
}

export async function assignTemplate(orgId: string, vendorId: string, vendorTypeId: string | null): Promise<void> {
  const vendor = await vendorRepo.findById(orgId, vendorId);
  if (!vendor) throw new Error("Vendor not found.");
  await vendorRepo.updateVendor(vendorId, { vendorTypeId: vendorTypeId ?? undefined } as any);
}
