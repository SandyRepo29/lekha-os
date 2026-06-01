import { test, expect } from "@playwright/test";

test.describe("Vendor portal", () => {
  test("invalid token returns 404", async ({ page }) => {
    const response = await page.goto("/portal/invalid-token-that-does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("expired-looking token route loads the portal page (even if token invalid)", async ({ page }) => {
    // The route itself should render; the 404 is from the notFound() inside the page
    const response = await page.goto("/portal/0000000000000000000000000000000000000000000000000000000000000000");
    // Either 404 or 200 (depending on DB state) — importantly does not crash with 500
    expect([200, 404]).toContain(response?.status());
  });
});
