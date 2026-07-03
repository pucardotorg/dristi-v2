import type { FilingData } from "../../src/types";
import { randomUUID } from "crypto";

function randomMobile(): string {
  // 10-digit mobile starting with 9
  return "9" + String(Math.random()).slice(2, 11);
}

export function buildValidFilingData(overrides?: Partial<FilingData>): FilingData {
  const uid = randomUUID().slice(0, 8);
  const complainantMobile = randomMobile();
  const accusedMobile = randomMobile();

  return {
    partyInPersonAffidavitDefault: "<p>Permission to appear in person.</p>",
    complainants: {
      c1: {
        partyInPerson: "yes",
        complainantType: "Individual",
        entityType: "",
        entityName: "",
        phone: complainantMobile,
        phoneConfirm: complainantMobile,
        repName: `Test Complainant ${uid}`,
        repAge: "35",
        email: `complainant-${uid}@test.com`,
        permanentAddresses: [
          {
            address: "Shop No. 1, Sector 12",
            pincode: "134112",
            district: "Panchkula",
            state: "Haryana",
            country: "India",
          },
        ],
        presentSameAsPermanent: "yes",
        presentAddresses: [],
        hasPoA: "no",
        poaPhone: "",
        poaPhoneConfirm: "",
        poaName: "",
        poaAge: "",
        poaEmail: "",
        poaPermanentAddresses: [],
        poaPresentSameAsPermanent: "yes",
        poaPresentAddresses: [],
        affidavitText: "",
      },
    },
    advocates: {
      av1: {
        barNumber: `BAR${uid}`,
        name: `Advocate ${uid}`,
        phone: randomMobile(),
        email: `advocate-${uid}@test.com`,
        vakalat: "",
        advocateFor: [],
      },
    },
    accused: {
      a1: {
        accusedType: "Individual",
        fullName: `Test Accused ${uid}`,
        age: "40",
        entityType: "",
        companyName: "",
        repName: "",
        repDesignation: "",
        repContacts: [{ phone: "", email: "" }],
        repAddresses: [],
        contacts: [{ phone: accusedMobile, email: `accused-${uid}@test.com` }],
        addresses: [
          {
            address: "House No. 2, Sector 12",
            pincode: "134112",
            district: "Panchkula",
            state: "Haryana",
          },
        ],
        withinJurisdiction: "yes",
      },
    },
    cheques: {
      ch1: {
        date: "2026-06-01",
        amount: "100000",
        number: `CHQ${uid}`,
        ifsc: "HDFC0001234",
        bank: "HDFC Bank",
        branch: "Panchkula",
        depositDate: "2026-06-03",
        returnDate: "2026-06-05",
        reason: "insufficient funds",
        infoDate: "2026-06-05",
        sameBank: "no",
      },
    },
    demands: {
      dn1: {
        nature: "Loan repayment",
        dispatch: "Registered Post",
        mode: "",
        tracking: "",
        delivered: "yes",
        delivery: "2026-06-10",
        returnDate: "",
        nonDeliveryReason: "",
        replied: "no",
        payment: "",
        partAmount: "",
      },
    },
    jurisdiction: {
      chequeDeposited: "yes",
      ifsc: "HDFC0001234",
      bankName: "HDFC Bank",
      bankBranch: "Sector 17, Chandigarh",
      payeePoliceStation: "",
      drawerPoliceStation: "",
      otherComplaints: "no",
      otherCases: [],
      causeDate: "2026-06-05",
      filingDate: "2026-06-15",
      delayReason: "",
    },
    adr: {
      adr: "yes",
      other: "",
      interimRelief: "",
      finalRelief: "",
    },
    documents: [
      { name: "Identity Proof of Complainant", helper: "", uploaded: true },
      { name: "Bounced Cheque", helper: "", uploaded: true },
      { name: "Cheque Return Memo", helper: "", uploaded: true },
      { name: "Proof of Debt / Liability", helper: "", uploaded: true },
      { name: "Legal Demand Notice", helper: "", uploaded: true },
      { name: "Notarised Affidavit", helper: "", uploaded: true },
    ],
    witnesses: {},
    docs: { uploads: {}, extraCase: [], extraParty: {} },
    affidavit: {
      text: "",
      deponent: `Test Complainant ${uid}`,
      place: "Panchkula",
      date: "2026-06-13",
      notarised: "no",
    },
    payment: { method: "" },
    sign: {
      mode: "esign",
      aadhaar: "",
      consent: true,
      bail: "no",
    },
    ...overrides,
  };
}
