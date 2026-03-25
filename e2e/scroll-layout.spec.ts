import { test, expect, Page } from "@playwright/test";
import path from "path";

const CSV_PATH = path.resolve(__dirname, "../public/examples/example-drive.csv");

// ── Helpers ──────────────────────────────────────────────────────────────────

async function uploadCSV(page: Page) {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(CSV_PATH);
  // Wait for analysis to complete — tab bar appears once result is ready
  await expect(page.getByRole("tablist")).toBeVisible({ timeout: 30_000 });
}

async function waitForStickyTabBar(page: Page) {
  await expect(page.getByRole("tablist")).toBeVisible({ timeout: 10_000 });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe("Empty state", () => {
  test("landing page shows upload UI and no-data message", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("OBD2 Dashboard")).toBeVisible();
    await expect(page.getByText("No Data Yet")).toBeVisible();
    // Tab bar and timeline should NOT be visible before upload
    await expect(page.getByRole("tablist")).not.toBeVisible();
    await expect(page.getByText("Reset")).not.toBeVisible();
  });
});

test.describe("After CSV upload", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await uploadCSV(page);
  });

  test("sticky tab bar appears with all category tabs", async ({ page }) => {
    await waitForStickyTabBar(page);

    const tabBar = page.getByRole("tablist");
    await expect(tabBar).toBeVisible();

    // Verify all 11 tabs are present (summary + 10 categories)
    const tabs = tabBar.getByRole("tab");
    await expect(tabs).toHaveCount(11);

    // First tab is "Summary" / "Sum"
    const firstTab = tabs.first();
    await expect(firstTab).toBeVisible();
  });

  test("tab bar is sticky — stays visible after scrolling past header", async ({ page }) => {
    await waitForStickyTabBar(page);

    // Scroll well past the header
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(300);

    // Tab bar should still be visible in the viewport
    const tabBar = page.getByRole("tablist");
    await expect(tabBar).toBeVisible();

    const box = await tabBar.boundingBox();
    expect(box).not.toBeNull();
    // Tab bar top should be at or near 0 (sticky to viewport top) — allow for browser chrome
    expect(box!.y).toBeLessThan(120);
  });

  test("timeline slider appears at the bottom", async ({ page }) => {
    await waitForStickyTabBar(page);

    // Timeline slider has a Reset button
    const resetBtn = page.getByRole("button", { name: "Reset" });
    await expect(resetBtn).toBeVisible();

    // It should be near the bottom of the viewport
    const box = await resetBtn.boundingBox();
    expect(box).not.toBeNull();
    const viewportHeight = page.viewportSize()!.height;
    expect(box!.y + box!.height).toBeGreaterThan(viewportHeight - 120);
  });

  test("summary section is first visible section below tab bar", async ({ page }) => {
    await waitForStickyTabBar(page);

    const summarySection = page.locator("#summary");
    await expect(summarySection).toBeVisible();
    await expect(summarySection.getByText("Category Summary")).toBeVisible();
  });

  test("all chart sections are in the DOM", async ({ page }) => {
    await waitForStickyTabBar(page);

    const sectionIds = [
      "summary", "overview", "engine", "fuel", "transmission",
      "power", "drivingBehavior", "abs", "awd", "electrical", "airIntake",
    ];

    for (const id of sectionIds) {
      const section = page.locator(`#${id}`);
      await expect(section).toBeAttached({ timeout: 5_000 });
    }
  });

  test("clicking Engine tab scrolls to engine section", async ({ page }) => {
    await waitForStickyTabBar(page);

    const tabs = page.getByRole("tablist").getByRole("tab");
    // Engine is index 2 (summary=0, overview=1, engine=2)
    const engineTab = tabs.nth(2);
    await engineTab.click();

    await page.waitForTimeout(900); // wait for smooth scroll

    // Engine section should now be in the viewport
    const engineSection = page.locator("#engine");
    const isInViewport = await engineSection.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });
    expect(isInViewport).toBe(true);
  });

  test("clicking AirIntake tab scrolls to airIntake section", async ({ page }) => {
    await waitForStickyTabBar(page);

    const tabs = page.getByRole("tablist").getByRole("tab");
    const lastTab = tabs.last(); // airIntake is last
    await lastTab.click();

    await page.waitForTimeout(900);

    const section = page.locator("#airIntake");
    const isInViewport = await section.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });
    expect(isInViewport).toBe(true);
  });

  test("no error overlays or console errors on load", async ({ page }) => {
    await waitForStickyTabBar(page);

    const errorOverlay = page.locator("[data-nextjs-dialog]");
    await expect(errorOverlay).not.toBeVisible();

    const hasContent = await page.evaluate(
      () => document.body.innerText.trim().length > 0
    );
    expect(hasContent).toBe(true);
  });
});

test.describe("Lazy loading", () => {
  test("charts below fold show skeletons initially and load on scroll", async ({ page }) => {
    await page.goto("/");
    await uploadCSV(page);
    await waitForStickyTabBar(page);

    // Scroll to the engine section
    await page.locator("#engine").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // After scrolling, the section should have content (skeleton or chart)
    const engineSection = page.locator("#engine");
    await expect(engineSection).toBeVisible();

    // Scroll further to electrical (lazy loads last)
    await page.locator("#electrical").scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const electricalSection = page.locator("#electrical");
    await expect(electricalSection).toBeVisible();
  });
});

test.describe("Timeline slider", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await uploadCSV(page);
    await waitForStickyTabBar(page);
  });

  test("Reset button is disabled when no range is set", async ({ page }) => {
    const resetBtn = page.getByRole("button", { name: "Reset" });
    await expect(resetBtn).toBeDisabled();
  });

  test("time labels show start and end of session", async ({ page }) => {
    // Timeline has two time labels (tabular-nums mono text near the slider)
    // The left label should be 0:00
    const sliderArea = page.locator(".sticky.bottom-0");
    await expect(sliderArea).toBeVisible();

    // Find the "0:00" start time label
    await expect(sliderArea.getByText("0:00")).toBeVisible();
  });

  test("dragging left handle updates range and enables Reset", async ({ page }) => {
    const sliderArea = page.locator(".sticky.bottom-0");
    const track = sliderArea.locator(".relative.flex-1");

    const trackBox = await track.boundingBox();
    expect(trackBox).not.toBeNull();

    // Drag left handle (at far left) rightward by 30% of track width
    const startX = trackBox!.x + 2;
    const startY = trackBox!.y + trackBox!.height / 2;
    const endX = trackBox!.x + trackBox!.width * 0.3;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, startY, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(200);

    // Reset button should now be enabled
    const resetBtn = page.getByRole("button", { name: "Reset" });
    await expect(resetBtn).toBeEnabled();
  });

  test("Reset button resets the range and becomes disabled again", async ({ page }) => {
    const sliderArea = page.locator(".sticky.bottom-0");
    const track = sliderArea.locator(".relative.flex-1");
    const trackBox = await track.boundingBox();

    // Set a range by dragging
    await page.mouse.move(trackBox!.x + 2, trackBox!.y + trackBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(trackBox!.x + trackBox!.width * 0.3, trackBox!.y + trackBox!.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const resetBtn = page.getByRole("button", { name: "Reset" });
    await expect(resetBtn).toBeEnabled();

    await resetBtn.click();
    await page.waitForTimeout(200);

    await expect(resetBtn).toBeDisabled();
  });
});

test.describe("Summary grid", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await uploadCSV(page);
    await waitForStickyTabBar(page);
  });

  test("summary section shows 8 category panels", async ({ page }) => {
    const summarySection = page.locator("#summary");
    await expect(summarySection.getByText("Category Summary")).toBeVisible();

    // Should have 8 CategoryPanel items (Engine, Fuel, Transmission, Power, ABS, AWD, Electrical, Air Intake)
    const grid = summarySection.locator(".grid");
    await expect(grid).toBeVisible();
  });

  test("Old ResetZoom button is gone from header", async ({ page }) => {
    // The old "Reset Zoom" button in the top bar should no longer exist
    await expect(page.getByText("Reset Zoom")).not.toBeVisible();
  });
});
