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
    async download(path: string) {
      const supabase = await createClient();
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error || !data) return null;
      const bytes = Buffer.from(await data.arrayBuffer());
      return { bytes, mimeType: data.type || "application/octet-stream" };
    },

    async delete(paths: string[]) {
      if (paths.length === 0) return;
      const supabase = await createClient();
      await supabase.storage.from(bucket).remove(paths);
    },

    async signedUrl(path: string, expiresIn = 3600) {
      const supabase = await createClient();
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);
      return data?.signedUrl ?? null;
    },
  };
}
