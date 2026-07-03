"use client";

import { useState, useCallback } from "react";
import { useFilingStore } from "@/src/stores/filing-store";

import { DateInput } from "@/components/ui/date-input";
import { FormField } from "@/components/ui/form-field";
import { NumStepper } from "@/components/ui/num-stepper";
import { EntityTabs } from "@/components/ui/entity-tabs";
import { PageTitle } from "@/components/ui/page-title";
import { NativeSelect } from "@/components/ui/native-select";
import { InlineRadios } from "@/components/ui/inline-radios";
import { InputAffix } from "@/components/ui/input-affix";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RemoveConfirmDialog, useRemoveConfirm } from "@/components/ui/remove-confirm-dialog";

import {
  DEBT_NATURES,
  SERVICE_MODES,
  NON_DELIVERY_REASONS,
  PAYMENT_STATUSES,
  YES_NO,
} from "@/src/data/lookups";
import type { Demand } from "@/src/types";

export function DemandPage() {
  const data = useFilingStore((s) => s.data);
  const updateDemand = useFilingStore((s) => s.updateDemand);
  const addDemand = useFilingStore((s) => s.addDemand);
  const removeDemand = useFilingStore((s) => s.removeDemand);

  const demandIds = Object.keys(data.demands);
  const [activeTab, setActiveTab] = useState(demandIds[0] ?? "dn1");

  const removeConfirm = useRemoveConfirm((id) => {
    removeDemand(id);
    if (activeTab === id) {
      setActiveTab(demandIds.find((k) => k !== id) ?? demandIds[0]);
    }
  });

  const dn: Demand = data.demands[activeTab] ?? {
    nature: "",
    dispatch: "",
    mode: "",
    tracking: "",
    delivered: "yes",
    delivery: "",
    returnDate: "",
    nonDeliveryReason: "",
    replied: "no",
    payment: "",
    partAmount: "",
  };

  const u = useCallback(
    (patch: Partial<Demand>) => updateDemand(activeTab, patch),
    [activeTab, updateDemand]
  );

  const handleRemoveTab = (id: string) => {
    if (demandIds.length <= 1) return;
    removeConfirm.requestRemove(id);
  };

  const tabs = demandIds.map((id, i) => ({
    id,
    label: `Demand Notice ${i + 1}`,
    done: false,
  }));

  return (
    <div>
      <PageTitle title="Legal demand notice details">
        <NumStepper
          label="Number of demand notices"
          value={demandIds.length}
          onChange={(n) => {
            const current = demandIds.length;
            if (n > current) {
              addDemand();
            } else if (n < current && current > 1) {
              const lastId = demandIds[demandIds.length - 1];
              handleRemoveTab(lastId);
            }
          }}
        />
      </PageTitle>

      <EntityTabs
        tabs={tabs}
        activeId={activeTab}
        onPick={(id) => setActiveTab(id)}
        onAdd={addDemand}
        addLabel="Add Demand Notice"
        onRemove={handleRemoveTab}
      />

      <Alert className="my-4">
        <AlertDescription>
          If you have issued multiple demand notices for the same cheque, please
          share the one that is validly issued within 30 days of the receipt of
          information about return of the cheque. In case of multiple cheques,
          you can share more than one demand notice.
        </AlertDescription>
      </Alert>

      <div className="field-stack">
        <FormField label="Nature of debt or other liability" required info>
          <NativeSelect
            value={dn.nature}
            onChange={(v) => u({ nature: v })}
            options={[...DEBT_NATURES]}
            placeholder="Select"
          />
        </FormField>

        <FormField label="Date of dispatch of demand notice" required info>
          <DateInput value={dn.dispatch} onChange={(v) => u({ dispatch: v })} />
        </FormField>

        <FormField label="Mode of service" required>
          <NativeSelect
            value={dn.mode}
            onChange={(v) => u({ mode: v })}
            options={[...SERVICE_MODES]}
            placeholder="Select"
          />
        </FormField>

        <FormField label="Tracking number (optional)" info>
          <InputAffix
            value={dn.tracking}
            onChange={(e) => u({ tracking: e.target.value })}
            placeholder="Enter"
          />
        </FormField>

        <FormField label="Whether delivered?" required>
          <InlineRadios
            value={dn.delivered}
            onChange={(v) => u({ delivered: v as "yes" | "no" })}
            options={YES_NO}
          />
        </FormField>

        {dn.delivered === "yes" && (
          <FormField label="Date of delivery" required info>
            <DateInput value={dn.delivery} onChange={(v) => u({ delivery: v })} />
          </FormField>
        )}

        {dn.delivered === "no" && (
          <div className="reveal-section field-stack">
            <FormField label="Date of return as not delivered" required>
              <DateInput value={dn.returnDate} onChange={(v) => u({ returnDate: v })} />
            </FormField>

            <FormField label="Reason for non-delivery" required>
              <NativeSelect
                value={dn.nonDeliveryReason}
                onChange={(v) => u({ nonDeliveryReason: v })}
                options={[...NON_DELIVERY_REASONS]}
                placeholder="Select"
              />
            </FormField>
          </div>
        )}

        <FormField label="Has the accused replied to the demand notice?" required>
          <InlineRadios
            value={dn.replied}
            onChange={(v) => u({ replied: v as "yes" | "no" })}
            options={YES_NO}
          />
        </FormField>

        <FormField
          label="Has the Drawer (Accused) made full or part payment due under the cheque?"
          required
          info
        >
          <NativeSelect
            value={dn.payment}
            onChange={(v) => u({ payment: v })}
            options={[...PAYMENT_STATUSES]}
            placeholder="Select"
          />
        </FormField>

        {dn.payment === "Part payment made" && (
          <FormField label="How much payment has already been made?" required>
            <InputAffix
              startAdornment="₹"
              value={dn.partAmount ?? ""}
              onChange={(e) => u({ partAmount: e.target.value })}
              placeholder="Enter Amount"
            />
          </FormField>
        )}
      </div>

      <RemoveConfirmDialog
        entityName="Demand Notice"
        open={removeConfirm.open}
        onCancel={removeConfirm.cancel}
        onConfirm={removeConfirm.confirm}
      />
    </div>
  );
}
