import { z } from "zod";

const addressDraftSchema = z.object({
  address: z.string().optional(),
  pincode: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
}).passthrough();

const addressSchema = z.object({
  address: z.string().min(1, "Address required"),
  pincode: z.string().min(6, "Valid pincode required"),
  district: z.string().min(1, "District required"),
  state: z.string().min(1, "State required"),
  country: z.string().default("India"),
}).passthrough();

function addAddressIssues(
  ctx: z.RefinementCtx,
  path: Array<string | number>,
  value: unknown
) {
  const parsed = addressSchema.safeParse(value);
  if (parsed.success) return;
  for (const issue of parsed.error.issues) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: issue.message,
      path: [...path, ...issue.path],
    });
  }
}

function requireAddresses(
  ctx: z.RefinementCtx,
  path: Array<string | number>,
  values: unknown[] | undefined,
  message: string
) {
  if (!values || values.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message, path });
    return;
  }
  values.forEach((value, index) => addAddressIssues(ctx, [...path, index], value));
}

const complainantSchema = z.object({
  partyInPerson: z.enum(["yes", "no"]),
  complainantType: z.enum(["Individual", "Entity"]),
  entityType: z.string().optional(),
  entityName: z.string().optional(),
  phone: z.string().min(10, "Valid phone required"),
  phoneConfirm: z.string().optional(),
  repName: z.string().min(1, "Name required"),
  repAge: z.string().optional(),
  email: z.string().email("Valid email required").or(z.literal("")).optional(),
  permanentAddresses: z.array(addressDraftSchema).optional(),
  presentSameAsPermanent: z.enum(["yes", "no"]).optional(),
  presentAddresses: z.array(addressDraftSchema).optional(),
  hasPoA: z.enum(["yes", "no"]),
  poaName: z.string().optional(),
  poaPhone: z.string().optional(),
  poaPhoneConfirm: z.string().optional(),
  poaAge: z.string().optional(),
  poaEmail: z.string().email("Valid email required").or(z.literal("")).optional(),
  poaPermanentAddresses: z.array(addressDraftSchema).optional(),
  poaPresentSameAsPermanent: z.enum(["yes", "no"]).optional(),
  poaPresentAddresses: z.array(addressDraftSchema).optional(),
  affidavitText: z.string().optional(),
}).passthrough().superRefine((val, ctx) => {
  requireAddresses(
    ctx,
    ["permanentAddresses"],
    val.permanentAddresses,
    "At least one permanent address required"
  );

  if (val.presentSameAsPermanent === "no") {
    requireAddresses(
      ctx,
      ["presentAddresses"],
      val.presentAddresses,
      "At least one present address required"
    );
  }

  if (val.hasPoA === "yes") {
    if (!val.poaName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PoA holder name required", path: ["poaName"] });
    }
    if (!val.poaPhone || val.poaPhone.length < 10) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valid PoA phone required", path: ["poaPhone"] });
    }
    requireAddresses(
      ctx,
      ["poaPermanentAddresses"],
      val.poaPermanentAddresses,
      "At least one PoA permanent address required"
    );
    if (val.poaPresentSameAsPermanent === "no") {
      requireAddresses(
        ctx,
        ["poaPresentAddresses"],
        val.poaPresentAddresses,
        "At least one PoA present address required"
      );
    }
  }
});

const advocateEntrySchema = z.object({
  barNumber: z.string().optional(),
  phone: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  vakalat: z.string().optional(),
  advocateFor: z.array(z.string()).optional(),
}).passthrough();

type AdvocateEntry = z.infer<typeof advocateEntrySchema>;

function hasAdvocateDetails(advocate: AdvocateEntry) {
  return Boolean(
    advocate.barNumber?.trim() ||
    advocate.phone?.trim() ||
    advocate.name?.trim() ||
    advocate.email?.trim() ||
    advocate.vakalat?.trim() ||
    (advocate.advocateFor?.length ?? 0) > 0
  );
}

function addAdvocateIssues(
  ctx: z.RefinementCtx,
  id: string,
  advocate: AdvocateEntry
) {
  if (!advocate.barNumber?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bar number required", path: [id, "barNumber"] });
  }
  if (!advocate.phone || advocate.phone.length < 10) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valid phone required", path: [id, "phone"] });
  }
  if (!advocate.name?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Advocate name required", path: [id, "name"] });
  }
}

const accusedContactSchema = z.object({
  phone: z.string().optional(),
  email: z.string().optional(),
}).passthrough();

const accusedAddressSchema = z.object({
  address: z.string().min(1, "Address required"),
  pincode: z.string().min(6, "Valid pincode required"),
  district: z.string().min(1, "District required"),
  state: z.string().min(1, "State required"),
  geo: z.string().optional(),
  policeStation: z.string().optional(),
}).passthrough();

const accusedSchema = z.object({
  accusedType: z.string().min(1, "Accused type required"),
  fullName: z.string().min(1, "Name required"),
  age: z.string().optional(),
  entityType: z.string().optional(),
  companyName: z.string().optional(),
  repName: z.string().optional(),
  repDesignation: z.string().optional(),
  repContacts: z.array(accusedContactSchema).optional(),
  repAddresses: z.array(accusedAddressSchema).optional(),
  contacts: z.array(accusedContactSchema).min(1, "At least one contact required"),
  addresses: z.array(accusedAddressSchema).min(1, "At least one address required"),
  withinJurisdiction: z.enum(["yes", "no"]).optional(),
}).passthrough();

const chequeSchema = z.object({
  date: z.string().min(1, "Cheque date required"),
  amount: z.string().min(1, "Cheque amount required"),
  number: z.string().min(1, "Cheque number required"),
  ifsc: z.string().optional(),
  bank: z.string().min(1, "Bank name required"),
  branch: z.string().optional(),
  depositDate: z.string().optional(),
  returnDate: z.string().min(1, "Return date required"),
  reason: z.string().min(1, "Return reason required"),
  infoDate: z.string().optional(),
  sameBank: z.enum(["yes", "no"]).optional(),
}).passthrough();

const demandSchema = z.object({
  nature: z.string().min(1, "Nature of debt required"),
  dispatch: z.string().min(1, "Dispatch method required"),
  mode: z.string().optional(),
  tracking: z.string().optional(),
  delivered: z.enum(["yes", "no"]).optional(),
  delivery: z.string().optional(),
  returnDate: z.string().optional(),
  nonDeliveryReason: z.string().optional(),
  replied: z.enum(["yes", "no"]).optional(),
  payment: z.string().optional(),
  partAmount: z.string().optional(),
}).passthrough();

const jurisdictionSchema = z.object({
  chequeDeposited: z.enum(["yes", "no"]).optional(),
  ifsc: z.string().optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  payeePoliceStation: z.string().optional(),
  drawerPoliceStation: z.string().optional(),
  otherComplaints: z.enum(["yes", "no"]).optional(),
  otherCases: z.array(z.object({ court: z.string(), caseNumber: z.string() }).passthrough()).optional(),
  causeDate: z.string().min(1, "Cause of action date required"),
  filingDate: z.string().optional(),
  delayReason: z.string().optional(),
}).passthrough();

const adrSchema = z.object({
  adr: z.string().optional(),
  other: z.string().optional(),
}).passthrough();

const documentSchema = z.object({
  name: z.string(),
  helper: z.string().optional(),
  uploaded: z.boolean(),
}).passthrough();

const docUploadSchema = z.object({
  fileName: z.string().optional(),
  nativelyDigital: z.boolean().optional(),
  quality: z.enum(["good", "bad"]).optional(),
}).passthrough();

const extraDocSchema = z.object({
  name: z.string(),
  fileName: z.string().optional(),
  nativelyDigital: z.boolean().optional(),
  quality: z.enum(["good", "bad"]).optional(),
}).passthrough();

const docsStateSchema = z.object({
  uploads: z.record(z.string(), docUploadSchema).optional(),
  extraCase: z.array(extraDocSchema).optional(),
  extraParty: z.record(z.string(), z.array(extraDocSchema)).optional(),
}).passthrough();

const affidavitSchema = z.object({
  text: z.string().optional(),
  deponent: z.string().min(1, "Deponent name required"),
  place: z.string().min(1, "Place required"),
  date: z.string().min(1, "Date required"),
  notarised: z.enum(["yes", "no"]).optional(),
}).passthrough();

const signSchema = z.object({
  mode: z.enum(["esign", "upload"]),
  aadhaar: z.string().optional(),
  consent: z.boolean().refine((v) => v === true, { message: "Choose a signing mode before submitting" }),
  bail: z.enum(["yes", "no"]).optional(),
}).passthrough();

const filingDataSchema = z.object({
  partyInPersonAffidavitDefault: z.string().optional(),
  complainants: z.record(z.string(), complainantSchema).superRefine((val, ctx) => {
    if (Object.keys(val).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one complainant required" });
    }
  }),
  advocates: z.record(z.string(), advocateEntrySchema),
  accused: z.record(z.string(), accusedSchema).superRefine((val, ctx) => {
    if (Object.keys(val).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one accused required" });
    }
  }),
  cheques: z.record(z.string(), chequeSchema).superRefine((val, ctx) => {
    if (Object.keys(val).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one cheque required" });
    }
  }),
  demands: z.record(z.string(), demandSchema).superRefine((val, ctx) => {
    if (Object.keys(val).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one demand notice required" });
    }
  }),
  jurisdiction: jurisdictionSchema,
  adr: adrSchema.optional(),
  documents: z.array(documentSchema).optional(),
  docs: docsStateSchema.optional(),
  affidavit: affidavitSchema,
  payment: z.object({ method: z.string().optional() }).passthrough().optional(),
  sign: signSchema,
}).passthrough().superRefine((val, ctx) => {
  const needsAdvocate = Object.values(val.complainants).some((complainant) => complainant.partyInPerson === "no");
  const enteredAdvocates = Object.entries(val.advocates).filter(([, advocate]) => hasAdvocateDetails(advocate));

  if (needsAdvocate && enteredAdvocates.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one advocate required", path: ["advocates"] });
  }

  for (const [id, advocate] of enteredAdvocates) {
    addAdvocateIssues(ctx, id, advocate);
  }

  const uploads = val.docs?.uploads ?? {};
  const hasCurrentUploads = Object.values(uploads).some((upload) => Boolean(upload.fileName?.trim()));

  if (hasCurrentUploads || !val.documents) {
    const requiredUploads: Array<{ key: string; name: string }> = [
      ...Object.keys(val.cheques).map((id, index) => ({ key: `cheque-${id}`, name: `Cheque ${index + 1}` })),
      { key: "cheque-return-memo", name: "Cheque return memo" },
      ...Object.keys(val.demands).map((id, index) => ({ key: `demand-${id}`, name: `Demand notice ${index + 1}` })),
      { key: "proof-dispatch", name: "Proof of dispatch (postal receipt)" },
      ...Object.entries(val.complainants).flatMap(([id, complainant], index) => {
        const partyDocs = [{ key: `party-${id}-aadhar`, name: `Identity proof for complainant ${index + 1}` }];
        if (complainant.hasPoA === "yes") {
          partyDocs.push({ key: `party-${id}-poa`, name: `Power of Attorney for complainant ${index + 1}` });
        }
        if (complainant.partyInPerson === "no") {
          partyDocs.push({ key: `party-${id}-vakalat`, name: `Vakalatnama for complainant ${index + 1}` });
        }
        return partyDocs;
      }),
    ];

    const missing = requiredUploads
      .filter((doc) => !uploads[doc.key]?.fileName?.trim())
      .map((doc) => doc.name);

    if (missing.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Missing required documents: ${missing.join(", ")}`,
        path: ["docs", "uploads"],
      });
    }
  } else {
    const missing = val.documents.filter((doc) => !doc.uploaded).map((doc) => doc.name);
    if (missing.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Missing required documents: ${missing.join(", ")}`,
        path: ["documents"],
      });
    }
  }
});

export const filingSubmitSchema = z.object({
  filingId: z.string().optional(),
  tenantId: z.string().min(1),
  courtId: z.string().min(1),
  data: filingDataSchema,
});

export type FilingSubmitInput = z.infer<typeof filingSubmitSchema>;
