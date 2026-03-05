import { test, expect } from "@playwright/test";
import { interceptApi } from "./helpers";

test.beforeEach(async ({ page }) => {
  await interceptApi(page);
  await page.goto("/performance");
});

test("shows 4 KPI cards with success rate and latency values", async ({
  page,
}) => {
  const kpiCards = page.locator(".kpi");
  await expect(kpiCards).toHaveCount(4);

  // Success Rate: rate_pct=95.7 -> formatPercent -> "95.7%"
  const successCard = kpiCards.filter({ hasText: "Success Rate" });
  await expect(successCard.locator(".kpi-value")).toHaveText("95.7%");

  // P50 Latency: p50_ms=1200 -> formatDuration -> "1.2s"
  const p50Card = kpiCards.filter({ hasText: "P50 Latency" });
  await expect(p50Card.locator(".kpi-value")).toHaveText("1.2s");

  // P95 Latency: p95_ms=4800 -> formatDuration -> "4.8s"
  const p95Card = kpiCards.filter({ hasText: "P95 Latency" });
  await expect(p95Card.locator(".kpi-value")).toHaveText("4.8s");

  // P99 Latency: p99_ms=12500 -> formatDuration -> "12.5s"
  const p99Card = kpiCards.filter({ hasText: "P99 Latency" });
  await expect(p99Card.locator(".kpi-value")).toHaveText("12.5s");
});

test("success/failure chart renders", async ({ page }) => {
  const chart = page.locator(".sf-chart");
  await expect(chart).toBeVisible();

  // 3 daily data points -> 3 bar columns
  const bars = chart.locator(".sf-bar-col");
  await expect(bars).toHaveCount(3);

  // Each column has a success bar
  const successBars = chart.locator(".sf-bar-success");
  await expect(successBars).toHaveCount(3);

  // Legend shows Success and Failed labels
  const legend = page
    .locator(".card")
    .filter({ hasText: "Success / Failure" })
    .locator(".chart-legend");
  await expect(legend).toContainText("Success");
  await expect(legend).toContainText("Failed");
});

test("error taxonomy shows error codes", async ({ page }) => {
  const taxonomyCard = page
    .locator(".card")
    .filter({ hasText: "Error Taxonomy" });
  await expect(taxonomyCard).toBeVisible();

  const legendRows = taxonomyCard.locator(".donut-legend-row");
  await expect(legendRows).toHaveCount(5);

  const errorCodes = [
    "CONTEXT_LIMIT_EXCEEDED",
    "TIMEOUT",
    "OOM",
    "LOGIC_ERROR",
    "INFRA_FAULT",
  ];
  for (const code of errorCodes) {
    await expect(legendRows.filter({ hasText: code })).toBeVisible();
  }
});

test("slowest agents table shows agent types", async ({ page }) => {
  const table = page
    .locator(".card")
    .filter({ hasText: "Slowest Agents" })
    .locator(".wtable");
  await expect(table).toBeVisible();

  const rows = table.locator("tbody tr");
  await expect(rows).toHaveCount(3);

  const agentTypes = ["deep-analyzer", "security-scanner", "test-writer"];
  for (const agent of agentTypes) {
    await expect(rows.filter({ hasText: agent })).toBeVisible();
  }
});

test("failure hotspots matrix renders with team headers", async ({ page }) => {
  const matrixCard = page
    .locator(".card")
    .filter({ hasText: "Failure Hotspots" });
  await expect(matrixCard).toBeVisible();

  const table = matrixCard.locator(".wtable");
  await expect(table).toBeVisible();

  // Team names appear as column headers
  const headers = table.locator("thead th");
  await expect(headers).toContainText(["ML Infra", "Data Eng", "Platform"]);

  // 2 agent types (code-reviewer, deep-analyzer) as rows
  const rows = table.locator("tbody tr");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("code-reviewer");
  await expect(rows.nth(1)).toContainText("deep-analyzer");
});
