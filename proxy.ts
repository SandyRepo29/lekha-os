import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js proxy (formerly "middleware"). Runs on every matched request.
 *
 * Order of operations:
 * 1. Skip /api/v1/* — they handle their own Bearer auth.
 * 2. Refresh Supabase session (updateSession).
 * 3. Enterprise auth enforcement (session tracking, IP allowlist, MFA gate).
 *
 * /auth/* and /api/auth/* routes are reachable without MFA verification
 * (they are the verification flow itself).
 */

// Routes that bypass enterprise auth enforcement
const AUTH_BYPASS = ["/auth/", "/api/auth/", "/_next/", "/favicon", "/portal/"];
// Routes that are public (no auth required, skip all checks)
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/verify/", "/api/health"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. API v1 routes — skip entirely
  if (pathname.startsWith("/api/v1/")) return;

  // 2. Public routes — skip enforcement
  if (PUBLIC_ROUTES.some(p => pathname === p || pathname.startsWith(p))) {
    return updateSession(request);
  }

  // 3. Refresh Supabase session
  const sessionResponse = await updateSession(request);

  // 4. Auth bypass routes (MFA verify page, auth callbacks)
  if (AUTH_BYPASS.some(p => pathname.startsWith(p))) {
    return sessionResponse;
  }

  // 5. Enterprise auth enforcement on authenticated app routes
  try {
    const enforcement = await enforceEnterpriseAuth(request, sessionResponse);
    if (enforcement) return enforcement;
  } catch {
    // Non-fatal — don't block the request if enforcement fails
  }

  return sessionResponse;
}

// ─── Enterprise auth enforcement ─────────────────────────────────────────────

async function enforceEnterpriseAuth(
  request: NextRequest,
  baseResponse: NextResponse | undefined
): Promise<NextResponse | null> {
  const { createServerClient } = await import("@supabase/ssr");

  // Build a Supabase client from the (now-refreshed) request cookies
  let userId: string | null = null;
  let orgId: string | null = null;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {}, // read-only in middleware context
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null; // unauthenticated — updateSession handles redirect

    userId = user.id;

    // Get org ID from audt-sid cookie (set when session was created) or look up
    const sidCookie = request.cookies.get("audt-sid")?.value;
    if (sidCookie) {
      const { getSessionById } = await import("@/lib/repositories/security-command-center-repo");
      const session = await getSessionById(sidCookie);
      if (session) {
        orgId = session.organizationId;

        // Check idle timeout
        const { getMfaSettings } = await import("@/lib/repositories/security-command-center-repo");
        const settings = await getMfaSettings(orgId);
        const idleMinutes = settings?.idleTimeoutMinutes ?? 60;
        const absoluteHours = settings?.absoluteTimeoutHours ?? 8;

        const idleExpired = Date.now() - session.lastActive.getTime() > idleMinutes * 60_000;
        const absoluteExpired = Date.now() - session.createdAt.getTime() > absoluteHours * 3_600_000;

        if (idleExpired || absoluteExpired) {
          const { revokeSession } = await import("@/lib/repositories/security-command-center-repo");
          await revokeSession(orgId, sidCookie, userId).catch(() => {});
          const loginUrl = new URL("/login", request.url);
          loginUrl.searchParams.set("expired", "1");
          const redirect = NextResponse.redirect(loginUrl);
          redirect.cookies.delete("audt-sid");
          redirect.cookies.delete("audt-mfa");
          return redirect;
        }

        // Check IP allowlist (non-blocking if DB fails)
        const { isIpAllowed, extractRequestIp } = await import("@/lib/services/auth/ip-check-service");
        const ip = extractRequestIp(Object.fromEntries(request.headers.entries()));
        if (ip) {
          const allowed = await isIpAllowed(orgId, ip, "all").catch(() => true);
          if (!allowed) {
            return new NextResponse("Access denied: your IP address is not allowed.", {
              status: 403,
              headers: { "Content-Type": "text/plain" },
            });
          }
        }

        // Update lastActive (fire-and-forget)
        const { updateSessionLastActive } = await import("@/lib/repositories/security-command-center-repo");
        updateSessionLastActive(sidCookie).catch(() => {});

        // Check MFA gate
        const mfaVerifiedCookie = request.cookies.get("audt-mfa")?.value;
        if (!mfaVerifiedCookie && settings) {
          const { getMfaStatusForUser } = await import("@/lib/repositories/security-command-center-repo");
          const mfaStatus = await getMfaStatusForUser(userId, orgId);

          if (mfaStatus?.enabled && !session.mfaVerified) {
            const mfaUrl = new URL("/auth/mfa-verify", request.url);
            return NextResponse.redirect(mfaUrl);
          }
        }
      }
    }
  } catch {
    // Enforcement failure — allow through (fail-open for availability)
  }

  return null;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
