import { expect, test } from "@playwright/test";

test.describe("Stokely public smoke", () => {
  test("landing page renders core marketing/features", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /build your streaks/i })).toBeVisible();
    await expect(page.getByText("End-to-End Encrypted Vault")).toBeVisible();
    await expect(page.getByText("Session + Account Controls")).toBeVisible();
    await expect(page.getByText("More Than a Reminder List")).toBeVisible();
  });

  test("register and login routes are reachable", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /get stoked for stokely/i }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /log in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
  });

  test("reset-password without token shows invalid-link state", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText(/invalid reset link/i)).toBeVisible();
  });

  test("forgot-password and verify-email public routes render expected states", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /recover account/i })).toBeVisible();

    await page.goto("/verify-email");
    await expect(page.getByText(/no verification token found/i)).toBeVisible();
  });

  test("token query params are scrubbed from reset/verify routes", async ({ page }) => {
    await page.goto("/reset-password?token=test-reset-token");
    await expect(page).toHaveURL(/\/reset-password$/);

    await page.goto("/verify-email?token=test-verify-token");
    await expect(page).toHaveURL(/\/verify-email$/);
  });
});
