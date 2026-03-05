import { test, expect } from "@playwright/test";
import { interceptApi } from "./helpers";

test.beforeEach(async ({ page }) => {
  await interceptApi(page);
  await page.goto("/cost-explorer");
});

test("shows page title", async ({ page }) => {
  await expect(page.locator("h1")).toHaveText("Cost Explorer");
});

test("filter bar renders with dimension and granularity selects", async ({
  page,
}) => {
  const filterBar = page.locator(".filter-bar");
  await expect(filterBar).toBeVisible();

  const selects = filterBar.locator("select");
  await expect(selects).toHaveCount(2);

  // Dimension select has Team and Agent Type options
  const dimensionSelect = selects.nth(0);
  await expect(dimensionSelect).toHaveValue("team");
  await expect(dimensionSelect.locator("option")).toHaveText([
    "Team",
    "Agent Type",
  ]);

  // Granularity select has Daily, Weekly, Monthly options
  const granularitySelect = selects.nth(1);
  await expect(granularitySelect).toHaveValue("daily");
  await expect(granularitySelect.locator("option")).toHaveText([
    "Daily",
    "Weekly",
    "Monthly",
  ]);
});

test("spend breakdown donut renders with driver names", async ({ page }) => {
  const donut = page.locator(".donut-container").first();
  await expect(donut).toBeVisible();

  const legendRows = donut.locator(".donut-legend-row");
  await expect(legendRows).toHaveCount(5);

  // Verify all five cost drivers appear
  const drivers = ["tokens", "compute", "storage", "egress", "other"];
  for (const driver of drivers) {
    await expect(
      legendRows.filter({ hasText: driver }),
    ).toBeVisible();
  }
});

test("forecast card shows projected spend value", async ({ page }) => {
  const forecastCard = page
    .locator(".card")
    .filter({ hasText: "Forecasted Month-End Spend" });
  await expect(forecastCard).toBeVisible();

  // projected_usd = 48050 -> formatCurrencyFull -> "$48,050"
  await expect(forecastCard.locator(".large-value").first()).toHaveText(
    "$48,050",
  );
});

test("burn rate card shows percentage", async ({ page }) => {
  const burnCard = page
    .locator(".card")
    .filter({ hasText: "Budget Burn Rate" });
  await expect(burnCard).toBeVisible();

  // burn_pct = 13.8, Math.round(13.8) = 14 -> "14%"
  await expect(burnCard.locator(".large-value")).toContainText("14%");
});

test("team cost summary table shows team rows", async ({ page }) => {
  const table = page.locator(".wtable").first();
  await expect(table).toBeVisible();

  // Verify header columns
  const headers = table.locator("thead th");
  await expect(headers).toHaveText([
    "Team",
    "Spend",
    "Runs",
    "Avg $/Run",
    "vs Prior Period",
    "Share",
  ]);

  // Verify 3 team rows
  const rows = table.locator("tbody tr");
  await expect(rows).toHaveCount(3);

  const teamNames = ["ML Platform", "Data Engineering", "Backend Services"];
  for (const name of teamNames) {
    await expect(rows.filter({ hasText: name })).toBeVisible();
  }
});
