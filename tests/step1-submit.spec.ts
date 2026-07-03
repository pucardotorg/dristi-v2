import { test, expect } from "@playwright/test";
import { saveDraft, submitFiling } from "./helpers/api";
import { getCaseStatus, cleanupCases } from "./helpers/db";

test.describe("Step 1 — Submit filing → READY_FOR_CIS", () => {
  test("submit API sets case status to READY_FOR_CIS", async ({ request }) => {
    const { filingId } = await saveDraft(request);

    const body = await submitFiling(request, filingId);

    expect(body.status).toBe("READY_FOR_CIS");

    const dbStatus = await getCaseStatus(filingId);
    expect(dbStatus).toBe("READY_FOR_CIS");

    await cleanupCases([filingId]);
  });

  test("wizard Submit to Court button sets case status to READY_FOR_CIS", async ({ page }) => {
    const { filingId } = await saveDraft(page.request);

    await page.goto(`/cases/new?id=${filingId}`);
    await page.waitForSelector("text=Loading draft", { state: "detached" });
    await page.waitForSelector('h1:has-text("Complainant details")');

    // Walk through the wizard until the submit button appears.
    for (let i = 0; i < 30; i++) {
      const submitBtn = page.locator('button:has-text("Submit to Court")');
      const isSubmitVisible = await submitBtn.isVisible().catch(() => false);
      if (isSubmitVisible) break;

      const nextBtn = page.locator('button:has-text("Next")');
      const isNextVisible = await nextBtn.isEnabled().catch(() => false);
      if (!isNextVisible) break;

      await nextBtn.click();
      await page.waitForTimeout(500);
    }

    await page.click('button:has-text("Submit to Court")');

    await expect(page.locator("text=Submitted to Court")).toBeVisible({
      timeout: 15_000,
    });

    const dbStatus = await getCaseStatus(filingId);
    expect(dbStatus).toBe("READY_FOR_CIS");

    await cleanupCases([filingId]);
  });
});
