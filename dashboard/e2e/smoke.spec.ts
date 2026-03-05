import { test, expect } from "@playwright/test";

const routes = [
  { path: "/executive-summary", title: "Executive Summary" },
  { path: "/cost-explorer", title: "Cost Explorer" },
  { path: "/performance", title: "Performance & Reliability" },
  { path: "/usage", title: "Usage & Capacity" },
  { path: "/team", title: "Team Drill-Down" },
];

test.describe("Smoke tests", () => {
  test("landing page redirects to executive summary", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/executive-summary");
    expect(page.url()).toMatch(/\/executive-summary$/);
  });

  for (const route of routes) {
    test(`${route.title} page loads without console errors`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(route.path);
      await page.waitForSelector(".kpi, .card", { timeout: 10000 });

      expect(consoleErrors).toEqual([]);
    });
  }

  test("sidebar navigation works across all pages", async ({ page }) => {
    await page.goto("/executive-summary");
    await page.waitForSelector("h1", { timeout: 10000 });

    for (const route of routes) {
      const navLink = page.locator(`.sidebar nav a[href="${route.path}"]`);
      await navLink.click();
      await page.waitForURL(`**${route.path}`);

      const heading = page.locator("h1");
      await expect(heading).toHaveText(route.title, { timeout: 10000 });
    }
  });
});
