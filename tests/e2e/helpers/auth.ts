import type { Page, BrowserContext } from "@playwright/test";
import path from "path";

export const AUTH_STATE_PATH = path.resolve(__dirname, "../.auth/user.json");

/** Sign in via the login page and save session cookies to `storageState`. */
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  // Wait for redirect to dashboard or vendors (depending on onboarding state)
  await page.waitForURL(/\/(dashboard|vendors|onboarding)/, { timeout: 15_000 });
}

/** Save the current session context to the auth state file. */
export async function saveSession(context: BrowserContext): Promise<void> {
  await context.storageState({ path: AUTH_STATE_PATH });
}
