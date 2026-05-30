import { createClient } from "@/lib/supabase/server";
import { VENDOR_DOCS_BUCKET } from "./paths";

/**
 * Platform adapter for vendor-document storage. Uses the user's Supabase
 * session (RLS-enforced). This is the deliberate seam where the otherwise
 * framework-agnostic services touch infrastructure.
 */
export async function downloadObject(
  path: string
): Promise<{ bytes: Buffer; mimeType: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(VENDOR_DOCS_BUCKET).download(path);
  if (error || !data) return null;
  const bytes = Buffer.from(await data.arrayBuffer());
  return { bytes, mimeType: data.type || "application/octet-stream" };
}

export async function removeObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = await createClient();
  await supabase.storage.from(VENDOR_DOCS_BUCKET).remove(paths);
}

export async function createSignedUrl(path: string, expiresIn = 3600): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage.from(VENDOR_DOCS_BUCKET).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}
