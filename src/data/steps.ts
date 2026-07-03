export interface SubStep {
  id: string;
  title: string;
}

export interface Step {
  id: string;
  title: string;
  time: string;
  subs: SubStep[];
}

export const STEPS: Step[] = [
  {
    id: "party",
    title: "Party details",
    time: "5m",
    subs: [
      { id: "complainant", title: "Complainant" },
      { id: "advocate", title: "Advocate (Complainant)" },
      { id: "accused", title: "Accused" },
    ],
  },
  {
    id: "case",
    title: "Case Details",
    time: "15m",
    subs: [
      { id: "cheque", title: "Cheque & Cheque return memo" },
      { id: "demand", title: "Demand notice & Nature of debt" },
      { id: "jurisdiction", title: "Jurisdiction & Limitation" },
      { id: "adr", title: "ADR, Other details, & Prayer" },
    ],
  },
  {
    id: "evidence",
    title: "Evidence",
    time: "5m",
    subs: [
      { id: "witnesses", title: "Witnesses" },
      { id: "documents", title: "Documents" },
    ],
  },
  { id: "affidavit", title: "Affidavit", time: "5m", subs: [] },
  { id: "preview", title: "Preview", time: "5m", subs: [] },
  { id: "sign", title: "Sign", time: "5m", subs: [] },
  { id: "pay", title: "Pay fees", time: "5m", subs: [] },
];