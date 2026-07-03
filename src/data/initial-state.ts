import type {
  FilingData,
  Complainant,
  Advocate,
  Accused,
  Cheque,
  Demand,
  Witness,
  DocsState,
} from "@/src/types";

// ---------- Templates ----------

export const COMPLAINANT_TEMPLATE: Complainant = {
  partyInPerson: "yes",
  complainantType: "Individual",
  entityType: "",
  entityName: "",
  phone: "",
  phoneConfirm: "",
  repName: "",
  repAge: "",
  email: "",
  permanentAddresses: [{ address: "", pincode: "", district: "", state: "", country: "India" }],
  presentSameAsPermanent: "yes",
  presentAddresses: [{ address: "", pincode: "", district: "", state: "", country: "India" }],
  hasPoA: "no",
  poaPhone: "",
  poaPhoneConfirm: "",
  poaName: "",
  poaAge: "",
  poaEmail: "",
  poaPermanentAddresses: [{ address: "", pincode: "", district: "", state: "", country: "India" }],
  poaPresentSameAsPermanent: "yes",
  poaPresentAddresses: [{ address: "", pincode: "", district: "", state: "", country: "India" }],
  affidavitText: "",
};

export const ADVOCATE_TEMPLATE: Advocate = {
  barNumber: "",
  name: "",
  phone: "",
  email: "",
  vakalat: "",
  advocateFor: [],
};

export const CHEQUE_TEMPLATE: Cheque = {
  date: "", amount: "", number: "", ifsc: "", bank: "", branch: "",
  depositDate: "", returnDate: "", reason: "", infoDate: "", sameBank: "no",
};

export const DEMAND_TEMPLATE: Demand = {
  nature: "", dispatch: "", mode: "", tracking: "",
  delivered: "yes", delivery: "", returnDate: "", nonDeliveryReason: "",
  replied: "no", payment: "", partAmount: "",
};

export const WITNESS_TEMPLATE: Witness = {
  fullName: "",
  designation: "",
  age: "",
  willProve: "",
  contacts: [{ phone: "", email: "" }],
  addresses: [],
};

export const ACCUSED_TEMPLATE: Accused = {
  accusedType: "Individual",
  fullName: "",
  age: "",
  entityType: "",
  companyName: "",
  repName: "",
  repDesignation: "",
  repContacts: [{ phone: "", email: "" }],
  repAddresses: [],
  contacts: [{ phone: "", email: "" }],
  addresses: [],
  withinJurisdiction: "yes",
};

// ---------- Full initial data ----------

export const INITIAL: FilingData = {
  partyInPersonAffidavitDefault:
    `<p>Request permission to appear and argue in person, as a party in person.</p>
     <p>I have not engaged any advocate for this case.</p>
     <p>I give an undertaking that I will maintain decorum of the Court and will not use or express objectionable and unparliamentary language or behavior during the course of hearing in the Court premises or in any pleadings.</p>
     <p>Kindly grant me permission to appear in person and conduct the proceedings.</p>`,
  complainants: {
    c1: { ...COMPLAINANT_TEMPLATE },
  },
  advocates: {
    av1: { ...ADVOCATE_TEMPLATE },
  },
  accused: {
    a1: { ...ACCUSED_TEMPLATE },
  },
  cheques: {
    ch1: {
      date: "", amount: "", number: "", ifsc: "", bank: "", branch: "",
      depositDate: "", returnDate: "", reason: "", infoDate: "",
    },
  },
  demands: {
    dn1: { ...DEMAND_TEMPLATE },
  },
  jurisdiction: {
    chequeDeposited: "yes",
    ifsc: "",
    bankName: "",
    bankBranch: "",
    payeePoliceStation: "",
    drawerPoliceStation: "",
    otherComplaints: "yes",
    otherCases: [{ court: "", caseNumber: "" }],
    causeDate: "",
    filingDate: "",
    delayReason: "",
  },
  adr: {
    adr: "yes",
    other: "",
    interimRelief:
      `<p>It is, therefore, most respectfully prayed that this Hon'ble Court may be pleased to:</p>` +
      `<p>Direct the Accused to pay interim compensation to the Complainant under Section 143A of the Negotiable Instruments Act, 1881, during the pendency of the trial, of a sum not exceeding 20% of the cheque amount i.e. Rs. 90,000, within 60 days of the order or such further period not exceeding 30 days as this Hon'ble Court may allow for sufficient cause shown</p>`,
    finalRelief:
      `<p>It is most respectfully prayed that this Hon'ble Court may be pleased to:</p>` +
      `<p>(a) Take cognizance of the offence committed by the Accused under Section 138 of the Negotiable Instruments Act, 1881;</p>` +
      `<p>(b) Issue process/summons against the Accused and direct him/her to appear before this Hon'ble Court;</p>` +
      `<p>(c) Upon trial, convict and sentence the Accused under Section 138 of the Negotiable Instruments Act, 1881, to imprisonment for a term which may extend to two years, or with fine which may extend to twice the amount of the cheque, or with both;</p>` +
      `<p>(d) Direct the Accused to pay compensation to the Complainant under Section 395 of the Bharatiya Nagarik Suraksha Sanhita, 2023, equivalent to the cheque amount along with interest @ 6% per annum from the date of dishonour;</p>` +
      `<p>(e) Grant such other and further relief(s) as this Hon'ble Court may deem fit and proper in the facts and circumstances of the case.</p>`,
  },
  witnesses: {
    w1: { ...WITNESS_TEMPLATE },
  },
  docs: {
    uploads: {},
    extraCase: [],
    extraParty: {},
  } satisfies DocsState,
  documents: [
    { name: "Identity Proof of Complainant", helper: "Aadhaar, PAN or Voter ID", uploaded: false },
    { name: "Bounced Cheque", helper: "A copy of the bounced cheque on the basis of which this case is being filed", uploaded: false },
    { name: "Cheque Return Memo", helper: "The document received from the bank that has the information that the cheque has bounced", uploaded: false },
    { name: "Proof of Debt / Liability", helper: "Anything to prove some sort of agreement between you and the respondent", uploaded: false },
    { name: "Legal Demand Notice", helper: "Any intimation you provided to the respondent informing them that their cheque had bounced and they still owed you the cheque amount", uploaded: false },
    { name: "Notarised Affidavit", helper: "A replacement for your sworn statement which reduces the chances that an admission hearing is needed for the court to take cognisance of your case", uploaded: false },
  ],
  affidavit: {
    text: "",
    deponent: "Rajesh Verma (Complainant)",
    place: "",
    date: "",
    notarised: "no",
  },
  payment: { method: "" },
  sign: { mode: "esign", aadhaar: "", consent: false, bail: "no" },
};
