import { test, expect } from "@playwright/test";
import { interceptApi } from "./helpers";

const TEAM_NAMES = [
  "ML Platform",
  "Data Engineering",
  "Backend Services",
  "Frontend Platform",
  "DevOps",
  "Research",
];

test.describe("Team Drill-Down", () => {
  test.beforeEach(async ({ page }) => {
    await interceptApi(page);
    await page.goto("/team");
    await page.waitForSelector(".pill-nav", { timeout: 10000 });
  });

  test("shows team selector with all 6 team names as buttons", async ({
    page,
  }) => {
    const buttons = page.locator(".pill-nav button");
    await expect(buttons).toHaveCount(6);

    for (let i = 0; i < TEAM_NAMES.length; i++) {
      await expect(buttons.nth(i)).toHaveText(TEAM_NAMES[i]!);
    }
  });

  test("first team is selected by default", async ({ page }) => {
    const buttons = page.locator(".pill-nav button");
    const firstButton = buttons.nth(0);
    await expect(firstButton).toHaveClass(/active/);

    // Other buttons should not have active class
    for (let i = 1; i < TEAM_NAMES.length; i++) {
      await expect(buttons.nth(i)).not.toHaveClass(/active/);
    }
  });

  test("KPI cards show correct values for selected team", async ({ page }) => {
    // Wait for KPI row to render after auto-selecting first team
    await page.waitForSelector(".kpi-row", { timeout: 10000 });

    const kpiCards = page.locator(".kpi-row .kpi");
    await expect(kpiCards).toHaveCount(4);

    // Team Runs: 1,500
    const runsCard = kpiCards.nth(0);
    await expect(runsCard).toContainText("1,500");

    // Team Spend: $12.4K
    const spendCard = kpiCards.nth(1);
    await expect(spendCard).toContainText("$12.4K");

    // Success Rate: 96.8%
    const successCard = kpiCards.nth(2);
    await expect(successCard).toContainText("96.8%");

    // Active Users: 14
    const usersCard = kpiCards.nth(3);
    await expect(usersCard).toContainText("14");
  });

  test("top agents table shows agent types", async ({ page }) => {
    await page.waitForSelector(".kpi-row", { timeout: 10000 });

    const agentsTable = page
      .locator(".wtable")
      .filter({ hasText: "Agent Type" });
    await expect(agentsTable).toBeVisible({ timeout: 10000 });

    const rows = agentsTable.locator("tbody tr");
    await expect(rows).toHaveCount(3);

    await expect(rows.nth(0)).toContainText("code-reviewer");
    await expect(rows.nth(0)).toContainText("520");

    await expect(rows.nth(1)).toContainText("test-writer");
    await expect(rows.nth(1)).toContainText("380");

    await expect(rows.nth(2)).toContainText("deep-analyzer");
    await expect(rows.nth(2)).toContainText("290");
  });

  test("user activity table shows user names", async ({ page }) => {
    await page.waitForSelector(".kpi-row", { timeout: 10000 });

    const userTable = page.locator(".wtable").filter({ hasText: "User" });
    await expect(userTable).toBeVisible({ timeout: 10000 });

    const rows = userTable.locator("tbody tr");
    await expect(rows).toHaveCount(3);

    await expect(rows.nth(0)).toContainText("Alice Chen");
    await expect(rows.nth(0)).toContainText("320");

    await expect(rows.nth(1)).toContainText("Bob Martinez");
    await expect(rows.nth(1)).toContainText("245");

    await expect(rows.nth(2)).toContainText("Carla Johnson");
    await expect(rows.nth(2)).toContainText("180");
  });

  test("clicking a different team button selects it", async ({ page }) => {
    const buttons = page.locator(".pill-nav button");

    // First button starts active
    await expect(buttons.nth(0)).toHaveClass(/active/);

    // Click second team
    await buttons.nth(1).click();

    // Second button should now be active
    await expect(buttons.nth(1)).toHaveClass(/active/);

    // First button should no longer be active
    await expect(buttons.nth(0)).not.toHaveClass(/active/);
  });
});
