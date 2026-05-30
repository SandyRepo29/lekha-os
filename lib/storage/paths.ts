export const VENDOR_DOCS_BUCKET = "vendor-documents";

/** Path convention: {orgId}/{vendorId}/{timestamp}-{safeFileName} */
export function buildVendorDocPath(orgId: string, vendorId: string, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return `${orgId}/${vendorId}/${Date.now()}-${safe}`;
}
