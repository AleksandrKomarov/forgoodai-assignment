import { test, expect } from "@playwright/test";
import { interceptApi } from "./helpers";

test.beforeEach(async ({ page }) => {
  await interceptApi(page);
  await page.goto("/usage");
});

test("shows 4 KPI cards with values", async ({ page }) => {
  const kpiCards = page.locator(".kpi");
  await expect(kpiCards).toHaveCount(4);

  // Active Teams: active_teams=4
  const teamsCard = kpiCards.filter({ hasText: "Active Teams" });
  await expect(teamsCard.locator(".kpi-value")).toHaveText("4");
  // Subtitle shows "4 of 5"
  await expect(teamsCard.locator(".kpi-delta")).toContainText("4 of 5");

  // Active Users: active_users=87 -> formatCount -> "87"
  const usersCard = kpiCards.filter({ hasText: "Active Users" });
  await expect(usersCard.locator(".kpi-value")).toHaveText("87");

  // Peak Concurrency: peak_in_period=28 -> formatCount -> "28"
  const concurrencyCard = kpiCards.filter({ hasText: "Peak Concurrency" });
  await expect(concurrencyCard.locator(".kpi-value")).toHaveText("28");

  // New Agent Types: current_month.new_count=3
  const agentTypesCard = kpiCards.filter({ hasText: "New Agent Types" });
  await expect(agentTypesCard.locator(".kpi-value")).toHaveText("3");
});

test("concurrency chart renders with bars", async ({ page }) => {
  const chart = page.locator(".concurrency-chart");
  await expect(chart).toBeVisible();

  // 3 daily data points -> 3 bars
  const bars = chart.locator(".concurrency-bar");
  await expect(bars).toHaveCount(3);

  // Limit line should be visible (concurrency_limit=30)
  const limitLine = chart.locator(".concurrency-limit-line");
  await expect(limitLine).toBeVisible();
  await expect(limitLine).toContainText("Limit: 30");
});

test("run volume by team shows team names", async ({ page }) => {
  const volumeCard = page
    .locator(".card")
    .filter({ hasText: "Run Volume by Team" });
  await expect(volumeCard).toBeVisible();

  const rows = volumeCard.locator(".run-volume-row");
  await expect(rows).toHaveCount(5);

  const teamNames = ["ML Infra", "Data Eng", "Platform", "Security", "DevTools"];
  for (const name of teamNames) {
    await expect(rows.filter({ hasText: name })).toBeVisible();
  }
});

test("run heatmap renders cells", async ({ page }) => {
  const heatmapCard = page
    .locator(".card")
    .filter({ hasText: "Run Heatmap" });
  await expect(heatmapCard).toBeVisible();

  const table = heatmapCard.locator(".heatmap-table");
  await expect(table).toBeVisible();

  // 7 day rows in the heatmap
  const bodyRows = table.locator("tbody tr");
  await expect(bodyRows).toHaveCount(7);

  // Each row has 24 hour cells + 1 label cell = heatmap-cells present
  const cells = table.locator(".heatmap-cell");
  // 7 days * 24 hours = 168 cells
  await expect(cells).toHaveCount(168);
});

test("agent adoption chart renders", async ({ page }) => {
  const adoptionCard = page
    .locator(".card")
    .filter({ hasText: "New Agent Types Adopted" });
  await expect(adoptionCard).toBeVisible();

  // 6 months of data -> 6 adoption bars
  const bars = adoptionCard.locator(".adoption-bar");
  await expect(bars).toHaveCount(6);
});
