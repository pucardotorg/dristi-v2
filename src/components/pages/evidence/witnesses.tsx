"use client";

import { useState, useCallback } from "react";
import { useFilingStore } from "@/src/stores/filing-store";
import { WITNESS_TEMPLATE } from "@/src/data/initial-state";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { PageTitle } from "@/components/ui/page-title";
import { NumStepper } from "@/components/ui/num-stepper";
import { EntityTabs } from "@/components/ui/entity-tabs";
import { SectionSep } from "@/components/ui/section-sep";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ContactTable } from "@/components/ui/contact-table";
import { AddressTable } from "@/components/ui/address-table";
import { AddressModal, type AddressForm } from "@/components/ui/address-modal";
import { RemoveConfirmDialog, useRemoveConfirm } from "@/components/ui/remove-confirm-dialog";

import type { Witness, WitnessAddress } from "@/src/types";

const ADDR_COLS = [
  { key: "address" as const, header: "Address" },
  { key: "pincode" as const, header: "Pincode" },
  { key: "district" as const, header: "District" },
  { key: "state" as const, header: "State" },
  { key: "geo" as const, header: "Geolocation" },
  { key: "policeStation" as const, header: "Police Stations" },
];

function useAddressModal(
  addresses: WitnessAddress[],
  onUpdate: (addresses: WitnessAddress[]) => void
) {
  const [modal, setModal] = useState<{ index: number | null } | null>(null);

  const openAdd = () => setModal({ index: null });
  const openEdit = (index: number) => setModal({ index });
  const close = () => setModal(null);

  const initial =
    modal?.index != null
      ? { ...addresses[modal.index], country: "India" }
      : undefined;

  const handleConfirm = (form: AddressForm) => {
    const addr: WitnessAddress = {
      address: form.address,
      pincode: form.pincode,
      district: form.district,
      state: form.state,
    };
    if (modal?.index != null) {
      onUpdate(addresses.map((a, i) => (i === modal.index ? addr : a)));
    } else {
      onUpdate([...addresses, addr]);
    }
    close();
  };

  return { modal, openAdd, openEdit, close, initial, handleConfirm };
}

export function WitnessesPage() {
  const data = useFilingStore((s) => s.data);
  const updateWitness = useFilingStore((s) => s.updateWitness);
  const addWitness = useFilingStore((s) => s.addWitness);
  const removeWitness = useFilingStore((s) => s.removeWitness);

  const witnessIds = Object.keys(data.witnesses ?? {});
  const [activeTab, setActiveTab] = useState(witnessIds[0] ?? "w1");

  const removeConfirm = useRemoveConfirm((id) => {
    removeWitness(id);
    if (activeTab === id) {
      setActiveTab(witnessIds.find((k) => k !== id) ?? witnessIds[0]);
    }
  });

  const wt: Witness = (data.witnesses ?? {})[activeTab] ?? { ...WITNESS_TEMPLATE };

  const u = useCallback(
    (patch: Partial<Witness>) => updateWitness(activeTab, patch),
    [activeTab, updateWitness]
  );

  const handleRemoveTab = (id: string) => {
    if (witnessIds.length <= 1) return;
    removeConfirm.requestRemove(id);
  };

  const tabIdx = witnessIds.indexOf(activeTab) + 1;
  const addrModal = useAddressModal(wt.addresses, (addresses) => u({ addresses }));

  const tabs = witnessIds.map((id, i) => ({
    id,
    label: `Witness ${i + 1}`,
    done: false,
  }));

  return (
    <div>
      <PageTitle title="List of witnesses" />

      <div className="mb-4">
        <NumStepper
          label="Please select number of witnesses"
          value={witnessIds.length || 1}
          onChange={(n) => {
            const current = witnessIds.length;
            if (n > current) {
              for (let i = current; i < n; i++) addWitness();
            } else if (n < current && current > 1) {
              const lastId = witnessIds[witnessIds.length - 1];
              handleRemoveTab(lastId);
            }
          }}
        />
      </div>

      <EntityTabs
        tabs={tabs}
        activeId={activeTab}
        onPick={setActiveTab}
        onAdd={addWitness}
        addLabel="Add Witness"
        onRemove={handleRemoveTab}
      />

      <div className="field-stack mt-6">
        <FormField label="Full Name">
          <Input
            value={wt.fullName}
            onChange={(e) => u({ fullName: e.target.value })}
            placeholder="Enter"
          />
        </FormField>

        <div className="flex items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
          <span className="mx-4 text-xs text-slate-400 dark:text-slate-500">OR</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
        </div>

        <FormField label="Designation">
          <Input
            value={wt.designation}
            onChange={(e) => u({ designation: e.target.value })}
            placeholder="Enter"
          />
        </FormField>

        <FormField label="Age (optional)">
          <Input
            type="number"
            inputMode="numeric"
            value={wt.age}
            onChange={(e) => u({ age: e.target.value })}
            placeholder="Enter"
          />
        </FormField>

        <FormField label="What will this witness prove?">
          <Textarea
            value={wt.willProve}
            onChange={(e) => u({ willProve: e.target.value })}
            placeholder="Placeholder"
            rows={3}
          />
        </FormField>
      </div>

      <SectionSep label={`Witness ${tabIdx} Contact details`} />
      <ContactTable rows={wt.contacts} onChange={(contacts) => u({ contacts })} />

      <SectionSep label={`Witness ${tabIdx} Address details`} />
      <Alert className="mb-3">
        <AlertDescription>
          Adding multiple addresses will increase your chances of successful delivery.
        </AlertDescription>
      </Alert>
      <AddressTable
        rows={wt.addresses}
        onAdd={addrModal.openAdd}
        onEdit={addrModal.openEdit}
        cols={ADDR_COLS}
      />

      <RemoveConfirmDialog
        entityName="Witness"
        open={removeConfirm.open}
        onCancel={removeConfirm.cancel}
        onConfirm={removeConfirm.confirm}
      />

      <AddressModal
        open={addrModal.modal !== null}
        title="Add Address"
        initial={addrModal.initial}
        onClose={addrModal.close}
        onConfirm={addrModal.handleConfirm}
      />
    </div>
  );
}
