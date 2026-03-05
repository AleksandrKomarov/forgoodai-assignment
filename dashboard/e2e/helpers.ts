import { type Page } from "@playwright/test";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

type Fixtures = Record<string, unknown>;

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadJson(file: string): Record<string, unknown> {
  const p = join(__dirname, "fixtures", file);
  return JSON.parse(readFileSync(p, "utf-8")) as Record<string, unknown>;
}

const execFixtures = loadJson("executive-summary.json");
const costFixtures = loadJson("cost-explorer.json");
const perfFixtures = loadJson("performance.json");
const usageFixtures = loadJson("usage-capacity.json");
const teamFixtures = loadJson("team-drilldown.json");

const ALL_FIXTURES: Fixtures = {
  "spend-kpi": execFixtures["spend-kpi"],
  "success-rate": execFixtures["success-rate"],
  "run-volume": execFixtures["run-volume"],
  "budget-forecast": execFixtures["budget-forecast"],
  "monthly-spend": execFixtures["monthly-spend"],
  "top-cost-centers": execFixtures["top-cost-centers"],
  "daily-spend": costFixtures["daily-spend"],
  "spend-breakdown": costFixtures["spend-breakdown"],
  "team-cost-summary": costFixtures["team-cost-summary"],
  "perf-success-rate": perfFixtures["perf-success-rate"],
  "latency-kpi": perfFixtures["latency-kpi"],
  "success-failure-timeseries": perfFixtures["success-failure-timeseries"],
  "error-taxonomy": perfFixtures["error-taxonomy"],
  "latency-distribution": perfFixtures["latency-distribution"],
  "slowest-agents": perfFixtures["slowest-agents"],
  "failure-hotspots": perfFixtures["failure-hotspots"],
  "active-users": usageFixtures["active-users"],
  "concurrency-timeseries": usageFixtures["concurrency-timeseries"],
  "run-volume-by-team": usageFixtures["run-volume-by-team"],
  "run-heatmap": usageFixtures["run-heatmap"],
  "agent-adoption": usageFixtures["agent-adoption"],
  "team-list": teamFixtures["team-list"],
  "team-summary": teamFixtures["team-summary"],
  "team-top-agents": teamFixtures["team-top-agents"],
  "team-user-activity": teamFixtures["team-user-activity"],
};

/**
 * Intercept all /api/v1/widgets/* routes and respond with fixture data.
 * Optionally override specific endpoints with custom data or error responses.
 */
export async function interceptApi(
  page: Page,
  overrides?: Record<string, { status?: number; body?: unknown; delay?: number }>,
) {
  await page.route("**/api/v1/widgets/**", async (route) => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname.replace("/api/v1/widgets/", "");

    const override = overrides?.[endpoint];
    if (override) {
      if (override.delay) {
        await new Promise((r) => setTimeout(r, override.delay));
      }
      return route.fulfill({
        status: override.status ?? 200,
        contentType: "application/json",
        body: JSON.stringify(override.body ?? {}),
      });
    }

    const fixture = ALL_FIXTURES[endpoint];
    if (fixture) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(fixture),
      });
    }

    // Fallback: return empty object for unknown endpoints
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });
}
