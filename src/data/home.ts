export type CaseTypeId = "s138" | "civil" | "matrimonial" | "consumer";
export type IconColor = "teal" | "blue" | "amber" | "purple";

export interface CaseType {
  id: CaseTypeId;
  name: string;
  desc: string;
  timeLabel: string;
  docCount: number;
  iconColor: IconColor;
}

export interface Draft {
  id: string;
  badge: string;
  savedAgo: string;
  title: string;
  court: string;
  progress: number;
  stepLabel: string;
}

export interface HomeStats {
  draftCount: number;
  filedCount: number;
}

export interface FiledCase {
  caseNo: string;
  title: string;
  type: string;
  filedOn: string;
  status: string;
  statusKind: "warn" | "success";
  nextDate: string;
}

export interface DocItem {
  num: string;
  title: string;
  desc: string;
}

export const CASE_TYPES: CaseType[] = [
  {
    id: "s138",
    name: "Cheque Bounce (S-138, NI Act)",
    desc: "Criminal complaint for dishonour of a cheque under Section 138 of the Negotiable Instruments Act.",
    timeLabel: "~40 min",
    docCount: 6,
    iconColor: "teal",
  },
  {
    id: "civil",
    name: "Civil Money Suit",
    desc: "Recovery of money due, breach of contract or specific performance.",
    timeLabel: "~55 min",
    docCount: 8,
    iconColor: "blue",
  },
  {
    id: "matrimonial",
    name: "Matrimonial / Family",
    desc: "Divorce, maintenance, custody or other matrimonial relief.",
    timeLabel: "~60 min",
    docCount: 10,
    iconColor: "amber",
  },
  {
    id: "consumer",
    name: "Consumer Dispute",
    desc: "Deficiency in goods or services, unfair trade practice.",
    timeLabel: "~35 min",
    docCount: 5,
    iconColor: "purple",
  },
];


export const S138_DOCS: DocItem[] = [
  {
    num: "01",
    title: "Identity Proof",
    desc: "A valid government-issued identity proof of the complainant such as Aadhaar, PAN or Voter ID.",
  },
  {
    num: "02",
    title: "Bounced Cheque",
    desc: "A copy of the bounced cheque on the basis of which this case is being filed.",
  },
  {
    num: "03",
    title: "Cheque Return Memo",
    desc: "The document received from the bank that has the information that the cheque has bounced.",
  },
  {
    num: "04",
    title: "Proof of Debt / Liability",
    desc: "Anything to prove some sort of agreement between you and the respondent.",
  },
  {
    num: "05",
    title: "Legal Demand Notice",
    desc: "Any intimation you provided to the respondent informing them that their cheque had bounced and they still owed you the cheque amount.",
  },
  {
    num: "06",
    title: "Notarised Affidavit",
    desc: "This is a replacement for your sworn statement which reduces the chances that an admission hearing is needed for the court to take cognisance of your case.",
  },
];
