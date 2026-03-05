import { test, expect } from "@playwright/test";
import { interceptApi } from "./helpers";

test.describe("Date Range Selector", () => {
  test.beforeEach(async ({ page }) => {
    await interceptApi(page);
    await page.goto("/executive-summary");
    await page.waitForSelector(".kpi-row", { timeout: 10000 });
  });

  test("default preset is Last 30 days", async ({ page }) => {
    const select = page.locator(".date-range-selector select");
    await expect(select).toHaveValue("30d");
  });

  test("changing preset triggers API refetch", async ({ page }) => {
    const calledEndpoints: string[] = [];

    // Add a secondary listener to track new API calls
    await page.route("**/api/v1/widgets/**", async (route) => {
      const url = new URL(route.request().url());
      const endpoint = url.pathname.replace("/api/v1/widgets/", "").split("?")[0]!;
      calledEndpoints.push(endpoint);
      // Continue to the previously registered handler
      await route.fallback();
    });

    // Change preset to "Last 7 days"
    const select = page.locator(".date-range-selector select");
    await select.selectOption("7d");

    // Wait for refetch to happen
    await page.waitForTimeout(1000);

    // Verify that range-scoped endpoints were called
    const expectedEndpoints = [
      "spend-kpi",
      "success-rate",
      "run-volume",
      "top-cost-centers",
    ];
    for (const ep of expectedEndpoints) {
      expect(calledEndpoints).toContain(ep);
    }
  });

  test("date range persists across navigation", async ({ page }) => {
    const select = page.locator(".date-range-selector select");

    // Change to "Last 90 days"
    await select.selectOption("90d");
    await expect(select).toHaveValue("90d");

    // Navigate to cost explorer
    const costExplorerLink = page.locator(
      '.sidebar nav a[href="/cost-explorer"]',
    );
    await costExplorerLink.click();
    await page.waitForURL("**/cost-explorer");

    // Verify the select still shows "Last 90 days"
    const selectAfterNav = page.locator(".date-range-selector select");
    await expect(selectAfterNav).toHaveValue("90d");
  });

  test("custom range shows date inputs", async ({ page }) => {
    const select = page.locator(".date-range-selector select");

    // Initially, no date inputs should be visible
    await expect(page.locator('.date-range-selector input[type="date"]')).toHaveCount(0);

    // Select "Custom range"
    await select.selectOption("custom");

    // Two date inputs should appear
    const dateInputs = page.locator('.date-range-selector input[type="date"]');
    await expect(dateInputs).toHaveCount(2);
    await expect(dateInputs.nth(0)).toBeVisible();
    await expect(dateInputs.nth(1)).toBeVisible();
  });

  test("custom range validation shows error for invalid dates", async ({
    page,
  }) => {
    const select = page.locator(".date-range-selector select");
    await select.selectOption("custom");

    const startInput = page.locator('input[aria-label="Start date"]');
    const endInput = page.locator('input[aria-label="End date"]');

    // Set end date before start date
    await startInput.fill("2025-03-10");
    await endInput.fill("2025-03-01");

    // Error message should appear
    const error = page.locator(".date-range-error");
    await expect(error).toBeVisible({ timeout: 5000 });
    await expect(error).toContainText("End date must be after start date");
  });
});
