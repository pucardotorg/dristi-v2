import type { APIRequestContext } from "@playwright/test";
import type { FilingData } from "../../src/types";
import { buildValidFilingData } from "./filing-data";

export interface SaveDraftResponse {
  filingId: string;
  filingNumber: string;
  status: string;
}

export async function saveDraft(
  request: APIRequestContext,
  overrides?: Partial<FilingData>,
  tenantId = "kl",
  courtId = "default-court"
): Promise<SaveDraftResponse> {
  const data = buildValidFilingData(overrides);
  const response = await request.post("/api/filing/save-draft", {
    data: { tenantId, courtId, data },
  });

  if (!response.ok()) {
    throw new Error(
      `save-draft failed (${response.status()}): ${await response.text()}`
    );
  }

  return (await response.json()) as SaveDraftResponse;
}

export async function submitFiling(
  request: APIRequestContext,
  filingId: string,
  overrides?: Partial<FilingData>,
  tenantId = "kl",
  courtId = "default-court"
): Promise<{ filingId: string; filingNumber: string; status: string }> {
  const data = buildValidFilingData(overrides);
  const response = await request.post("/api/filing/submit", {
    data: { filingId, tenantId, courtId, data },
  });

  if (!response.ok()) {
    throw new Error(
      `filing submit failed (${response.status()}): ${await response.text()}`
    );
  }

  return (await response.json()) as { filingId: string; filingNumber: string; status: string };
}
