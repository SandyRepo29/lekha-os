/**
 * Supabase Storage implementation of StorageProvider.
 *
 * This is the ONLY file that calls the Supabase Storage SDK for file
 * operations. Uses the user's session client so RLS policies are enforced.
 */

import { createClient } from "@/lib/supabase/server";
import type { StorageProvider } from "./index";

export function createSupabaseStorageProvider(bucket: string): StorageProvider {
  return {
    async uploadFile(path: string, data: Buffer, mimeType: string) {
      const supabase = await createClient();
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, data, { contentType: mimeType, upsert: true });
      if (error) throw new Error(`Storage upload failed: ${error.message}`);
    },

    async downloadFile(path: string) {
      const supabase = await createClient();
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error || !data) return null;
      const bytes = Buffer.from(await data.arrayBuffer());
      return { bytes, mimeType: data.type || "application/octet-stream" };
    },

    async deleteFile(paths: string[]) {
      if (paths.length === 0) return;
      const supabase = await createClient();
      await supabase.storage.from(bucket).remove(paths);
    },

    async generateSignedUrl(path: string, expiresIn = 900) {
      const supabase = await createClient();
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);
      return data?.signedUrl ?? null;
    },

    async exists(path: string) {
      const supabase = await createClient();
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60);
      return data?.signedUrl != null;
    },
  };
}
