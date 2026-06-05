/**
 * Platform storage adapter — delegates to the StorageProvider.
 *
 * Currently backed by Supabase Storage (lib/providers/storage/supabase.ts).
 * To switch to S3, GCS, or Azure Blob: implement StorageProvider there and
 * swap the import below. All callers remain unchanged.
 */

import { createSupabaseStorageProvider } from "@/lib/providers/storage/supabase";
import { VENDOR_DOCS_BUCKET } from "./paths";

const _provider = createSupabaseStorageProvider(VENDOR_DOCS_BUCKET);

export const downloadObject  = (path: string) => _provider.download(path);
export const removeObjects   = (paths: string[]) => _provider.delete(paths);
export const createSignedUrl = (path: string, expiresIn?: number) =>
  _provider.signedUrl(path, expiresIn);
