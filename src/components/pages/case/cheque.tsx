"use client";

import { useState, useCallback } from "react";
import { useFilingStore } from "@/src/stores/filing-store";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { FormField } from "@/components/ui/form-field";
import { NumStepper } from "@/components/ui/num-stepper";
import { EntityTabs } from "@/components/ui/entity-tabs";
import { PageTitle } from "@/components/ui/page-title";
import { SectionSep } from "@/components/ui/section-sep";
import { NativeSelect } from "@/components/ui/native-select";
import { InlineRadios } from "@/components/ui/inline-radios";
import { InputAffix } from "@/components/ui/input-affix";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RemoveConfirmDialog, useRemoveConfirm } from "@/components/ui/remove-confirm-dialog";

import { RETURN_REASONS, YES_NO } from "@/src/data/lookups";
import type { Cheque } from "@/src/types";

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function ChequePage() {
  const data = useFilingStore((s) => s.data);
  const updateCheque = useFilingStore((s) => s.updateCheque);
  const addCheque = useFilingStore((s) => s.addCheque);
  const removeCheque = useFilingStore((s) => s.removeCheque);

  const chequeIds = Object.keys(data.cheques);
  const [activeTab, setActiveTab] = useState(chequeIds[0] ?? "ch1");
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const removeConfirm = useRemoveConfirm((id) => {
    removeCheque(id);
    if (activeTab === id) {
      setActiveTab(chequeIds.find((k) => k !== id) ?? chequeIds[0]);
    }
  });

  const ch: Cheque = data.cheques[activeTab] ?? {
    date: "",
    amount: "",
    number: "",
    ifsc: "",
    bank: "",
    branch: "",
    depositDate: "",
    returnDate: "",
    reason: "",
    infoDate: "",
    sameBank: "no",
  };

  const tabIdx = chequeIds.indexOf(activeTab) + 1;

  const u = useCallback(
    (patch: Partial<Cheque>) => updateCheque(activeTab, patch),
    [activeTab, updateCheque]
  );

  const handleRemoveTab = (id: string) => {
    if (chequeIds.length <= 1) return;
    removeConfirm.requestRemove(id);
  };

  const handleSameBankChange = (v: string) => {
    const same = v as "yes" | "no";
    if (same === "yes") {
      const prevId = chequeIds[tabIdx - 2];
      const prev = data.cheques[prevId];
      if (prev) {
        u({ sameBank: "yes", ifsc: prev.ifsc, bank: prev.bank, branch: prev.branch });
      } else {
        u({ sameBank: "yes" });
      }
    } else {
      u({ sameBank: "no", ifsc: "", bank: "", branch: "" });
    }
  };

  const handleFetchIFSC = async () => {
    if (!ch.ifsc || fetchState === "loading") return;
    setFetchState("loading");
    setFetchError(null);
    try {
      const res = await fetch(`/api/ifsc/${encodeURIComponent(ch.ifsc)}`);
      if (!res.ok) throw new Error(res.status === 404 ? "IFSC not found" : "Lookup failed");
      const json = (await res.json()) as { bank: string; branch: string };
      u({ bank: json.bank, branch: json.branch });
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

  const bankFieldsLocked = tabIdx > 1 && ch.sameBank === "yes";

  const tabs = chequeIds.map((id, i) => ({
    id,
    label: `Cheque ${i + 1}`,
    done: false,
  }));

  return (
    <div>
      <PageTitle title="Cheque details">
        <NumStepper
          label="Number of cheques"
          value={chequeIds.length}
          onChange={(n) => {
            const current = chequeIds.length;
            if (n > current) {
              addCheque();
            } else if (n < current && current > 1) {
              const lastId = chequeIds[chequeIds.length - 1];
              handleRemoveTab(lastId);
            }
          }}
        />
      </PageTitle>

      <EntityTabs
        tabs={tabs}
        activeId={activeTab}
        onPick={(id) => {
          setActiveTab(id);
          setFetchState("idle");
          setFetchError(null);
        }}
        onAdd={addCheque}
        addLabel="Add Cheque"
        onRemove={handleRemoveTab}
      />

      <div className="field-stack mt-6">
        <FormField label="Date on cheque" required info>
          <DateInput value={ch.date} onChange={(v) => u({ date: v })} />
        </FormField>

        <FormField label="Amount" required info>
          <InputAffix
            startAdornment="₹"
            value={ch.amount}
            onChange={(e) => u({ amount: e.target.value })}
            placeholder="Enter Amount"
          />
        </FormField>

        <FormField label="Cheque Number" required info>
          <Input
            value={ch.number}
            onChange={(e) => u({ number: e.target.value })}
            placeholder="Enter"
          />
        </FormField>

        {tabIdx > 1 && (
          <FormField label="Bank details below are same as the previous cheque?">
            <InlineRadios
              value={ch.sameBank ?? "no"}
              onChange={handleSameBankChange}
              options={YES_NO}
            />
          </FormField>
        )}

        <FormField label="IFSC Code" required info>
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <Input
                value={ch.ifsc}
                onChange={(e) => {
                  u({ ifsc: e.target.value.toUpperCase() });
                  setFetchState("idle");
                  setFetchError(null);
                }}
                placeholder="Enter"
                disabled={bankFieldsLocked}
              />
              {fetchError && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fetchError}</p>
              )}
              {ch.ifsc && !IFSC_RE.test(ch.ifsc) && (
                <p className="mt-1 text-xs text-muted-foreground">Format: 4 letters + 0 + 6 alphanumeric (e.g. HDFC0000482)</p>
              )}
              {fetchState === "done" && (
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Bank details fetched</p>
              )}
            </div>
            {!bankFieldsLocked && (
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchIFSC}
                disabled={!ch.ifsc || !IFSC_RE.test(ch.ifsc) || fetchState === "loading"}
                className="shrink-0"
              >
                {fetchState === "loading" ? "Fetching…" : "Fetch Details"}
              </Button>
            )}
          </div>
        </FormField>

        <FormField label="Bank Name" required info>
          <Input
            value={ch.bank}
            onChange={(e) => u({ bank: e.target.value })}
            placeholder="Enter"
            disabled={bankFieldsLocked}
          />
        </FormField>

        <FormField label="Bank Branch" required info>
          <Input
            value={ch.branch}
            onChange={(e) => u({ branch: e.target.value })}
            placeholder="Enter"
            disabled={bankFieldsLocked}
          />
        </FormField>
      </div>

      <SectionSep label="Cheque return memo details" />

      <Alert className="mb-3">
        <AlertDescription>
          In case of multiple return memos, please add details of the latest
          return memo. However, where the latest return memo says the
          Drawer&apos;s bank account has been closed, please add details of the
          last return memo where the Drawer account is open.
        </AlertDescription>
      </Alert>

      <div className="field-stack">
        <FormField label="Date of presentation/ deposit" required info>
          <DateInput value={ch.depositDate} onChange={(v) => u({ depositDate: v })} />
        </FormField>

        <FormField label="Date of return" required info>
          <DateInput value={ch.returnDate} onChange={(v) => u({ returnDate: v })} />
        </FormField>

        <FormField label="Return reason" required info>
          <NativeSelect
            value={ch.reason}
            onChange={(v) => u({ reason: v })}
            options={[...RETURN_REASONS]}
            placeholder="Select"
          />
        </FormField>

        <FormField label="Date of receipt of information about return" optional info>
          <DateInput value={ch.infoDate} onChange={(v) => u({ infoDate: v })} />
        </FormField>
      </div>

      <RemoveConfirmDialog
        entityName="Cheque"
        open={removeConfirm.open}
        onCancel={removeConfirm.cancel}
        onConfirm={removeConfirm.confirm}
      />
    </div>
  );
}
