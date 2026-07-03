import { test, expect } from "@playwright/test";
import { saveDraft } from "./helpers/api";
import { updateCaseStatus, getCaseDetails, cleanupCases, cleanupAllTestCases } from "./helpers/db";

test.describe("Step 4 — CIS result import endpoint", () => {
  const exportedIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    await cleanupAllTestCases();

    for (let i = 0; i < 3; i++) {
      const { filingId } = await saveDraft(request);
      await updateCaseStatus(filingId, "EXPORTED_FOR_CIS");
      exportedIds.push(filingId);
    }
  });

  test.afterAll(async () => {
    await cleanupCases(exportedIds);
  });

  test("imports success and failure results and updates DB statuses", async ({
    request,
  }) => {
    const [successId, failedId, successId2] = exportedIds;

    const payload = [
      {
        external_filing_id: successId,
        status: "success",
        cis_filing_no: "NACT/9/2026",
        cis_cnr: "HRPK020006882026",
      },
      {
        external_filing_id: failedId,
        status: "failed",
        error: "CIS submission failed",
      },
      {
        external_filing_id: successId2,
        status: "success",
        cis_filing_no: "NACT/10/2026",
        cis_cnr: "HRPK020006882027",
      },
      {
        external_filing_id: "non-existent-case-id",
        status: "success",
        cis_filing_no: "NACT/99/2026",
        cis_cnr: "HRPK020006882099",
      },
    ];

    const response = await request.post("/api/cis/import-results", {
      data: payload,
    });
    expect(response.ok()).toBeTruthy();

    const summary = (await response.json()) as {
      total: number;
      filed: number;
      failed: number;
      skipped: number;
    };

    expect(summary.total).toBe(4);
    expect(summary.filed).toBe(2);
    expect(summary.failed).toBe(1);
    expect(summary.skipped).toBe(1);

    const successDetails = await getCaseDetails(successId);
    expect(successDetails.status).toBe("FILED_IN_CIS");
    expect(successDetails.cnr_number).toBe("HRPK020006882026");
    expect(successDetails.additional_details).toMatchObject({
      cis: { filing_no: "NACT/9/2026", cnr: "HRPK020006882026" },
    });

    const failedDetails = await getCaseDetails(failedId);
    expect(failedDetails.status).toBe("CIS_FAILED");
    expect(failedDetails.additional_details).toMatchObject({
      cis: { error: "CIS submission failed" },
    });

    const success2Details = await getCaseDetails(successId2);
    expect(success2Details.status).toBe("FILED_IN_CIS");
    expect(success2Details.cnr_number).toBe("HRPK020006882027");
  });

  test("rejects invalid payload", async ({ request }) => {
    const response = await request.post("/api/cis/import-results", {
      data: [
        {
          external_filing_id: exportedIds[0],
          status: "success",
          // missing cis_filing_no and cis_cnr
        },
      ],
    });

    expect(response.status()).toBe(422);
  });
});
