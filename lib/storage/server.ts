/**
 * Platform storage adapter — delegates to the StorageProvider.
 *
 * Currently backed by Supabase Storage (lib/providers/storage/supabase.ts).
 * To add S3, Azure Blob, or SharePoint: implement StorageProvider there,
 * update the factory call below. All callers remain unchanged.
 *
 * Bucket routing:
 *   New uploads  → compliance-documents  (tenant_{orgId}/... paths)
 *   Legacy files → vendor-documents      (plain {orgId}/... paths)
 * The bucketForPath() helper auto-detects which bucket to use for downloads
 * and deletes, so callers never need to specify the bucket explicitly.
 */

import { createSupabaseStorageProvider } from "@/lib/providers/storage/supabase";
import { VENDOR_DOCS_BUCKET, COMPLIANCE_DOCS_BUCKET, bucketForPath } from "./paths";

function provider(bucket: string) {
  return createSupabaseStorageProvider(bucket);
}

/** Upload a file to the compliance-documents bucket. */
export const uploadFile = (path: string, data: Buffer, mimeType: string) =>
  provider(COMPLIANCE_DOCS_BUCKET).uploadFile(path, data, mimeType);

/**
 * Download a file. Auto-detects the bucket from the path prefix.
 * Returns null if the object does not exist.
 */
export const downloadObject = (path: string) =>
  provider(bucketForPath(path)).downloadFile(path);

/**
 * Permanently delete objects. Paths may span both buckets — they are
 * grouped internally and deleted from the correct bucket each.
 */
export async function removeObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const legacy = paths.filter((p) => !p.startsWith("tenant_"));
  const modern = paths.filter((p) => p.startsWith("tenant_"));
  await Promise.all([
    legacy.length ? provider(VENDOR_DOCS_BUCKET).deleteFile(legacy) : Promise.resolve(),
    modern.length ? provider(COMPLIANCE_DOCS_BUCKET).deleteFile(modern) : Promise.resolve(),
  ]);
}

/**
 * Generate a 15-minute signed URL for browser download.
 * Auto-detects the correct bucket from the path prefix.
 */
export const createSignedUrl = (path: string, expiresIn = 900) =>
  provider(bucketForPath(path)).generateSignedUrl(path, expiresIn);

/** Check whether an object exists in storage. */
export const objectExists = (path: string) =>
  provider(bucketForPath(path)).exists(path);
