"use client";

import { Info } from "lucide-react";
import { useFilingStore } from "@/src/stores/filing-store";

import { PageTitle } from "@/components/ui/page-title";
import { Subhead } from "@/components/ui/subhead";
import { FormField } from "@/components/ui/form-field";
import { InlineRadios } from "@/components/ui/inline-radios";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

import { ADR_OPTIONS } from "@/src/data/lookups";
import type { ADR } from "@/src/types";

export function ADRPage() {
  const data = useFilingStore((s) => s.data);
  const setData = useFilingStore((s) => s.setData);

  const adr: ADR = data.adr;
  const u = (patch: Partial<ADR>) => setData({ adr: { ...adr, ...patch } });

  return (
    <div>
      <PageTitle title="ADR, Other details, & Prayer" />

      <FormField
        label={
          <>
            Would you like to settle the case outside the court through alternative
            methods of dispute resolution if the other party(s) agrees?
          </>
        }
        className="mt-6 mb-6"
      >
        <InlineRadios
          value={adr.adr}
          onChange={(v) => u({ adr: v })}
          options={ADR_OPTIONS}
        />
      </FormField>

      <Subhead>Other Details</Subhead>

      <FormField
        label={
          <>
            Would you like to add any additional details to the complaint?
            <Info className="inline w-3.5 h-3.5 ml-1 align-middle text-slate-400" />
          </>
        }
      >
        <p className="text-sm text-slate-400 dark:text-slate-500 mb-3 leading-relaxed">
          You can use this box to add any other details you would like to share
          with the Court as part of the complaint. No need to repeat cheque
          details or other information already provided above. In addition, the
          synopsis will be auto-generated — you can review it on the Preview
          page.
        </p>
      </FormField>
      <RichTextEditor
        value={adr.other}
        onChange={(v) => u({ other: v })}
        placeholder="Write here"
        minHeight={120}
      />

      <div className="mt-8">
        <Subhead>Prayer/ Relief Sought</Subhead>
      </div>

      <div className="mb-4 field-stack">
        <div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Interim relief
          </span>
          <span className="text-sm font-normal text-slate-400 dark:text-slate-500 ml-1.5">
            (optional)
          </span>
        </div>
        <p className="text-sm text-teal mb-2">
          Please edit this where required as per the details of your case.
        </p>
        <RichTextEditor
          value={adr.interimRelief}
          onChange={(v) => u({ interimRelief: v })}
          minHeight={120}
        />
      </div>

      <div className="mt-6 field-stack">
        <div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Final relief
          </span>
        </div>
        <p className="text-sm text-teal mb-2">
          Please edit this where required as per the details of your case.
        </p>
        <RichTextEditor
          value={adr.finalRelief}
          onChange={(v) => u({ finalRelief: v })}
          minHeight={200}
        />
      </div>
    </div>
  );
}
