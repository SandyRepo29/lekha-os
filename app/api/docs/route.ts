/**
 * GET /api/docs
 *
 * Serves the AUDT OpenAPI 3.1 specification as JSON.
 * No authentication required — the spec itself describes public API structure.
 * Cached for 1 hour at CDN/browser.
 */

export const dynamic = "force-dynamic";

import { buildOpenApiSpec } from "@/lib/openapi/spec";

export async function GET() {
  const spec = buildOpenApiSpec();
  return new Response(JSON.stringify(spec, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
