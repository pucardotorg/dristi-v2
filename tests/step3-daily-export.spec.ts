import { test, expect } from "@playwright/test";
import { saveDraft } from "./helpers/api";
import { updateCaseStatus, getCaseStatus, cleanupCases, cleanupAllTestCases } from "./helpers/db";

test.describe("Step 3 — CIS daily export endpoint", () => {
  const caseIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    await cleanupAllTestCases();

    for (let i = 0; i < 2; i++) {
      const { filingId } = await saveDraft(request);
      await updateCaseStatus(filingId, "READY_FOR_CIS");
      caseIds.push(filingId);
    }
  });

  test.afterAll(async () => {
    await cleanupCases(caseIds);
  });

  test("exports READY_FOR_CIS cases and marks them EXPORTED_FOR_CIS", async ({
    request,
  }) => {
    const response = await request.get("/api/cis/daily-export");
    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as Array<Record<string, unknown>>;
    expect(body).toHaveLength(2);

    for (const item of body) {
      expect(item).toHaveProperty("external_filing_id");
      expect(item).toHaveProperty("app_filing_number");
      expect(item).toHaveProperty("court_code");
      expect(item).toHaveProperty("complainant_name");
      expect(item).toHaveProperty("complainant_address");
      expect(item).toHaveProperty("complainant_mobile");
      expect(item).toHaveProperty("complainant_age", "35");
      expect(item).toHaveProperty("advocate_name");
      expect(String(item.advocate_name)).toContain("Advocate ");
      expect(item).toHaveProperty("advocate_bar_number");
      expect(String(item.advocate_bar_number)).toContain("BAR");
      expect(item).toHaveProperty("advocate_mobile");
      expect(item).toHaveProperty("advocate_email");
      expect(String(item.advocate_email)).toContain("advocate-");
      expect(item).toHaveProperty("accused_name");
      expect(item).toHaveProperty("accused_address");
      expect(item).toHaveProperty("accused_mobile");
      expect(item).toHaveProperty("accused_age", "40");
      expect(item).toHaveProperty("cheque_amount");
      expect(item).toHaveProperty("cheque_number");
      expect(item).toHaveProperty("cheque_date");
      expect(item).toHaveProperty("dishonour_date");
      expect(item).toHaveProperty("cause_of_action_date");
      expect(item).toHaveProperty("cause_of_action");
      expect(item).toHaveProperty("relief");
    }

    for (const id of caseIds) {
      expect(await getCaseStatus(id)).toBe("EXPORTED_FOR_CIS");
    }
  });

  test("second export request returns empty after all cases are exported", async ({
    request,
  }) => {
    const response = await request.get("/api/cis/daily-export");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toEqual([]);
  });
});
