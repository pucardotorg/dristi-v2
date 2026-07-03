import { eq, and, asc } from "drizzle-orm";
import { db } from "./db";
import {
  caseTable,
  caseStatutesSections,
  individual,
  address,
  individualIdentifier,
  advocate,
  caseLitigant,
  caseRepresentative,
  caseRepresentativeLitigant,
  casePoaHolder,
  caseDocument,
  demand as demandTable,
  demandDetail as demandDetailTable,
  payment as paymentTable,
  paymentDetail as paymentDetailTable,
} from "@/db/schema";
import type { FilingData, Complainant, Advocate, Accused, AccusedContact, AccusedAddress, AddressForm, DocEntry } from "@/src/types";
import { COMPLAINANT_TEMPLATE, ADVOCATE_TEMPLATE, INITIAL } from "@/src/data/initial-state";

export interface SaveFilingPayload {
  filingId?: string;
  tenantId: string;
  courtId: string;
  userId?: string;
  data: FilingData;
}

function now() {
  return Date.now();
}

function uuid() {
  return crypto.randomUUID();
}

export async function saveFiling(
  payload: SaveFilingPayload,
  draft: boolean
): Promise<{ caseId: string; filingNumber: string }> {
  const { tenantId, courtId, userId, data } = payload;
  const ts = now();

  return db.transaction(async (tx) => {
    // ------------------------------------------------------------------ //
    // 1. Upsert case row
    // ------------------------------------------------------------------ //
    let caseId = payload.filingId;
    let filingNumber: string;

    if (caseId) {
      const [existing] = await tx
        .select({ filing_number: caseTable.filing_number, status: caseTable.status })
        .from(caseTable)
        .where(eq(caseTable.id, caseId));

      if (!existing) throw new Error(`Case ${caseId} not found`);
      filingNumber = existing.filing_number ?? `FL-${caseId.slice(0, 8).toUpperCase()}`;

      const nextStatus =
        !draft ? "READY_FOR_CIS"
        : existing.status === "DRAFT" ? "DRAFT"
        : existing.status;

      await tx
        .update(caseTable)
        .set({
          status: nextStatus,
          court_id: courtId,
          case_details: buildCaseDetails(data),
          additional_details: buildAdditionalDetails(data),
          updated_at: ts,
        })
        .where(eq(caseTable.id, caseId));
    } else {
      caseId = uuid();
      filingNumber = `FL-${caseId.slice(0, 8).toUpperCase()}`;

      await tx.insert(caseTable).values({
        id: caseId,
        tenant_id: tenantId,
        court_id: courtId,
        filing_number: filingNumber,
        case_type: "NI_ACT_138",
        status: draft ? "DRAFT" : "READY_FOR_CIS",
        case_details: buildCaseDetails(data),
        additional_details: buildAdditionalDetails(data),
        created_by: userId ?? null,
        created_at: ts,
        updated_at: ts,
      });

      // Seed NI Act s.138 statutes row
      await tx.insert(caseStatutesSections).values({
        id: uuid(),
        tenant_id: tenantId,
        case_id: caseId,
        statutes: "Negotiable Instruments Act",
        sections: "138",
        created_at: ts,
        updated_at: ts,
      });
    }

    // ------------------------------------------------------------------ //
    // 2. Complainants → individual + address + case_litigant
    // ------------------------------------------------------------------ //
    const complainantLitigantIds: string[] = [];

    for (const [, complainant] of Object.entries(data.complainants)) {
      const individualId = await upsertIndividual(tx, tenantId, {
        given_name: complainant.repName || complainant.phone,
        mobile_number: complainant.phone,
        email: complainant.email,
        additional_details: {
          age: complainant.repAge || undefined,
          poaAge: complainant.poaAge || undefined,
          partyInPerson: complainant.partyInPerson,
          entityType: complainant.entityType || undefined,
          entityName: complainant.entityName || undefined,
          affidavitText: complainant.affidavitText || undefined,
        },
        ts,
      });

      // Permanent addresses
      for (const addr of complainant.permanentAddresses) {
        await upsertAddress(tx, tenantId, individualId, "PERMANENT", addr, ts);
      }
      // Present addresses (skip if same as permanent)
      if (complainant.presentSameAsPermanent !== "yes") {
        for (const addr of complainant.presentAddresses) {
          await upsertAddress(tx, tenantId, individualId, "PRESENT", addr, ts);
        }
      }

      const litigantId = await upsertCaseLitigant(tx, {
        tenantId,
        caseId,
        individualId,
        partyType: "COMPLAINANT",
        partyCategory: complainant.complainantType === "Entity" ? "ENTITY" : "INDIVIDUAL",
        ts,
      });
      complainantLitigantIds.push(litigantId);

      // PoA holder
      if (complainant.hasPoA === "yes" && complainant.poaName) {
        const poaIndividualId = await upsertIndividual(tx, tenantId, {
          given_name: complainant.poaName,
          mobile_number: complainant.poaPhone,
          email: complainant.poaEmail,
          ts,
        });

        for (const addr of complainant.poaPermanentAddresses) {
          await upsertAddress(tx, tenantId, poaIndividualId, "POA_PERMANENT", addr, ts);
        }
        if (complainant.poaPresentSameAsPermanent !== "yes") {
          for (const addr of complainant.poaPresentAddresses) {
            await upsertAddress(tx, tenantId, poaIndividualId, "POA_PRESENT", addr, ts);
          }
        }

        await upsertPoaHolder(tx, {
          tenantId,
          caseId,
          individualId: poaIndividualId,
          name: complainant.poaName,
          litigantIds: [litigantId],
          ts,
        });
      }
    }

    // Deactivate surplus complainant litigants when user removed some.
    const existingComplainants = await tx
      .select({ id: caseLitigant.id })
      .from(caseLitigant)
      .where(and(
        eq(caseLitigant.case_id, caseId),
        eq(caseLitigant.party_type, "COMPLAINANT"),
        eq(caseLitigant.is_active, true),
      ));

    for (const row of existingComplainants) {
      if (!complainantLitigantIds.includes(row.id)) {
        await tx
          .update(caseLitigant)
          .set({ is_active: false, updated_at: ts })
          .where(eq(caseLitigant.id, row.id));
      }
    }

    // ------------------------------------------------------------------ //
    // 3. Advocate → individual + advocate + case_representative
    // ------------------------------------------------------------------ //
    const savedRepIds: string[] = [];
    for (const av of Object.values(data.advocates)) {
      if (!av.barNumber) continue;
      const advocateIndividualId = await upsertIndividual(tx, tenantId, {
        given_name: av.name || av.barNumber,
        mobile_number: av.phone,
        email: av.email,
        ts,
      });

      // Bar number as identifier
      await upsertIndividualIdentifier(tx, {
        tenantId,
        individualId: advocateIndividualId,
        identifierType: "BAR_NUMBER",
        identifierId: av.barNumber,
        ts,
      });

      const advocateId = await upsertAdvocate(tx, {
        tenantId,
        individualId: advocateIndividualId,
        barNumber: av.barNumber,
        ts,
      });

      const repId = await upsertCaseRepresentative(tx, {
        tenantId,
        caseId,
        advocateId,
        additional_details: {
          vakalat: av.vakalat || undefined,
          advocateFor: av.advocateFor.length > 0 ? av.advocateFor : undefined,
        },
        ts,
      });
      savedRepIds.push(repId);

      // Link representative to all complainant litigants
      for (const litId of complainantLitigantIds) {
        await upsertRepresentativeLitigant(tx, { tenantId, repId, litId, ts });
      }
    }

    // Deactivate surplus advocate representatives when user removed some.
    const existingReps = await tx
      .select({ id: caseRepresentative.id })
      .from(caseRepresentative)
      .where(and(
        eq(caseRepresentative.case_id, caseId),
        eq(caseRepresentative.is_active, true),
      ));

    for (const row of existingReps) {
      if (!savedRepIds.includes(row.id)) {
        await tx
          .update(caseRepresentative)
          .set({ is_active: false, updated_at: ts })
          .where(eq(caseRepresentative.id, row.id));
      }
    }

    // ------------------------------------------------------------------ //
    // 4. Accused → individual + address + case_litigant (position-based)
    // ------------------------------------------------------------------ //

    // Fetch existing accused litigants ordered by insertion time so we can
    // update them in place rather than inserting duplicates on every save.
    const existingAccused = await tx
      .select({ id: caseLitigant.id, individual_id: caseLitigant.individual_id })
      .from(caseLitigant)
      .where(and(
        eq(caseLitigant.case_id, caseId),
        eq(caseLitigant.party_type, "ACCUSED"),
        eq(caseLitigant.is_active, true),
      ))
      .orderBy(asc(caseLitigant.created_at));

    const accusedEntries = Object.values(data.accused);

    for (let i = 0; i < accusedEntries.length; i++) {
      const accused = accusedEntries[i];
      const primaryContact = accused.contacts?.[0];
      const litigantDetails = {
        accusedType: accused.accusedType,
        age: accused.age,
        entityType: accused.entityType,
        companyName: accused.companyName,
        withinJurisdiction: accused.withinJurisdiction,
        repName: accused.repName,
        repDesignation: accused.repDesignation,
        repContacts: accused.repContacts,
        repAddresses: accused.repAddresses,
        contacts: accused.contacts,
      };

      const existing = existingAccused[i];

      let individualId: string;
      if (existing) {
        // Update the individual in place — no mobile-number dedup needed.
        individualId = existing.individual_id!;
        await tx
          .update(individual)
          .set({
            given_name: accused.fullName || primaryContact?.phone || "",
            mobile_number: primaryContact?.phone || null,
            email: primaryContact?.email || null,
            updated_at: ts,
          })
          .where(eq(individual.id, individualId));

        await tx
          .update(caseLitigant)
          .set({
            party_category: accused.accusedType === "Individual" ? "INDIVIDUAL" : "ENTITY",
            additional_details: litigantDetails,
            updated_at: ts,
          })
          .where(eq(caseLitigant.id, existing.id));
      } else {
        // New accused — insert fresh individual + litigant.
        individualId = uuid();
        await tx.insert(individual).values({
          id: individualId,
          tenant_id: tenantId,
          given_name: accused.fullName || primaryContact?.phone || "",
          mobile_number: primaryContact?.phone || null,
          email: primaryContact?.email || null,
          created_at: ts,
          updated_at: ts,
        });

        await tx.insert(caseLitigant).values({
          id: uuid(),
          tenant_id: tenantId,
          case_id: caseId,
          individual_id: individualId,
          party_type: "ACCUSED",
          party_category: accused.accusedType === "Individual" ? "INDIVIDUAL" : "ENTITY",
          is_active: true,
          additional_details: litigantDetails,
          created_at: ts,
          updated_at: ts,
        });
      }

      for (const addr of accused.addresses ?? []) {
        await upsertAddress(tx, tenantId, individualId, "PERMANENT", {
          address: addr.address,
          pincode: addr.pincode,
          district: addr.district,
          state: addr.state,
          country: "India",
          geo: addr.geo,
          policeStation: addr.policeStation,
        }, ts);
      }
    }

    // Deactivate surplus accused rows when user reduced the count.
    for (const surplus of existingAccused.slice(accusedEntries.length)) {
      await tx
        .update(caseLitigant)
        .set({ is_active: false, updated_at: ts })
        .where(eq(caseLitigant.id, surplus.id));
    }

    // ------------------------------------------------------------------ //
    // 5. Documents (evidence checklist)
    // ------------------------------------------------------------------ //
    for (const doc of data.documents) {
      if (!doc.uploaded) continue;

      const existing = await tx
        .select({ id: caseDocument.id })
        .from(caseDocument)
        .where(
          and(
            eq(caseDocument.case_id, caseId),
            eq(caseDocument.document_type, docNameToType(doc.name))
          )
        );

      if (existing.length === 0) {
        await tx.insert(caseDocument).values({
          id: uuid(),
          tenant_id: tenantId,
          case_id: caseId,
          document_type: docNameToType(doc.name),
          is_active: true,
          created_at: ts,
          updated_at: ts,
        });
      }
    }

    // ------------------------------------------------------------------ //
    // 6. Demand + demand line items (court fee record)
    // ------------------------------------------------------------------ //
    const demandId = await upsertDemand(tx, { tenantId, caseId, filingNumber, ts });
    await upsertDemandDetails(tx, { tenantId, demandId, ts });

    // ------------------------------------------------------------------ //
    // 7. Payment (only when the user has selected a payment method)
    // ------------------------------------------------------------------ //
    if (data.payment?.method) {
      await upsertPaymentRecord(tx, {
        tenantId,
        caseId,
        demandId,
        method: data.payment.method,
        ts,
      });
    }

    return { caseId, filingNumber };
  });
}

// ------------------------------------------------------------------ //
// Read filing by ID (reconstruct FilingData from normalized tables)
// ------------------------------------------------------------------ //

export class FilingNotFoundError extends Error {}

export async function getFilingById(
  caseId: string,
  userId: string
): Promise<{ filingId: string; filingNumber: string; data: FilingData }> {
  const [caseRow] = await db
    .select({
      id: caseTable.id,
      filing_number: caseTable.filing_number,
      status: caseTable.status,
      created_by: caseTable.created_by,
      case_details: caseTable.case_details,
      additional_details: caseTable.additional_details,
    })
    .from(caseTable)
    .where(and(eq(caseTable.id, caseId), eq(caseTable.lifecycle_status, "ACTIVE")));

  console.log("[getFilingById]", { caseId, userId, found: !!caseRow, created_by: caseRow?.created_by });
  if (!caseRow || caseRow.created_by !== userId) throw new FilingNotFoundError("Not found");

  // Fetch complainant litigants + their individuals + addresses
  const complainantLitigants = await db
    .select({
      litigant_id: caseLitigant.id,
      party_category: caseLitigant.party_category,
      individual_id: caseLitigant.individual_id,
      given_name: individual.given_name,
      mobile_number: individual.mobile_number,
      email: individual.email,
      individual_details: individual.additional_details,
    })
    .from(caseLitigant)
    .innerJoin(individual, eq(individual.id, caseLitigant.individual_id))
    .where(and(eq(caseLitigant.case_id, caseId), eq(caseLitigant.party_type, "COMPLAINANT"), eq(caseLitigant.is_active, true)));

  // Fetch accused litigants
  const accusedLitigants = await db
    .select({
      litigant_id: caseLitigant.id,
      litigant_details: caseLitigant.additional_details,
      individual_id: caseLitigant.individual_id,
      given_name: individual.given_name,
      family_name: individual.family_name,
      other_names: individual.other_names,
      mobile_number: individual.mobile_number,
      email: individual.email,
      father_name: individual.father_name,
    })
    .from(caseLitigant)
    .innerJoin(individual, eq(individual.id, caseLitigant.individual_id))
    .where(and(eq(caseLitigant.case_id, caseId), eq(caseLitigant.party_type, "ACCUSED"), eq(caseLitigant.is_active, true)));

  // Fetch addresses for all individuals
  const allIndividualIds = [
    ...complainantLitigants.map((r) => r.individual_id!),
    ...accusedLitigants.map((r) => r.individual_id!),
  ].filter(Boolean);

  const addressByIndividual = new Map<string, {
    individual_id: string;
    address_type: string;
    address_line: string | null;
    pincode: string | null;
    district: string | null;
    state: string | null;
    country: string | null;
    geo: string | null;
    police_station: string | null;
  }[]>();
  for (const indId of allIndividualIds) {
    const rows = await db
      .select({
        individual_id: address.individual_id,
        address_type: address.address_type,
        address_line: address.address_line,
        pincode: address.pincode,
        district: address.district,
        state: address.state,
        country: address.country,
        geo: address.geo,
        police_station: address.police_station,
      })
      .from(address)
      .where(eq(address.individual_id, indId));
    addressByIndividual.set(indId, rows);
  }

  // Fetch advocates via case_representative → advocate → individual
  const repRows = await db
    .select({
      bar_number: advocate.bar_registration_number,
      given_name: individual.given_name,
      mobile_number: individual.mobile_number,
      email: individual.email,
      rep_details: caseRepresentative.additional_details,
    })
    .from(caseRepresentative)
    .innerJoin(advocate, eq(advocate.id, caseRepresentative.advocate_id))
    .innerJoin(individual, eq(individual.id, advocate.individual_id))
    .where(and(eq(caseRepresentative.case_id, caseId), eq(caseRepresentative.is_active, true)));

  // Fetch documents
  const docRows = await db
    .select({ document_type: caseDocument.document_type })
    .from(caseDocument)
    .where(and(eq(caseDocument.case_id, caseId), eq(caseDocument.is_active, true)));

  // Fetch payment
  const [paymentRow] = await db
    .select({ payment_mode: paymentTable.payment_mode, payment_status: paymentTable.payment_status })
    .from(paymentTable)
    .where(eq(paymentTable.case_id, caseId));

  const uploadedTypes = new Set(docRows.map((d) => d.document_type));

  // ---- Reconstruct FilingData ----

  const toAddressForm = (r: {
    address_line: string | null;
    pincode: string | null;
    district: string | null;
    state: string | null;
    country: string | null;
  }): AddressForm => ({
    address: r.address_line ?? "",
    pincode: r.pincode ?? "",
    district: r.district ?? "",
    state: r.state ?? "",
    country: r.country ?? "India",
  });

  const complainants: FilingData["complainants"] = {};
  complainantLitigants.forEach((lit, i) => {
    const key = `c${i + 1}`;
    const addrs = addressByIndividual.get(lit.individual_id!) ?? [];
    const permanentAddresses = addrs.filter((a) => a.address_type === "PERMANENT").map(toAddressForm);
    const presentAddresses = addrs.filter((a) => a.address_type === "PRESENT").map(toAddressForm);
    const poaPerms = addrs.filter((a) => a.address_type === "POA_PERMANENT").map(toAddressForm);
    const poaPresent = addrs.filter((a) => a.address_type === "POA_PRESENT").map(toAddressForm);

    const det = (lit.individual_details as Record<string, unknown> | null) ?? {};

    const c: Complainant = {
      ...COMPLAINANT_TEMPLATE,
      complainantType: lit.party_category === "ENTITY" ? "Entity" : "Individual",
      partyInPerson: (det.partyInPerson as "yes" | "no") ?? "yes",
      entityType: (det.entityType as string) ?? "",
      entityName: (det.entityName as string) ?? "",
      phone: lit.mobile_number ?? "",
      phoneConfirm: lit.mobile_number ?? "",
      repName: lit.given_name ?? "",
      repAge: (det.age as string) ?? "",
      email: lit.email ?? "",
      permanentAddresses: permanentAddresses.length > 0 ? permanentAddresses : COMPLAINANT_TEMPLATE.permanentAddresses,
      presentSameAsPermanent: presentAddresses.length === 0 ? "yes" : "no",
      presentAddresses: presentAddresses.length > 0 ? presentAddresses : [],
      hasPoA: poaPerms.length > 0 ? "yes" : "no",
      poaAge: (det.poaAge as string) ?? "",
      poaPermanentAddresses: poaPerms.length > 0 ? poaPerms : [],
      poaPresentSameAsPermanent: poaPresent.length === 0 ? "yes" : "no",
      poaPresentAddresses: poaPresent.length > 0 ? poaPresent : [],
      affidavitText: (det.affidavitText as string) ?? "",
    };
    complainants[key] = c;
  });

  const advocates: FilingData["advocates"] = {};
  repRows.forEach((rep, i) => {
    const key = `av${i + 1}`;
    const repDet = (rep.rep_details as Record<string, unknown> | null) ?? {};
    const av: Advocate = {
      ...ADVOCATE_TEMPLATE,
      barNumber: rep.bar_number,
      name: rep.given_name,
      phone: rep.mobile_number ?? "",
      email: rep.email ?? "",
      vakalat: (repDet.vakalat as string) ?? "",
      advocateFor: (repDet.advocateFor as string[]) ?? [],
    };
    advocates[key] = av;
  });

  const accused: FilingData["accused"] = {};
  accusedLitigants.forEach((lit, i) => {
    const key = `a${i + 1}`;
    const addrs = addressByIndividual.get(lit.individual_id!) ?? [];
    const permAddrs = addrs.filter((a) => a.address_type === "PERMANENT");
    const litDet = (lit.litigant_details as Record<string, unknown> | null) ?? {};
    const a: Accused = {
      accusedType: (litDet.accusedType as string) ?? "Individual",
      fullName: lit.given_name ?? "",
      age: (litDet.age as string) ?? "",
      entityType: (litDet.entityType as string) ?? "",
      companyName: (litDet.companyName as string) ?? "",
      repName: (litDet.repName as string) ?? "",
      repDesignation: (litDet.repDesignation as string) ?? "",
      repContacts: (litDet.repContacts as AccusedContact[]) ?? [{ phone: "", email: "" }],
      repAddresses: (litDet.repAddresses as AccusedAddress[]) ?? [],
      contacts: (litDet.contacts as AccusedContact[]) ?? [{ phone: lit.mobile_number ?? "", email: lit.email ?? "" }],
      addresses: permAddrs.map((r) => ({
        address: r.address_line ?? "",
        pincode: r.pincode ?? "",
        district: r.district ?? "",
        state: r.state ?? "",
        geo: r.geo ?? undefined,
        policeStation: r.police_station ?? undefined,
      })),
      withinJurisdiction: (litDet.withinJurisdiction as "yes" | "no") ?? "yes",
    };
    accused[key] = a;
  });

  const cd = (caseRow.case_details ?? {}) as Record<string, unknown>;
  const ad = (caseRow.additional_details ?? {}) as Record<string, unknown>;

  const documents: DocEntry[] = INITIAL.documents.map((doc) => ({
    ...doc,
    uploaded: uploadedTypes.has(docNameToType(doc.name)),
  }));

  const data: FilingData = {
    partyInPersonAffidavitDefault: (ad.partyInPersonAffidavitDefault as string) ?? INITIAL.partyInPersonAffidavitDefault,
    complainants: Object.keys(complainants).length > 0 ? complainants : INITIAL.complainants,
    advocates: Object.keys(advocates).length > 0 ? advocates : INITIAL.advocates,
    accused: Object.keys(accused).length > 0 ? accused : INITIAL.accused,
    cheques: (cd.cheques as FilingData["cheques"]) ?? INITIAL.cheques,
    demands: (cd.demands as FilingData["demands"]) ?? INITIAL.demands,
    jurisdiction: (cd.jurisdiction as FilingData["jurisdiction"]) ?? INITIAL.jurisdiction,
    adr: (cd.adr as FilingData["adr"]) ?? INITIAL.adr,
    witnesses: INITIAL.witnesses,
    documents,
    docs: INITIAL.docs,
    affidavit: migrateAffidavit(ad, complainantLitigants),
    payment: paymentRow
      ? { method: paymentRow.payment_mode?.toLowerCase() ?? "" }
      : INITIAL.payment,
    sign: (ad.sign as FilingData["sign"]) ?? INITIAL.sign,
  };

  return {
    filingId: caseRow.id,
    filingNumber: caseRow.filing_number ?? `FL-${caseRow.id.slice(0, 8).toUpperCase()}`,
    data,
  };
}

// ------------------------------------------------------------------ //
// Helpers
// ------------------------------------------------------------------ //

/** Read affidavit from additional_details, falling back to legacy per-complainant affidavitText. */
function migrateAffidavit(
  ad: Record<string, unknown>,
  complainantLitigants: { individual_details: unknown }[],
): FilingData["affidavit"] {
  const saved = ad.affidavit as FilingData["affidavit"] | undefined;
  if (saved?.text) return saved;
  // Backward compat: old records stored text on the first complainant individual
  const det = (complainantLitigants[0]?.individual_details as Record<string, unknown> | null) ?? {};
  const legacyText = (det.affidavitText as string) ?? "";
  return { ...INITIAL.affidavit, ...saved, text: legacyText };
}

function buildCaseDetails(data: FilingData) {
  return {
    cheques: data.cheques,
    demands: data.demands,
    jurisdiction: data.jurisdiction,
    adr: data.adr,
  };
}

function buildAdditionalDetails(data: FilingData) {
  return {
    affidavit: data.affidavit,
    sign: data.sign,
    partyInPersonAffidavitDefault: data.partyInPersonAffidavitDefault,
  };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function upsertIndividual(
  tx: Tx,
  tenantId: string,
  fields: {
    given_name: string;
    family_name?: string;
    other_names?: string;
    mobile_number?: string;
    email?: string;
    father_name?: string;
    additional_details?: Record<string, unknown>;
    ts: number;
  }
): Promise<string> {
  // Match by mobile if provided, else always insert
  if (fields.mobile_number) {
    const [existing] = await tx
      .select({ id: individual.id, additional_details: individual.additional_details })
      .from(individual)
      .where(
        and(
          eq(individual.tenant_id, tenantId),
          eq(individual.mobile_number, fields.mobile_number)
        )
      );

    if (existing) {
      const mergedDetails = fields.additional_details
        ? { ...(existing.additional_details as Record<string, unknown> | null ?? {}), ...fields.additional_details }
        : existing.additional_details;
      await tx
        .update(individual)
        .set({
          given_name: fields.given_name,
          family_name: fields.family_name ?? null,
          other_names: fields.other_names ?? null,
          email: fields.email ?? null,
          father_name: fields.father_name ?? null,
          additional_details: mergedDetails,
          updated_at: fields.ts,
        })
        .where(eq(individual.id, existing.id));
      return existing.id;
    }
  }

  const id = uuid();
  await tx.insert(individual).values({
    id,
    tenant_id: tenantId,
    given_name: fields.given_name,
    family_name: fields.family_name ?? null,
    other_names: fields.other_names ?? null,
    mobile_number: fields.mobile_number ?? null,
    email: fields.email ?? null,
    father_name: fields.father_name ?? null,
    additional_details: fields.additional_details ?? null,
    created_at: fields.ts,
    updated_at: fields.ts,
  });
  return id;
}

type AddressFields = {
  address: string;
  pincode: string;
  district: string;
  state: string;
  country: string;
  geo?: string;
  policeStation?: string;
};

async function upsertAddress(
  tx: Tx,
  tenantId: string,
  individualId: string,
  addressType: string,
  fields: AddressFields,
  ts: number
): Promise<void> {
  const [existing] = await tx
    .select({ id: address.id })
    .from(address)
    .where(
      and(
        eq(address.individual_id, individualId),
        eq(address.address_type, addressType)
      )
    );

  if (existing) {
    await tx
      .update(address)
      .set({
        address_line: fields.address,
        pincode: fields.pincode,
        district: fields.district,
        state: fields.state,
        country: fields.country || "India",
        geo: fields.geo ?? null,
        police_station: fields.policeStation ?? null,
        updated_at: ts,
      })
      .where(eq(address.id, existing.id));
  } else {
    await tx.insert(address).values({
      id: uuid(),
      tenant_id: tenantId,
      individual_id: individualId,
      address_type: addressType,
      address_line: fields.address,
      pincode: fields.pincode,
      district: fields.district,
      state: fields.state,
      country: fields.country || "India",
      geo: fields.geo ?? null,
      police_station: fields.policeStation ?? null,
      created_at: ts,
      updated_at: ts,
    });
  }
}

async function upsertIndividualIdentifier(
  tx: Tx,
  opts: { tenantId: string; individualId: string; identifierType: string; identifierId: string; ts: number }
): Promise<void> {
  const [existing] = await tx
    .select({ id: individualIdentifier.id })
    .from(individualIdentifier)
    .where(
      and(
        eq(individualIdentifier.individual_id, opts.individualId),
        eq(individualIdentifier.identifier_type, opts.identifierType)
      )
    );

  if (existing) {
    await tx
      .update(individualIdentifier)
      .set({ identifier_id: opts.identifierId, updated_at: opts.ts })
      .where(eq(individualIdentifier.id, existing.id));
  } else {
    await tx.insert(individualIdentifier).values({
      id: uuid(),
      tenant_id: opts.tenantId,
      individual_id: opts.individualId,
      identifier_type: opts.identifierType,
      identifier_id: opts.identifierId,
      created_at: opts.ts,
      updated_at: opts.ts,
    });
  }
}

async function upsertAdvocate(
  tx: Tx,
  opts: { tenantId: string; individualId: string; barNumber: string; ts: number }
): Promise<string> {
  const [existing] = await tx
    .select({ id: advocate.id })
    .from(advocate)
    .where(
      and(
        eq(advocate.tenant_id, opts.tenantId),
        eq(advocate.bar_registration_number, opts.barNumber)
      )
    );

  if (existing) {
    await tx
      .update(advocate)
      .set({ individual_id: opts.individualId, updated_at: opts.ts })
      .where(eq(advocate.id, existing.id));
    return existing.id;
  }

  const id = uuid();
  await tx.insert(advocate).values({
    id,
    tenant_id: opts.tenantId,
    individual_id: opts.individualId,
    bar_registration_number: opts.barNumber,
    status: "ACTIVE",
    created_at: opts.ts,
    updated_at: opts.ts,
  });
  return id;
}

async function upsertCaseLitigant(
  tx: Tx,
  opts: {
    tenantId: string;
    caseId: string;
    individualId: string;
    partyType: string;
    partyCategory: string;
    additional_details?: Record<string, unknown>;
    ts: number;
  }
): Promise<string> {
  const [existing] = await tx
    .select({ id: caseLitigant.id })
    .from(caseLitigant)
    .where(
      and(
        eq(caseLitigant.case_id, opts.caseId),
        eq(caseLitigant.individual_id, opts.individualId),
        eq(caseLitigant.party_type, opts.partyType)
      )
    );

  if (existing) {
    if (opts.additional_details) {
      await tx
        .update(caseLitigant)
        .set({ additional_details: opts.additional_details, updated_at: opts.ts })
        .where(eq(caseLitigant.id, existing.id));
    }
    return existing.id;
  }

  const id = uuid();
  await tx.insert(caseLitigant).values({
    id,
    tenant_id: opts.tenantId,
    case_id: opts.caseId,
    individual_id: opts.individualId,
    party_type: opts.partyType,
    party_category: opts.partyCategory,
    is_active: true,
    additional_details: opts.additional_details ?? null,
    created_at: opts.ts,
    updated_at: opts.ts,
  });
  return id;
}

async function upsertCaseRepresentative(
  tx: Tx,
  opts: { tenantId: string; caseId: string; advocateId: string; additional_details?: Record<string, unknown>; ts: number }
): Promise<string> {
  const [existing] = await tx
    .select({ id: caseRepresentative.id })
    .from(caseRepresentative)
    .where(
      and(
        eq(caseRepresentative.case_id, opts.caseId),
        eq(caseRepresentative.advocate_id, opts.advocateId)
      )
    );

  if (existing) {
    if (opts.additional_details) {
      await tx
        .update(caseRepresentative)
        .set({ additional_details: opts.additional_details, updated_at: opts.ts })
        .where(eq(caseRepresentative.id, existing.id));
    }
    return existing.id;
  }

  const id = uuid();
  await tx.insert(caseRepresentative).values({
    id,
    tenant_id: opts.tenantId,
    case_id: opts.caseId,
    advocate_id: opts.advocateId,
    filing_status: "PENDING",
    is_active: true,
    additional_details: opts.additional_details ?? null,
    created_at: opts.ts,
    updated_at: opts.ts,
  });
  return id;
}

async function upsertRepresentativeLitigant(
  tx: Tx,
  opts: { tenantId: string; repId: string; litId: string; ts: number }
): Promise<void> {
  const [existing] = await tx
    .select({ id: caseRepresentativeLitigant.id })
    .from(caseRepresentativeLitigant)
    .where(
      and(
        eq(caseRepresentativeLitigant.case_representative_id, opts.repId),
        eq(caseRepresentativeLitigant.case_litigant_id, opts.litId)
      )
    );

  if (!existing) {
    await tx.insert(caseRepresentativeLitigant).values({
      id: uuid(),
      tenant_id: opts.tenantId,
      case_representative_id: opts.repId,
      case_litigant_id: opts.litId,
      created_at: opts.ts,
    });
  }
}

async function upsertPoaHolder(
  tx: Tx,
  opts: {
    tenantId: string;
    caseId: string;
    individualId: string;
    name: string;
    litigantIds: string[];
    ts: number;
  }
): Promise<void> {
  const [existing] = await tx
    .select({ id: casePoaHolder.id })
    .from(casePoaHolder)
    .where(
      and(
        eq(casePoaHolder.case_id, opts.caseId),
        eq(casePoaHolder.individual_id, opts.individualId)
      )
    );

  if (existing) {
    await tx
      .update(casePoaHolder)
      .set({
        name: opts.name,
        representing_litigants: opts.litigantIds,
        updated_at: opts.ts,
      })
      .where(eq(casePoaHolder.id, existing.id));
  } else {
    await tx.insert(casePoaHolder).values({
      id: uuid(),
      tenant_id: opts.tenantId,
      case_id: opts.caseId,
      individual_id: opts.individualId,
      poa_type: "GENERAL",
      name: opts.name,
      is_active: true,
      representing_litigants: opts.litigantIds,
      created_at: opts.ts,
      updated_at: opts.ts,
    });
  }
}

// ------------------------------------------------------------------ //
// Billing helpers
// ------------------------------------------------------------------ //

const FEE_LINE_ITEMS = [
  { code: "LEGAL_BENEFIT_FEE",              amount: "25.00" },
  { code: "ADVOCATE_CLERK_WELFARE_FUND",    amount: "25.00" },
  { code: "COMPLAINT_FEE",                  amount: "25.00" },
  { code: "ADVOCATE_WELFARE_FUND",          amount: "25.00" },
  { code: "COURT_FEE_DELAY_NOTICE",         amount: "1.00"  },
  { code: "APPLICATION_FEE_DELAY_CONDONATION", amount: "25.00" },
  { code: "PROCESS_FEE_SUMMONS",            amount: "49.00" },
  { code: "PROCESS_FEE_WARRANTS",           amount: "50.00" },
];

const TOTAL_FILING_FEE = "225.00";

async function upsertDemand(
  tx: Tx,
  opts: { tenantId: string; caseId: string; filingNumber: string; ts: number }
): Promise<string> {
  const [existing] = await tx
    .select({ id: demandTable.id })
    .from(demandTable)
    .where(
      and(
        eq(demandTable.case_id, opts.caseId),
        eq(demandTable.business_service, "CASE_FILING_FEE")
      )
    );

  if (existing) {
    await tx
      .update(demandTable)
      .set({ updated_at: opts.ts })
      .where(eq(demandTable.id, existing.id));
    return existing.id;
  }

  const id = uuid();
  await tx.insert(demandTable).values({
    id,
    tenant_id: opts.tenantId,
    case_id: opts.caseId,
    consumer_code: opts.filingNumber,
    business_service: "CASE_FILING_FEE",
    status: "ACTIVE",
    minimum_amount: TOTAL_FILING_FEE,
    is_payment_completed: false,
    created_at: opts.ts,
    updated_at: opts.ts,
  });
  return id;
}

async function upsertDemandDetails(
  tx: Tx,
  opts: { tenantId: string; demandId: string; ts: number }
): Promise<void> {
  for (const item of FEE_LINE_ITEMS) {
    const [existing] = await tx
      .select({ id: demandDetailTable.id })
      .from(demandDetailTable)
      .where(
        and(
          eq(demandDetailTable.demand_id, opts.demandId),
          eq(demandDetailTable.tax_head_code, item.code)
        )
      );

    if (!existing) {
      await tx.insert(demandDetailTable).values({
        id: uuid(),
        tenant_id: opts.tenantId,
        demand_id: opts.demandId,
        tax_head_code: item.code,
        tax_amount: item.amount,
        collection_amount: "0",
        created_at: opts.ts,
        updated_at: opts.ts,
      });
    }
  }
}

async function upsertPaymentRecord(
  tx: Tx,
  opts: { tenantId: string; caseId: string; demandId: string; method: string; ts: number }
): Promise<void> {
  const [existing] = await tx
    .select({ id: paymentTable.id })
    .from(paymentTable)
    .where(eq(paymentTable.case_id, opts.caseId));

  if (existing) {
    await tx
      .update(paymentTable)
      .set({ payment_mode: opts.method.toUpperCase(), updated_at: opts.ts })
      .where(eq(paymentTable.id, existing.id));
    return;
  }

  const paymentId = uuid();
  await tx.insert(paymentTable).values({
    id: paymentId,
    tenant_id: opts.tenantId,
    case_id: opts.caseId,
    total_due: TOTAL_FILING_FEE,
    payment_mode: opts.method.toUpperCase(),
    payment_status: "NEW",
    created_at: opts.ts,
    updated_at: opts.ts,
  });

  await tx.insert(paymentDetailTable).values({
    id: uuid(),
    tenant_id: opts.tenantId,
    payment_id: paymentId,
    demand_id: opts.demandId,
    due: TOTAL_FILING_FEE,
    amount_paid: "0",
    business_service: "CASE_FILING_FEE",
    created_at: opts.ts,
    updated_at: opts.ts,
  });
}

const DOC_TYPE_MAP: Record<string, string> = {
  "Identity Proof of Complainant": "IDENTITY_PROOF",
  "Bounced Cheque": "BOUNCED_CHEQUE",
  "Cheque Return Memo": "RETURN_MEMO",
  "Proof of Debt / Liability": "DEBT_PROOF",
  "Legal Demand Notice": "DEMAND_NOTICE",
  "Notarised Affidavit": "AFFIDAVIT",
};

function docNameToType(name: string): string {
  return DOC_TYPE_MAP[name] ?? name.toUpperCase().replace(/\s+/g, "_");
}
