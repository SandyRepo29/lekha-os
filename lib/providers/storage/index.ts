/**
 * Storage provider interface.
 *
 * The only storage SDK calls live in lib/providers/storage/supabase.ts.
 * To move to S3, GCS, or Azure Blob (e.g. for DPDP India data residency),
 * implement this interface and swap the factory in lib/storage/server.ts.
 */

export interface StorageProvider {
  /** Download a file. Returns null if the object does not exist. */
  download(path: string): Promise<{ bytes: Buffer; mimeType: string } | null>;

  /** Permanently delete one or more objects. */
  delete(paths: string[]): Promise<void>;

  /**
   * Generate a short-lived signed URL for direct browser download.
   * Returns null if the object does not exist.
   */
  signedUrl(path: string, expiresIn?: number): Promise<string | null>;
}
