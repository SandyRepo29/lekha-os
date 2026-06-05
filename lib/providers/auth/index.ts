/**
 * Auth provider interface.
 *
 * The only place in the codebase that touches an auth provider SDK is
 * lib/providers/auth/supabase.ts. Services import this interface, not
 * the Supabase Admin SDK, so swapping auth providers requires changing
 * one file.
 */

export interface AuthProvider {
  /**
   * Invite a user by email. Creates the auth account if it doesn't exist
   * and sends a magic-link invite email.
   * Returns the auth user ID.
   */
  inviteUser(email: string, redirectTo: string): Promise<{ userId: string }>;
}

// ---- Factory ----------------------------------------------------------------

import { createSupabaseAuthProvider } from "./supabase";

let _provider: AuthProvider | null = null;

/** Returns the configured auth provider (lazy singleton). */
export function getAuthProvider(): AuthProvider {
  if (!_provider) _provider = createSupabaseAuthProvider();
  return _provider;
}
