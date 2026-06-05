export const VENDOR_DOCS_BUCKET = "vendor-documents";
export const COMPLIANCE_DOCS_BUCKET = "compliance-documents";

/**
 * Tenant-scoped path for compliance documents.
 * Structure: tenant_{orgId}/{category}/{vendorId}/{timestamp}-{safeFileName}
 *
 * The tenant_ prefix allows RLS policies to extract and verify the org ID
 * from the first path segment without ambiguity.
 */
export function buildDocPath(
  orgId: string,
  category: "vendors" | "contracts" | "assessments" | "evidence" | "certifications" | "policies" | "questionnaires" | "reports",
  subId: string,
  fileName: string
): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return `tenant_${orgId}/${category}/${subId}/${Date.now()}-${safe}`;
}

/** Convenience wrapper for vendor documents (most common case). */
export function buildVendorDocPath(orgId: string, vendorId: string, fileName: string): string {
  return buildDocPath(orgId, "vendors", vendorId, fileName);
}

/**
 * Detect which bucket a stored path belongs to.
 * Paths with the tenant_ prefix use the compliance-documents bucket;
 * legacy paths (UUID first segment) use the old vendor-documents bucket.
 */
export function bucketForPath(storagePath: string): string {
  return storagePath.startsWith("tenant_") ? COMPLIANCE_DOCS_BUCKET : VENDOR_DOCS_BUCKET;
}
