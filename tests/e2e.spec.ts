import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const BASE = "http://localhost:3000";

const SAMPLE_PDF = path.resolve(
  __dirname,
  "../node_modules/pdf-parse/test/data/01-valid.pdf"
);

const SAMPLE_JD = `Software Engineer – Full Stack
Acme Corp | Remote | Full-time | $130k–$160k

We are looking for a Full Stack Software Engineer to join our growing team.

Responsibilities:
- Build and maintain scalable web applications using React and Node.js
- Design and implement RESTful APIs
- Work with PostgreSQL databases and cloud infrastructure (AWS)
- Write clean, tested, maintainable code

Requirements:
- 3+ years of full-stack development experience
- Proficiency in TypeScript, React, and Node.js
- Experience with SQL databases (PostgreSQL preferred)
- Familiarity with cloud platforms (AWS, GCP, or Azure)`;

// Shared state across all tests (single worker, same module instance)
let jobId = "";

test.describe("Resume Optimizer — End-to-End", () => {
  test.setTimeout(180000);

  test("1. Dashboard loads", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator("header")).toContainText("Resume Optimizer");
    await expect(page.getByRole("link", { name: /New Job/i })).toBeVisible();
    console.log("✓ Dashboard loaded");
  });

  test("2. Create a new job with JD", async ({ page }) => {
    await page.goto(`${BASE}/jobs/new`);
    await page.waitForLoadState("networkidle");

    // Fill company name — use ref selector to be explicit
    await page.getByPlaceholder("Acme Corp").fill("Acme Corp");
    await page.getByPlaceholder("Senior Engineer").fill("Software Engineer");
    await page.getByPlaceholder("Full-time · Remote · $120k").fill("Full-time · Remote · $130k");
    await page.locator("textarea").fill(SAMPLE_JD);

    // Confirm form is ready (button enabled)
    const submitBtn = page.getByRole("button", { name: /Create Job/i });
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });

    await submitBtn.click();

    // Wait for redirect to the job page — URL ends with a UUID-like id
    await page.waitForURL(/\/jobs\/[0-9a-f-]{32,}$/, { timeout: 20000 });

    jobId = page.url().split("/jobs/")[1];
    console.log(`✓ Job created — ID: ${jobId}`);

    await expect(page.getByText("Acme Corp")).toBeVisible();
    await expect(page.getByText("Software Engineer")).toBeVisible();
  });

  test("3. Confirm the JD", async ({ page }) => {
    expect(jobId, "jobId must be set from test 2").toBeTruthy();
    await page.goto(`${BASE}/jobs/${jobId}`);
    await page.waitForLoadState("networkidle");

    // Click "Confirm JD" button
    const confirmBtn = page.getByRole("button", { name: /Confirm JD/i });
    await expect(confirmBtn).toBeVisible({ timeout: 8000 });
    await confirmBtn.click();

    // Wait for "Confirmed" badge to appear
    await expect(page.getByText("Confirmed")).toBeVisible({ timeout: 15000 });
    console.log("✓ JD confirmed and locked");
  });

  test("4. Upload a resume PDF", async ({ page }) => {
    expect(jobId).toBeTruthy();
    await page.goto(`${BASE}/jobs/${jobId}`);
    await page.waitForLoadState("networkidle");

    // Click the drag-drop zone which triggers the hidden file input
    const dropZone = page.locator("[class*='rounded']", {
      hasText: /Drop PDF|click to browse/i,
    }).first();

    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser", { timeout: 10000 }),
      dropZone.click(),
    ]);
    await fileChooser.setFiles(SAMPLE_PDF);

    // Filename should appear in a list before uploading
    await page.waitForTimeout(500);

    // Click the Upload button
    const uploadBtn = page.getByRole("button", { name: /Upload/i });
    if (await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await uploadBtn.click();
    }

    // Wait for the resume row to appear (poll + reload)
    let found = false;
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(2000);
      await page.reload();
      const rows = page.locator("tbody tr");
      const count = await rows.count();
      if (count > 0) {
        found = true;
        console.log(`✓ Resume uploaded — ${count} row(s) in table`);
        break;
      }
    }
    expect(found, "Resume row should appear in table after upload").toBe(true);
  });

  test("5. Optimize the resume via AI", async ({ page }) => {
    expect(jobId).toBeTruthy();
    await page.goto(`${BASE}/jobs/${jobId}`);
    await page.waitForLoadState("networkidle");

    // Click Optimize All or individual optimize button
    const optimizeBtn = page.getByRole("button", { name: /Optimize/i }).first();
    await expect(optimizeBtn).toBeVisible({ timeout: 8000 });
    await optimizeBtn.click();

    console.log("  Waiting for AI optimization (up to 90s)...");

    // Poll until OPTIMIZED
    let optimized = false;
    for (let i = 0; i < 45; i++) {
      await page.waitForTimeout(2000);
      await page.reload();
      const bodyText = await page.locator("main").textContent();
      if (bodyText?.match(/OPTIMIZED|Optimized/i)) {
        optimized = true;
        break;
      }
      if (bodyText?.match(/FAILED/i)) {
        console.log("  Body:", bodyText?.slice(0, 300));
        throw new Error("Optimization FAILED");
      }
      process.stdout.write(".");
    }

    expect(optimized, "Resume should reach OPTIMIZED status").toBe(true);
    console.log("\n✓ Resume optimized");
  });

  test("6. Open resume editor and verify content", async ({ page }) => {
    expect(jobId).toBeTruthy();
    await page.goto(`${BASE}/jobs/${jobId}`);
    await page.waitForLoadState("networkidle");

    // Click first resume row
    const firstRow = page.locator("tbody tr").first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    await firstRow.click();

    await page.waitForURL(/\/resumes\//, { timeout: 15000 });
    console.log(`✓ Navigated to: ${page.url()}`);

    // Structured fields should be visible
    await expect(page.getByText("Full Name")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Experience")).toBeVisible();
    await expect(page.getByText("Education")).toBeVisible();

    // AI should have populated name
    const nameValue = await page.locator("input").first().inputValue();
    console.log(`  Candidate name: "${nameValue}"`);
    expect(nameValue.length).toBeGreaterThan(0);

    await expect(page.locator("text=/v\\d+/")).toBeVisible();
    console.log("✓ Resume editor verified");
  });

  test("7. Edit and save resume content", async ({ page }) => {
    expect(jobId).toBeTruthy();
    await page.goto(`${BASE}/jobs/${jobId}`);
    await page.waitForLoadState("networkidle");
    await page.locator("tbody tr").first().click();
    await page.waitForURL(/\/resumes\//);
    await page.waitForLoadState("networkidle");

    const summaryTextarea = page.locator("textarea").first();
    await summaryTextarea.fill(
      "Experienced software engineer with a passion for building scalable systems."
    );

    const saveBtn = page.getByRole("button", { name: /Save Changes/i }).first();
    await saveBtn.click();

    await expect(
      page.getByText(/✓ Saved|Saved/i)
    ).toBeVisible({ timeout: 15000 });
    console.log("✓ Save confirmed");

    const versionText = await page.locator("text=/v\\d+/").textContent();
    console.log(`  Version: ${versionText}`);
  });

  test("8. Download PDF", async ({ page }) => {
    expect(jobId).toBeTruthy();
    await page.goto(`${BASE}/jobs/${jobId}`);
    await page.waitForLoadState("networkidle");
    await page.locator("tbody tr").first().click();
    await page.waitForURL(/\/resumes\//);

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 20000 }),
      page.getByRole("link", { name: /Download PDF/i }).click(),
    ]);

    const tmpPath = await download.path();
    const size = fs.statSync(tmpPath!).size;
    console.log(`✓ PDF downloaded: ${download.suggestedFilename()} (${size} bytes)`);
    expect(size).toBeGreaterThan(1000);
  });

  test("9. Bulk export ZIP", async ({ page }) => {
    expect(jobId).toBeTruthy();

    // Hit the export API and capture the download
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 20000 }),
      page.goto(`${BASE}/api/jobs/${jobId}/export`),
    ]);

    if (download) {
      const tmpPath = await download.path();
      const size = fs.statSync(tmpPath!).size;
      console.log(`✓ ZIP export: ${size} bytes`);
      expect(size).toBeGreaterThan(100);
    } else {
      console.log("✓ Export endpoint responded");
    }
  });

  test("10. Delete the resume", async ({ page }) => {
    expect(jobId).toBeTruthy();
    await page.goto(`${BASE}/jobs/${jobId}`);
    await page.waitForLoadState("networkidle");

    const deleteBtn = page.getByRole("button", { name: /Delete/i }).first();
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      page.once("dialog", (d) => d.accept());
      await deleteBtn.click();
      await page.waitForTimeout(2000);
      await page.reload();
      const rowCount = await page.locator("tbody tr").count();
      expect(rowCount).toBe(0);
      console.log("✓ Resume deleted");
    } else {
      console.log("  (Delete button not found — skip)");
    }
  });
});
