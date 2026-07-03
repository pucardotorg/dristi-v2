import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { caseTable } from "@/db/schema";

// ---- Types ----

export interface CISSuccessResult {
  external_filing_id: string;
  status: "success";
  cis_filing_no: string;
  cis_cnr: string;
  raw_cis_response?: unknown;
}

export interface CISFailedResult {
  external_filing_id: string;
  status: "failed";
  error: string;
}

export type CISImportResult = CISSuccessResult | CISFailedResult;

export interface CISImportSummary {
  total: number;
  filed: number;
  failed: number;
  skipped: number;
  details: {
    external_filing_id: string;
    status: "FILED_IN_CIS" | "CIS_FAILED" | "SKIPPED";
    reason?: string;
  }[];
}

// ---- Core import function ----

export async function importCISResults(
  results: CISImportResult[]
): Promise<CISImportSummary> {
  const summary: CISImportSummary = {
    total: results.length,
    filed: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  return db.transaction(async (tx) => {
    const ts = Date.now();

    for (const result of results) {
      const caseId = result.external_filing_id;

      // Only process cases currently in EXPORTED_FOR_CIS status
      const [existing] = await tx
        .select({ id: caseTable.id, status: caseTable.status, additional_details: caseTable.additional_details })
        .from(caseTable)
        .where(
          and(
            eq(caseTable.id, caseId),
            eq(caseTable.status, "EXPORTED_FOR_CIS")
          )
        );

      if (!existing) {
        summary.skipped++;
        summary.details.push({
          external_filing_id: caseId,
          status: "SKIPPED",
          reason: "Case not in EXPORTED_FOR_CIS status or not found",
        });
        continue;
      }

      const currentDetails = (existing.additional_details ?? {}) as Record<string, unknown>;

      if (result.status === "success") {
        // Merge CIS filing_no and cnr into additional_details
        const updatedDetails = {
          ...currentDetails,
          cis: {
            ...((currentDetails.cis as Record<string, unknown>) ?? {}),
            filing_no: result.cis_filing_no,
            cnr: result.cis_cnr,
            ...(result.raw_cis_response ? { raw_response: result.raw_cis_response } : {}),
          },
        };

        await tx
          .update(caseTable)
          .set({
            cnr_number: result.cis_cnr,
            status: "FILED_IN_CIS",
            additional_details: updatedDetails,
            updated_at: ts,
          })
          .where(eq(caseTable.id, caseId));

        summary.filed++;
        summary.details.push({
          external_filing_id: caseId,
          status: "FILED_IN_CIS",
        });
      } else {
        // Failed — store error in additional_details
        const updatedDetails = {
          ...currentDetails,
          cis: {
            ...((currentDetails.cis as Record<string, unknown>) ?? {}),
            error: result.error,
          },
        };

        await tx
          .update(caseTable)
          .set({
            status: "CIS_FAILED",
            additional_details: updatedDetails,
            updated_at: ts,
          })
          .where(eq(caseTable.id, caseId));

        summary.failed++;
        summary.details.push({
          external_filing_id: caseId,
          status: "CIS_FAILED",
        });
      }
    }

    return summary;
  });
}
