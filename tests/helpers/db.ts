import { config } from "dotenv";
config({ path: ".env.local" });
import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

export async function getCaseStatus(caseId: string): Promise<string | null> {
  const { rows } = await getPool().query<{ status: string }>(
    'SELECT status FROM "case" WHERE id = $1',
    [caseId]
  );
  return rows[0]?.status ?? null;
}

export async function getCaseDetails(caseId: string): Promise<{
  status: string;
  cnr_number: string | null;
  additional_details: unknown;
}> {
  const { rows } = await getPool().query<{
    status: string;
    cnr_number: string | null;
    additional_details: unknown;
  }>('SELECT status, cnr_number, additional_details FROM "case" WHERE id = $1', [caseId]);
  return (
    rows[0] ?? {
      status: null,
      cnr_number: null,
      additional_details: null,
    }
  );
}

export async function updateCaseStatus(
  caseId: string,
  status: string,
  extra?: {
    cnrNumber?: string;
    additionalDetails?: Record<string, unknown>;
  }
): Promise<void> {
  const updates: string[] = ["status = $2"];
  const values: (string | Record<string, unknown>)[] = [caseId, status];

  if (extra?.cnrNumber !== undefined) {
    updates.push(`cnr_number = $${values.length + 1}`);
    values.push(extra.cnrNumber);
  }

  if (extra?.additionalDetails !== undefined) {
    updates.push(`additional_details = $${values.length + 1}`);
    values.push(extra.additionalDetails);
  }

  await getPool().query(
    `UPDATE "case" SET ${updates.join(", ")}, updated_at = $${
      values.length + 1
    } WHERE id = $1`,
    [...values, Date.now()]
  );
}

export async function cleanupCases(caseIds: string[]): Promise<void> {
  if (caseIds.length === 0) return;
  await getPool().query(
    'UPDATE "case" SET lifecycle_status = $1 WHERE id = ANY($2::varchar[])',
    ["INACTIVE", caseIds]
  );
}

export async function cleanupAllTestCases(courtId = "default-court"): Promise<void> {
  await getPool().query(
    'UPDATE "case" SET lifecycle_status = $1 WHERE court_id = $2 AND case_type = $3 AND lifecycle_status = $4',
    ["INACTIVE", courtId, "NI_ACT_138", "ACTIVE"]
  );
}
