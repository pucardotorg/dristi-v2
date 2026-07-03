import { test, expect } from "@playwright/test";
import { saveDraft } from "./helpers/api";
import { updateCaseStatus, cleanupCases, cleanupAllTestCases } from "./helpers/db";

test.describe("Step 2 — Staff dashboard status tabs", () => {
  const created = new Map<
    string,
    { id: string; complainantName: string; accusedName: string }
  >();

  test.beforeAll(async ({ request }) => {
    await cleanupAllTestCases();

    const statuses = [
      "DRAFT",
      "READY_FOR_CIS",
      "EXPORTED_FOR_CIS",
      "FILED_IN_CIS",
      "CIS_FAILED",
    ] as const;

    for (const status of statuses) {
      const { filingId } = await saveDraft(request);

      if (status === "FILED_IN_CIS") {
        await updateCaseStatus(filingId, status, {
          cnrNumber: `CNR-${filingId.slice(0, 8).toUpperCase()}`,
          additionalDetails: {
            cis: {
              filing_no: `NACT/1/2026`,
              cnr: `CNR-${filingId.slice(0, 8).toUpperCase()}`,
            },
          },
        });
      } else if (status === "CIS_FAILED") {
        await updateCaseStatus(filingId, status, {
          additionalDetails: { cis: { error: "CIS submission failed" } },
        });
      } else {
        await updateCaseStatus(filingId, status);
      }

      created.set(status, {
        id: filingId,
        complainantName: "Test Complainant",
        accusedName: "Test Accused",
      });
    }
  });

  test.afterAll(async () => {
    await cleanupCases(Array.from(created.values()).map((c) => c.id));
  });

  test("staff page shows counts for every status tab", async ({ page }) => {
    await page.goto("/staff");

    for (const [label] of [
      ["Drafts"],
      ["Ready for CIS"],
      ["Exported"],
      ["Filed in CIS"],
      ["CIS Failed"],
    ] as const) {
      const tab = page.locator(`a:has-text("${label}")`);
      const badge = tab.locator("span").first();
      await expect(badge).toHaveText("1");
    }
  });

  test("clicking each tab renders the matching case row", async ({ page }) => {
    const tabs: { label: string; status: string; statusBadge: string }[] = [
      { label: "Ready for CIS", status: "READY_FOR_CIS", statusBadge: "Ready for CIS" },
      { label: "Drafts", status: "DRAFT", statusBadge: "Draft" },
      { label: "Exported", status: "EXPORTED_FOR_CIS", statusBadge: "Exported for CIS" },
      { label: "Filed in CIS", status: "FILED_IN_CIS", statusBadge: "Filed in CIS" },
      { label: "CIS Failed", status: "CIS_FAILED", statusBadge: "CIS Failed" },
    ];

    for (const { label, status, statusBadge } of tabs) {
      await page.goto(`/staff?status=${status}`);

      const tab = page.locator(`a:has-text("${label}")`);
      await expect(tab).toHaveClass(/border-teal/);

      const row = page.locator("tbody tr").first();
      await expect(row).toBeVisible();
      await expect(row.locator("td").nth(1)).toContainText("Test Complainant");
      await expect(row.locator("td").nth(3)).toContainText(statusBadge);
    }
  });
});
