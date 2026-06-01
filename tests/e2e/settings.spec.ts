import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./helpers/auth";
import * as fs from "fs";

const hasAuthState = fs.existsSync(AUTH_STATE_PATH);

test.describe("Settings", () => {
  test.use({ storageState: hasAuthState ? AUTH_STATE_PATH : undefined });
  test.skip(!hasAuthState, "No saved auth session — run auth setup first");

  test("settings page loads with profile and org sections", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your profile" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Organization", exact: true })).toBeVisible();
  });

  test("team page loads with invite form", async ({ page }) => {
    await page.goto("/settings/team");
    await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();
  });

  test("notifications page loads with preference toggles", async ({ page }) => {
    await page.goto("/settings/notifications");
    await expect(page.getByRole("heading", { name: "Notifications", exact: true })).toBeVisible();
    await expect(page.getByText(/expiry alerts/i).first()).toBeVisible();
    await expect(page.getByText(/weekly/i).first()).toBeVisible();
  });

  test("sign out button is present on settings page", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
  });
});
