import { test, expect } from "@playwright/test";

const E2E_EMAIL    = process.env.E2E_USER_EMAIL    ?? "e2e@lekhaos.test";
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD ?? "E2ETest123!";

test.describe("Authentication flow", () => {
  test("landing page renders with hero and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".hero__title")).toBeVisible();
    await expect(page.getByRole("link", { name: /request demo/i }).first()).toBeVisible();
  });

  test("unauthenticated user accessing /dashboard is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user accessing /vendors is redirected to /login", async ({ page }) => {
    await page.goto("/vendors");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders with email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("signup page renders with full name, email, and password fields", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("wrong@email.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Error message should appear (Supabase returns error for invalid credentials)
    await expect(page.locator("text=/invalid|incorrect|credentials/i").first()).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Authenticated user flow", () => {
  // These tests require valid Supabase credentials to be set via env vars
  test.skip(!process.env.E2E_USER_EMAIL, "E2E_USER_EMAIL not set — skipping authenticated tests");

  test("sign in and land on dashboard or onboarding", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(E2E_EMAIL);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|vendors|onboarding)/, { timeout: 15_000 });
    const url = page.url();
    expect(url).toMatch(/dashboard|vendors|onboarding/);
  });
});
