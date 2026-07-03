"use client";

import { useState } from "react";
import { Pencil, Download, ChevronDown, ChevronUp } from "lucide-react";
import { useFilingStore } from "@/src/stores/filing-store";
import { Button } from "@/components/ui/button";
import type {
  Complainant,
  Advocate,
  Accused,
  Cheque,
  Demand,
  Witness,
  FilingData,
} from "@/src/types";

// ── Value helpers ─────────────────────────────────────────────────────────────

function v(x: string | undefined | null): string {
  return x?.trim() || "—";
}

function fmtAddr(
  addr:
    | { address?: string; pincode?: string; district?: string; state?: string }
    | undefined
): string {
  if (!addr) return "—";
  return (
    [addr.address, addr.district, addr.state, addr.pincode]
      .filter(Boolean)
      .join(", ") || "—"
  );
}

// ── Layout primitives ─────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
      <div className="text-sm text-slate-800 dark:text-slate-200 break-words">
        {children || "—"}
      </div>
    </div>
  );
}

function FGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
      {children}
    </div>
  );
}

function HR() {
  return <hr className="border-slate-100 dark:border-slate-800 my-4" />;
}

function EntityLabel({ label }: { label: string }) {
  return (
    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 mt-4 first:mt-0">
      {label}
    </p>
  );
}

// ── Collapsible section card ──────────────────────────────────────────────────

function SectionCard({
  number,
  title,
  badge,
  onEdit,
  children,
}: {
  number: number | string;
  title: string;
  badge?: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden mb-4">
      <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-800/60">
        <button
          type="button"
          className="flex items-center gap-2 flex-1 text-left min-w-0"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {number}. {title}
          </span>
          {badge && (
            <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-teal/10 text-teal">
              {badge}
            </span>
          )}
          {open ? (
            <ChevronUp className="w-4 h-4 text-slate-400 ml-auto shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 ml-auto shrink-0" />
          )}
        </button>
        <button
          type="button"
          onClick={onEdit}
          title="Edit this section"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-teal transition-colors shrink-0"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && <div className="px-5 py-4">{children}</div>}
    </div>
  );
}

function SubHead({
  number,
  title,
  badge,
  onEdit,
}: {
  number: string;
  title: string;
  badge?: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {number} {title}
      </h3>
      {badge && (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
          {badge}
        </span>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="ml-auto p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-teal transition-colors"
          title="Edit"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ── Case Synopsis ─────────────────────────────────────────────────────────────

function buildSynopsis(data: FilingData): string {
  const c = Object.values(data.complainants)[0];
  const ac = Object.values(data.accused)[0];
  const av = Object.values(data.advocates)[0];
  const ch = Object.values(data.cheques)[0];
  const dm = Object.values(data.demands)[0];

  const cName =
    c?.complainantType === "Entity"
      ? (c.entityName ?? "the Complainant")
      : (c?.repName ?? "the Complainant");
  const acName =
    ac?.accusedType === "Entity"
      ? (ac.companyName ?? "the Accused")
      : (ac?.fullName ?? "the Accused");
  const avPart =
    av?.name
      ? ` through Advocate ${av.name}`
      : c?.partyInPerson === "yes"
      ? " (party in person)"
      : "";
  const chPart = ch?.amount
    ? `, for dishonour of Cheque No. ${ch.number || "___"} dated ${ch.date || "___"} for ₹${ch.amount}`
    : "";
  const returnPart = ch?.returnDate ? `, returned on ${ch.returnDate}` : "";
  const modePart = dm?.mode ? ` A legal demand notice was sent via ${dm.mode}.` : "";

  return (
    `Complainant ${cName}${avPart} has filed a complaint against ${acName}` +
    ` under Section 138 of the Negotiable Instruments Act, 1881${chPart}${returnPart}.${modePart}`
  );
}

function CaseSynopsis({ data }: { data: FilingData }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden mb-4">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-800/60 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1">
          Case synopsis
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 py-4">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {buildSynopsis(data)}
          </p>
        </div>
      )}
    </div>
  );
}

// ── 1.1 Complainant block ─────────────────────────────────────────────────────

function ComplainantBlock({ c, index }: { c: Complainant; index: number }) {
  const name =
    c.complainantType === "Entity" ? v(c.entityName) : v(c.repName);
  const addr0 = c.permanentAddresses?.[0];

  return (
    <>
      <EntityLabel label={`Complainant ${index}`} />
      <FGrid>
        <Field label="Complainant Type">{v(c.complainantType)}</Field>
        {c.complainantType === "Entity" && (
          <Field label="Entity Type">{v(c.entityType)}</Field>
        )}
        <Field label="Full Name">{name}</Field>
        {c.complainantType === "Individual" && (
          <Field label="Age">{v(c.repAge)}</Field>
        )}
        <Field label="Phone number">{v(c.phone)}</Field>
        <Field label="Email Address">{v(c.email)}</Field>
        {addr0 && (
          <Field label="Permanent Address">{fmtAddr(addr0)}</Field>
        )}
      </FGrid>

      {c.hasPoA === "yes" && (
        <>
          <EntityLabel label={`PoA for Complainant ${index}`} />
          <FGrid>
            <Field label="Full Name">{v(c.poaName)}</Field>
            <Field label="Age">{v(c.poaAge)}</Field>
            <Field label="Phone number">{v(c.poaPhone)}</Field>
            <Field label="Email Address">{v(c.poaEmail)}</Field>
            {c.poaPermanentAddresses?.[0] && (
              <Field label="Permanent Address">
                {fmtAddr(c.poaPermanentAddresses[0])}
              </Field>
            )}
          </FGrid>
        </>
      )}
    </>
  );
}

// ── 1.2 Advocate block ────────────────────────────────────────────────────────

function AdvocateBlock({ av, index }: { av: Advocate; index: number }) {
  return (
    <>
      <EntityLabel label={`Advocate for Complainant ${index}`} />
      <FGrid>
        <Field label="Bar number">{v(av.barNumber)}</Field>
        <Field label="Full name">{v(av.name)}</Field>
        <Field label="Phone number">{v(av.phone)}</Field>
        <Field label="Email Address">{v(av.email)}</Field>
      </FGrid>
    </>
  );
}

// ── 1.3 Accused block ─────────────────────────────────────────────────────────

function AccusedBlock({ ac, index }: { ac: Accused; index: number }) {
  const name =
    ac.accusedType === "Entity" ? v(ac.companyName) : v(ac.fullName);
  const contact = ac.contacts?.[0];
  const addr0 = ac.addresses?.[0];

  return (
    <>
      <EntityLabel label={`Accused ${index}`} />
      <FGrid>
        <Field label="Type">{v(ac.accusedType)}</Field>
        {ac.accusedType === "Entity" && (
          <>
            <Field label="Entity Type">{v(ac.entityType)}</Field>
            <Field label="Company Name">{v(ac.companyName)}</Field>
          </>
        )}
        <Field label="Full Name">{name}</Field>
        {ac.accusedType === "Individual" && (
          <Field label="Age">{v(ac.age)}</Field>
        )}
        {contact && (
          <>
            <Field label="Phone number">{v(contact.phone)}</Field>
            <Field label="Email Address">{v(contact.email)}</Field>
          </>
        )}
        {addr0 && <Field label="Address">{fmtAddr(addr0)}</Field>}
      </FGrid>
    </>
  );
}

// ── Cheque + Return Memo block ────────────────────────────────────────────────

function ChequeBlock({
  ch,
  chequeNum,
  subBase,
}: {
  ch: Cheque;
  chequeNum: number;
  subBase: number;
}) {
  return (
    <>
      <SubHead number={`2.${subBase}`} title={`Cheque details ${chequeNum}`} />
      <FGrid>
        <Field label="Date of Cheque">{v(ch.date)}</Field>
        <Field label="Amount">{ch.amount ? `₹${ch.amount}` : "—"}</Field>
        <Field label="Cheque number">{v(ch.number)}</Field>
        <Field label="IFSC">{v(ch.ifsc)}</Field>
        <Field label="Bank Name">{v(ch.bank)}</Field>
        <Field label="Bank Branch">{v(ch.branch)}</Field>
      </FGrid>

      <HR />

      <SubHead
        number={`2.${subBase + 1}`}
        title={`Cheque return memo ${chequeNum}`}
      />
      <FGrid>
        <Field label="Date of deposit">{v(ch.depositDate)}</Field>
        <Field label="Date of return">{v(ch.returnDate)}</Field>
        <Field label="Reason of return">{v(ch.reason)}</Field>
        <Field label="Date of information">{v(ch.infoDate)}</Field>
      </FGrid>
    </>
  );
}

// ── Demand block ──────────────────────────────────────────────────────────────

function DemandBlock({
  dm,
  demandNum,
  subNum,
}: {
  dm: Demand;
  demandNum: number;
  subNum: number;
}) {
  return (
    <>
      <SubHead
        number={`2.${subNum}`}
        title={`Demand notice details ${demandNum}`}
      />
      <FGrid>
        <Field label="Nature of debt">{v(dm.nature)}</Field>
        <Field label="Date of dispatch">{v(dm.dispatch)}</Field>
        <Field label="Mode of dispatch">{v(dm.mode)}</Field>
        <Field label="Tracking number">{v(dm.tracking)}</Field>
        <Field label="Was it delivered?">{v(dm.delivered)}</Field>
        {dm.delivered === "yes" ? (
          <Field label="Date of delivery">{v(dm.delivery)}</Field>
        ) : (
          <>
            <Field label="Date of return">{v(dm.returnDate)}</Field>
            <Field label="Non-delivery reason">
              {v(dm.nonDeliveryReason)}
            </Field>
          </>
        )}
        <Field label="Reply to demand?">{v(dm.replied)}</Field>
        <Field label="Payment made?">{v(dm.payment)}</Field>
        {dm.partAmount && (
          <Field label="Part payment amount">₹{dm.partAmount}</Field>
        )}
      </FGrid>
    </>
  );
}

// ── 3.1 Witness table ─────────────────────────────────────────────────────────

function WitnessTable({
  witnesses,
}: {
  witnesses: [string, Witness][];
}) {
  if (!witnesses.length) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500">
        No witnesses added.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            {["Sl.No", "Full Name", "Age", "Email", "Address", "Will Prove"].map(
              (h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left text-xs font-medium text-slate-500 whitespace-nowrap"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {witnesses.map(([id, w], i) => (
            <tr
              key={id}
              className="border-t border-slate-100 dark:border-slate-800"
            >
              <td className="px-3 py-2 text-slate-500">{i + 1}</td>
              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                {v(w.fullName)}
              </td>
              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                {v(w.age)}
              </td>
              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                {v(w.contacts?.[0]?.email)}
              </td>
              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                {fmtAddr(w.addresses?.[0])}
              </td>
              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                {v(w.willProve)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 3.2 Document table ────────────────────────────────────────────────────────

function DocumentsTable({ data }: { data: FilingData }) {
  const uploads = data.docs?.uploads ?? {};
  const chequeIds = Object.keys(data.cheques ?? {});
  const demandIds = Object.keys(data.demands ?? {});
  const complainantIds = Object.keys(data.complainants ?? {});
  const extraCase = data.docs?.extraCase ?? [];

  const rows: { key: string; name: string }[] = [
    ...chequeIds.map((id, i) => ({
      key: `cheque-${id}`,
      name: `Cheque ${i + 1}`,
    })),
    { key: "cheque-return-memo", name: "Cheque return memo" },
    ...demandIds.map((id, i) => ({
      key: `demand-${id}`,
      name: `Demand notice ${i + 1}`,
    })),
    { key: "proof-dispatch", name: "Proof of dispatch (postal receipt)" },
    { key: "proof-delivery", name: "Proof of delivery (ID Card)" },
    { key: "reply-demand", name: "Reply to the demand notice" },
    ...extraCase.map((e, i) => ({ key: `extra-case-${i}`, name: e.name })),
    ...complainantIds.flatMap((cId, ci) => {
      const partyExtras = data.docs?.extraParty?.[cId] ?? [];
      return [
        { key: `party-${cId}-aadhar`, name: `Aadhar Card Complainant ${ci + 1}` },
        { key: `party-${cId}-poa`, name: `Power of Attorney ${ci + 1}` },
        { key: `party-${cId}-vakalat`, name: `Vakalatnama ${ci + 1}` },
        ...partyExtras.map((e, i) => ({
          key: `extra-party-${cId}-${i}`,
          name: e.name,
        })),
      ];
    }),
  ];

  return (
    <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            {["Sl.No", "Document Name", "Natively Digital", "File"].map(
              (h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left text-xs font-medium text-slate-500 whitespace-nowrap"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const up = uploads[row.key];
            return (
              <tr
                key={row.key}
                className="border-t border-slate-100 dark:border-slate-800"
              >
                <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                  {row.name}
                </td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                  {up?.nativelyDigital ? "Yes" : "No"}
                </td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                  {up?.fileName ? (
                    <span className="text-blue-600 dark:text-blue-400">
                      {up.fileName}
                    </span>
                  ) : (
                    <span className="text-slate-400">Not uploaded</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function PreviewPage() {
  const data = useFilingStore((s) => s.data);
  const goTo = useFilingStore((s) => s.goTo);

  const complainantEntries = Object.entries(data.complainants ?? {});
  const advocateEntries = Object.entries(data.advocates ?? {});
  const accusedEntries = Object.entries(data.accused ?? {});
  const chequeEntries = Object.entries(data.cheques ?? {});
  const demandEntries = Object.entries(data.demands ?? {});
  const witnessEntries = Object.entries(data.witnesses ?? {});

  const firstComplainant = complainantEntries[0]?.[1];
  const firstAccused = accusedEntries[0]?.[1];

  const complainantName =
    firstComplainant?.complainantType === "Entity"
      ? firstComplainant.entityName
      : firstComplainant?.repName;
  const accusedName =
    firstAccused?.accusedType === "Entity"
      ? firstAccused.companyName
      : firstAccused?.fullName;

  const jx = data.jurisdiction;
  const adr = data.adr;

  // Running sub-section counter — skips nothing when optional sections are absent
  const demandSubStart = chequeEntries.length * 2 + 1;
  let _n = demandSubStart + demandEntries.length;
  const jxSubNum = _n++;
  const limitSubNum = _n++;
  const adrSubNum = _n++;
  const otherSubNum = adr.other ? _n++ : 0;
  const interimSubNum = adr.interimRelief ? _n++ : 0;
  const properSubNum = _n++;

  const affidavitText = data.affidavit?.text ?? "";

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide leading-snug max-w-xl">
            Complaint filed under Section 138 of Negotiable Instruments Act
            1881
          </h1>
          {(complainantName || accusedName) && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 space-x-3">
              {complainantName && (
                <span>
                  Complainant:{" "}
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {complainantName}
                  </span>
                </span>
              )}
              {complainantName && accusedName && (
                <span className="text-slate-300 dark:text-slate-600">·</span>
              )}
              {accusedName && (
                <span>
                  Accused:{" "}
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {accusedName}
                  </span>
                </span>
              )}
            </p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            The key facts / details of the complaint are as below
          </p>
        </div>
        <Button variant="teal" size="sm" className="gap-2 shrink-0">
          <Download className="w-3.5 h-3.5" />
          Download Case File
        </Button>
      </div>

      {/* ── Case Synopsis ────────────────────────────────────────────────────── */}
      <CaseSynopsis data={data} />

      {/* ── 1. Party Details ─────────────────────────────────────────────────── */}
      <SectionCard
        number={1}
        title="Party details"
        badge={`${complainantEntries.length} Complainant${complainantEntries.length !== 1 ? "s" : ""}`}
        onEdit={() => goTo("party", "complainant")}
      >
        {/* 1.1 Complainants */}
        <SubHead
          number="1.1"
          title="Complainant"
          badge={String(complainantEntries.length)}
          onEdit={() => goTo("party", "complainant")}
        />
        {complainantEntries.map(([id, c], i) => (
          <ComplainantBlock key={id} c={c} index={i + 1} />
        ))}

        <HR />

        {/* 1.2 Advocates */}
        <SubHead
          number="1.2"
          title="Advocate(s)"
          badge={String(advocateEntries.length)}
          onEdit={() => goTo("party", "advocate")}
        />
        {advocateEntries.map(([id, av], i) => (
          <AdvocateBlock key={id} av={av} index={i + 1} />
        ))}

        <HR />

        {/* 1.3 Accused */}
        <SubHead
          number="1.3"
          title="Accused"
          badge={String(accusedEntries.length)}
          onEdit={() => goTo("party", "accused")}
        />
        {accusedEntries.map(([id, ac], i) => (
          <AccusedBlock key={id} ac={ac} index={i + 1} />
        ))}
      </SectionCard>

      {/* ── 2. Case Details ──────────────────────────────────────────────────── */}
      <SectionCard
        number={2}
        title="Case Details"
        onEdit={() => goTo("case", "cheque")}
      >
        {/* 2.1 / 2.2 … Cheque + Return Memo per cheque */}
        {chequeEntries.map(([id, ch], i) => (
          <div key={id}>
            <ChequeBlock
              ch={ch}
              chequeNum={i + 1}
              subBase={i * 2 + 1}
            />
            {i < chequeEntries.length - 1 && <HR />}
          </div>
        ))}

        {demandEntries.length > 0 && <HR />}

        {/* Demand notices */}
        {demandEntries.map(([id, dm], i) => (
          <div key={id}>
            <DemandBlock
              dm={dm}
              demandNum={i + 1}
              subNum={demandSubStart + i}
            />
            {i < demandEntries.length - 1 && <HR />}
          </div>
        ))}

        <HR />

        {/* 2.X Jurisdiction */}
        <SubHead
          number={`2.${jxSubNum}`}
          title="Jurisdiction"
          onEdit={() => goTo("case", "jurisdiction")}
        />
        <FGrid>
          <Field label="Cheque deposited with payee bank?">
            {v(jx.chequeDeposited)}
          </Field>
          {jx.chequeDeposited === "yes" ? (
            <>
              <Field label="IFSC">{v(jx.ifsc)}</Field>
              <Field label="Bank Name">{v(jx.bankName)}</Field>
              <Field label="Bank Branch">{v(jx.bankBranch)}</Field>
              <Field label="Police Station">{v(jx.payeePoliceStation)}</Field>
            </>
          ) : (
            <Field label="Police Station">{v(jx.drawerPoliceStation)}</Field>
          )}
          <Field label="Other complaints?">{v(jx.otherComplaints)}</Field>
          {jx.otherComplaints === "yes" &&
            jx.otherCases?.map((oc, i) => (
              <Field key={i} label={`Other case ${i + 1}`}>
                {[oc.court, oc.caseNumber].filter(Boolean).join(" – ") || "—"}
              </Field>
            ))}
        </FGrid>

        <HR />

        {/* 2.X+1 Limitation Period */}
        <SubHead
          number={`2.${limitSubNum}`}
          title="Limitation Period"
          onEdit={() => goTo("case", "jurisdiction")}
        />
        <FGrid>
          <Field label="Cause of action date">{v(jx.causeDate)}</Field>
          <Field label="Filing date">{v(jx.filingDate)}</Field>
          {jx.delayReason && (
            <Field label="Reason for delay">{v(jx.delayReason)}</Field>
          )}
        </FGrid>

        <HR />

        {/* 2.X+2 ADR */}
        <SubHead
          number={`2.${adrSubNum}`}
          title="ADR"
          onEdit={() => goTo("case", "adr")}
        />
        <FGrid>
          <Field label="ADR preference">{v(adr.adr)}</Field>
        </FGrid>

        {adr.other && (
          <>
            <HR />
            <SubHead
              number={`2.${otherSubNum}`}
              title="Other details"
              onEdit={() => goTo("case", "adr")}
            />
            <div
              className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: adr.other }}
            />
          </>
        )}

        <HR />

        {/* Relief sections */}
        {adr.interimRelief && (
          <>
            <SubHead
              number={`2.${interimSubNum}`}
              title="Interim Relief Sought"
              onEdit={() => goTo("case", "adr")}
            />
            <div
              className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 [&_p]:mb-2 mb-4"
              dangerouslySetInnerHTML={{ __html: adr.interimRelief }}
            />
          </>
        )}

        <SubHead
          number={`2.${properSubNum}`}
          title="Proper Relief Sought"
          onEdit={() => goTo("case", "adr")}
        />
        {adr.finalRelief ? (
          <div
            className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 [&_p]:mb-2"
            dangerouslySetInnerHTML={{ __html: adr.finalRelief }}
          />
        ) : (
          <p className="text-sm text-slate-400">—</p>
        )}
      </SectionCard>

      {/* ── 3. Evidence ──────────────────────────────────────────────────────── */}
      <SectionCard
        number={3}
        title="Evidence"
        onEdit={() => goTo("evidence", "witnesses")}
      >
        <SubHead
          number="3.1"
          title="List of witnesses"
          onEdit={() => goTo("evidence", "witnesses")}
        />
        <WitnessTable witnesses={witnessEntries} />

        <HR />

        <SubHead
          number="3.2"
          title="List of documents"
          onEdit={() => goTo("evidence", "documents")}
        />
        <DocumentsTable data={data} />
      </SectionCard>

      {/* ── 4. Affidavit ─────────────────────────────────────────────────────── */}
      <SectionCard
        number={4}
        title="Affidavit"
        onEdit={() => goTo("affidavit", "affidavit")}
      >
        {affidavitText ? (
          <div
            className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 [&_p]:mb-3"
            dangerouslySetInnerHTML={{ __html: affidavitText }}
          />
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            No affidavit text saved. Complete the Affidavit step to see the
            content here.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
