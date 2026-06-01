import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./helpers/auth";
import * as fs from "fs";

const hasAuthState = fs.existsSync(AUTH_STATE_PATH);

// All CRUD tests require an authenticated session.
// Save the session first by running: npx playwright test auth.spec.ts --project=chromium
// with E2E_USER_EMAIL and E2E_USER_PASSWORD set in .env.local.
test.describe("Vendor CRUD", () => {
  test.use({ storageState: hasAuthState ? AUTH_STATE_PATH : undefined });
  test.skip(!hasAuthState, "No saved auth session — run auth setup first");

  test("vendor list page loads", async ({ page }) => {
    await page.goto("/vendors");
    await expect(page.getByRole("heading", { name: /vendors/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /add vendor/i })).toBeVisible();
  });

  test("add vendor form is accessible", async ({ page }) => {
    await page.goto("/vendors/new");
    await expect(page.getByLabel(/vendor name/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /add vendor/i })).toBeVisible();
  });

  test("add vendor — validation rejects empty name", async ({ page }) => {
    await page.goto("/vendors/new");
    await page.getByRole("button", { name: /add vendor/i }).click();
    // Required field validation should prevent submission or show error
    const nameInput = page.getByLabel(/vendor name/i);
    await expect(nameInput).toBeVisible();
  });

  test("full vendor CRUD flow", async ({ page }) => {
    const vendorName = `E2E Vendor ${Date.now()}`;

    // 1. Navigate to add vendor
    await page.goto("/vendors/new");
    await page.getByLabel(/vendor name/i).fill(vendorName);
    await page.getByRole("button", { name: /add vendor/i }).click();

    // 2. Redirected to vendor detail
    await page.waitForURL(/\/vendors\/.+/, { timeout: 10_000 });
    await expect(page.getByText(vendorName)).toBeVisible();

    // 3. Score ring is visible
    await expect(page.locator("svg").first()).toBeVisible();

    // 4. Documents tab is the default
    await expect(page.getByRole("tab", { name: /documents/i })).toBeVisible();

    // 5. Edit vendor
    await page.getByRole("link", { name: /edit/i }).click();
    await page.waitForURL(/\/vendors\/.+\/edit/);
    await expect(page.getByLabel(/vendor name/i)).toHaveValue(vendorName);

    // 6. Go back
    await page.getByRole("link", { name: /back/i }).click();
    await page.waitForURL(/\/vendors\/.+/);

    // 7. Delete vendor
    await page.getByRole("button", { name: /delete/i }).click();
    // Confirm browser dialog
    page.on("dialog", (d) => d.accept());
    await page.waitForURL("/vendors", { timeout: 10_000 });

    // 8. Vendor no longer in list
    await expect(page.getByText(vendorName)).not.toBeVisible();
  });
});
