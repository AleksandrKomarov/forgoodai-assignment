import { test, expect } from "@playwright/test";
import { interceptApi } from "./helpers";

test.describe("Executive Summary page", () => {
  test.beforeEach(async ({ page }) => {
    await interceptApi(page);
    await page.goto("/executive-summary");
    await page.waitForSelector(".kpi-row", { timeout: 10000 });
  });

  test("shows all 4 KPI cards with correct values", async ({ page }) => {
    const kpiCards = page.locator(".kpi-row .kpi");
    await expect(kpiCards).toHaveCount(4);

    // Accumulated Spend
    const spendCard = kpiCards.nth(0);
    await expect(spendCard).toContainText("$47.2K");
    await expect(spendCard).toContainText("+8.5%");

    // Total Runs
    const runsCard = kpiCards.nth(1);
    await expect(runsCard).toContainText("13,338");
    await expect(runsCard).toContainText("+10.2%");

    // Success Rate
    const successCard = kpiCards.nth(2);
    await expect(successCard).toContainText("96.3%");
    await expect(successCard).toContainText("+0.5pp");

    // Projected Month-End
    const projectedCard = kpiCards.nth(3);
    await expect(projectedCard).toContainText("$48.0K");
    await expect(projectedCard).toContainText("over budget");
  });

  test("monthly spend chart renders with bars", async ({ page }) => {
    const chart = page.locator(".card").filter({ hasText: "Monthly Spend" });
    await expect(chart).toBeVisible({ timeout: 10000 });

    // Recharts renders bars as <rect> inside SVG
    const bars = chart.locator(".recharts-bar-rectangle");
    await expect(bars.first()).toBeVisible({ timeout: 10000 });

    // 12 actual + 3 forecast = 15 bars
    const barCount = await bars.count();
    expect(barCount).toBe(15);
  });

  test("success rate gauge shows percentage", async ({ page }) => {
    const gauge = page.locator(".gauge");
    await expect(gauge).toBeVisible({ timeout: 10000 });
    await expect(gauge).toContainText("96.3%");
  });

  test("run volume sparkline renders bars", async ({ page }) => {
    const sparkline = page.locator(".sparkline");
    await expect(sparkline).toBeVisible({ timeout: 10000 });

    const bars = sparkline.locator(".sp-bar");
    const barCount = await bars.count();
    expect(barCount).toBeGreaterThan(0);
  });

  test("top cost centers table shows 3 team rows with correct team names", async ({
    page,
  }) => {
    const table = page.locator(".wtable");
    await expect(table).toBeVisible({ timeout: 10000 });

    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(3);

    await expect(rows.nth(0)).toContainText("ML Platform");
    await expect(rows.nth(1)).toContainText("Data Engineering");
    await expect(rows.nth(2)).toContainText("Backend Services");
  });
});
