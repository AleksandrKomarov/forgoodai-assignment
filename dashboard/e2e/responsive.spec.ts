import { test, expect } from "@playwright/test";
import { interceptApi } from "./helpers";

test.describe("Responsive Breakpoints", () => {
  test.beforeEach(async ({ page }) => {
    await interceptApi(page);
  });

  test("desktop (1280x800): sidebar visible with ~220px width, 4-col KPI row", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/executive-summary");
    await page.waitForSelector(".kpi-row", { timeout: 10000 });

    const sidebar = page.locator(".sidebar");
    await expect(sidebar).toBeVisible();

    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox).not.toBeNull();
    // Sidebar should be approximately 220px wide
    expect(sidebarBox!.width).toBeGreaterThanOrEqual(200);
    expect(sidebarBox!.width).toBeLessThanOrEqual(240);

    // KPI row should have 4 columns (grid-template-columns: repeat(4, 1fr))
    const kpiRow = page.locator(".kpi-row");
    const kpiCards = kpiRow.locator(".kpi");
    await expect(kpiCards).toHaveCount(4);

    // All 4 cards should be on roughly the same row (similar y position)
    const firstBox = await kpiCards.nth(0).boundingBox();
    const lastBox = await kpiCards.nth(3).boundingBox();
    expect(firstBox).not.toBeNull();
    expect(lastBox).not.toBeNull();
    // Same row means similar top positions (within some tolerance)
    expect(Math.abs(firstBox!.y - lastBox!.y)).toBeLessThan(10);
  });

  test("tablet (1024x768): sidebar is narrower (~56px), 2-col KPI row", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/executive-summary");
    await page.waitForSelector(".kpi-row", { timeout: 10000 });

    const sidebar = page.locator(".sidebar");
    await expect(sidebar).toBeVisible();

    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox).not.toBeNull();
    // Sidebar should be approximately 56px wide at tablet breakpoint
    expect(sidebarBox!.width).toBeGreaterThanOrEqual(40);
    expect(sidebarBox!.width).toBeLessThanOrEqual(70);

    // KPI row should have 2 columns
    const kpiCards = page.locator(".kpi-row .kpi");
    await expect(kpiCards).toHaveCount(4);

    // First and second card should be on the same row
    const firstBox = await kpiCards.nth(0).boundingBox();
    const secondBox = await kpiCards.nth(1).boundingBox();
    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();
    expect(Math.abs(firstBox!.y - secondBox!.y)).toBeLessThan(10);

    // Third card should be on a different row (below)
    const thirdBox = await kpiCards.nth(2).boundingBox();
    expect(thirdBox).not.toBeNull();
    expect(thirdBox!.y).toBeGreaterThan(firstBox!.y + 20);
  });

  test("mobile (375x667): sidebar is hidden, hamburger is visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/executive-summary");
    await page.waitForSelector(".kpi-row", { timeout: 10000 });

    // Sidebar should not be visible
    const sidebar = page.locator(".sidebar");
    await expect(sidebar).not.toBeVisible();

    // Hamburger button should be visible
    const hamburger = page.locator(".sidebar-toggle");
    await expect(hamburger).toBeVisible();
  });

  test("hamburger toggle opens and closes sidebar on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/executive-summary");
    await page.waitForSelector(".kpi-row", { timeout: 10000 });

    const sidebar = page.locator(".sidebar");
    const hamburger = page.locator(".sidebar-toggle");

    // Sidebar starts hidden
    await expect(sidebar).not.toBeVisible();

    // Click hamburger to open sidebar
    await hamburger.click();

    // Sidebar should now be visible with .open class
    await expect(sidebar).toHaveClass(/open/);
    await expect(sidebar).toBeVisible();

    // Overlay should be visible
    const overlay = page.locator(".sidebar-overlay");
    await expect(overlay).toBeVisible();

    // Click overlay area to the right of the sidebar (sidebar is 220px wide)
    await page.click(".sidebar-overlay", { position: { x: 300, y: 400 } });

    // Sidebar should be hidden again
    await expect(sidebar).not.toHaveClass(/open/);
    await expect(sidebar).not.toBeVisible();
  });

  test("KPI cards stack on phone (375x667): single column layout", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/executive-summary");
    await page.waitForSelector(".kpi-row", { timeout: 10000 });

    const kpiCards = page.locator(".kpi-row .kpi");
    await expect(kpiCards).toHaveCount(4);

    // Each card should be on its own row (stacked vertically)
    const firstBox = await kpiCards.nth(0).boundingBox();
    const secondBox = await kpiCards.nth(1).boundingBox();
    const thirdBox = await kpiCards.nth(2).boundingBox();

    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();
    expect(thirdBox).not.toBeNull();

    // Each subsequent card should be below the previous one
    expect(secondBox!.y).toBeGreaterThan(firstBox!.y + 20);
    expect(thirdBox!.y).toBeGreaterThan(secondBox!.y + 20);
  });
});
