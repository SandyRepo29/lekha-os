/**
 * Storage provider interface.
 *
 * The only storage SDK calls live in lib/providers/storage/supabase.ts.
 * To add S3, Azure Blob, SharePoint, or OneDrive (future enterprise phases):
 * implement this interface and register the provider via the factory in
 * lib/storage/server.ts. Business services must never import storage SDKs
 * directly — always call through this interface.
 */

export interface StorageProvider {
  /** Upload a file. Overwrites if the path already exists. */
  uploadFile(path: string, data: Buffer, mimeType: string): Promise<void>;

  /** Download a file. Returns null if the object does not exist. */
  downloadFile(path: string): Promise<{ bytes: Buffer; mimeType: string } | null>;

  /** Permanently delete one or more objects. */
  deleteFile(paths: string[]): Promise<void>;

  /**
   * Generate a short-lived signed URL for direct browser download.
   * Default expiry is 900 seconds (15 minutes) — private bucket requirement.
   * Returns null if the object does not exist.
   */
  generateSignedUrl(path: string, expiresIn?: number): Promise<string | null>;

  /** Returns true if the object exists in the bucket. */
  exists(path: string): Promise<boolean>;
}
