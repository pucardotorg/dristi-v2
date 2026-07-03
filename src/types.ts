// ---------- Building blocks ----------

export interface Address {
  address: string;
  pincode: string;
  district: string;
  state: string;
  geo?: string;
  policeStation?: string;
}

export interface RepAddress {
  address: string;
  pincode: string;
  district: string;
  state: string;
}

// ---------- Complainant ----------

export interface Complainant {
  partyInPerson: "yes" | "no";
  complainantType: "Individual" | "Entity";
  entityType?: string;
  entityName?: string;
  phone: string;
  phoneConfirm: string;
  repName: string;
  repAge: string;
  email: string;
  permanentAddresses: AddressForm[];
  presentSameAsPermanent: "yes" | "no";
  presentAddresses: AddressForm[];
  hasPoA: "yes" | "no";
  poaPhone: string;
  poaPhoneConfirm: string;
  poaName: string;
  poaAge: string;
  poaEmail: string;
  poaPermanentAddresses: AddressForm[];
  poaPresentSameAsPermanent: "yes" | "no";
  poaPresentAddresses: AddressForm[];
  /** Party-in-person affidavit text (only relevant when partyInPerson === 'yes'). */
  affidavitText: string;
}

export interface AddressForm {
  address: string;
  pincode: string;
  district: string;
  state: string;
  country: string;
}

export interface ComplainantMap {
  [key: string]: Complainant;
}

// ---------- Advocate ----------

export interface Advocate {
  barNumber: string;
  name: string;
  phone: string;
  email: string;
  vakalat: string;
  advocateFor: string[];
}

export interface AdvocateMap {
  [key: string]: Advocate;
}

// ---------- Accused ----------

export interface AccusedContact {
  phone: string;
  email: string;
}

export interface AccusedAddress {
  address: string;
  pincode: string;
  district: string;
  state: string;
  geo?: string;
  policeStation?: string;
}

export interface Accused {
  accusedType: string;
  fullName: string;
  age: string;
  entityType: string;
  companyName: string;
  repName: string;
  repDesignation: string;
  repContacts: AccusedContact[];
  repAddresses: AccusedAddress[];
  contacts: AccusedContact[];
  addresses: AccusedAddress[];
  withinJurisdiction: "yes" | "no";
}

export interface AccusedMap {
  [key: string]: Accused;
}

// ---------- Cheque ----------

export interface Cheque {
  date: string;
  amount: string;
  number: string;
  ifsc: string;
  bank: string;
  branch: string;
  depositDate: string;
  returnDate: string;
  reason: string;
  infoDate: string;
  sameBank?: "yes" | "no";
}

export interface ChequeMap {
  [key: string]: Cheque;
}

// ---------- Demand ----------

export interface Demand {
  nature: string;
  dispatch: string;
  mode: string;
  tracking: string;
  delivered: "yes" | "no";
  delivery: string;
  returnDate: string;
  nonDeliveryReason: string;
  replied: "yes" | "no";
  payment: string;
  partAmount?: string;
}

export interface DemandMap {
  [key: string]: Demand;
}

// ---------- Jurisdiction ----------

export interface OtherCase {
  court: string;
  caseNumber: string;
}

export interface Jurisdiction {
  chequeDeposited: "yes" | "no";
  // Yes path — payee bank details
  ifsc: string;
  bankName: string;
  bankBranch: string;
  payeePoliceStation: string;
  // No path
  drawerPoliceStation: string;
  // Common
  otherComplaints: "yes" | "no";
  otherCases: OtherCase[];
  // Limitation Period
  causeDate: string;
  filingDate: string;
  delayReason: string;
}

// ---------- ADR ----------

export interface ADR {
  adr: string;
  other: string;
  interimRelief: string;
  finalRelief: string;
}

// ---------- Witness ----------

export interface WitnessContact {
  phone: string;
  email: string;
}

export interface WitnessAddress {
  address: string;
  pincode: string;
  district: string;
  state: string;
  geo?: string;
  policeStation?: string;
}

export interface Witness {
  fullName: string;
  designation: string;
  age: string;
  willProve: string;
  contacts: WitnessContact[];
  addresses: WitnessAddress[];
}

export interface WitnessMap {
  [key: string]: Witness;
}

// ---------- Evidence ----------

export interface DocEntry {
  name: string;
  helper: string;
  uploaded: boolean;
}

export interface DocUpload {
  fileName: string;
  nativelyDigital: boolean;
  quality?: "good" | "bad";
}

export interface DocsState {
  uploads: { [key: string]: DocUpload };
  extraCase: Array<{ name: string; fileName: string; nativelyDigital: boolean; quality?: "good" | "bad" }>;
  extraParty: { [cId: string]: Array<{ name: string; fileName: string; nativelyDigital: boolean; quality?: "good" | "bad" }> };
}

// ---------- Affidavit ----------

export interface Affidavit {
  text: string;
  deponent: string;
  place: string;
  date: string;
  notarised: "yes" | "no";
}

// ---------- Sign ----------

export interface Sign {
  mode: "esign" | "upload";
  aadhaar: string;
  consent: boolean;
  bail: "yes" | "no";
}

// ---------- Payment ----------

export interface Payment {
  method: string;
}

// ---------- Top-level ----------

export interface FilingData {
  partyInPersonAffidavitDefault: string;
  complainants: ComplainantMap;
  advocates: AdvocateMap;
  accused: AccusedMap;
  cheques: ChequeMap;
  demands: DemandMap;
  jurisdiction: Jurisdiction;
  adr: ADR;
  witnesses: WitnessMap;
  /** @deprecated Use docs: DocsState for file-level upload tracking. Kept for the legacy checklist in filing-service. */
  documents: DocEntry[];
  docs: DocsState;
  affidavit: Affidavit;
  payment: Payment;
  sign: Sign;
}