import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the OAuth / email-confirmation redirect from Supabase Auth,
 * exchanging the code for a session.
 * Also creates an AUDT session record and sets the audt-sid cookie.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const res = NextResponse.redirect(`${origin}${next}`);
      // Create AUDT session record asynchronously (fire-and-forget on error)
      try {
        const { findActiveOrgByUser } = await import("@/lib/repositories/org-repo");
        const { createSession } = await import("@/lib/services/auth/session-service");
        const org = await findActiveOrgByUser(data.user.id);
        if (org) {
          const { sessionId } = await createSession({
            userId: data.user.id,
            orgId: org.id,
            ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? undefined,
            userAgent: request.headers.get("user-agent") ?? undefined,
          });
          res.cookies.set("audt-sid", sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 8 * 3600,
            path: "/",
          });
        }
      } catch {
        // Session creation failure must not block login
      }
      return res;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
