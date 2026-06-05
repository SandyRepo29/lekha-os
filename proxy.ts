import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js proxy (formerly "middleware"). Runs on every matched request to
 * refresh the Supabase auth session and guard authenticated app routes.
 *
 * /api/v1/* routes are excluded from session refresh — they authenticate
 * via Bearer API keys handled inside each route handler.
 */
export async function proxy(request: NextRequest) {
  // API routes handle their own auth — skip session middleware entirely.
  if (request.nextUrl.pathname.startsWith("/api/v1/")) {
    return;
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match everything except static assets and image optimization.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
