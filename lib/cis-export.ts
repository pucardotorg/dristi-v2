import { eq, and, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  caseTable,
  caseLitigant,
  individual,
  address,
  court,
  advocate,
  caseRepresentative,
} from "@/db/schema";

// ---- Types ----

export interface CISBridgePayload {
  external_filing_id: string;
  app_filing_number: string;
  court_code: string;
  complainant_name: string;
  complainant_address: string;
  complainant_mobile: string;
  complainant_age: string;
  advocate_name: string;
  advocate_bar_number: string;
  advocate_mobile: string;
  advocate_email: string;
  accused_name: string;
  accused_address: string;
  accused_mobile: string;
  accused_age: string;
  cheque_amount: string;
  cheque_number: string;
  cheque_date: string;
  dishonour_date: string;
  cause_of_action_date: string;
  cause_of_action: string;
  relief: string;
}

interface CaseDetailsJson {
  cheques?: Record<string, { date?: string; amount?: string; number?: string; returnDate?: string; reason?: string }>;
  demands?: Record<string, unknown>;
  jurisdiction?: { court?: string; causeDate?: string };
  adr?: { other?: string };
}

function formatDateForCIS(isoOrAny: string): string {
  // Expect YYYY-MM-DD or DD-MM-YYYY; output DD-MM-YYYY
  if (!isoOrAny) return "";
  // Already DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(isoOrAny)) return isoOrAny;
  // YYYY-MM-DD → DD-MM-YYYY
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoOrAny);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return isoOrAny;
}

// ---- Core export function ----

export async function exportReadyCasesForCIS(courtId: string): Promise<CISBridgePayload[]> {
  return db.transaction(async (tx) => {
    // 1. Atomically mark READY_FOR_CIS → EXPORTED_FOR_CIS and get IDs
    const ts = Date.now();

    const updated = await tx
      .update(caseTable)
      .set({ status: "EXPORTED_FOR_CIS", updated_at: ts })
      .where(
        and(
          eq(caseTable.court_id, courtId),
          eq(caseTable.lifecycle_status, "ACTIVE"),
          eq(caseTable.case_type, "NI_ACT_138"),
          eq(caseTable.status, "READY_FOR_CIS")
        )
      )
      .returning({
        id: caseTable.id,
        filing_number: caseTable.filing_number,
        case_details: caseTable.case_details,
      });

    if (updated.length === 0) return [];

    const caseIds = updated.map((c) => c.id);

    // 2. Get court code
    const [courtRow] = await tx
      .select({ code: court.code })
      .from(court)
      .where(eq(court.id, courtId));

    const courtCode = courtRow?.code ?? "UNKNOWN";

    // 3. Get first complainant per case
    const complainantRows = await tx
      .select({
        case_id: caseLitigant.case_id,
        individual_id: caseLitigant.individual_id,
        given_name: individual.given_name,
        mobile_number: individual.mobile_number,
        email: individual.email,
        additional_details: individual.additional_details,
      })
      .from(caseLitigant)
      .innerJoin(individual, eq(individual.id, caseLitigant.individual_id))
      .where(
        and(
          inArray(caseLitigant.case_id, caseIds),
          eq(caseLitigant.party_type, "COMPLAINANT"),
          eq(caseLitigant.is_active, true)
        )
      );

    // 4. Get first accused per case
    const accusedRows = await tx
      .select({
        case_id: caseLitigant.case_id,
        individual_id: caseLitigant.individual_id,
        given_name: individual.given_name,
        mobile_number: individual.mobile_number,
        email: individual.email,
        litigant_details: caseLitigant.additional_details,
      })
      .from(caseLitigant)
      .innerJoin(individual, eq(individual.id, caseLitigant.individual_id))
      .where(
        and(
          inArray(caseLitigant.case_id, caseIds),
          eq(caseLitigant.party_type, "ACCUSED"),
          eq(caseLitigant.is_active, true)
        )
      );

    // 5. Get first advocate per case
    const advocateRows = await tx
      .select({
        case_id: caseRepresentative.case_id,
        bar_number: advocate.bar_registration_number,
        given_name: individual.given_name,
        mobile_number: individual.mobile_number,
        email: individual.email,
      })
      .from(caseRepresentative)
      .innerJoin(advocate, eq(advocate.id, caseRepresentative.advocate_id))
      .innerJoin(individual, eq(individual.id, advocate.individual_id))
      .where(
        and(
          inArray(caseRepresentative.case_id, caseIds),
          eq(caseRepresentative.is_active, true)
        )
      );

    // 6. Get addresses for all individuals involved
    const allIndividualIds = [
      ...complainantRows.map((r) => r.individual_id!),
      ...accusedRows.map((r) => r.individual_id!),
    ].filter(Boolean);

    const addressRows = await tx
      .select({
        individual_id: address.individual_id,
        address_type: address.address_type,
        address_line: address.address_line,
        pincode: address.pincode,
        district: address.district,
        state: address.state,
      })
      .from(address)
      .where(inArray(address.individual_id, allIndividualIds));

    // Build address lookup: individual_id -> first PERMANENT or first address
    const addressMap = new Map<string, string>();
    for (const r of addressRows) {
      if (addressMap.has(r.individual_id!)) continue;
      if (r.address_type === "PERMANENT" || r.address_type === "PRESENT") {
        addressMap.set(r.individual_id!, r.address_line ?? "");
      }
    }
    // Fallback for any individual without an address yet
    for (const id of allIndividualIds) {
      if (!addressMap.has(id)) addressMap.set(id, "");
    }

    // Build per-case maps (first complainant / accused per case)
    const complainantMap = new Map<string, { name: string; mobile: string; individualId: string; details: Record<string, unknown> | null }>();
    for (const r of complainantRows) {
      if (complainantMap.has(r.case_id!)) continue;
      complainantMap.set(r.case_id!, {
        name: r.given_name ?? "",
        mobile: r.mobile_number ?? "",
        individualId: r.individual_id!,
        details: (r.additional_details as Record<string, unknown>) ?? null,
      });
    }

    const advocateMap = new Map<string, { name: string; barNumber: string; mobile: string; email: string }>();
    for (const r of advocateRows) {
      if (advocateMap.has(r.case_id!)) continue;
      advocateMap.set(r.case_id!, {
        name: r.given_name ?? "",
        barNumber: r.bar_number ?? "",
        mobile: r.mobile_number ?? "",
        email: r.email ?? "",
      });
    }

    const accusedMap = new Map<string, { name: string; mobile: string; individualId: string; details: Record<string, unknown> | null }>();
    for (const r of accusedRows) {
      if (accusedMap.has(r.case_id!)) continue;
      const litDet = (r.litigant_details as Record<string, unknown>) ?? {};
      accusedMap.set(r.case_id!, {
        name: r.given_name ?? "",
        mobile: r.mobile_number ?? "",
        individualId: r.individual_id!,
        details: litDet,
      });
    }

    // 6. Build payloads
    const results: CISBridgePayload[] = [];

    for (const c of updated) {
      const cd = (c.case_details ?? {}) as CaseDetailsJson;
      const cmp = complainantMap.get(c.id);
      const av = advocateMap.get(c.id);
      const acc = accusedMap.get(c.id);

      const cheques = cd.cheques ?? {};
      const firstChequeKey = Object.keys(cheques)[0];
      const ch = firstChequeKey ? cheques[firstChequeKey] : {};

      const demands = cd.demands ?? {};
      const firstDemandKey = Object.keys(demands)[0];

      const adr = cd.adr;

      // Build complainant name: use entityName if entity type, else individual name
      let complainantName = cmp?.name ?? "";
      const cmpDetails = cmp?.details;
      if (cmpDetails?.entityName && cmpDetails.entityType) {
        complainantName = String(cmpDetails.entityName);
      }

      // Build accused name: use fullName from litigant details, fallback to individual name
      let accusedName = acc?.name ?? "";
      const accDetails = acc?.details;
      if (accDetails?.companyName) {
        accusedName = String(accDetails.companyName);
      }

      const chNumber = ch.number ?? "";
      const chAmount = ch.amount ?? "";
      const chDate = formatDateForCIS(ch.date ?? "");
      const chReturnDate = formatDateForCIS(ch.returnDate ?? "");
      const chReason = ch.reason ?? "insufficient funds";

      // Build cause of action text
      const causeOfAction =
        `Cheque No. ${chNumber} dated ${chDate} for Rs. ${chAmount} was dishonoured due to ${chReason}.`;

      // Build relief: prefer ADR other text, fall back to default
      const relief =
        (adr?.other && String(adr.other).trim())
          ? String(adr.other)
          : "Complaint under Section 138 of Negotiable Instruments Act.";

      results.push({
        external_filing_id: c.id,
        app_filing_number: c.filing_number ?? `FL-${c.id.slice(0, 8).toUpperCase()}`,
        court_code: courtCode,
        complainant_name: complainantName,
        complainant_address: addressMap.get(cmp?.individualId ?? "") ?? "",
        complainant_mobile: cmp?.mobile ?? "",
        complainant_age: String(cmpDetails?.age ?? ""),
        advocate_name: av?.name ?? "",
        advocate_bar_number: av?.barNumber ?? "",
        advocate_mobile: av?.mobile ?? "",
        advocate_email: av?.email ?? "",
        accused_name: accusedName,
        accused_address: addressMap.get(acc?.individualId ?? "") ?? "",
        accused_mobile: acc?.mobile ?? "",
        accused_age: String(accDetails?.age ?? ""),
        cheque_amount: chAmount,
        cheque_number: chNumber,
        cheque_date: chDate,
        dishonour_date: chReturnDate,
        cause_of_action_date: chReturnDate,
        cause_of_action: causeOfAction,
        relief,
      });
    }

    return results;
  });
}
