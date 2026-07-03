import { test, expect } from "@playwright/test";
import fs from "fs";
import os from "os";
import path from "path";
import { saveDraft } from "./helpers/api";
import {
  updateCaseStatus,
  getCaseStatus,
  cleanupCases,
  cleanupAllTestCases,
} from "./helpers/db";

test.describe("Step 6 — Staff UI export / import buttons", () => {
  const exportedIds: string[] = [];
  let downloadDir = "";

  test.beforeAll(async ({ request }) => {
    await cleanupAllTestCases();

    for (let i = 0; i < 2; i++) {
      const { filingId } = await saveDraft(request);
      await updateCaseStatus(filingId, "READY_FOR_CIS");
      exportedIds.push(filingId);
    }
    downloadDir = fs.mkdtempSync(path.join(os.tmpdir(), "drishti-export-"));
  });

  test.afterAll(async () => {
    await cleanupCases(exportedIds);
    try {
      fs.rmSync(downloadDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  test("Download Today’s CIS Batch button downloads JSON batch", async ({
    page,
  }) => {
    await page.goto("/staff");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click('button:has-text("Download Today’s CIS Batch")'),
    ]);

    const downloadPath = path.join(
      downloadDir,
      `batch-${Date.now()}.json`
    );
    await download.saveAs(downloadPath);

    const batch = JSON.parse(fs.readFileSync(downloadPath, "utf-8")) as Array<
      Record<string, unknown>
    >;
    expect(batch).toHaveLength(2);
    expect(batch[0]).toHaveProperty("external_filing_id");

    for (const id of exportedIds) {
      expect(await getCaseStatus(id)).toBe("EXPORTED_FOR_CIS");
    }
  });

  test("Import CIS Results upload updates cases to FILED_IN_CIS", async ({
    page,
  }) => {
    // Cases left over from the export test are already EXPORTED_FOR_CIS.
    const results = exportedIds.map((id, index) => ({
      external_filing_id: id,
      status: "success",
      cis_filing_no: `NACT/${index + 1}/2026`,
      cis_cnr: `HRPK02000688202${index}`,
    }));

    const importFile = path.join(downloadDir, `import-${Date.now()}.json`);
    fs.writeFileSync(importFile, JSON.stringify(results));

    await page.goto("/staff");

    await page
      .locator('label:has-text("Import CIS Results") input[type="file"]')
      .setInputFiles(importFile);

    await expect(page.locator("text=processed")).toBeVisible();
    await expect(page.locator("text=2 filed")).toBeVisible();

    for (const id of exportedIds) {
      expect(await getCaseStatus(id)).toBe("FILED_IN_CIS");
    }

    fs.unlinkSync(importFile);
  });
});
