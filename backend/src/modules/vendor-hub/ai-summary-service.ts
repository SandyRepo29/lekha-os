import { generateText, isAIConfigured } from "@/lib/providers/ai";
import * as vendorRepo from "@/backend/src/modules/vendor-hub/vendor-repo";
import * as documentRepo from "@/backend/src/modules/vendor-hub/document-repo";
import type { VendorDocument } from "@/lib/db/schema";

const PROMPT = `You are a compliance analyst for a vendor governance platform.
Generate a concise executive summary (3-5 sentences) for this vendor based on the data provided.
Cover: what the vendor does, their compliance posture, key risks or gaps, and any upcoming document expiries.
Be factual, professional, and actionable. Do not invent data not present.`;

function formatVendorContext(
  vendor: Awaited<ReturnType<typeof vendorRepo.findById>>,
  docs: VendorDocument[]
): string {
  if (!vendor) return "";
  const expired = docs.filter((d) => d.status === "expired").map((d) => d.documentType);
  const expiring = docs.filter((d) => d.status === "expiring").map((d) => d.documentType);
  const valid = docs.filter((d) => d.status === "valid").map((d) => d.documentType);
  const missing = docs.filter((d) => d.status === "missing").map((d) => d.documentType);

  return `
Vendor: ${vendor.name}
Category: ${vendor.category ?? "Unknown"}
Risk Level: ${vendor.riskLevel}
Status: ${vendor.status}
Compliance Score: ${vendor.complianceScore}/100
Owner: ${vendor.ownerName ?? "Not assigned"} (${vendor.ownerDepartment ?? "—"})

Documents:
- Valid: ${valid.join(", ") || "None"}
- Expiring soon: ${expiring.join(", ") || "None"}
- Expired: ${expired.join(", ") || "None"}
- Missing: ${missing.join(", ") || "None"}

Notes: ${vendor.notes ?? "None"}
`.trim();
}

export async function generateVendorSummary(orgId: string, vendorId: string): Promise<string | null> {
  if (!isAIConfigured()) return null;

  const vendor = await vendorRepo.findById(orgId, vendorId);
  if (!vendor) return null;

  const docs = await documentRepo.listByVendor(orgId, vendorId);
  const context = formatVendorContext(vendor, docs);

  const summary = await generateText(`${PROMPT}\n\n${context}`, { maxTokens: 300, temperature: 0.4 });

  if (summary) {
    await vendorRepo.updateVendor(vendorId, { aiSummary: summary, aiSummaryAt: new Date() });
  }
  return summary || null;
}
