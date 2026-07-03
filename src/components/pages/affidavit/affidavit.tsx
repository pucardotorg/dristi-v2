"use client";

import { useFilingStore } from "@/src/stores/filing-store";
import { PageTitle } from "@/components/ui/page-title";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { FormField } from "@/components/ui/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import { DateInput } from "@/components/ui/date-input";
import { InlineRadios } from "@/components/ui/inline-radios";
import { SectionSep } from "@/components/ui/section-sep";
import type { FilingData } from "@/src/types";

function buildAffidavitDraft(data: FilingData): string {
  const complainant = Object.values(data.complainants)[0];
  const accused = Object.values(data.accused)[0];
  const cheque = Object.values(data.cheques)[0];

  const chequeNum = cheque?.number || "___";
  const chequeDate = cheque?.date || "___";
  const chequeAmount = cheque?.amount || "___";
  const bankName = cheque?.bank || "___";
  const bankBranch = cheque?.branch || "___";

  const accusedName = accused
    ? accused.accusedType === "Entity"
      ? accused.companyName
      : accused.fullName
    : "the Accused";

  const complainantName =
    complainant?.complainantType === "Entity"
      ? complainant.entityName
      : complainant?.repName || "the Complainant";

  return [
    `<p>I, ${complainantName}, am the complainant / authorised representative of the complainant in the above case and am fully acquainted with the facts and circumstances of the case. I am competent and authorised to swear to this affidavit.</p>`,
    `<p>The accused, ${accusedName}, issued Cheque No. ${chequeNum} dated ${chequeDate} for \u20b9${chequeAmount} drawn on ${bankName}, ${bankBranch}, in discharge of a legally enforceable debt or liability. It has been dishonoured due to insufficiency of funds. A demand notice has been issued to the accused, but she/he has failed to make the payment due under the cheque. All other requirements under Section 138 of the Negotiable Instruments Act, 1881 have been complied with.</p>`,
    `<p>I confirm that the demand notice was served on the last known correct address of ${accusedName}.</p>`,
    `<p>In accordance with Section 225 of the Bharatiya Nagarik Suraksha Sanhita, 2023, I confirm that there is sufficient ground for proceeding against the accused.</p>`,
    `<p>In accordance with Section 223 and other relevant provisions of the Bharatiya Nagarik Suraksha Sanhita, 2023, I confirm that the contents of this complaint are true and correct to the best of my knowledge, belief and information.</p>`,
    `<p>The physical or electronic records of the documents etc. produced by me with this complaint are in my lawful and proper custody and possession.</p>`,
    `<p>It is therefore humbly prayed that this Hon'ble Court may be pleased to take cognizance of the offence committed by the accused, and issue process to the accused.</p>`,
  ].join("");
}

export function AffidavitPage() {
  const data = useFilingStore((s) => s.data);
  const setData = useFilingStore((s) => s.setData);

  const affidavit = data.affidavit;
  const affidavitText = affidavit.text || buildAffidavitDraft(data);

  // Build deponent options from complainant names
  const complainantNames = Object.values(data.complainants).map((c) =>
    c.complainantType === "Entity" ? c.entityName || "Complainant" : c.repName || "Complainant"
  );
  const deponentOptions =
    complainantNames.length > 0 ? complainantNames : ["Complainant"];

  const patch = (patch: Partial<typeof affidavit>) =>
    setData({ affidavit: { ...affidavit, ...patch } });

  return (
    <div>
      <PageTitle title="Affidavit" />

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Please edit the affidavit text where required as per the details of your case.
      </p>

      {/* Affidavit metadata */}
      <div className="space-y-4 mb-6 max-w-2xl">
        <FormField label="Deponent" required>
          <NativeSelect
            value={affidavit.deponent}
            onChange={(v) => patch({ deponent: v })}
            options={deponentOptions}
            placeholder="Select deponent"
          />
        </FormField>

        <FormField label="Place" required>
          <input
            type="text"
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors"
            placeholder="e.g. Chandigarh"
            value={affidavit.place}
            onChange={(e) => patch({ place: e.target.value })}
          />
        </FormField>

        <FormField label="Date" required>
          <DateInput
            value={affidavit.date}
            onChange={(v) => patch({ date: v })}
          />
        </FormField>

        <FormField label="Notarised">
          <InlineRadios
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={affidavit.notarised}
            onChange={(v) => patch({ notarised: v as "yes" | "no" })}
          />
        </FormField>
      </div>

      <SectionSep label="Affidavit Text" />

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 mt-4">
        This affidavit has been auto-drafted based on your case details. Edit where needed.
      </p>

      <RichTextEditor
        value={affidavitText}
        onChange={(text) => patch({ text })}
        minHeight={400}
      />
    </div>
  );
}
