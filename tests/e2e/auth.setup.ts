import { test as setup } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { signIn, saveSession, AUTH_STATE_PATH } from "./helpers/auth";

const E2E_EMAIL    = process.env.E2E_USER_EMAIL    ?? "e2e@lekhaos.test";
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD ?? "E2ETest123!";

/**
 * Setup project: signs in once and persists the session to AUTH_STATE_PATH.
 * The `chromium` project depends on this, so authenticated specs
 * (settings, vendor-crud) get a logged-in browser context.
 *
 * Requires E2E_USER_EMAIL / E2E_USER_PASSWORD in the environment and a
 * seeded user (run `node scripts/seed-e2e.mjs` first).
 */
setup("authenticate and save session", async ({ page, context }) => {
  fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });
  await signIn(page, E2E_EMAIL, E2E_PASSWORD);
  await saveSession(context);
});
