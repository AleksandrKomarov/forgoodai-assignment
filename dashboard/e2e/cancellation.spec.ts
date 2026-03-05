import { test, expect } from "@playwright/test";
import { interceptApi } from "./helpers";

test.describe("Request Cancellation", () => {
  test("navigating away during slow response does not cause stale errors", async ({
    page,
  }) => {
    // Intercept with a very slow spend-kpi
    await interceptApi(page, {
      "spend-kpi": {
        delay: 5000,
        body: {
          start: "2025-02-03",
          end: "2025-03-04",
          spend_usd: 47200,
          prior_spend_usd: 43500,
          delta_pct: 8.5,
          budget_usd: 50000,
          budget_utilization_pct: 94.4,
        },
      },
    });

    // Navigate to executive summary (spend-kpi will be loading)
    await page.goto("/executive-summary");

    // Wait briefly for the page to start loading
    await page.waitForSelector(".skeleton, .kpi", { timeout: 5000 });

    // Immediately navigate away to cost explorer
    const costExplorerLink = page.locator(
      '.sidebar nav a[href="/cost-explorer"]',
    );
    await costExplorerLink.click();
    await page.waitForURL("**/cost-explorer");

    // Cost explorer page should load without errors
    await page.waitForSelector(".card, .kpi", { timeout: 10000 });

    // There should be no stale widget-error from the executive summary page
    // (give it a moment for any stale state to potentially appear)
    await page.waitForTimeout(500);
    const pageContent = await page.textContent("body");
    expect(pageContent).not.toContain("Failed to load data");
  });

  test("date range change cancels previous slow request", async ({ page }) => {
    let callCount = 0;

    // First, set up normal interception
    await interceptApi(page);

    await page.goto("/executive-summary");
    await page.waitForSelector(".kpi-row", { timeout: 10000 });

    // Now re-route spend-kpi to be slow for the first subsequent call, fast for the next
    await page.route("**/api/v1/widgets/spend-kpi**", async (route) => {
      callCount++;
      if (callCount === 1) {
        // First call after date change: very slow
        await new Promise((r) => setTimeout(r, 5000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            start: "2025-02-03",
            end: "2025-03-04",
            spend_usd: 99999,
            prior_spend_usd: 43500,
            delta_pct: 8.5,
            budget_usd: 50000,
            budget_utilization_pct: 94.4,
          }),
        });
      } else {
        // Second call: fast
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
      }
    });

    // Change date range to trigger first (slow) fetch
    const select = page.locator(".date-range-selector select");
    await select.selectOption("7d");

    // Quickly change again to trigger second (fast) fetch, canceling the first
    await select.selectOption("90d");

    // Wait for loading to resolve
    await page.waitForTimeout(2000);

    // The page should be in a valid state without errors
    const widgetErrors = page.locator(".widget-error");
    const errorCount = await widgetErrors.count();
    expect(errorCount).toBe(0);
  });
});
