import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { importCISResults, type CISImportResult } from "@/lib/cis-import";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be a JSON array" }, { status: 422 });
  }

  // Basic validation
  for (const item of body) {
    if (!item.external_filing_id || !item.status) {
      return NextResponse.json(
        { error: "Each item must have external_filing_id and status" },
        { status: 422 }
      );
    }
    if (item.status === "success" && (!item.cis_filing_no || !item.cis_cnr)) {
      return NextResponse.json(
        { error: "Success items must have cis_filing_no and cis_cnr" },
        { status: 422 }
      );
    }
    if (item.status === "failed" && !item.error) {
      return NextResponse.json(
        { error: "Failed items must have an error message" },
        { status: 422 }
      );
    }
  }

  const summary = await importCISResults(body as CISImportResult[]);

  return NextResponse.json(summary);
}
