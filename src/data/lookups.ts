export const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

export const COMPLAINANT_TYPES = ["Individual", "Entity"] as const;

export const ENTITY_TYPES = [
  "Sole Proprietorship",
  "Partnership Firm",
  "Private Limited Company",
  "Public Limited Company",
  "LLP",
  "HUF",
  "Trust",
  "Society",
] as const;

export const ACCUSED_PARTY_TYPES = [
  "Individual",
  "Proprietorship",
  "Partnership Firm",
  "Company",
  "HUF",
  "Other",
] as const;

export const SALUTATIONS = ["Mr.", "Mrs.", "Ms.", "M/s"] as const;

export const RETURN_REASONS = [
  "Funds insufficient",
  "Account closed",
  "Signature mismatch",
  "Stop payment instructions issued",
  "Drawer's signature differs",
  "Other",
] as const;

export const DEBT_NATURES = [
  "Friendly loan",
  "Business loan",
  "Sale consideration",
  "Services rendered",
  "Rent due",
  "Salary / wages",
  "Refund of advance",
  "Other",
] as const;

export const SERVICE_MODES = [
  "Registered Post AD",
  "Speed Post",
  "Courier",
  "Hand delivery",
  "Email",
] as const;

export const NON_DELIVERY_REASONS = [
  "Addressee not found",
  "Refused by addressee",
  "Left unclaimed",
  "Insufficient address",
  "Moved / No longer at address",
  "Other",
] as const;

export const PAYMENT_STATUSES = [
  "No payment made",
  "Part payment made",
  "Full payment made",
] as const;

export const COURTS = [
  "24×7 ON Court Chandigarh",
  "Chief Judicial Magistrate Chandigarh",
  "District Court Mohali",
] as const;

export const POLICE_STATIONS = [
  "Sector 3, Chandigarh",
  "Sector 11, Chandigarh",
  "Sector 17, Chandigarh",
  "Sector 19, Chandigarh",
  "Sector 26, Chandigarh",
  "Sector 31, Chandigarh",
  "Sector 36, Chandigarh",
  "Sector 39, Chandigarh",
  "Manimajra, Chandigarh",
  "Industrial Area Phase I, Chandigarh",
  "Industrial Area Phase II, Chandigarh",
  "Sarangpur, Chandigarh",
  "Phase 1, Mohali",
  "Phase 3B2, Mohali",
  "Phase 7, Mohali",
  "Zirakpur, Mohali",
] as const;

export const LIMITATION_PERIODS = [
  "1 month",
  "Beyond 1 month — with application for condonation",
] as const;

export const ADR_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "maybe", label: "May be" },
] as const;

export const DEPONENTS = [
  "Rajesh Verma (Complainant)",
  "Authorized Representative",
] as const;

export const SIGN_MODES = [
  { value: "esign", label: "E-Sign" },
  { value: "upload", label: "Upload Signed Copy" },
] as const;

export const PAYMENT_METHODS = [
  { value: "upi", label: "UPI" },
  { value: "card", label: "Debit / Credit Card" },
  { value: "netbanking", label: "Net Banking" },
] as const;

export const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
] as const;