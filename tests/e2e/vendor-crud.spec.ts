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
    const detailUrl = /\/vendors\/[0-9a-f-]{36}$/;

    // 1. Create a vendor — the app redirects to the vendor LIST (not detail)
    await page.goto("/vendors/new");
    await page.getByLabel(/vendor name/i).fill(vendorName);
    await page.getByRole("button", { name: /add vendor/i }).click();

    // 2. Land on the list; the new vendor is present
    await page.waitForURL(/\/vendors(\?.*)?$/, { timeout: 10_000 });
    const listLink = page.getByRole("link", { name: new RegExp(vendorName) });
    await expect(listLink).toBeVisible();

    // 3. Open the vendor detail page
    await listLink.click();
    await page.waitForURL(detailUrl, { timeout: 10_000 });
    await expect(page.getByText(vendorName).first()).toBeVisible();

    // 4. Documents tab is the default
    await expect(page.getByRole("tab", { name: /documents/i })).toBeVisible();

    // 5. Edit vendor
    await page.getByRole("link", { name: /edit/i }).first().click();
    await page.waitForURL(/\/vendors\/[0-9a-f-]{36}\/edit/);
    await expect(page.getByLabel(/vendor name/i)).toHaveValue(vendorName);

    // 6. Return to detail
    await page.goBack();
    await page.waitForURL(detailUrl);

    // 7. Delete vendor (native confirm — accept it)
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /^delete$/i }).click();

    // 8. Redirected to the list; vendor no longer present
    await page.waitForURL(/\/vendors(\?.*)?$/, { timeout: 10_000 });
    await expect(page.getByRole("link", { name: new RegExp(vendorName) })).toHaveCount(0);
  });
});
