"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { useFilingStore } from "@/src/stores/filing-store";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { FormField } from "@/components/ui/form-field";
import { PageTitle } from "@/components/ui/page-title";
import { Subhead } from "@/components/ui/subhead";
import { NativeSelect } from "@/components/ui/native-select";
import { InlineRadios } from "@/components/ui/inline-radios";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { YES_NO, POLICE_STATIONS } from "@/src/data/lookups";
import { INITIAL } from "@/src/data/initial-state";
import type { Jurisdiction, OtherCase } from "@/src/types";

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function computeDelay(causeDate: string, filingDate: string): string {
  if (!causeDate || !filingDate) return "-";
  const cause = new Date(causeDate);
  const filing = new Date(filingDate);
  const diffDays = Math.floor((filing.getTime() - cause.getTime()) / 86400000);
  if (diffDays < 0) return "-";
  const delayDays = diffDays - 30;
  if (delayDays <= 0) return "-";
  return `${delayDays} day${delayDays === 1 ? "" : "s"}`;
}

export function JurisdictionPage() {
  const data = useFilingStore((s) => s.data);
  const setData = useFilingStore((s) => s.setData);

  const [fetchState, setFetchState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const j: Jurisdiction = {
    ...INITIAL.jurisdiction,
    ...data.jurisdiction,
    otherCases: data.jurisdiction.otherCases ?? INITIAL.jurisdiction.otherCases,
  };

  const u = (patch: Partial<Jurisdiction>) =>
    setData({ jurisdiction: { ...j, ...patch } });

  const handleFetchIFSC = async () => {
    if (!j.ifsc || fetchState === "loading") return;
    setFetchState("loading");
    setFetchError(null);
    try {
      const res = await fetch(`/api/ifsc/${encodeURIComponent(j.ifsc)}`);
      if (!res.ok) throw new Error(res.status === 404 ? "IFSC not found" : "Lookup failed");
      const json = (await res.json()) as { bank: string; branch: string };
      u({ bankName: json.bank, bankBranch: json.branch });
      setFetchState("done");
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Lookup failed");
      setFetchState("error");
      setTimeout(() => {
        setFetchState("idle");
        setFetchError(null);
      }, 3000);
    }
  };

  const updateOtherCase = (i: number, patch: Partial<OtherCase>) => {
    const next = j.otherCases.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    u({ otherCases: next });
  };

  const addOtherCase = () =>
    u({ otherCases: [...j.otherCases, { court: "", caseNumber: "" }] });

  const delay = computeDelay(j.causeDate, j.filingDate);

  return (
    <div>
      <PageTitle title="Jurisdiction & Limitation" />

      <FormField
        label={
          <>
            Did the Payee (Complainant) deposit the cheque in their bank account?
            <Info className="inline w-3.5 h-3.5 ml-1 align-middle text-slate-400" />
          </>
        }
        className="mt-6 mb-4"
      >
        <InlineRadios
          value={j.chequeDeposited}
          onChange={(v) => u({ chequeDeposited: v as "yes" | "no" })}
          options={YES_NO}
        />
      </FormField>

      <Alert className="mb-4">
        <AlertDescription>
          Jurisdiction will be based on the bank branch where cheque is
          presented for collection and account is maintained by the
          complainant.
        </AlertDescription>
      </Alert>

      {j.chequeDeposited === "yes" && (
        <div className="reveal-section field-stack">
          <Subhead>Payee (Complainant) Bank Details</Subhead>

          <FormField label="IFSC Code" required info>
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <Input
                  value={j.ifsc}
                  onChange={(e) => {
                    u({ ifsc: e.target.value.toUpperCase() });
                    setFetchState("idle");
                    setFetchError(null);
                  }}
                  placeholder="Enter"
                />
                {fetchError && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fetchError}</p>
                )}
                {j.ifsc && !IFSC_RE.test(j.ifsc) && (
                  <p className="mt-1 text-xs text-muted-foreground">Format: 4 letters + 0 + 6 alphanumeric (e.g. HDFC0000482)</p>
                )}
                {fetchState === "done" && (
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Bank details fetched</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchIFSC}
                disabled={!j.ifsc || !IFSC_RE.test(j.ifsc) || fetchState === "loading"}
                className="shrink-0"
              >
                {fetchState === "loading" ? "Fetching…" : "Fetch Details"}
              </Button>
            </div>
          </FormField>

          <FormField label="Bank Name">
            <Input value={j.bankName} onChange={() => {}} placeholder="-" disabled />
          </FormField>

          <FormField label="Bank Branch">
            <Input value={j.bankBranch} onChange={() => {}} placeholder="-" disabled />
          </FormField>

          <FormField label="Police Station of bank branch">
            <NativeSelect
              value={j.payeePoliceStation}
              onChange={(v) => u({ payeePoliceStation: v })}
              options={[...POLICE_STATIONS]}
              placeholder="Select"
            />
          </FormField>
        </div>
      )}

      {j.chequeDeposited === "no" && (
        <div className="reveal-section field-stack mt-4">
          <FormField label="Police Station of Drawer (Accused) bank branch">
            <Input
              value={j.drawerPoliceStation}
              onChange={(e) => u({ drawerPoliceStation: e.target.value })}
              placeholder="Select"
            />
          </FormField>
        </div>
      )}

      <Subhead>Other cheque dishonour complaints between the same parties</Subhead>

      <div className="field-stack">
        <FormField
          label={
            j.chequeDeposited === "yes"
              ? "Is there any other cheque dishonour complaint pending between the same parties?"
              : "Is there any other cheque dishonour complaint under Section 138 of the Negotiable Instruments Act 1881 pending between the same parties?"
          }
          required
        >
          <InlineRadios
            value={j.otherComplaints}
            onChange={(v) => u({ otherComplaints: v as "yes" | "no" })}
            options={YES_NO}
          />
        </FormField>

        {j.otherComplaints === "yes" && (
          <div className="reveal-section field-stack">
            <Alert>
              <AlertDescription>
                Please state the case details of such cases (court &amp; case number).
              </AlertDescription>
            </Alert>

            {j.otherCases.map((c, i) => (
              <div key={i} className="field-stack">
                <FormField label="Court">
                  <Input
                    value={c.court}
                    onChange={(e) => updateOtherCase(i, { court: e.target.value })}
                    placeholder="Enter"
                  />
                </FormField>
                <FormField label="Case Number">
                  <Input
                    value={c.caseNumber}
                    onChange={(e) => updateOtherCase(i, { caseNumber: e.target.value })}
                    placeholder="Enter"
                  />
                </FormField>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addOtherCase}
              className="w-fit border-dashed text-teal border-teal hover:bg-teal/5 hover:text-teal"
            >
              + Add more
            </Button>
          </div>
        )}
      </div>

      <Subhead>Limitation Period</Subhead>

      <div className="field-stack">
        <FormField label="Date of cause of action" required info>
          <DateInput value={j.causeDate} onChange={(v) => u({ causeDate: v })} />
        </FormField>

        <FormField label="Date of complaint filing">
          <DateInput value={j.filingDate} onChange={(v) => u({ filingDate: v })} />
        </FormField>

        <FormField label="Duration of delay">
          <Input value={delay === "-" ? "" : delay} onChange={() => {}} placeholder="-" disabled />
        </FormField>

        <FormField label="Reason for praying condonation of delay" info>
          <Textarea
            value={j.delayReason}
            onChange={(e) => u({ delayReason: e.target.value })}
            placeholder="Enter"
            rows={4}
          />
        </FormField>
      </div>
    </div>
  );
}
