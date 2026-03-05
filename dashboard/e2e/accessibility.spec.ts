import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { interceptApi } from "./helpers";

test.describe("Accessibility", () => {
  test("executive summary has no critical a11y violations", async ({
    page,
  }) => {
    await interceptApi(page);
    await page.goto("/executive-summary");
    await page.waitForSelector(".kpi", { timeout: 10000 });

    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast", "landmark-one-main", "page-has-heading-one", "region"])
      .analyze();

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(criticalOrSerious).toEqual([]);
  });

  test("cost explorer has no critical a11y violations", async ({ page }) => {
    await interceptApi(page);
    await page.goto("/cost-explorer");
    await page.waitForSelector(".kpi, .card", { timeout: 10000 });

    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast", "landmark-one-main", "page-has-heading-one", "region"])
      .analyze();

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(criticalOrSerious).toEqual([]);
  });

  test("keyboard navigation through sidebar links", async ({ page }) => {
    await interceptApi(page);
    await page.goto("/executive-summary");
    await page.waitForSelector(".kpi", { timeout: 10000 });

    const sidebarLinks = page.locator(".sidebar nav a");
    const linkCount = await sidebarLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    // Focus the first sidebar link by clicking it, then we can tab through
    await sidebarLinks.nth(0).focus();

    // Verify focus is on the first link
    const firstLinkHref = await sidebarLinks.nth(0).getAttribute("href");
    let focusedHref = await page.evaluate(() =>
      document.activeElement?.getAttribute("href"),
    );
    expect(focusedHref).toBe(firstLinkHref);

    // Tab through remaining sidebar links
    for (let i = 1; i < linkCount; i++) {
      await page.keyboard.press("Tab");

      const expectedHref = await sidebarLinks.nth(i).getAttribute("href");
      focusedHref = await page.evaluate(() =>
        document.activeElement?.getAttribute("href"),
      );
      expect(focusedHref).toBe(expectedHref);
    }
  });
});
