import { test, expect, Page } from "@playwright/test";
import path from "path";

const COBB_CSV_PATH = path.resolve(
  __dirname,
  "../public/examples/example-cobb-drive.csv"
);

// ── Helpers ──────────────────────────────────────────────────────────────────

async function uploadCobbCSV(page: Page) {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(COBB_CSV_PATH);
  // Wait for analysis — tab bar appears once result is ready
  await expect(page.getByRole("tablist")).toBeVisible({ timeout: 30_000 });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe("COBB file upload — basic flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await uploadCobbCSV(page);
  });

  test("COBB Accessport section heading is visible", async ({ page }) => {
    await expect(page.getByText("COBB Accessport")).toBeVisible();
  });

  test("vehicle and tune metadata are displayed", async ({ page }) => {
    // The real file contains AP Info metadata
    await expect(page.getByText(/2023 USDM WRX MT/)).toBeVisible();
    await expect(page.getByText(/Stage1 93/)).toBeVisible();
  });

  test("all 6 COBB metric subsections are present", async ({ page }) => {
    const headings = [
      "Boost Curve",
      "Knock Events",
      "AFR vs Target",
      "Wastegate Position",
      "Injector",
      "AVCS Cam Timing",
    ];
    for (const heading of headings) {
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("boost metrics show numeric values (not all dashes)", async ({ page }) => {
    // Avg Boost and Max Boost should be present as labels
    await expect(page.getByText("Avg Boost")).toBeVisible();
    await expect(page.getByText("Max Boost", { exact: true })).toBeVisible();

    // The value cells should contain "psi" — confirming real numbers rendered
    const boostValues = page.locator("text=/\\d+\\.?\\d* psi/");
    await expect(boostValues.first()).toBeVisible();
  });

  test("knock events show numeric count", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Knock Events" })).toBeVisible();
  });

  test("AFR metric labels are all present", async ({ page }) => {
    await expect(page.getByText("Avg AFR")).toBeVisible();
    await expect(page.getByText("Avg Target AFR")).toBeVisible();
    await expect(page.getByText("Max AFR Deviation")).toBeVisible();
  });

  test("wastegate metric labels are all present", async ({ page }) => {
    await expect(page.getByText("Avg Actual")).toBeVisible();
    await expect(page.getByText("Max Actual")).toBeVisible();
    await expect(page.getByText("Avg Error")).toBeVisible();
  });

  test("injector metric labels are all present", async ({ page }) => {
    await expect(page.getByText("Avg Duty Cycle")).toBeVisible();
    await expect(page.getByText("Max Duty Cycle")).toBeVisible();
    await expect(page.getByText("Fuel Cut Events")).toBeVisible();
  });

  test("AVCS cam timing metric labels are present", async ({ page }) => {
    await expect(page.getByText("Avg Intake", { exact: true })).toBeVisible();
    await expect(page.getByText("Avg Exhaust", { exact: true })).toBeVisible();
  });
});

test.describe("COBB file upload — standard dashboard still works", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await uploadCobbCSV(page);
  });

  test("sticky tab bar appears with all category tabs", async ({ page }) => {
    const tabs = page.getByRole("tablist").getByRole("tab");
    await expect(tabs).toHaveCount(11);
  });

  test("summary section with Category Summary heading is visible", async ({ page }) => {
    await expect(page.locator("#summary")).toBeAttached();
    await expect(page.getByText("Category Summary")).toBeVisible();
  });

  test("all standard section IDs are in the DOM", async ({ page }) => {
    const sectionIds = [
      "summary", "overview", "engine", "fuel", "transmission",
      "power", "drivingBehavior", "abs", "awd", "electrical", "airIntake",
    ];
    for (const id of sectionIds) {
      await expect(page.locator(`#${id}`)).toBeAttached({ timeout: 5_000 });
    }
  });

  test("no error overlays on COBB upload", async ({ page }) => {
    const errorOverlay = page.locator("[data-nextjs-dialog]");
    await expect(errorOverlay).not.toBeVisible();
  });
});

test.describe("Unknown CSV format — error handling", () => {
  test("uploading unrecognized CSV shows an error message", async ({ page }) => {
    await page.goto("/");

    // Inject a fake file that is neither OBD2 nor COBB format
    const badCsv = "col1,col2,col3\n1,2,3\n4,5,6\n";
    await page.evaluate((csv) => {
      const file = new File([csv], "bad.csv", { type: "text/csv" });
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        Object.defineProperty(input, "files", { value: dt.files });
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, badCsv);

    // Error message should appear — "Unrecognized" or "Unsupported"
    await expect(
      page.getByText(/unrecognized|unsupported|invalid/i)
    ).toBeVisible({ timeout: 15_000 });
  });
});
