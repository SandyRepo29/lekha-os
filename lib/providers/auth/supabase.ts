/**
 * Supabase Auth implementation of AuthProvider.
 *
 * This is the ONLY file that imports @supabase/supabase-js for admin auth
 * operations. All business logic remains provider-agnostic.
 */

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { DomainError } from "@/lib/services/errors";
import type { AuthProvider } from "./index";

export function createSupabaseAuthProvider(): AuthProvider {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (
    !serviceRoleKey ||
    serviceRoleKey === "placeholder-service-role-key" ||
    !supabaseUrl
  ) {
    throw new DomainError(
      "Service role key not configured. Add SUPABASE_SERVICE_ROLE_KEY to env vars."
    );
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return {
    async inviteUser(email: string, redirectTo: string) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
      });
      if (error) throw new DomainError(`Invite failed: ${error.message}`);
      const userId = data.user?.id;
      if (!userId) throw new DomainError("Could not get invited user ID.");
      return { userId };
    },
  };
}
