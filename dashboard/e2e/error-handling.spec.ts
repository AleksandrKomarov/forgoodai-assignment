import { test, expect } from "@playwright/test";
import { interceptApi } from "./helpers";

test.describe("Error Handling", () => {
  test("single widget failure shows error while siblings render", async ({
    page,
  }) => {
    // Intercept with spend-kpi returning 500
    await interceptApi(page, {
      "spend-kpi": { status: 500, body: { error: "internal_error" } },
    });

    await page.goto("/executive-summary");
    await page.waitForSelector(".kpi-row", { timeout: 10000 });

    // The failed widget should show .widget-error with a retry button
    const widgetError = page.locator(".widget-error");
    await expect(widgetError.first()).toBeVisible({ timeout: 10000 });
    await expect(widgetError.first().locator("button")).toBeVisible();

    // Other KPI cards should still render with data
    // Total Runs should show 13,338
    const kpiCards = page.locator(".kpi-row .kpi");
    const totalRunsCard = kpiCards.filter({ hasText: "13,338" });
    await expect(totalRunsCard).toBeVisible();
  });

  test("retry button works after fixing the endpoint", async ({ page }) => {
    // Start with spend-kpi failing
    await interceptApi(page, {
      "spend-kpi": { status: 500, body: { error: "internal_error" } },
    });

    await page.goto("/executive-summary");
    await page.waitForSelector(".kpi-row", { timeout: 10000 });

    // Verify error state is visible
    const widgetError = page.locator(".widget-error");
    await expect(widgetError.first()).toBeVisible({ timeout: 10000 });

    // Now fix the endpoint by re-routing spend-kpi to return success
    await page.route("**/api/v1/widgets/spend-kpi**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          start: "2025-02-03",
          end: "2025-03-04",
          spend_usd: 47200,
          prior_spend_usd: 43500,
          delta_pct: 8.5,
          budget_usd: 50000,
          budget_utilization_pct: 94.4,
        }),
      });
    });

    // Click the retry button
    const retryButton = widgetError.first().locator("button");
    await retryButton.click();

    // The widget should now re-render with data
    await expect(page.locator(".kpi").filter({ hasText: "$47.2K" })).toBeVisible({
      timeout: 10000,
    });
  });

  test("sibling widgets are unaffected by single endpoint failure", async ({
    page,
  }) => {
    await interceptApi(page, {
      "spend-kpi": { status: 500, body: { error: "internal_error" } },
    });

    await page.goto("/executive-summary");
    await page.waitForSelector(".kpi-row", { timeout: 10000 });

    // Total Runs KPI (from run-volume endpoint) should work fine
    await expect(
      page.locator(".kpi").filter({ hasText: "13,338" }),
    ).toBeVisible({ timeout: 10000 });

    // Success Rate KPI should work fine
    await expect(
      page.locator(".kpi").filter({ hasText: "96.3%" }),
    ).toBeVisible({ timeout: 10000 });

    // Projected Month-End KPI should work fine
    await expect(
      page.locator(".kpi").filter({ hasText: "$48.0K" }),
    ).toBeVisible({ timeout: 10000 });

    // Top cost centers table should still render
    const table = page.locator(".wtable");
    await expect(table).toBeVisible({ timeout: 10000 });
    await expect(table.locator("tbody tr")).toHaveCount(3);
  });
});
